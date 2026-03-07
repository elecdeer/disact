import { describe, expect, it } from "vitest";
import { testAppHook } from "../testing/testAppHook";
import { useRerender } from "./useRerender";

describe("useRerender", () => {
  it("testAppHook を通じて useRerender が関数を返す", async () => {
    let renderCallCount = 0;

    const { result } = await testAppHook(() => {
      renderCallCount++;
      const rerender = useRerender();
      return { renderCallCount, rerender };
    });

    expect(result.current.renderCallCount).toBe(1);
    expect(typeof result.current.rerender).toBe("function");
  });

  it("useRerender を呼び出すと再レンダリングがトリガーされる", async () => {
    let renderCallCount = 0;

    await testAppHook(() => {
      const rerender = useRerender();
      renderCallCount++;
      if (renderCallCount < 3) {
        rerender();
      }
      return renderCallCount;
    });

    expect(renderCallCount).toBe(3);
  });

  it("1レンダリング中に複数回 useRerender を呼び出しても1回の再レンダリングにまとめられる", async () => {
    let renderCallCount = 0;

    await testAppHook(() => {
      const rerender = useRerender();
      renderCallCount++;
      if (renderCallCount === 1) {
        rerender();
        rerender();
        rerender();
      }
      return renderCallCount;
    });

    expect(renderCallCount).toBe(2);
  });

  it("setTimeoutで非同期的にrerenderを呼び出すと再レンダリングがトリガーされるべき", async () => {
    // 現在の実装では、renderタスク完了後に setTimeout 経由で rerender を呼び出しても
    // rerenderRequested フラグはタスク実行中にしかチェックされないため
    // 再レンダリングはトリガーされない。
    // このテストは現在の制限を文書化するためにスキップされている。
    let renderCallCount = 0;

    await testAppHook(() => {
      const rerender = useRerender();
      renderCallCount++;
      if (renderCallCount === 1) {
        setTimeout(() => rerender(), 0);
      }
      return renderCallCount;
    });

    // setTimeout の発火を待機
    await new Promise<void>((resolve) => setTimeout(resolve, 200));

    // 期待: 2回レンダリングされるべきだが、現在の実装では1回のみ
    expect(renderCallCount).toBe(2);
  });

  it("streamのclose後にrerenderを呼び出してもエラーにならない", async () => {
    let renderCallCount = 0;
    let capturedRerender: (() => void) | undefined;

    await testAppHook(() => {
      const rerender = useRerender();
      renderCallCount++;
      capturedRerender = rerender;
      return renderCallCount;
    });

    expect(renderCallCount).toBe(1);

    // stream が close された後に rerender を呼び出す
    expect(() => {
      capturedRerender?.();
    }).not.toThrow();

    // 追加のレンダリングは発生しない
    await new Promise<void>((resolve) => setTimeout(resolve, 200));
    expect(renderCallCount).toBe(1);
  });
});
