/**
 * JSX Dev Runtime for disact
 * Re-exports React's jsx-dev-runtime with custom type definitions
 */

import type React from "react";

// Re-export React's jsx-dev-runtime
export { Fragment, jsxDEV } from "react/jsx-dev-runtime";

// Custom JSX namespace with disact-specific types
export namespace JSX {
  export type Element = React.ReactElement;
  export type ElementChildrenAttribute = {
    children: unknown;
  };
  // Loose intrinsic elements definition - allows any element with children
  export type IntrinsicElements = Record<
    string,
    {
      children?: React.ReactNode;
      [key: string]: unknown;
    }
  >;
}
