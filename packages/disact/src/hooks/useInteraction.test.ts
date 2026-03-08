import type { APIMessageComponentButtonInteraction } from "discord-api-types/v10";
import { describe, expect, it, vi } from "vitest";
import { createButtonInteraction } from "../testing/interactionFactory";
import { testAppHook } from "../testing/testAppHook";
import { useCurrentInteraction, useInteraction } from "./useInteraction";
import { useRerender } from "./useRerender";

describe("useInteraction", () => {
  describe("testAppHook を使ったインテグレーションテスト", () => {
    it("clickButton で useInteraction コールバックが実行される", async () => {
      const spy = vi.fn();

      const { clickButton } = await testAppHook(() => {
        useInteraction<APIMessageComponentButtonInteraction>((interaction) => {
          spy(interaction.data.custom_id);
        });
        return null;
      });

      await clickButton("my-button");
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith("my-button");
    });

    it("コールバック内で再レンダリングが発生しても1回のみ実行される", async () => {
      const spy = vi.fn();

      const { clickButton } = await testAppHook(() => {
        const rerender = useRerender();
        useInteraction<APIMessageComponentButtonInteraction>((interaction) => {
          spy(interaction.data.custom_id);
          // コールバック内でrerenderを呼んでもコールバックは再実行されない
          rerender();
        });
        return null;
      });

      await clickButton("my-button");
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith("my-button");
    });

    it("複数回のインタラクションで各インタラクションに対して1回ずつ実行される", async () => {
      const spy = vi.fn();

      const { clickButton } = await testAppHook(() => {
        useInteraction<APIMessageComponentButtonInteraction>((interaction) => {
          spy(interaction.data.custom_id);
        });
        return null;
      });

      await clickButton("button-1");
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenLastCalledWith("button-1");

      await clickButton("button-2");
      expect(spy).toHaveBeenCalledTimes(2);
      expect(spy).toHaveBeenLastCalledWith("button-2");
    });

    it("useCurrentInteraction が現在のインタラクションを返す", async () => {
      const { result, interact } = await testAppHook(() =>
        useCurrentInteraction<APIMessageComponentButtonInteraction>(),
      );

      // 初回レンダリング: インタラクションなし
      expect(result.current).toBeUndefined();

      const interaction = createButtonInteraction("test-button");
      await interact(interaction);

      // インタラクション中のレンダリングでは interaction が設定されている
      expect(result.current?.data.custom_id).toBe("test-button");
    });

    it("initialInteraction を指定すると初回から interaction が設定される", async () => {
      const initialInteraction = createButtonInteraction("initial-button");

      const { result } = await testAppHook(
        () => useCurrentInteraction<APIMessageComponentButtonInteraction>(),
        { initialInteraction },
      );

      expect(result.current?.data.custom_id).toBe("initial-button");
    });
  });
});
