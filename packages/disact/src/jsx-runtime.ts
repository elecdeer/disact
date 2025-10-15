export { Fragment, jsx } from "@disact/engine";

export namespace JSX {
  export type Element = import("@disact/engine").DisactElement;
  export type ElementChildrenAttribute = {
    children: unknown;
  };
  export type IntrinsicElements =
    import("./components/index.ts").IntrinsicElements;
}
