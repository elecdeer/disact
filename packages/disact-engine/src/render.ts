import type { DisactElement, DisactNode, RenderedElement } from "./element";

export const renderRoot = <Context>(
  element: DisactElement,
  context: Context,
): RenderedElement => {
  const result = render(element, context);
  if (result === null) {
    throw new Error("Root element cannot be null");
  }
  if (Array.isArray(result)) {
    throw new Error("Root element cannot be an array");
  }
  return result;
};

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

  // 最初にfallbackを使ってレンダリング
  const initialResult = renderWithFallbacks(element, context, promises);
  if (initialResult === null) {
    throw new Error("Root element cannot be null");
  }
  if (Array.isArray(initialResult)) {
    throw new Error("Root element cannot be an array");
  }

  if (promises.length > 0) {
    // Promiseが収集された場合、microtaskキューの実行を待つ
    await new Promise((resolve) => setTimeout(resolve, 0));

    // microtask実行後に再度チェック - 即座に解決されたPromiseがあるかもしれない
    const secondPromises: Promise<unknown>[] = [];
    const secondResult = renderWithFallbacks(element, context, secondPromises);

    if (secondPromises.length === 0) {
      // すべてのPromiseが解決済みの場合、fallbackなしで直接結果を返す
      if (secondResult === null) {
        throw new Error("Root element cannot be null");
      }
      if (Array.isArray(secondResult)) {
        throw new Error("Root element cannot be an array");
      }
      return secondResult;
    } else {
      // まだ未解決のPromiseがある場合は、fallbackを先に送信
      controller.enqueue(initialResult);

      // 各Promiseが個別に解決されるたびに中間結果を送信
      let remainingPromises = [...secondPromises];

      const handleIndividualPromiseResolution = async () => {
        while (remainingPromises.length > 0) {
          // いずれかのPromiseが解決されるのを待つ
          await Promise.race(remainingPromises);

          // 現在の状態で再レンダリングを試行
          const currentPromises: Promise<unknown>[] = [];
          const currentResult = renderWithFallbacks(
            element,
            context,
            currentPromises,
          );

          // 解決されたPromiseがある場合（currentPromisesが減った場合）
          if (currentPromises.length < remainingPromises.length) {
            if (currentResult !== null && !Array.isArray(currentResult)) {
              controller.enqueue(currentResult);
            }

            // 残っているPromiseを更新
            remainingPromises = currentPromises;
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

const renderWithFallbacks = <Context>(
  element: DisactNode,
  context: Context,
  promises: Promise<unknown>[],
): RenderedElement | RenderedElement[] | null => {
  if (Array.isArray(element)) {
    return element
      .flatMap((child) => renderWithFallbacks(child, context, promises))
      .filter((child): child is RenderedElement => child !== null);
  }

  if (element === null || element === undefined) {
    return null;
  }

  if (typeof element === "string") {
    return element === "" ? null : { type: "text", content: element };
  }

  if (element.type === "function") {
    const children = element.fc(element.props);
    return renderWithFallbacks(children, context, promises);
  }

  if (element.type === "intrinsic") {
    const { children, ...rest } = element.props;
    const renderedChildren = renderWithFallbacks(
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
      return renderWithFallbacks(element.props.children, context, promises);
    } catch (thrown) {
      // Promiseが投げられた場合、Suspense処理を開始
      if (isPromise(thrown)) {
        promises.push(thrown);
        // fallbackをレンダリングして返す
        return renderWithFallbacks(element.props.fallback, context, promises);
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

const render = <Context>(
  element: DisactNode,
  context: Context,
): RenderedElement | RenderedElement[] | null => {
  if (Array.isArray(element)) {
    return element
      .flatMap((child) => render(child, context))
      .filter((child): child is RenderedElement => child !== null);
  }

  if (element === null || element === undefined) {
    return null;
  }

  if (typeof element === "string") {
    return element === "" ? null : { type: "text", content: element };
  }

  if (element.type === "function") {
    const children = element.fc(element.props);
    return render(children, context);
  }

  if (element.type === "intrinsic") {
    const { children, ...rest } = element.props;

    const renderedChildren = render(children as DisactNode, context);

    return {
      type: "intrinsic",
      name: element.name,
      props: rest,
      children: renderedChildren && toArray(renderedChildren),
    };
  }

  if (element.type === "suspense") {
    // Suspenseの子をレンダリングしてみる
    try {
      return render(element.props.children, context);
    } catch (thrown) {
      // Suspense内でPromiseが投げられた場合、そのPromiseを再度投げる
      // これにより、上位のrenderWithSuspenseで適切に処理される
      if (isPromise(thrown)) {
        throw thrown;
      }
      throw thrown;
    }
  }

  throw new Error("Unknown element type");
};

const toArray = <T>(value: T | T[]): T[] => {
  if (Array.isArray(value)) {
    return value;
  }
  return [value];
};
