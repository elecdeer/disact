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
});
