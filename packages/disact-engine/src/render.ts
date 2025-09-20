import {
  contextSymbol,
  type DisactElement,
  type DisactNode,
  type IntrinsicElementDisactElement,
  isFragmentElement,
  isFunctionComponentElement,
} from "./element";

export type RenderedDisactElement =
  | IntrinsicElementDisactElement
  | string
  | undefined
  | null;

export const render = async (
  element: DisactElement,
): Promise<RenderedDisactElement> => {
  const result = await renderElement(element);
  if (Array.isArray(result)) {
    throw new Error("Top level element must not be Fragment");
  }
  return result;
};

const renderElement = async (
  node: DisactElement | string | undefined | null,
  combinedContextRunner: <T>(cb: () => T) => T = (cb) => cb(),
): Promise<RenderedDisactElement | RenderedDisactElement[]> => {
  if (node === null || node === undefined || typeof node === "string") {
    return node;
  }

  const context = contextSymbol in node ? node[contextSymbol] : undefined;

  const contextRunner = context
    ? <T>(cb: () => T) => {
        return combinedContextRunner<T>(() => context(cb));
      }
    : combinedContextRunner;

  if (isFragmentElement(node)) {
    return await renderChildren(node.children, contextRunner);
  }

  if (isFunctionComponentElement(node)) {
    const resolved = await contextRunner(async () =>
      node.type({
        ...node.props,
        children: node.children,
      }),
    );
    return await renderElement(resolved, contextRunner);
  }

  return {
    ...node,
    children: await renderChildren(node.children, combinedContextRunner),
  };
};

const renderChildren = async (
  children: DisactNode | DisactNode[],
  combinedContextRunner: <T>(cb: () => T) => T = (cb) => cb(),
) => {
  if (Array.isArray(children)) {
    const renderedChildren = await Promise.all(
      children.map((child) => renderElement(child, combinedContextRunner)),
    );

    const validChildren = renderedChildren
      .flat()
      .filter((child) => child !== null && child !== undefined);

    if (validChildren.length === 0) {
      return undefined;
    }
    return validChildren;
  }

  return (await renderElement(children, combinedContextRunner)) ?? undefined;
};
