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
  source: DevSource,
): DisactElement => {
  if (typeof tag === "function") {
    return {
      type: "function",
      fc: tag,
      props,
      _devSource: source,
    };
  } else {
    return {
      type: "intrinsic",
      name: tag,
      props,
      _devSource: source,
    };
  }
};

export const Fragment = ({
  children,
}: {
  children: DisactElement[];
}): DisactNode => children;

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

// usePromise を re-export して use としても利用可能にする
export { usePromise as use } from "./promise-state";
