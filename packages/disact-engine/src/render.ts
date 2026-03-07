import { SpanStatusCode, context as otelContext, trace } from "@opentelemetry/api";
import { runInContext } from "./context";
import type { DisactElement, DisactNode, RenderedElement, RenderResult } from "./element";
import { createScheduler } from "./scheduler";
import { getEngineLogger } from "./utils/logger";
import { getEngineTracer } from "./utils/tracer";

const logger = getEngineLogger("render");

/**
 * レンダリングライフサイクルヘルパー関数
 */
export type RenderLifecycleHelpers = {
  /** 再レンダリングを要求する関数 */
  requestRerender: () => void;
};

/**
 * レンダリングライフサイクルフック
 */
export type RenderLifecycleCallbacks = {
  /** 各レンダリング開始前に呼ばれる */
  preRender?: (helpers: RenderLifecycleHelpers) => void | Promise<void>;
  /** 各レンダリング直後に呼ばれる */
  postRender?: (helpers: RenderLifecycleHelpers) => void | Promise<void>;
  /** 全レンダリングサイクル完了後（controller.close()直前）に呼ばれる */
  postRenderCycle?: (helpers: RenderLifecycleHelpers) => void | Promise<void>;
};

const MAX_RERENDER_WITHOUT_COMMIT = 100;

export const renderToReadableStream = <Context>(
  element: DisactElement,
  context: Context,
  callbacks?: RenderLifecycleCallbacks,
): ReadableStream<RenderResult> => {
  // 呼び出し時のOTelコンテキストをキャプチャ
  const capturedOtelCtx = otelContext.active();

  return new ReadableStream<RenderResult>({
    async start(controller) {
      // キャプチャしたOTelコンテキストを復元してストリーム処理を実行
      await otelContext.with(capturedOtelCtx, async () => {
        const tracer = getEngineTracer();
        await tracer.startActiveSpan("disact-engine.render.stream", async (streamSpan) => {
          logger.debug("Starting render stream");
          try {
            // 結果をバッファ
            let lastResult: RenderResult = null;
            // 無限ループ防止カウンター
            let rerenderCount = 0;

            // setTimeout(0) によるバッチング用フラグ
            // 同一tick内での複数の requestRerender 呼び出しを1回にまとめる：
            // 最初の呼び出しで即座に queue() し、setTimeout(0) が解決するまでの間は
            // 追加の呼び出しをスキップする
            let rerenderBatchPending = false;

            const requestRerender = () => {
              logger.debug("Rerender requested");
              if (rerenderBatchPending) return; // このtick内ですでにキュー済み
              if (scheduler.isDisposed()) return;
              rerenderBatchPending = true;
              scheduler.queue();
              setTimeout(() => {
                rerenderBatchPending = false;
              }, 0);
            };

            const helpers: RenderLifecycleHelpers = { requestRerender };

            // コンテキストにrequestRerender関数を追加
            // 別オブジェクトにしてはいけない
            const contextWithRerender: Context & {
              __requestRerender: () => void;
            } = context as Context & { __requestRerender: () => void };
            contextWithRerender.__requestRerender = requestRerender;

            const scheduler = createScheduler({
              task: async () => {
                const cycleSpan = tracer.startSpan("disact-engine.render.cycle", {
                  attributes: {
                    "disact-engine.render.cycle_number": rerenderCount,
                  },
                });

                try {
                  // タスク開始時にバッチング状態をリセット
                  // （前タスクで設定されたまま引き継がれるのを防ぐ）
                  rerenderBatchPending = false;

                  // 無限ループ防止チェック
                  rerenderCount++;
                  if (rerenderCount > MAX_RERENDER_WITHOUT_COMMIT) {
                    throw new Error(
                      `Maximum rerender count (${MAX_RERENDER_WITHOUT_COMMIT}) exceeded`,
                    );
                  }

                  // preRenderフック
                  if (callbacks?.preRender) {
                    await callbacks.preRender(helpers);
                  }

                  // レンダリング実行（OTelコンテキストを伝播させる）
                  const cycleCtx = trace.setSpan(otelContext.active(), cycleSpan);
                  lastResult = otelContext.with(cycleCtx, () =>
                    runInContext(contextWithRerender, () =>
                      render(element, contextWithRerender, (promise) => {
                        // Promiseが投げられたら、そのPromiseを待つタスクをキューに追加
                        scheduler.queue(promise);
                      }),
                    ),
                  );

                  // postRenderフック
                  if (callbacks?.postRender) {
                    await callbacks.postRender(helpers);
                  }
                } catch (error) {
                  cycleSpan.setStatus({ code: SpanStatusCode.ERROR });
                  cycleSpan.recordException(
                    error instanceof Error ? error : new Error(String(error)),
                  );
                  throw error;
                } finally {
                  cycleSpan.end();
                }
              },
              idleTimeout: 100,
              onIdle: async () => {
                // 結果を送信
                logger.debug("Sending result", { result: lastResult });
                controller.enqueue(lastResult);
                // カウンターをリセット
                rerenderCount = 0;
              },
              onFinish: async () => {
                // postRenderCycleフック
                if (callbacks?.postRenderCycle) {
                  await callbacks.postRenderCycle(helpers);
                }

                // postRenderCycle 内で requestRerender が呼ばれた場合、
                // 即座に scheduler.queue() されるため pendingCount が増加している
                if (scheduler.pendingCount() === 0) {
                  logger.info("Render stream completed");
                  // dispose してから close することで、close 後の requestRerender を無害にする
                  scheduler.dispose();
                  streamSpan.end();
                  controller.close();
                }
              },
              onError: (error) => {
                logger.error("Render task failed", { error });
                streamSpan.setStatus({ code: SpanStatusCode.ERROR });
                streamSpan.recordException(
                  error instanceof Error ? error : new Error(String(error)),
                );
                streamSpan.end();
                controller.error(error);
                return "stop";
              },
            });

            // 初回レンダリングをキュー
            scheduler.queue();
          } catch (error) {
            logger.error("Render stream failed", { error });
            streamSpan.setStatus({ code: SpanStatusCode.ERROR });
            streamSpan.recordException(error instanceof Error ? error : new Error(String(error)));
            streamSpan.end();
            controller.error(error);
          }
        });
      });
    },
  });
};

const render = <Context>(
  element: DisactNode,
  context: Context,
  trackPromise?: (promise: Promise<unknown>) => void,
): RenderResult => {
  if (Array.isArray(element)) {
    logger.trace("Rendering children array", { count: element.length });
    return renderChildrenArray(element, context, render, trackPromise);
  }

  if (element === null || element === undefined || typeof element === "boolean") {
    logger.trace("Rendering null/undefined/boolean element");
    return null;
  }

  if (typeof element === "string") {
    logger.trace("Rendering text element", { isEmpty: element === "" });
    return element === "" ? null : { type: "text", content: element };
  }

  if (typeof element === "number") {
    logger.trace("Rendering number element", { value: element });
    return { type: "text", content: String(element) };
  }

  if (element.type === "function") {
    const componentName = element.fc.name || "anonymous";
    const tracer = getEngineTracer();

    return tracer.startActiveSpan(
      "disact-engine.render.component",
      { attributes: { "disact-engine.component.name": componentName } },
      () => {
        logger.trace("Rendering function component", { component: componentName });
        const span = trace.getActiveSpan();
        try {
          const children = element.fc(element.props);
          const result = render(children, context, trackPromise);
          return result;
        } finally {
          span?.end();
        }
      },
    );
  }

  if (element.type === "intrinsic") {
    logger.trace("Rendering intrinsic element", { name: element.name });
    const { children, ...rest } = element.props;
    const renderedChildren = render(children as DisactNode, context, trackPromise);

    const result = {
      type: "intrinsic" as const,
      name: element.name,
      props: rest,
      children: renderedChildren && toArray(renderedChildren),
    };
    logger.trace("Intrinsic element rendered", {
      name: element.name,
      result,
    });
    return result;
  }

  if (element.type === "suspense") {
    logger.debug("Entering Suspense boundary");
    try {
      // 子をレンダリング
      const result = render(element.props.children, context, trackPromise);
      return result;
    } catch (thrown) {
      // Promiseが投げられた場合、Suspense処理を開始
      if (isPromise(thrown)) {
        logger.debug("Suspense caught thrown promise");
        const span = trace.getActiveSpan();
        span?.addEvent("suspense.fallback");
        trackPromise?.(thrown);
        // fallbackをレンダリングして返す
        return render(element.props.fallback, context, trackPromise);
      }
      logger.error("Non-promise thrown in Suspense", { thrown });
      throw thrown;
    }
  }

  if (element.type === "errorBoundary") {
    logger.debug("Entering ErrorBoundary");
    try {
      // 子をレンダリングしてみる
      return render(element.props.children, context, trackPromise);
    } catch (thrown) {
      // Promiseが投げられた場合はSuspenseに任せる（再スロー）
      if (isPromise(thrown)) {
        throw thrown;
      }
      logger.warn("ErrorBoundary caught error", {
        error: thrown instanceof Error ? thrown.message : thrown,
      });
      const span = trace.getActiveSpan();
      span?.addEvent("error_boundary.caught", {
        "error.message": thrown instanceof Error ? thrown.message : String(thrown),
      });
      // Errorの場合はfallbackをレンダリング
      if (thrown instanceof Error) {
        return render(element.props.fallback(thrown), context, trackPromise);
      }
      // Error以外の例外も一応処理
      const error = new Error("Unknown error", {
        cause: thrown,
      });
      return render(element.props.fallback(error), context, trackPromise);
    }
  }

  logger.error("Unknown element type encountered");
  throw new Error("Unknown element type");
};

const isPromise = (value: unknown): value is Promise<unknown> => {
  return (
    value != null &&
    typeof value === "object" &&
    "then" in value &&
    typeof value.then === "function"
  );
};

const renderChildrenArray = <Context>(
  elements: DisactNode[],
  context: Context,
  renderFn: (
    element: DisactNode,
    context: Context,
    trackPromise?: (promise: Promise<unknown>) => void,
  ) => RenderResult,
  trackPromise?: (promise: Promise<unknown>) => void,
): RenderedElement[] => {
  return elements
    .flatMap((child) => renderFn(child, context, trackPromise))
    .filter((child): child is RenderedElement => child !== null);
};

const toArray = <T>(value: T | T[]): T[] => {
  if (Array.isArray(value)) {
    return value;
  }
  return [value];
};
