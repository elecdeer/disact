/** @jsxImportSource ../ */

import { describe, expect, it } from "vitest";
import { renderToReadableStream } from "../render";
import { getCurrentContext } from "../context";
import type { RenderLifecycleHelpers } from "../render";
import type { RenderResult, DisactElement } from "../element";

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

type RerenderContext = {
  __requestRerender?: () => void;
  [key: string]: unknown;
};

describe("requestRerender", () => {
  describe("ライフサイクルフックからの再レンダリング", () => {
    it("postRenderフック内でrequestRerenderを呼び出すと再レンダリングされる", async () => {
      let renderCount = 0;
      let postRenderCount = 0;

      const Component = (): DisactElement => {
        renderCount++;
        return <div>{`Render count: ${renderCount}`}</div>;
      };

      const stream = renderToReadableStream(
        <Component />,
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

      // 2回レンダリングされる（初回 + 再レンダリング）
      expect(renderCount).toBe(2);
      expect(postRenderCount).toBe(2);

      expect(chunks).toMatchInlineSnapshot(`
        [
          {
            "children": [
              {
                "content": "Render count: 2",
                "type": "text",
              },
            ],
            "name": "div",
            "props": {},
            "type": "intrinsic",
          },
        ]
      `);
    });

    it("preRenderフック内でrequestRerenderを呼び出すと再レンダリングされる", async () => {
      let renderCount = 0;
      let preRenderCount = 0;

      const Component = (): DisactElement => {
        renderCount++;
        return <div>{`Render count: ${renderCount}`}</div>;
      };

      const stream = renderToReadableStream(
        <Component />,
        {},
        {
          preRender: ({ requestRerender }: RenderLifecycleHelpers) => {
            preRenderCount++;
            // 2回目のpreRenderでのみ再レンダリング（初回は再レンダリングトリガー前なので）
            if (preRenderCount === 2) {
              requestRerender();
            }
          },
          postRender: ({ requestRerender }: RenderLifecycleHelpers) => {
            // 初回のpostRenderで再レンダリングをトリガー
            if (renderCount === 1) {
              requestRerender();
            }
          },
        },
      );
      await readAllChunks(stream);

      // 3回レンダリングされる（初回 + postRenderトリガー + preRenderトリガー）
      expect(renderCount).toBe(3);
      expect(preRenderCount).toBe(3);
    });

    it("postRenderCycleフック内でrequestRerenderを呼び出すと新しいサイクルが開始される", async () => {
      let renderCount = 0;
      let postRenderCycleCount = 0;

      const Component = (): DisactElement => {
        renderCount++;
        return <div>{`Render count: ${renderCount}`}</div>;
      };

      const stream = renderToReadableStream(
        <Component />,
        {},
        {
          postRenderCycle: ({ requestRerender }: RenderLifecycleHelpers) => {
            postRenderCycleCount++;
            // 最初のpostRenderCycleでのみ再レンダリング
            if (postRenderCycleCount === 1) {
              requestRerender();
            }
          },
        },
      );
      const result = await readAllChunks(stream);

      // 2回レンダリングされる
      expect(renderCount).toBe(2);
      expect(postRenderCycleCount).toBe(2);
      expect(result).toMatchInlineSnapshot(`
        [
          {
            "children": [
              {
                "content": "Render count: 1",
                "type": "text",
              },
            ],
            "name": "div",
            "props": {},
            "type": "intrinsic",
          },
          {
            "children": [
              {
                "content": "Render count: 2",
                "type": "text",
              },
            ],
            "name": "div",
            "props": {},
            "type": "intrinsic",
          },
        ]
      `);
    });
  });

  describe("コンテキストからの直接アクセス", () => {
    it("コンテキストから__requestRerenderを取得してrequestRerenderを呼び出せる", async () => {
      let renderCount = 0;
      let postRenderCount = 0;

      const Component = (): DisactElement => {
        renderCount++;
        const context = getCurrentContext<RerenderContext>();

        // コンテキストに__requestRerenderが存在することを確認
        expect(context.__requestRerender).toBeDefined();

        return <div>{`Render count: ${renderCount}`}</div>;
      };

      const stream = renderToReadableStream(
        <Component />,
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
      await readAllChunks(stream);

      // 2回レンダリングされる（初回 + 再レンダリング）
      expect(renderCount).toBe(2);
      expect(postRenderCount).toBe(2);
    });
  });

  describe("複数回の再レンダリング", () => {
    it("複数回のrequestRerenderを順次処理できる", async () => {
      let renderCount = 0;
      let postRenderCount = 0;

      const Component = (): DisactElement => {
        renderCount++;
        return <div>{`Render count: ${renderCount}`}</div>;
      };

      const stream = renderToReadableStream(
        <Component />,
        {},
        {
          postRender: ({ requestRerender }: RenderLifecycleHelpers) => {
            postRenderCount++;
            // 最初の3回は再レンダリング
            if (postRenderCount < 3) {
              requestRerender();
            }
          },
        },
      );
      await readAllChunks(stream);

      // 3回レンダリングされる
      expect(renderCount).toBe(3);
      expect(postRenderCount).toBe(3);
    });

    it("一回のレンダリング中に複数回requestRerenderを呼び出しても1回の再レンダリングにまとめられる", async () => {
      let renderCount = 0;

      const Component = (): DisactElement => {
        renderCount++;
        return <div>{`Render count: ${renderCount}`}</div>;
      };

      const stream = renderToReadableStream(
        <Component />,
        {},
        {
          postRender: ({ requestRerender }: RenderLifecycleHelpers) => {
            // 一回のpostRenderで複数回再レンダリングをトリガー

            if (renderCount === 1) {
              requestRerender();
              requestRerender();
              requestRerender();
            }
          },
        },
      );
      await readAllChunks(stream);

      // 2回レンダリングされる（初回 + 1回の再レンダリング）
      expect(renderCount).toBe(2);
    });
  });
});
