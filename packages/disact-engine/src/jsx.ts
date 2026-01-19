import type {
  DevSource,
  DisactElement,
  DisactNode,
  FunctionComponent,
  IntrinsicElementName,
  PropsBase,
} from "./element";

export const jsx = (
  tag: IntrinsicElementName | FunctionComponent,
  props: PropsBase,
  _key: unknown,
  _isStaticChildren: boolean,
  source?: DevSource,
): DisactElement => {
  if (typeof tag === "function") {
    const element: DisactElement = {
      type: "function",
      fc: tag,
      props,
    };
    if (source !== undefined) {
      element._devSource = source;
    }
    return element;
  } else {
    const element: DisactElement = {
      type: "intrinsic",
      name: tag,
      props,
    };
    if (source !== undefined) {
      element._devSource = source;
    }
    return element;
  }
};

export const jsxDEV = jsx;

export const Fragment = ({ children }: { children: DisactElement[] }): DisactNode => children;

export const Suspense = ({
  fallback,
  children,
}: {
  fallback: DisactNode;
  children: DisactNode;
}): DisactElement => ({
  type: "suspense",
  props: { fallback, children },
});

export const ErrorBoundary = ({
  fallback,
  children,
}: {
  fallback: (error: Error) => DisactNode;
  children: DisactNode;
}): DisactElement => ({
  type: "errorBoundary",
  props: { fallback, children },
});

export namespace JSXInternal {
  export type Element = DisactElement;

  // oxlint-disable-next-line no-explicit-any
  export type ElementType<P extends PropsBase = any> =
    | {
        [K in keyof IntrinsicElements]: P extends IntrinsicElements[K] ? K : never;
      }[keyof IntrinsicElements]
    | ((props: P) => DisactNode);

  export type ElementChildrenAttribute = {
    children: unknown;
  };

  export type IntrinsicElements = {
    [elemName: string]: PropsBase;
  };
}
