/**
 * グローバルなレンダリングコンテキスト管理
 * renderToReadableStream実行中のcontextを保持し、
 * コンポーネント内からアクセス可能にする
 */

// 現在レンダリング中のcontextを保持するグローバル変数
let currentRenderingContext: unknown = null;

/**
 * 現在のレンダリングコンテキストを取得する
 * レンダリング中のコンポーネント内でのみ呼び出し可能
 */
export const getCurrentContext = <T = unknown>(): T => {
  if (currentRenderingContext === null) {
    throw new Error("getCurrentContext can only be called during rendering");
  }
  return currentRenderingContext as T;
};

/**
 * レンダリングコンテキストを設定する（内部用）
 * runInContextの実行開始時に呼び出される
 */
const setCurrentContext = <T>(context: T): void => {
  currentRenderingContext = context;
};

/**
 * レンダリングコンテキストをクリアする（内部用）
 * runInContextの実行終了時に呼び出される
 */
const clearCurrentContext = (): void => {
  currentRenderingContext = null;
};

/**
 * コンテキスト内でコールバックを実行する
 * コールバック実行中のみcontextが利用可能で、完了後は自動的にクリアされる
 * ネストした呼び出しはエラーになる
 */
export const runInContext = <T, R>(
  context: T,
  callback: () => R
): R => {
  // ネストチェック
  if (currentRenderingContext !== null) {
    throw new Error("runInContext cannot be nested");
  }

  setCurrentContext(context);
  try {
    return callback();
  } finally {
    clearCurrentContext();
  }
};