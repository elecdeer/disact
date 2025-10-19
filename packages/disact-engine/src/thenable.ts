/**
 * Promise の状態を表すプロパティを持つ Thenable 型
 */
export type Thenable<T> = Promise<T> & {
  status?: "pending" | "fulfilled" | "rejected";
  value?: T;
  reason?: unknown;
};

/**
 * React の use フックに似た実装
 * Promise が解決されていない場合はそのPromise を投げ、
 * 解決されている場合は結果を返す
 *
 * Promise オブジェクトに直接 status, value, reason プロパティを追加して状態を管理します。
 */
export const use = <T>(promise: Promise<T>): T => {
  const thenable = promise as Thenable<T>;

  // 既に状態が設定されている場合
  if (thenable.status === "fulfilled") {
    return thenable.value as T;
  }

  if (thenable.status === "rejected") {
    throw thenable.reason;
  }

  // 初めて呼ばれた場合、状態を追跡開始
  if (!thenable.status) {
    thenable.status = "pending";
    promise.then(
      (value) => {
        thenable.status = "fulfilled";
        thenable.value = value;
      },
      (reason) => {
        thenable.status = "rejected";
        thenable.reason = reason;
      },
    );
  }

  // Suspense バウンダリにキャッチされるように Promise を投げる
  throw promise;
};
