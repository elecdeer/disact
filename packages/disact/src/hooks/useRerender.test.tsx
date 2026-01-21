import { describe, expect, it } from "vitest";
import { renderToReadableStream } from "@disact/engine";
import type { RenderResult, RenderLifecycleHelpers } from "@disact/engine";
import { useRerender } from "./useRerender";
import { jsx } from "@disact/engine";

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

    const element = jsx(Component, {}, undefined, false);
    const stream = renderToReadableStream(element, {});
    await readAllChunks(stream);

    // useRerender()は関数を返す
    expect(rerenderFn).toBeInstanceOf(Function);
  });

  it("postRenderフック内で再レンダリングをトリガーできる", async () => {
    let renderCount = 0;
    let postRenderCount = 0;

    const Component = () => {
      renderCount++;
      return `Render count: ${renderCount}`;
    };

    const element = jsx(Component, {}, undefined, false);
    const stream = renderToReadableStream(
      element,
      {},
      {
        postRender: ({ requestRerender }: RenderLifecycleHelpers) => {
          postRenderCount++;
          // 最初のpostRenderでのみ再レンダリング
          if (postRenderCount === 1) {
            requestRerender();
          }
        },
      },
    );
    const chunks = await readAllChunks(stream);

    // 2回レンダリングされる
    expect(renderCount).toBe(2);
    expect(postRenderCount).toBe(2);
    expect(chunks).toHaveLength(2);
  });
});
