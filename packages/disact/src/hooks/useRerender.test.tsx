import { describe, expect, it } from "vitest";
import { renderHook } from "../testing/renderHook";
import { useRerender } from "./useRerender";

describe("useRerender", () => {
  it("renderHook を通じて useRerender が関数を返す", async () => {
    let renderCallCount = 0;

    const { result } = await renderHook(() => {
      renderCallCount++;
      const rerender = useRerender();
      return { renderCallCount, rerender };
    });

    expect(result.current.renderCallCount).toBe(1);
    expect(typeof result.current.rerender).toBe("function");
  });

  it("useRerender を呼び出すと再レンダリングがトリガーされる", async () => {
    let renderCallCount = 0;

    await renderHook(() => {
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

    await renderHook(() => {
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
});
