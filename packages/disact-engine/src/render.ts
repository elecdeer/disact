import { runInContext } from "./context";
import type { DisactElement, DisactNode, RenderedElement, RenderResult } from "./element";
import { createPromiseTracker } from "./promiseTracker";

export const renderToReadableStream = <Context>(
  element: DisactElement,
  context: Context,
): ReadableStream<RenderResult> => {
  return new ReadableStream<RenderResult>({
    async start(controller) {
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
          controller.enqueue(initialResult);
          controller.close();
          return;
        }

        // Promiseの追跡を開始
        promiseTracker.trackPromises(promises);
        // Promiseが収集された場合、microtaskキューの実行を待つ
        await new Promise((resolve) => setTimeout(resolve, 0));

        if (promiseTracker.areAllResolved()) {
          // すべてのPromiseがすでに解決されている場合、再レンダリングして結果を返す
          const finalResult = runInContext(contextWithTracker, () =>
            render(element, contextWithTracker),
          );
          controller.enqueue(finalResult);
          controller.close();
          return;
        }

        // まだ未解決のPromiseがある場合は、fallbackを先に送信
        controller.enqueue(initialResult);

        // 各Promiseが個別に解決されるたびに中間結果を送信
        while (promiseTracker.hasPendingPromises()) {
          // いずれかのPromiseが解決されるのを待つ
          await promiseTracker.waitForAnyResolution();

          // 再レンダリングして現在の結果を送信（新しいPromiseも収集）
          const newPromises: Promise<unknown>[] = [];
          const currentResult = runInContext(contextWithTracker, () =>
            render(element, contextWithTracker, newPromises),
          );

          // 新しいPromiseが発生した場合（ネストしたSuspenseなど）は追跡に追加
          if (newPromises.length > 0) {
            promiseTracker.trackPromises(newPromises);
          }

          controller.enqueue(currentResult);
        }

        controller.close();
      } catch (error) {
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
    return renderChildrenArray(element, context, render, promises);
  }

  if (element === null || element === undefined) {
    return null;
  }

  if (typeof element === "string") {
    return element === "" ? null : { type: "text", content: element };
  }

  if (element.type === "function") {
    const children = element.fc(element.props);
    return render(children, context, promises);
  }

  if (element.type === "intrinsic") {
    const { children, ...rest } = element.props;
    const renderedChildren = render(children as DisactNode, context, promises);

    // props内のDisactElementもレンダリング
    const renderedProps: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(rest)) {
      if (value && typeof value === "object" && "type" in value) {
        // DisactElementの場合、レンダリング
        renderedProps[key] = render(value as DisactNode, context, promises);
      } else {
        renderedProps[key] = value;
      }
    }

    return {
      type: "intrinsic",
      name: element.name,
      props: renderedProps,
      children: renderedChildren && toArray(renderedChildren),
    };
  }

  if (element.type === "suspense") {
    try {
      // 子をレンダリングしてみる（独立したPromise配列を使用）
      const childPromises: Promise<unknown>[] = [];
      const result = render(element.props.children, context, childPromises);

      // 子で発生したPromiseがある場合、それらを親のPromise配列に追加
      if (childPromises.length > 0) {
        promises.push(...childPromises);
      }

      return result;
    } catch (thrown) {
      // Promiseが投げられた場合、Suspense処理を開始
      if (isPromise(thrown)) {
        promises.push(thrown);
        // fallbackをレンダリングして返す
        return render(element.props.fallback, context, promises);
      }
      throw thrown;
    }
  }

  if (element.type === "errorBoundary") {
    try {
      // 子をレンダリングしてみる
      return render(element.props.children, context, promises);
    } catch (thrown) {
      // Promiseが投げられた場合はSuspenseに任せる（再スロー）
      if (isPromise(thrown)) {
        throw thrown;
      }
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
