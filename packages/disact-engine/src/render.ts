import type { DisactElement, DisactNode, RenderedElement } from "./element";

export const renderToReadableStream = <Context>(
  element: DisactElement,
  context: Context,
): ReadableStream<RenderedElement> => {
  return new ReadableStream<RenderedElement>({
    async start(controller) {
      try {
        const result = await renderWithSuspenseSupport(
          element,
          context,
          controller,
        );
        // resultがnullの場合は既にすべての結果が送信済みなのでcloseのみ
        if (result !== null) {
          controller.enqueue(result);
        }
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });
};

const renderWithSuspenseSupport = async <Context>(
  element: DisactElement,
  context: Context,
  controller: ReadableStreamDefaultController<RenderedElement>,
): Promise<RenderedElement | null> => {
  const promises: Promise<unknown>[] = [];
  const promiseTracker = createPromiseTracker();

  // 最初にfallbackを使ってレンダリング
  const initialResult = validateRootElement(render(element, context, promises));

  if (promises.length > 0) {
    // Promiseの追跡を開始
    promises.forEach(promise => promiseTracker.trackPromise(promise));

    // Promiseが収集された場合、microtaskキューの実行を待つ
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Promiseの解決状況をチェック
    if (promiseTracker.areAllResolved(promises)) {
      // すべてのPromiseが解決済みの場合、再レンダリングして結果を返す
      const finalResult = render(element, context);
      return validateRootElement(finalResult);
    } else {
      // まだ未解決のPromiseがある場合は、fallbackを先に送信
      controller.enqueue(initialResult);

      // 各Promiseが個別に解決されるたびに中間結果を送信
      let remainingPromises = promiseTracker.getPendingPromises(promises);

      const handleIndividualPromiseResolution = async () => {
        while (remainingPromises.length > 0) {
          // いずれかのPromiseが解決されるのを待つ
          await Promise.race(remainingPromises);

          // 現在のPromiseの解決状況をチェック
          const currentPendingPromises = promiseTracker.getPendingPromises(remainingPromises);

          // 解決されたPromiseがある場合
          if (currentPendingPromises.length < remainingPromises.length) {
            // 再レンダリングして現在の結果を送信
            const currentResult = render(element, context);
            if (currentResult !== null && !Array.isArray(currentResult)) {
              controller.enqueue(currentResult);
            }

            // 残っているPromiseを更新
            remainingPromises = currentPendingPromises;
          } else {
            // まだ解決されていない場合、少し待ってから再試行
            await new Promise((resolve) => setTimeout(resolve, 1));
          }
        }
      };

      await handleIndividualPromiseResolution();

      // すべてのPromiseが解決済みの場合、最終結果は既に送信されているため
      // nullを返してストリームを終了
      return null;
    }
  } else {
    // Suspenseなしの場合
    return initialResult;
  }
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
    const renderedChildren = render(
      children as DisactNode,
      context,
      promises,
    );

    return {
      type: "intrinsic",
      name: element.name,
      props: rest,
      children: renderedChildren && toArray(renderedChildren),
    };
  }

  if (element.type === "suspense") {
    try {
      // 子をレンダリングしてみる
      return render(element.props.children, context, promises);
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

  const trackPromise = (promise: Promise<unknown>) => {
    promise.then(
      () => resolvedPromises.add(promise),
      () => resolvedPromises.add(promise)
    );
  };

  const areAllResolved = (promises: Promise<unknown>[]): boolean => {
    return promises.every(promise => resolvedPromises.has(promise));
  };

  const getPendingPromises = (promises: Promise<unknown>[]): Promise<unknown>[] => {
    return promises.filter(promise => !resolvedPromises.has(promise));
  };

  return { trackPromise, areAllResolved, getPendingPromises };
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
  renderFn: (element: DisactNode, context: Context, promises?: Promise<unknown>[]) => RenderedElement | RenderedElement[] | null,
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
