import type { APIMessageComponentButtonInteraction } from "discord-api-types/v10";
import { describe, expect, it, vi } from "vitest";
import { createButtonInteraction } from "../testing/interactionFactory";
import { renderHook } from "../testing/renderHook";
import { useCurrentInteraction, useInteraction } from "./useInteraction";

describe("useInteraction", () => {
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
});
