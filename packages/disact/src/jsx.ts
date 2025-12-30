import { DisactElement } from "@disact/engine";
import type { FC, PropsBase } from "./index.js";
export { Fragment, jsxDEV, jsxDEV as jsxsDev } from "@disact/engine";

// Re-export IntrinsicElements under a different name for JSX namespace
type _IntrinsicElements = import("./components/index.ts").IntrinsicElements;

export namespace JSXInternal {
  export type Element = DisactElement;

  // oxlint-disable-next-line no-explicit-any
  export type ElementType<P extends PropsBase = any> =
    | {
        [K in keyof IntrinsicElements]: P extends IntrinsicElements[K] ? K : never;
      }[keyof IntrinsicElements]
    | FC<P>;

  export type ElementChildrenAttribute = {
    children: unknown;
  };

  export type IntrinsicElements = _IntrinsicElements;
}
