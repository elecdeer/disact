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
 * renderToReadableStreamの実行開始時に呼び出される
 */
export const setCurrentContext = <T>(context: T): void => {
  currentRenderingContext = context;
};

/**
 * レンダリングコンテキストをクリアする（内部用）
 * renderToReadableStreamの実行終了時に呼び出される
 */
export const clearCurrentContext = (): void => {
  currentRenderingContext = null;
};