/** @jsxImportSource .. */

import { describe, expect, it } from "vitest";
import { renderToReadableStream } from "@disact/engine";
import type { RenderResult } from "@disact/engine";
import { useRerender } from "./useRerender";

/**
 * ReadableStreamから全てのチャンクを読み取る
 */
const readAllChunks = async (stream: ReadableStream<RenderResult>): Promise<RenderResult[]> => {
  const reader = stream.getReader();
  const chunks: RenderResult[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  return chunks;
};

describe("useRerender", () => {
  it("useRerender()は常にコンテキストから関数を取得できる", async () => {
    let rerenderFn: (() => void) | null = null;

    const Component = () => {
      rerenderFn = useRerender();
      return "Test";
    };

    const stream = renderToReadableStream(<Component />, {});
    await readAllChunks(stream);

    // useRerender()は関数を返す
    expect(rerenderFn).toBeInstanceOf(Function);
  });

  it("コンポーネント内で useRerender を呼び出せる", async () => {
    let renderCount = 0;

    const Component = () => {
      const rerender = useRerender();

      renderCount++;
      if (renderCount < 3) {
        // 2回まで再レンダリングをトリガー
        rerender();
      }

      return `Render count: ${renderCount}`;
    };

    const stream = renderToReadableStream(<Component />, {});
    const chunks = await readAllChunks(stream);

    expect(renderCount).toBe(3);
    expect(chunks.at(-1)).toEqual({
      type: "text",
      content: "Render count: 3",
    });
    expect(chunks).toMatchInlineSnapshot(`
      [
        {
          "content": "Render count: 3",
          "type": "text",
        },
      ]
    `);
  });

  it("1レンダリング中に複数回 useRerender を呼び出しても1回の再レンダリングにまとめられる", async () => {
    let renderCount = 0;

    const Component = () => {
      const rerender = useRerender();

      renderCount++;
      if (renderCount === 1) {
        // 最初のレンダリング中に複数回再レンダリングをトリガー
        rerender();
        rerender();
        rerender();
      }

      return `Render count: ${renderCount}`;
    };

    const stream = renderToReadableStream(<Component />, {});
    const chunks = await readAllChunks(stream);

    expect(renderCount).toBe(2);
    expect(chunks.at(-1)).toEqual({
      type: "text",
      content: "Render count: 2",
    });
    expect(chunks).toMatchInlineSnapshot(`
      [
        {
          "content": "Render count: 2",
          "type": "text",
        },
      ]
    `);
  });
});
