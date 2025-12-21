// TODO: 具体的な形にしたほうがよい？
export type IntrinsicElementName = string;

export type PropsBase = Record<PropertyKey, unknown>;

// oxlint-disable-next-line no-explicit-any: 右側はanyにせざるを得ない
export type FunctionComponent<P extends PropsBase = any> = (props: P) => DisactNode;

export type DevSource = {
  fileName: string;
  lineNumber: number;
  columnNumber: number;
};

/**
 * createElementの返り値となる要素の型
 */
export type DisactElement =
  | FunctionComponentElement
  | IntrinsicElement
  | SuspenseElement
  | ErrorBoundaryElement;

/**
 * レンダリング可能な要素の型
 *
 * FCの返り値やchildrenとして使える型
 */
export type DisactNode = DisactElement | string | null | undefined | DisactNode[];

type DisactElementBase = {
  _devSource?: DevSource;
};

export type FunctionComponentElement = {
  type: "function";
  fc: FunctionComponent;
  props: PropsBase;
} & DisactElementBase;

export type IntrinsicElement = {
  type: "intrinsic";
  name: IntrinsicElementName;
  props: PropsBase;
} & DisactElementBase;

export type SuspenseElement = {
  type: "suspense";
  props: {
    fallback: DisactNode;
    children: DisactNode;
  };
} & DisactElementBase;

export type ErrorBoundaryElement = {
  type: "errorBoundary";
  props: {
    fallback: (error: Error) => DisactNode;
    children: DisactNode;
  };
} & DisactElementBase;

export type RenderedElement =
  | {
      type: "intrinsic";
      name: IntrinsicElementName;
      props: PropsBase;
      children: RenderedElement[] | null;
    }
  | { type: "text"; content: string };

/**
 * レンダリング結果の型（nullや配列も含む）
 */
export type RenderResult = RenderedElement | RenderedElement[] | null;
