export { Fragment, jsx } from "@disact/engine";

export namespace JSX {
  export type Element = import("@disact/engine").DisactElement;
  export type ElementChildrenAttribute = {
    children: unknown;
  };
  export interface IntrinsicElements {
    [elemName: string]: unknown;
  }
}
