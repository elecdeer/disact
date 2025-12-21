import type { IntrinsicElements as MarkdownIntrinsicElements } from "./markdown";

export namespace DisactJSX {
  export type Element = DisactElement;

  export interface IntrinsicElements extends MarkdownIntrinsicElements {}

  export interface ElementChildrenAttribute {
    children?: unknown;
  }
}

export type DisactJSXElement = {
  _jsxType: FunctionComponent | string;
  _props: PropType;
  _context?: (<T>(cb: () => T) => T) | undefined;

  [key: string]: unknown;
};

export type DisactObjectElement = object;

export type DisactElement = DisactJSXElement | DisactObjectElement;

export type StringLike = {
  toString(): string;
};

export type DisactChildElement =
  | DisactElement
  | DisactFragment
  | string
  | StringLike
  | number
  | boolean
  | null
  | undefined;

export type DisactFragment = DisactChildElement[];

export type DisactChildElements = DisactChildElement | DisactChildElement[];

export type DisactChildNode = DisactElement | boolean | null | undefined;

export type DisactChildNodes = DisactChildNode | DisactChildNode[];

export type PropType = Record<PropertyKey, unknown>;
// biome-ignore lint/suspicious/noExplicitAny: TODO:
export type FunctionComponent<P extends PropType = any> = (
  props: P,
) => DisactJSX.Element | Promise<DisactJSX.Element>;

export type JsxDevSource = {
  fileName: string;
  lineNumber: number;
  columnNumber: number;
};

const _toArray = <T>(value: T | T[]): T[] => {
  if (Array.isArray(value)) {
    return value;
  }
  return [value];
};

export const jsx = (
  type: FunctionComponent | keyof DisactJSX.IntrinsicElements,
  props: Record<string, unknown> & {
    children?: (string | unknown)[];
  },
  _key: unknown,
  __isStaticChildren: boolean | undefined,
  source: JsxDevSource | undefined,
): DisactJSX.Element => {
  if (typeof type === "function") {
    return {
      _jsxType: type,
      _props: props,
      _source: source,
    };
  }

  return {
    _jsxType: type,
    _source: source,
    type,
    props,
  };
};

export const jsxs = jsx;

export const FragmentInternal = ({ children }: { children: DisactJSX.Element[] }) =>
  ([] as DisactJSX.Element[]).concat(children);

export const isDisactElement = (element: unknown): element is DisactJSXElement => {
  return (
    typeof element === "object" &&
    element !== null &&
    element !== undefined &&
    "_jsxType" in element
  );
};
