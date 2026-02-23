import { runInContext } from "@disact/engine";
import {
  ComponentType,
  InteractionType,
  type APIMessageComponentInteraction,
} from "discord-api-types/v10";
import { describe, expect, it } from "vitest";
import type { EmbedStateContext } from "../state/embedStateContext";
import type { InteractionCallbacksContext } from "./useInteraction";
import type { RerenderContext } from "./useRerender";
import { useEmbedState } from "./useEmbedState";

type TestContext = EmbedStateContext & InteractionCallbacksContext & RerenderContext;

describe("useEmbedState", () => {
  describe("初回レンダリング", () => {
    it("should return initialValue", () => {
      const context: TestContext = {
        __embedStateInstanceCounter: 0,
        __interactionCallbacks: [],
        __requestRerender: () => {},
      };

      const [count] = runInContext(context, () => {
        return useEmbedState(0, {
          increment: (prev) => prev + 1,
        });
      });

      expect(count).toBe(0);
    });

    it("should generate customId for each action", () => {
      const context: TestContext = {
        __embedStateInstanceCounter: 0,
        __interactionCallbacks: [],
        __requestRerender: () => {},
      };

      const [, actions] = runInContext(context, () => {
        return useEmbedState(0, {
          increment: (prev) => prev + 1,
          decrement: (prev) => prev - 1,
        });
      });

      const customId1 = actions.increment();
      const customId2 = actions.decrement();

      expect(customId1.startsWith("DSCT")).toBeTruthy();
      expect(customId2.startsWith("DSCT")).toBeTruthy();
      expect(customId1).toMatchInlineSnapshot(`"DSCT|increment#0|0"`);
      expect(customId2).toMatchInlineSnapshot(`"DSCT|decrement#0|0"`);
    });

    it("should generate different instanceId for multiple calls", () => {
      const context: TestContext = {
        __embedStateInstanceCounter: 0,
        __interactionCallbacks: [],
        __requestRerender: () => {},
      };

      const result = runInContext(context, () => {
        const [, actions1] = useEmbedState(0, {
          increment: (prev) => prev + 1,
        });
        const [, actions2] = useEmbedState(1, {
          next: (prev) => prev + 1,
        });
        return {
          action1: actions1.increment(),
          action2: actions2.next(),
        };
      });

      expect(result.action1).toMatchInlineSnapshot(`"DSCT|increment#0|0"`);
      expect(result.action2).toMatchInlineSnapshot(`"DSCT|next#1|1"`);
    });
  });

  describe("トリガー時", () => {
    it("should execute reducer when action matches", async () => {
      // Mock interaction
      const interaction: APIMessageComponentInteraction = {
        type: InteractionType.MessageComponent,
        data: {
          custom_id: "DSCT|increment#0|5",
          component_type: 2,
        },
      } as APIMessageComponentInteraction;

      let rerenderCalled = false;
      const context: TestContext = {
        __embedStateInstanceCounter: 0,
        __interactionCallbacks: [],
        __requestRerender: () => {
          rerenderCalled = true;
        },
        __interaction: interaction,
      };

      // 初回レンダリング
      const [count1] = runInContext(context, () => {
        return useEmbedState(0, {
          increment: (prev) => prev + 1,
        });
      });

      expect(count1).toBe(0); // initialValue

      // useInteraction のコールバックを実行
      for (const callback of context.__interactionCallbacks || []) {
        await callback(interaction);
      }

      expect(rerenderCalled).toBe(true);
      expect(context.__embedStateComputedStates?.get("0")).toBe(6); // 5 + 1

      // 2回目のレンダリング（rerenderトリガー後）
      context.__embedStateInstanceCounter = 0; // リセット
      context.__interactionCallbacks = [];
      const [count2] = runInContext(context, () => {
        return useEmbedState(0, {
          increment: (prev) => prev + 1,
        });
      });

      expect(count2).toBe(6); // 計算済み状態
    });

    it("should use initialValue when action does not match", async () => {
      // Mock interaction triggering action "decrement"
      const interaction: APIMessageComponentInteraction = {
        type: InteractionType.MessageComponent,
        data: {
          custom_id: "DSCT|decrement#1|10",
          component_type: 2,
        },
      } as APIMessageComponentInteraction;

      const context: TestContext = {
        __embedStateInstanceCounter: 0,
        __interactionCallbacks: [],
        __requestRerender: () => {},
        __interaction: interaction,
      };

      // 初回レンダリング
      const result1 = runInContext(context, () => {
        const [count1] = useEmbedState(0, {
          increment: (prev) => prev + 1,
        });
        const [count2] = useEmbedState(10, {
          decrement: (prev) => prev - 1,
        });
        return { count1, count2 };
      });

      expect(result1.count1).toBe(0); // initialValue
      expect(result1.count2).toBe(10); // initialValue

      // useInteraction のコールバックを実行
      for (const callback of context.__interactionCallbacks || []) {
        await callback(interaction);
      }

      // instanceId=1 のみが更新される
      expect(context.__embedStateComputedStates?.get("1")).toBe(9); // 10 - 1

      // 2回目のレンダリング
      context.__embedStateInstanceCounter = 0;
      context.__interactionCallbacks = [];
      const result2 = runInContext(context, () => {
        const [count1] = useEmbedState(0, {
          increment: (prev) => prev + 1,
        });
        const [count2] = useEmbedState(10, {
          decrement: (prev) => prev - 1,
        });
        return { count1, count2 };
      });

      expect(result2.count1).toBe(0); // initialValue (action does not match)
      expect(result2.count2).toBe(9); // 計算済み状態
    });

    it("should pass interaction to reducer", async () => {
      // Mock Select interaction
      const interaction = {
        type: InteractionType.MessageComponent,
        data: {
          custom_id: "DSCT|set#0|0",
          component_type: 3,
          values: ["42"],
        },
      } as unknown as APIMessageComponentInteraction;

      const context: TestContext = {
        __embedStateInstanceCounter: 0,
        __interactionCallbacks: [],
        __requestRerender: () => {},
        __interaction: interaction,
      };

      // 初回レンダリング
      runInContext(context, () => {
        return useEmbedState(0, {
          // Select の values を取得する例
          set: (prev, interaction) => {
            if (interaction.data.component_type !== ComponentType.StringSelect) {
              return prev;
            }

            return Number(interaction.data.values?.[0] ?? 0);
          },
        });
      });

      // useInteraction のコールバックを実行
      for (const callback of context.__interactionCallbacks || []) {
        await callback(interaction);
      }

      expect(context.__embedStateComputedStates?.get("0")).toBe(42);

      // 2回目のレンダリング
      context.__embedStateInstanceCounter = 0;
      context.__interactionCallbacks = [];
      const [value] = runInContext(context, () => {
        return useEmbedState(0, {
          set: (prev, interaction) => {
            if (interaction.data.component_type !== ComponentType.StringSelect) {
              return prev;
            }

            return Number(interaction.data.values?.[0] ?? 0);
          },
        });
      });

      expect(value).toBe(42);
    });
  });

  describe("カスタムシリアライザー", () => {
    it("should use custom serialize/deserialize", () => {
      type State = { count: number; page: number };

      const context: TestContext = {
        __embedStateInstanceCounter: 0,
        __interactionCallbacks: [],
        __requestRerender: () => {},
      };

      const [state, actions] = runInContext(context, () => {
        return useEmbedState<State, { increment: (prev: State) => State }>(
          { count: 0, page: 1 },
          {
            increment: (prev) => ({ ...prev, count: prev.count + 1 }),
          },
          {
            // カスタムシリアライザー（コンパクト化の例）
            serialize: (value) => `${value.count},${value.page}`,
            deserialize: (str) => {
              const [count = 0, page = 1] = str.split(",").map(Number);
              return { count, page };
            },
          },
        );
      });

      expect(state).toEqual({ count: 0, page: 1 });
      expect(actions.increment()).toBe("DSCT|increment#0|0,1");
    });

    it("should deserialize with custom serializer when triggered", async () => {
      type State = { count: number; page: number };

      const interaction: APIMessageComponentInteraction = {
        type: InteractionType.MessageComponent,
        data: {
          custom_id: "DSCT|increment#0|5,2",
          component_type: 2,
        },
      } as APIMessageComponentInteraction;

      const context: TestContext = {
        __embedStateInstanceCounter: 0,
        __interactionCallbacks: [],
        __requestRerender: () => {},
        __interaction: interaction,
      };

      // 初回レンダリング
      runInContext(context, () => {
        return useEmbedState<State, { increment: (prev: State) => State }>(
          { count: 0, page: 1 },
          {
            increment: (prev) => ({ ...prev, count: prev.count + 1 }),
          },
          {
            serialize: (value) => `${value.count},${value.page}`,
            deserialize: (str) => {
              const [count = 0, page = 1] = str.split(",").map(Number);
              return { count, page };
            },
          },
        );
      });

      // useInteraction のコールバックを実行
      for (const callback of context.__interactionCallbacks || []) {
        await callback(interaction);
      }

      expect(context.__embedStateComputedStates?.get("0")).toEqual({ count: 6, page: 2 });

      // 2回目のレンダリング
      context.__embedStateInstanceCounter = 0;
      context.__interactionCallbacks = [];
      const [state, actions] = runInContext(context, () => {
        return useEmbedState<State, { increment: (prev: State) => State }>(
          { count: 0, page: 1 },
          {
            increment: (prev) => ({ ...prev, count: prev.count + 1 }),
          },
          {
            serialize: (value) => `${value.count},${value.page}`,
            deserialize: (str) => {
              const [count = 0, page = 1] = str.split(",").map(Number);
              return { count, page };
            },
          },
        );
      });

      expect(state).toEqual({ count: 6, page: 2 }); // 5 + 1, page は変わらず
      expect(actions.increment()).toBe("DSCT|increment#0|6,2");
    });
  });

  describe("エラーケース", () => {
    it("should not throw error for unknown action (returns initialValue)", async () => {
      const interaction: APIMessageComponentInteraction = {
        type: InteractionType.MessageComponent,
        data: {
          custom_id: "DSCT|unknown#0|0",
          component_type: 2,
        },
      } as APIMessageComponentInteraction;

      const context: TestContext = {
        __embedStateInstanceCounter: 0,
        __interactionCallbacks: [],
        __requestRerender: () => {},
        __interaction: interaction,
      };

      // 初回レンダリング
      const [count1] = runInContext(context, () => {
        return useEmbedState(0, {
          increment: (prev) => prev + 1,
        });
      });

      expect(count1).toBe(0); // initialValue

      // useInteraction のコールバックを実行（unknown actionなので何も起こらない）
      for (const callback of context.__interactionCallbacks || []) {
        await callback(interaction);
      }

      // 状態は更新されない
      expect(context.__embedStateComputedStates?.get("0")).toBeUndefined();

      // 2回目のレンダリング
      context.__embedStateInstanceCounter = 0;
      context.__interactionCallbacks = [];
      const [count2] = runInContext(context, () => {
        return useEmbedState(0, {
          increment: (prev) => prev + 1,
        });
      });

      // アクションが存在しない場合は初期値を使用
      expect(count2).toBe(0);
    });

    it("should not throw error when interaction is missing", () => {
      const context: TestContext = {
        __embedStateInstanceCounter: 0,
        __interactionCallbacks: [],
        __requestRerender: () => {},
        // __interaction が設定されていない
      };

      // エラーをスローしない（useInteractionのコールバック内でのみinteractionを使用）
      expect(() => {
        runInContext(context, () => {
          return useEmbedState(0, {
            increment: (prev) => prev + 1,
          });
        });
      }).not.toThrow();
    });
  });
});
