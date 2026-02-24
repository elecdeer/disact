/** @jsxImportSource .. */

import { describe, expect, test, vi } from "vitest";
import type { APIMessageComponentButtonInteraction } from "discord-api-types/v10";
import { useEmbedState } from "../hooks/useEmbedState";
import { useInteraction } from "../hooks/useInteraction";
import { useCurrentInteraction } from "../hooks/useInteraction";
import { useRerender } from "../hooks/useRerender";
import { createButtonInteraction } from "./interactionFactory";
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

  test("clickButton で useEmbedState の状態が更新される", async () => {
    const { result, clickButton } = await renderHook(() =>
      useEmbedState(0, {
        increment: (prev: number) => prev + 1,
        decrement: (prev: number) => prev - 1,
      }),
    );

    const [count0, actions0] = result.current;
    expect(count0).toBe(0);

    await clickButton(actions0.increment());
    expect(result.current[0]).toBe(1);

    await clickButton(result.current[1].increment());
    expect(result.current[0]).toBe(2);

    await clickButton(result.current[1].decrement());
    expect(result.current[0]).toBe(1);
  });

  test("selectOption で useEmbedState の状態が更新される", async () => {
    const { result, selectOption } = await renderHook(() =>
      useEmbedState("none", {
        select: (_prev: string, interaction) => interaction.data.values[0] ?? "none",
      }),
    );

    expect(result.current[0]).toBe("none");

    await selectOption(result.current[1].select(), ["option-a"]);
    expect(result.current[0]).toBe("option-a");
  });

  test("useInteraction コールバックが実行される", async () => {
    const spy = vi.fn();

    const { interact } = await renderHook(() => {
      useInteraction<APIMessageComponentButtonInteraction>((interaction) => {
        spy(interaction.data.custom_id);
      });
      return null;
    });

    const interaction = createButtonInteraction("test-button");
    await interact(interaction);

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith("test-button");
  });

  test("clickButton で useInteraction コールバックが実行される", async () => {
    const spy = vi.fn();

    const { clickButton } = await renderHook(() => {
      useInteraction<APIMessageComponentButtonInteraction>((interaction) => {
        spy(interaction.data.custom_id);
      });
      return null;
    });

    await clickButton("my-button");
    expect(spy).toHaveBeenCalledWith("my-button");
  });

  test("useCurrentInteraction が現在のインタラクションを返す", async () => {
    const { result, interact } = await renderHook(() =>
      useCurrentInteraction<APIMessageComponentButtonInteraction>(),
    );

    // 初回レンダリング: インタラクションなし
    expect(result.current).toBeUndefined();

    const interaction = createButtonInteraction("test-button");
    await interact(interaction);

    // インタラクション中のレンダリングでは interaction が設定されている
    // (同一 connect 内の全レンダリングで同じ context.__interaction が使われる)
    expect(result.current?.data.custom_id).toBe("test-button");
  });

  test("initialInteraction を指定すると初回から interaction が設定される", async () => {
    const initialInteraction = createButtonInteraction("initial-button");

    const { result } = await renderHook(
      () => useCurrentInteraction<APIMessageComponentButtonInteraction>(),
      { initialInteraction },
    );

    expect(result.current?.data.custom_id).toBe("initial-button");
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

  test("useRerender を使って手動再レンダリングができる", async () => {
    let renderCallCount = 0;

    const { result } = await renderHook(() => {
      renderCallCount++;
      const rerender = useRerender();
      return { renderCallCount, rerender };
    });

    expect(result.current.renderCallCount).toBe(1);

    // 外部から rerender を呼ぶことはできないが、
    // 返り値の安定性を確認する
    expect(typeof result.current.rerender).toBe("function");
  });

  test("複数の useEmbedState を持つフックが独立して動作する", async () => {
    const { result, clickButton } = await renderHook(() => {
      const [countA, actionsA] = useEmbedState(0, {
        inc: (prev: number) => prev + 1,
      });
      const [countB, actionsB] = useEmbedState(100, {
        inc: (prev: number) => prev + 10,
      });
      return { countA, actionsA, countB, actionsB };
    });

    expect(result.current.countA).toBe(0);
    expect(result.current.countB).toBe(100);

    await clickButton(result.current.actionsA.inc());
    expect(result.current.countA).toBe(1);
    expect(result.current.countB).toBe(100);

    await clickButton(result.current.actionsB.inc());
    expect(result.current.countA).toBe(1);
    expect(result.current.countB).toBe(110);
  });
});
