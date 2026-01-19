/** @jsxImportSource ../ */

import { describe, expect, it } from "vitest";
import { renderToReadableStream } from "../render";
import { readStreamToCompletion } from "./testUtil";
import type { FC } from "../element";
import { getCurrentContext } from "../context";
import { use } from "../thenable";
import { Suspense } from "../jsx-dev-runtime";

describe("Context参照機能", () => {
  it("should provide access to context during component rendering", async () => {
    interface TestContext {
      theme: string;
      userId: number;
    }

    const testContext: TestContext = { theme: "dark", userId: 123 };

    const ContextAwareComponent: FC = () => {
      const ctx = getCurrentContext<TestContext>();
      return <div>{`Theme: ${ctx.theme}, User: ${ctx.userId}`}</div>;
    };

    const element = <ContextAwareComponent />;

    const stream = renderToReadableStream(element, testContext);
    const chunks = await readStreamToCompletion(stream);

    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toEqual({
      type: "intrinsic",
      name: "div",
      props: {},
      children: [{ type: "text", content: "Theme: dark, User: 123" }],
    });
  });

  it("should provide context access in nested components", async () => {
    const testContext = { message: "Hello from context!" };

    const NestedComponent: FC = () => {
      const ctx = getCurrentContext<typeof testContext>();
      return <span>{ctx.message}</span>;
    };

    const WrapperComponent: FC = () => (
      <div>
        Wrapper start - <NestedComponent /> - Wrapper end
      </div>
    );

    const element = <WrapperComponent />;

    const stream = renderToReadableStream(element, testContext);
    const chunks = await readStreamToCompletion(stream);

    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toEqual({
      type: "intrinsic",
      name: "div",
      props: {},
      children: [
        { type: "text", content: "Wrapper start - " },
        {
          type: "intrinsic",
          name: "span",
          props: {},
          children: [{ type: "text", content: "Hello from context!" }],
        },
        { type: "text", content: " - Wrapper end" },
      ],
    });
  });

  it("should maintain context during async rendering with Suspense", async () => {
    const { promise, resolve } = Promise.withResolvers<string>();

    const testContext = {
      prefix: "Context:",
    };

    const AsyncComponent: FC = () => {
      const ctx = getCurrentContext<typeof testContext>();
      const result = use(promise);
      return <span>{`${ctx.prefix} ${result}`}</span>;
    };

    const element = Suspense({
      fallback: "Loading...",
      children: <AsyncComponent />,
    });

    const stream = renderToReadableStream(element, testContext);
    const reader = stream.getReader();

    // 最初のチャンク（fallback）
    const firstChunk = await reader.read();
    expect(firstChunk.value).toEqual({
      type: "text",
      content: "Loading...",
    });

    // Promiseを解決
    resolve("Async data");

    // 次のチャンク（contextが保持されている）
    const secondChunk = await reader.read();
    expect(secondChunk.value).toEqual({
      type: "intrinsic",
      name: "span",
      props: {},
      children: [{ type: "text", content: "Context: Async data" }],
    });

    reader.releaseLock();
  });

  it("should clear context after rendering completes", async () => {
    const testContext = { value: "test" };

    const TestComponent: FC = () => {
      const ctx = getCurrentContext<typeof testContext>();
      return <div>{ctx.value}</div>;
    };

    const element = <TestComponent />;

    const stream = renderToReadableStream(element, testContext);
    await readStreamToCompletion(stream);

    // レンダリング完了後はcontextにアクセスできない
    expect(() => getCurrentContext()).toThrow(
      "getCurrentContext can only be called during rendering",
    );
  });
});
