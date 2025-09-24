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

/**
 * Reactのuse()フックと同様の機能を提供する
 * Promiseが解決されていない場合はそのPromiseを投げ、
 * 解決されている場合は結果を返す
 */
export const use = <T>(promise: Promise<T>): T => {
  // Promiseの状態を追跡するために、promiseにメタデータを付加
  const promiseWithStatus = promise as Promise<T> & {
    status?: "pending" | "fulfilled" | "rejected";
    value?: T;
    reason?: unknown;
  };

  // 既に解決されている場合は結果を返す
  if (promiseWithStatus.status === "fulfilled") {
    return promiseWithStatus.value!;
  }

  // 既に拒否されている場合はエラーを投げる
  if (promiseWithStatus.status === "rejected") {
    throw promiseWithStatus.reason;
  }

  // まだ解決されていない場合は状態を設定し、Promiseを投げる
  if (promiseWithStatus.status === undefined) {
    promiseWithStatus.status = "pending";

    promise.then(
      (value) => {
        promiseWithStatus.status = "fulfilled";
        promiseWithStatus.value = value;
      },
      (reason) => {
        promiseWithStatus.status = "rejected";
        promiseWithStatus.reason = reason;
      },
    );
  }

  // SuspenseバウンダリにキャッチされるようにPromiseを投げる
  throw promise;
};
