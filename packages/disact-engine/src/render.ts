import type { DisactElement, DisactNode, RenderedElement } from "./element";
import { setCurrentContext, clearCurrentContext } from "./context-manager";

export const renderToReadableStream = <Context>(
  element: DisactElement,
  context: Context,
): ReadableStream<RenderedElement> => {
  return new ReadableStream<RenderedElement>({
    async start(controller) {
      try {
        // レンダリング開始時にcontextを設定
        setCurrentContext(context);

        const promises: Promise<unknown>[] = [];
        const promiseTracker = createPromiseTracker();

        // 最初にfallbackを使ってレンダリング
        const initialResult = validateRootElement(render(element, context, promises));

        if (promises.length > 0) {
          // Promiseの追跡を開始
          promiseTracker.trackPromises(promises);

          // Promiseが収集された場合、microtaskキューの実行を待つ
          await new Promise((resolve) => setTimeout(resolve, 0));

          // Promiseの解決状況をチェック
          if (promiseTracker.areAllResolved()) {
            // すべてのPromiseが解決済みの場合、再レンダリングして結果を返す
            const finalResult = render(element, context);
            controller.enqueue(validateRootElement(finalResult));
          } else {
            // まだ未解決のPromiseがある場合は、fallbackを先に送信
            controller.enqueue(initialResult);

            // 各Promiseが個別に解決されるたびに中間結果を送信
            let hasEnqueuedFinal = false;

            const handleIndividualPromiseResolution = async () => {
              while (promiseTracker.hasPendingPromises()) {
                // いずれかのPromiseが解決されるのを待つ
                await promiseTracker.waitForAnyResolution();

                // 再レンダリングして現在の結果を送信（新しいPromiseも収集）
                const newPromises: Promise<unknown>[] = [];
                const currentResult = render(element, context, newPromises);

                // 新しいPromiseが発生した場合（ネストしたSuspenseなど）は追跡に追加
                if (newPromises.length > 0) {
                  promiseTracker.trackPromises(newPromises);
                }

                if (currentResult !== null && !Array.isArray(currentResult)) {
                  controller.enqueue(currentResult);
                  hasEnqueuedFinal = true;
                }
              }
            };

            await handleIndividualPromiseResolution();

            // ループ終了後、まだ最終結果が送信されていない場合のみ送信
            if (!promiseTracker.hasPendingPromises() && !hasEnqueuedFinal) {
              const finalResult = render(element, context);
              if (finalResult !== null && !Array.isArray(finalResult)) {
                controller.enqueue(finalResult);
              }
            }
          }
        } else {
          // Suspenseなしの場合
          controller.enqueue(initialResult);
        }

        controller.close();
      } catch (error) {
        controller.error(error);
      } finally {
        // レンダリング終了時にcontextをクリア
        clearCurrentContext();
      }
    },
  });
};

const render = <Context>(
  element: DisactNode,
  context: Context,
  promises: Promise<unknown>[] = [],
): RenderedElement | RenderedElement[] | null => {
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

    return {
      type: "intrinsic",
      name: element.name,
      props: rest,
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

// よりシンプルなアプローチ：Promiseの状態をキャッシュして管理
const createPromiseTracker = () => {
  const resolvedPromises = new Set<Promise<unknown>>();
  const allPromises: Promise<unknown>[] = [];

  const trackPromise = (promise: Promise<unknown>) => {
    if (!allPromises.includes(promise)) {
      allPromises.push(promise);
    }
    promise.then(
      () => resolvedPromises.add(promise),
      () => resolvedPromises.add(promise),
    );
  };

  const trackPromises = (promises: Promise<unknown>[]) => {
    for (const promise of promises) {
      trackPromise(promise);
    }
  };

  const areAllResolved = (): boolean => {
    return allPromises.every((promise) => resolvedPromises.has(promise));
  };

  const getPendingPromises = (): Promise<unknown>[] => {
    return allPromises.filter((promise) => !resolvedPromises.has(promise));
  };

  const waitForAnyResolution = async (): Promise<void> => {
    const pendingPromises = getPendingPromises();
    if (pendingPromises.length > 0) {
      await Promise.race(pendingPromises);
    }
  };

  const hasPendingPromises = (): boolean => {
    return getPendingPromises().length > 0;
  };

  return {
    trackPromise,
    trackPromises,
    areAllResolved,
    getPendingPromises,
    waitForAnyResolution,
    hasPendingPromises,
  };
};

const validateRootElement = (
  result: RenderedElement | RenderedElement[] | null,
): RenderedElement => {
  if (result === null) {
    throw new Error("Root element cannot be null");
  }
  if (Array.isArray(result)) {
    throw new Error("Root element cannot be an array");
  }
  return result;
};

const renderChildrenArray = <Context>(
  elements: DisactNode[],
  context: Context,
  renderFn: (
    element: DisactNode,
    context: Context,
    promises?: Promise<unknown>[],
  ) => RenderedElement | RenderedElement[] | null,
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
