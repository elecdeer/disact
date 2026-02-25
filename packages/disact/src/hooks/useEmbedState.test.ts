import type { APIMessageComponentSelectMenuInteraction } from "discord-api-types/v10";
import { describe, expect, it } from "vitest";
import { renderHook } from "../testing/renderHook";
import { useEmbedState } from "./useEmbedState";

describe("useEmbedState", () => {
  describe("renderHook を使ったインテグレーションテスト", () => {
    it("clickButton で useEmbedState の状態が更新される", async () => {
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

    it("selectOption で useEmbedState の状態が更新される", async () => {
      const { result, selectOption } = await renderHook(() =>
        useEmbedState("none", {
          select: (_prev: string, interaction) =>
            (interaction as APIMessageComponentSelectMenuInteraction).data.values[0] ?? "none",
        }),
      );

      expect(result.current[0]).toBe("none");

      await selectOption(result.current[1].select(), ["option-a"]);
      expect(result.current[0]).toBe("option-a");
    });

    it("複数の useEmbedState を持つフックが独立して動作する", async () => {
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

      // 注意: testApp ベースでは各インタラクションで新規コンテキストが作られるため、
      // A の状態（count: 1）は持ち越されず初期値にリセットされる既知の挙動がある
      await clickButton(result.current.actionsB.inc());
      expect(result.current.countB).toBe(110);
    });
  });
});
