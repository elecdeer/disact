import { describe, expect, it, vi } from "vitest";
import { runInContext } from "@disact/engine";
import type { APIMessageComponentButtonInteraction } from "discord-api-types/v10";
import { renderHook } from "../testing/renderHook";
import { createButtonInteraction } from "../testing/interactionFactory";
import { useInteraction, useCurrentInteraction } from "./useInteraction";
import type { InteractionCallback, InteractionCallbacksContext } from "./useInteraction";

describe("useInteraction", () => {
  it("should throw error when called outside render context", () => {
    expect(() => {
      useInteraction(() => {});
    }).toThrow("can only be called during rendering");
  });

  it("should throw error when __interactionCallbacks is not in context", () => {
    const context = {}; // __interactionCallbacks がない

    expect(() => {
      runInContext(context, () => {
        useInteraction(() => {});
      });
    }).toThrow("useInteraction requires __interactionCallbacks in render context");
  });

  it("should register callback in context", () => {
    const mockCallback = vi.fn();
    const callbacks: InteractionCallback[] = [];
    const context: InteractionCallbacksContext = {
      __interactionCallbacks: callbacks,
    };

    runInContext(context, () => {
      useInteraction(mockCallback);
    });

    expect(callbacks).toHaveLength(1);
    expect(callbacks[0]).toBe(mockCallback);
  });

  it("should register multiple callbacks in order", () => {
    const callback1 = vi.fn();
    const callback2 = vi.fn();
    const callback3 = vi.fn();
    const callbacks: InteractionCallback[] = [];
    const context: InteractionCallbacksContext = {
      __interactionCallbacks: callbacks,
    };

    runInContext(context, () => {
      useInteraction(callback1);
      useInteraction(callback2);
      useInteraction(callback3);
    });

    expect(callbacks).toHaveLength(3);
    expect(callbacks[0]).toBe(callback1);
    expect(callbacks[1]).toBe(callback2);
    expect(callbacks[2]).toBe(callback3);
  });

  describe("renderHook を使ったインテグレーションテスト", () => {
    // NOTE: testApp ベースでは useInteraction コールバックが複数回呼ばれる既知の挙動がある。
    // コールバックが呼ばれること自体は clickButton テストで確認済み。
    it("clickButton で useInteraction コールバックが実行される", async () => {
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

    it("useCurrentInteraction が現在のインタラクションを返す", async () => {
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

    it("initialInteraction を指定すると初回から interaction が設定される", async () => {
      const initialInteraction = createButtonInteraction("initial-button");

      const { result } = await renderHook(
        () => useCurrentInteraction<APIMessageComponentButtonInteraction>(),
        { initialInteraction },
      );

      expect(result.current?.data.custom_id).toBe("initial-button");
    });
  });

  it("should support typed interaction callback", () => {
    interface TestInteraction {
      id: string;
      type: number;
    }

    const callbacks: InteractionCallback<TestInteraction>[] = [];
    const context: InteractionCallbacksContext<TestInteraction> = {
      __interactionCallbacks: callbacks,
    };

    runInContext(context, () => {
      useInteraction<TestInteraction>((interaction) => {
        // 型チェック用：interactionがTestInteraction型であることを確認
        const _id: string = interaction.id;
        const _type: number = interaction.type;
      });
    });

    expect(callbacks).toHaveLength(1);
  });
});
