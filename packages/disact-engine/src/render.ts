import { runInContext } from "./context";
import type { DisactElement, DisactNode, RenderedElement, RenderResult } from "./element";
import { createRerenderSignal } from "./rerenderSignal";
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
        // RerenderSignalを作成（PromiseTracker機能も含む）
        const rerenderSignal = createRerenderSignal();

        // RerenderSignalを組み込みContextとして追加
        const contextWithSignal = {
          ...context,
          __rerenderSignal: rerenderSignal,
        };

        const helpers: RenderLifecycleHelpers = {
          requestRerender: () => {
            rerenderSignal.requestRerender();
          },
        };

        // preRenderフック呼び出し
        if (callbacks?.preRender) {
          await callbacks.preRender(helpers);
        }

        // 初回レンダリング
        const initialResult = runInContext(contextWithSignal, () =>
          render(element, contextWithSignal, (promise) => rerenderSignal.trackPromise(promise)),
        );

        // postRenderフック呼び出し
        if (callbacks?.postRender) {
          await callbacks.postRender(helpers);
        }

        // 再レンダリングが不要な場合は即座に結果を返す
        if (!rerenderSignal.shouldRerender()) {
          logger.debug("No rerender needed, completing immediately", {
            result: initialResult,
          });
          controller.enqueue(initialResult);

          // postRenderCycleフック呼び出し
          if (callbacks?.postRenderCycle) {
            await callbacks.postRenderCycle(helpers);

            // postRenderCycleで再レンダリングが要求された場合は続行
            if (rerenderSignal.shouldRerender()) {
              let chunkIndex = 1;
              let rerenderCountSinceLastCommit = 0;

              // 再レンダリングループに入る
              while (true) {
                rerenderCountSinceLastCommit = 0;

                while (rerenderSignal.shouldRerender()) {
                  if (rerenderCountSinceLastCommit >= MAX_RERENDER_WITHOUT_COMMIT) {
                    throw new Error(
                      `Maximum rerender count (${MAX_RERENDER_WITHOUT_COMMIT}) exceeded`,
                    );
                  }
                  rerenderCountSinceLastCommit++;

                  await rerenderSignal.waitForRerenderTrigger();
                  rerenderSignal.clearRerenderRequest();

                  if (callbacks?.preRender) {
                    await callbacks.preRender(helpers);
                  }

                  const currentResult = runInContext(contextWithSignal, () =>
                    render(element, contextWithSignal, (promise) =>
                      rerenderSignal.trackPromise(promise),
                    ),
                  );

                  if (callbacks?.postRender) {
                    await callbacks.postRender(helpers);
                  }

                  logger.debug("Sending rerendered result from postRenderCycle", {
                    chunkIndex,
                    result: currentResult,
                  });
                  controller.enqueue(currentResult);
                  rerenderCountSinceLastCommit = 0;
                  chunkIndex++;
                }

                // postRenderCycleを呼び出して、再レンダリング要求があるか確認
                if (callbacks?.postRenderCycle) {
                  await callbacks.postRenderCycle(helpers);
                }

                if (!rerenderSignal.shouldRerender()) {
                  break;
                }
              }
            }
          }

          controller.close();
          return;
        }

        // Promiseが収集された場合、microtaskキューの実行を待つ
        await new Promise((resolve) => setTimeout(resolve, 0));

        // 全てのPromiseがすでに解決されている場合、初回結果をスキップ
        if (rerenderSignal.areAllPromisesResolved() && !rerenderSignal.shouldRerender()) {
          logger.debug("All promises resolved immediately, re-rendering");

          // preRenderフック呼び出し
          if (callbacks?.preRender) {
            await callbacks.preRender(helpers);
          }

          const finalResult = runInContext(contextWithSignal, () =>
            render(element, contextWithSignal, (promise) => rerenderSignal.trackPromise(promise)),
          );

          // postRenderフック呼び出し
          if (callbacks?.postRender) {
            await callbacks.postRender(helpers);
          }

          logger.debug("Final render result", { result: finalResult });

          // postRenderCycleフック呼び出し
          if (callbacks?.postRenderCycle) {
            await callbacks.postRenderCycle(helpers);
          }

          controller.enqueue(finalResult);
          controller.close();
          return;
        }

        // 初回結果を送信
        logger.debug("Sending initial result", { result: initialResult });
        controller.enqueue(initialResult);

        // メインループ: 再レンダリング要求がある限り繰り返す
        let chunkIndex = 1;
        let rerenderCountSinceLastCommit = 0;

        while (rerenderSignal.shouldRerender()) {
          if (rerenderCountSinceLastCommit >= MAX_RERENDER_WITHOUT_COMMIT) {
            throw new Error(
              `Maximum rerender count (${MAX_RERENDER_WITHOUT_COMMIT}) exceeded without enqueuing results`,
            );
          }
          rerenderCountSinceLastCommit++;

          // 次の再レンダリングトリガーを待機
          logger.trace("Waiting for rerender trigger");
          await rerenderSignal.waitForRerenderTrigger();
          rerenderSignal.clearRerenderRequest();

          // preRenderフック呼び出し
          if (callbacks?.preRender) {
            await callbacks.preRender(helpers);
          }

          // 再レンダリング
          const currentResult = runInContext(contextWithSignal, () =>
            render(element, contextWithSignal, (promise) => rerenderSignal.trackPromise(promise)),
          );

          // postRenderフック呼び出し
          if (callbacks?.postRender) {
            await callbacks.postRender(helpers);
          }

          logger.debug("Sending rerendered result", {
            chunkIndex,
            result: currentResult,
          });
          controller.enqueue(currentResult);
          rerenderCountSinceLastCommit = 0; // リセット
          chunkIndex++;
        }

        logger.info("Render stream completed", { totalChunks: chunkIndex });

        // postRenderCycleフック呼び出し - 再レンダリング要求がある限り繰り返す
        while (true) {
          if (callbacks?.postRenderCycle) {
            await callbacks.postRenderCycle(helpers);
          }

          // postRenderCycleで再レンダリングが要求されなければ終了
          if (!rerenderSignal.shouldRerender()) {
            break;
          }

          logger.debug("postRenderCycle requested rerender, starting new cycle");
          rerenderCountSinceLastCommit = 0;

          while (rerenderSignal.shouldRerender()) {
            if (rerenderCountSinceLastCommit >= MAX_RERENDER_WITHOUT_COMMIT) {
              throw new Error(
                `Maximum rerender count (${MAX_RERENDER_WITHOUT_COMMIT}) exceeded in postRenderCycle`,
              );
            }
            rerenderCountSinceLastCommit++;

            await rerenderSignal.waitForRerenderTrigger();
            rerenderSignal.clearRerenderRequest();

            if (callbacks?.preRender) {
              await callbacks.preRender(helpers);
            }

            const cycleResult = runInContext(contextWithSignal, () =>
              render(element, contextWithSignal, (promise) =>
                rerenderSignal.trackPromise(promise),
              ),
            );

            if (callbacks?.postRender) {
              await callbacks.postRender(helpers);
            }

            logger.debug("Sending postRenderCycle result", {
              chunkIndex,
              result: cycleResult,
            });
            controller.enqueue(cycleResult);
            rerenderCountSinceLastCommit = 0;
            chunkIndex++;
          }
        }

        controller.close();
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

  if (element === null || element === undefined) {
    logger.trace("Rendering null/undefined element");
    return null;
  }

  if (typeof element === "string") {
    logger.trace("Rendering text element", { isEmpty: element === "" });
    return element === "" ? null : { type: "text", content: element };
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
