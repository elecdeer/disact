/**
 * JSX Runtime for disact
 * Re-exports React's jsx-runtime with custom type definitions
 */

import type { DisactElement, DisactNode } from "./types.js";

// Re-export React's jsx-runtime
export { Fragment, jsx, jsxs } from "react/jsx-runtime";

// Custom JSX namespace with disact-specific types
export namespace JSX {
  export type Element = DisactElement;
  export type ElementChildrenAttribute = {
    children: unknown;
  };
  // Loose intrinsic elements definition - allows any element with children
  export type IntrinsicElements = Record<
    string,
    {
      children?: DisactNode;
      [key: string]: unknown;
    }
  >;
}
