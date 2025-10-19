import type { DisactElement, RenderResult } from "@disact/engine";
import {
  createPromiseStateManager,
  renderToReadableStream,
} from "@disact/engine";
import { toPayload } from "../components/index";

type PayloadElement = object | string;

export interface TestRenderResult {
  result: {
    current: PayloadElement[] | null;
    history: PayloadElement[][];
  };
}

/**
 * testing library ライクなテストユーティリティ
 *
 * renderToReadableStream を使用してレンダリングし、
 * 各チャンクを toPayload で変換して history に記録します。
 * 初回のレンダリングが完了したらresolveします。
 *
 * @param element レンダリングする要素
 * @param context レンダリングコンテキスト
 * @returns テスト結果オブジェクトのPromise
 *
 * @example
 * ```tsx
 * const { result } = await testRender(<Component />);
 * expect(result.current).toEqual([...]);
 * expect(result.history).toHaveLength(2);
 * ```
 */
export const testRender = async <Context = undefined>(
  element: DisactElement,
  context?: Context | undefined,
): Promise<TestRenderResult> => {
  const history: PayloadElement[][] = [];
  const result: TestRenderResult["result"] = {
    current: null,
    history,
  };

  // promiseStateManager をコンテキストに追加
  const contextWithManager = {
    ...context,
    promiseStateManager: createPromiseStateManager(),
  } as Context;

  const stream = renderToReadableStream(element, contextWithManager);
  const reader = stream.getReader();

  // バックグラウンドでストリームを読み続ける
  (async () => {
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // RenderResult を PayloadElement[] に変換
        const payloads = removeUndefinedValuesDeep(
          renderResultToPayloads(value),
        );
        history.push(payloads);
        result.current = payloads;
      }
    } finally {
      reader.releaseLock();
    }
  })();

  // 初回のレンダリングが完了するまで待機
  await new Promise<void>((resolve) => {
    const checkInterval = setInterval(() => {
      if (history.length > 0) {
        clearInterval(checkInterval);
        resolve();
      }
    }, 10);
  });

  return { result };
};

/**
 * RenderResult を PayloadElement[] に変換
 */
const renderResultToPayloads = (result: RenderResult): PayloadElement[] => {
  if (result === null) {
    return [];
  }

  if (Array.isArray(result)) {
    return result.map((element) => toPayload(element));
  }

  return [toPayload(result)];
};

export const removeUndefinedValuesDeep = <T>(val: T): T => {
  if (val == null) {
    return val as T;
  }

  if (Array.isArray(val)) {
    return val.map((item) => removeUndefinedValuesDeep(item)) as T;
  }

  if (typeof val === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(val)) {
      if (value !== undefined) {
        result[key] = removeUndefinedValuesDeep(value);
      }
    }
    return result as T;
  }

  return val;
};

/**
 * 条件が満たされるまで待機するユーティリティ
 *
 * @param callback 条件をチェックするコールバック関数
 * @param options タイムアウトとチェック間隔のオプション
 *
 * @example
 * ```tsx
 * await waitFor(() => {
 *   expect(result.current).toEqual([...]);
 * });
 * ```
 */
export const waitFor = async (
  callback: () => void | Promise<void>,
  options: {
    timeout?: number;
    interval?: number;
  } = {},
): Promise<void> => {
  const { timeout = 1000, interval = 50 } = options;
  const startTime = Date.now();

  while (true) {
    try {
      await callback();
      return;
    } catch (error) {
      if (Date.now() - startTime >= timeout) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, interval));
    }
  }
};
