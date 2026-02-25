/** @jsxImportSource .. */

import { describe, expect, test } from "vitest";
import { useEmbedState } from "../hooks/useEmbedState";
import { renderHook } from "./renderHook";

describe("renderHook", () => {
  test("フックの初期戻り値が取得できる", async () => {
    const { result } = await renderHook(() => {
      const [count, actions] = useEmbedState(0, {
        increment: (prev: number) => prev + 1,
      });
      return { count, actions };
    });

    expect(result.current.count).toBe(0);
    expect(typeof result.current.actions.increment).toBe("function");
  });

  test("result.current は getter で常に最新値を返す", async () => {
    const { result, clickButton } = await renderHook(() => {
      const [count, actions] = useEmbedState(0, {
        increment: (prev: number) => prev + 1,
      });
      return { count, actions };
    });

    const initialCustomId = result.current.actions.increment();
    expect(result.current.count).toBe(0);

    await clickButton(initialCustomId);

    expect(result.current.count).toBe(1);
  });

  test("rerender で再レンダリングできる", async () => {
    let renderCallCount = 0;

    const { result, rerender } = await renderHook(() => {
      renderCallCount++;
      return renderCallCount;
    });

    const countAfterInit = result.current;
    expect(countAfterInit).toBeGreaterThanOrEqual(1);

    await rerender();
    expect(result.current).toBeGreaterThan(countAfterInit);
  });
});
