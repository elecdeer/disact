import { runInContext } from "./context";
import type { DisactElement, DisactNode, RenderedElement, RenderResult } from "./element";
import { createPromiseTracker } from "./promiseTracker";
import { getEngineLogger } from "./utils/logger";

const logger = getEngineLogger("render");

export const renderToReadableStream = <Context>(
  element: DisactElement,
  context: Context,
): ReadableStream<RenderResult> => {
  return new ReadableStream<RenderResult>({
    async start(controller) {
      logger.debug("Starting render stream");
      try {
        const promises: Promise<unknown>[] = [];
        const promiseTracker = createPromiseTracker();

        // PromiseTrackerを組み込みContextとして追加
        const contextWithTracker: Context & {
          __promiseTracker: ReturnType<typeof createPromiseTracker>;
        } = {
          ...context,
          __promiseTracker: promiseTracker,
        };

        const initialResult = runInContext(contextWithTracker, () =>
          render(element, contextWithTracker, promises),
        );

        // Suspenseがない場合は即座に結果を返す
        if (promises.length === 0) {
          logger.debug("No suspense detected, completing immediately");
          controller.enqueue(initialResult);
          controller.close();
          return;
        }

        // Promiseの追跡を開始
        logger.debug("Suspense detected", { promiseCount: promises.length });
        promiseTracker.trackPromises(promises);
        // Promiseが収集された場合、microtaskキューの実行を待つ
        await new Promise((resolve) => setTimeout(resolve, 0));

        if (promiseTracker.areAllResolved()) {
          // すべてのPromiseがすでに解決されている場合、再レンダリングして結果を返す
          logger.debug("All promises resolved immediately, re-rendering");
          const finalResult = runInContext(contextWithTracker, () =>
            render(element, contextWithTracker),
          );
          controller.enqueue(finalResult);
          controller.close();
          return;
        }

        // まだ未解決のPromiseがある場合は、fallbackを先に送信
        logger.debug("Sending initial fallback result");
        controller.enqueue(initialResult);

        // 各Promiseが個別に解決されるたびに中間結果を送信
        let chunkIndex = 1;
        while (promiseTracker.hasPendingPromises()) {
          // いずれかのPromiseが解決されるのを待つ
          logger.trace("Waiting for promise resolution", {
            pendingCount: promiseTracker.hasPendingPromises() ? "has pending" : "none",
          });
          await promiseTracker.waitForAnyResolution();

          // 再レンダリングして現在の結果を送信（新しいPromiseも収集）
          const newPromises: Promise<unknown>[] = [];
          const currentResult = runInContext(contextWithTracker, () =>
            render(element, contextWithTracker, newPromises),
          );

          // 新しいPromiseが発生した場合（ネストしたSuspenseなど）は追跡に追加
          if (newPromises.length > 0) {
            logger.debug("New promises detected during re-render", {
              count: newPromises.length,
            });
            promiseTracker.trackPromises(newPromises);
          }

          logger.debug("Sending intermediate result", { chunkIndex });
          controller.enqueue(currentResult);
          chunkIndex++;
        }

        logger.info("Render stream completed", { totalChunks: chunkIndex });
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
  promises: Promise<unknown>[] = [],
): RenderResult => {
  if (Array.isArray(element)) {
    logger.trace("Rendering children array", { count: element.length });
    return renderChildrenArray(element, context, render, promises);
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
    return render(children, context, promises);
  }

  if (element.type === "intrinsic") {
    logger.trace("Rendering intrinsic element", { name: element.name });
    const { children, ...rest } = element.props;
    const renderedChildren = render(children as DisactNode, context, promises);

    return {
      type: "intrinsic",
      name: element.name,
      props: rest,
      children: renderedChildren && toArray(renderedChildren),
    };
  }

  if (element.type === "suspense") {
    logger.debug("Entering Suspense boundary");
    try {
      // 子をレンダリングしてみる（独立したPromise配列を使用）
      const childPromises: Promise<unknown>[] = [];
      const result = render(element.props.children, context, childPromises);

      // 子で発生したPromiseがある場合、それらを親のPromise配列に追加
      if (childPromises.length > 0) {
        logger.debug("Suspense captured promises", { count: childPromises.length });
        promises.push(...childPromises);
      }

      return result;
    } catch (thrown) {
      // Promiseが投げられた場合、Suspense処理を開始
      if (isPromise(thrown)) {
        logger.debug("Suspense caught thrown promise");
        promises.push(thrown);
        // fallbackをレンダリングして返す
        return render(element.props.fallback, context, promises);
      }
      logger.error("Non-promise thrown in Suspense", { thrown });
      throw thrown;
    }
  }

  if (element.type === "errorBoundary") {
    logger.debug("Entering ErrorBoundary");
    try {
      // 子をレンダリングしてみる
      return render(element.props.children, context, promises);
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
        return render(element.props.fallback(thrown), context, promises);
      }
      // Error以外の例外も一応処理
      const error = new Error("Unknown error", {
        cause: thrown,
      });
      return render(element.props.fallback(error), context, promises);
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
  renderFn: (element: DisactNode, context: Context, promises?: Promise<unknown>[]) => RenderResult,
  promises: Promise<unknown>[] = [],
): RenderedElement[] => {
  return elements
    .flatMap((child) => renderFn(child, context, promises))
    .filter((child): child is RenderedElement => child !== null);
};

const toArray = <T>(value: T | T[]): T[] => {
  if (Array.isArray(value)) {
    return value;
  }
  return [value];
};
