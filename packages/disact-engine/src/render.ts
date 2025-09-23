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

  throw new Error("Unknown element type");
};

const toArray = <T>(value: T | T[]): T[] => {
  if (Array.isArray(value)) {
    return value;
  }
  return [value];
};
