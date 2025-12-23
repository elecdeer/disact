export { Fragment, jsxDEV, jsxDEV as jsxsDev } from "@disact/engine";

// Re-export IntrinsicElements under a different name for JSX namespace
type _IntrinsicElements = import("./components/index.ts").IntrinsicElements;

export namespace JSX {
  export type Element = import("@disact/engine").DisactElement;
  export type ElementChildrenAttribute = {
    children: unknown;
  };
  export type IntrinsicElements = _IntrinsicElements;
}
