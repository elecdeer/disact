import { runInContext } from "./context";
import type { DisactElement, DisactNode, RenderedElement, RenderResult } from "./element";
import { createScheduler } from "./scheduler";
import { getEngineLogger } from "./utils/logger";

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
  return new ReadableStream<RenderResult>({
    async start(controller) {
      logger.debug("Starting render stream");
      try {
        // 結果をバッファ
        let lastResult: RenderResult = null;
        // 無限ループ防止カウンター
        let rerenderCount = 0;

        // requestRerender関数を作成（schedulerへの参照をクロージャでキャプチャ）
        let rerenderRequested = false;
        const requestRerender = () => {
          rerenderRequested = true;
          logger.debug("Rerender requested");
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
            rerenderRequested = false;

            // 無限ループ防止チェック
            rerenderCount++;
            if (rerenderCount > MAX_RERENDER_WITHOUT_COMMIT) {
              throw new Error(`Maximum rerender count (${MAX_RERENDER_WITHOUT_COMMIT}) exceeded`);
            }

            // preRenderフック
            if (callbacks?.preRender) {
              await callbacks.preRender(helpers);
            }

            // レンダリング実行
            lastResult = runInContext(contextWithRerender, () =>
              render(element, contextWithRerender, (promise) => {
                // Promiseが投げられたら、そのPromiseを待つタスクをキューに追加
                scheduler.queue(promise);
              }),
            );

            // postRenderフック
            if (callbacks?.postRender) {
              await callbacks.postRender(helpers);
            }

            // 再レンダリング要求があれば再度キューに追加
            if (rerenderRequested) {
              logger.debug("Rerendering due to requestRerender called");
              scheduler.queue();
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
            rerenderRequested = false;
            if (callbacks?.postRenderCycle) {
              await callbacks.postRenderCycle(helpers);
            }
            if (rerenderRequested) {
              // 再レンダリング要求があれば再度キューに追加
              logger.debug("Rerendering due to requestRerender called in postRenderCycle");
              scheduler.queue();
            }

            if (scheduler.pendingCount() === 0) {
              logger.info("Render stream completed");
              controller.close();
            }
          },
          onError: (error) => {
            logger.error("Render task failed", { error });
            controller.error(error);
            return "stop";
          },
        });

        // 初回レンダリングをキュー
        scheduler.queue();
      } catch (error) {
        logger.error("Render stream failed", { error });
        controller.error(error);
      }
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
    logger.trace("Rendering function component");
    const children = element.fc(element.props);
    return render(children, context, trackPromise);
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
