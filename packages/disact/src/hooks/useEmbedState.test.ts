import { runInContext } from "@disact/engine";
import {
  ComponentType,
  InteractionType,
  type APIMessageComponentInteraction,
} from "discord-api-types/v10";
import { describe, expect, it } from "vitest";
import type { EmbedStateContext } from "../state/embedStateContext";
import { useEmbedState } from "./useEmbedState";

describe("useEmbedState", () => {
  describe("初回レンダリング", () => {
    it("should return initialValue", () => {
      const context: EmbedStateContext = {
        __embedStateInstanceCounter: 0,
        __embedStateReducers: new Map(),
      };

      const [count] = runInContext(context, () => {
        return useEmbedState(0, {
          increment: (prev) => prev + 1,
        });
      });

      expect(count).toBe(0);
    });

    it("should generate customId for each action", () => {
      const context: EmbedStateContext = {
        __embedStateInstanceCounter: 0,
        __embedStateReducers: new Map(),
      };

      const [, actions] = runInContext(context, () => {
        return useEmbedState(0, {
          increment: (prev) => prev + 1,
          decrement: (prev) => prev - 1,
        });
      });

      expect(actions.increment()).toBe("DSCT|increment#0|0");
      expect(actions.decrement()).toBe("DSCT|decrement#1|0");
    });

    it("should generate different instanceId for multiple calls", () => {
      const context: EmbedStateContext = {
        __embedStateInstanceCounter: 0,
        __embedStateReducers: new Map(),
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

      expect(result.action1).toBe("DSCT|increment#0|0");
      expect(result.action2).toBe("DSCT|next#1|1");
    });
  });

  describe("トリガー時", () => {
    it("should execute reducer when action matches", () => {
      // Mock interaction
      const interaction: APIMessageComponentInteraction = {
        type: InteractionType.MessageComponent,
        data: {
          custom_id: "DSCT|increment#0|5",
          component_type: 2,
        },
      } as APIMessageComponentInteraction;

      const context: EmbedStateContext = {
        __embedStateInstanceCounter: 0,
        __embedStateReducers: new Map(),
        __embedStateTriggered: {
          action: "increment",
          prevState: "5",
        },
        __embedStateInteraction: interaction,
      };

      const [count, actions] = runInContext(context, () => {
        return useEmbedState(0, {
          increment: (prev) => prev + 1,
        });
      });

      expect(count).toBe(6); // 5 + 1
      expect(actions.increment()).toBe("DSCT|increment#0|6");
    });

    it("should use initialValue when action does not match", () => {
      // Mock interaction triggering action "decrement"
      const interaction: APIMessageComponentInteraction = {
        type: InteractionType.MessageComponent,
        data: {
          custom_id: "DSCT|decrement#0|10",
          component_type: 2,
        },
      } as APIMessageComponentInteraction;

      const context: EmbedStateContext = {
        __embedStateInstanceCounter: 0,
        __embedStateReducers: new Map(),
        __embedStateTriggered: {
          action: "decrement",
          prevState: "10",
        },
        __embedStateInteraction: interaction,
      };

      const result = runInContext(context, () => {
        const [count1] = useEmbedState(0, {
          increment: (prev) => prev + 1,
        });
        const [count2] = useEmbedState(10, {
          decrement: (prev) => prev - 1,
        });
        return { count1, count2 };
      });

      expect(result.count1).toBe(0); // initialValue (action does not match)
      expect(result.count2).toBe(9); // 10 - 1
    });

    it("should pass interaction to reducer", () => {
      // Mock Select interaction
      const interaction = {
        type: InteractionType.MessageComponent,
        data: {
          custom_id: "DSCT|set#0|0",
          component_type: 3,
          values: ["42"],
        },
      } as unknown as APIMessageComponentInteraction;

      const context: EmbedStateContext = {
        __embedStateInstanceCounter: 0,
        __embedStateReducers: new Map(),
        __embedStateTriggered: {
          action: "set",
          prevState: "0",
        },
        __embedStateInteraction: interaction,
      };

      const [value] = runInContext(context, () => {
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

      expect(value).toBe(42);
    });
  });

  describe("カスタムシリアライザー", () => {
    it("should use custom serialize/deserialize", () => {
      type State = { count: number; page: number };

      const context: EmbedStateContext = {
        __embedStateInstanceCounter: 0,
        __embedStateReducers: new Map(),
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

    it("should deserialize with custom serializer when triggered", () => {
      type State = { count: number; page: number };

      const interaction: APIMessageComponentInteraction = {
        type: InteractionType.MessageComponent,
        data: {
          custom_id: "DSCT|increment#0|5,2",
          component_type: 2,
        },
      } as APIMessageComponentInteraction;

      const context: EmbedStateContext = {
        __embedStateInstanceCounter: 0,
        __embedStateReducers: new Map(),
        __embedStateTriggered: {
          action: "increment",
          prevState: "5,2", // カスタムシリアライズされた形式
        },
        __embedStateInteraction: interaction,
      };

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
    it("should not throw error for unknown action (returns initialValue)", () => {
      const interaction: APIMessageComponentInteraction = {
        type: InteractionType.MessageComponent,
        data: {
          custom_id: "DSCT|unknown#0|0",
          component_type: 2,
        },
      } as APIMessageComponentInteraction;

      const context: EmbedStateContext = {
        __embedStateInstanceCounter: 0,
        __embedStateReducers: new Map(),
        __embedStateTriggered: {
          action: "unknown", // 存在しないアクション
          prevState: "0",
        },
        __embedStateInteraction: interaction,
      };

      const [count] = runInContext(context, () => {
        return useEmbedState(0, {
          increment: (prev) => prev + 1,
        });
      });

      // アクションが存在しない場合は初期値を使用
      expect(count).toBe(0);
    });

    it("should throw error when interaction is missing", () => {
      const context: EmbedStateContext = {
        __embedStateInstanceCounter: 0,
        __embedStateReducers: new Map(),
        __embedStateTriggered: {
          action: "increment",
          prevState: "0",
        },
        // __embedStateInteraction が設定されていない
      };

      expect(() => {
        runInContext(context, () => {
          return useEmbedState(0, {
            increment: (prev) => prev + 1,
          });
        });
      }).toThrow("useEmbedState: interaction is required when triggered");
    });
  });
});
