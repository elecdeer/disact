import type { DisactElement, RenderResult } from "@disact/engine";
import { renderToReadableStream } from "@disact/engine";
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
 *
 * @param element レンダリングする要素
 * @param context レンダリングコンテキスト
 * @returns テスト結果オブジェクト
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
  context?: Context,
): Promise<TestRenderResult> => {
  const history: PayloadElement[][] = [];

  const stream = renderToReadableStream(
    element,
    context as Context extends undefined ? Record<string, never> : Context,
  );
  const reader = stream.getReader();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      // RenderResult を PayloadElement[] に変換
      const payloads = renderResultToPayloads(value);
      history.push(payloads);
    }
  } finally {
    reader.releaseLock();
  }

  return {
    result: {
      current: history.length > 0 ? history[history.length - 1] : null,
      history,
    },
  };
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
