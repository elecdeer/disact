import { describe, expect, it, vi } from "vitest";
import { runInContext } from "@disact/engine";
import { useInteraction } from "./useInteraction";
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
