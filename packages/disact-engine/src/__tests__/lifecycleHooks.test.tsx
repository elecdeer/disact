/** @jsxImportSource ../ */

import { describe, expect, it } from "vitest";
import { renderToReadableStream } from "../render";
import { readStreamToCompletion } from "./testUtil";
import type { FC } from "../element";
import { use } from "../thenable";
import { Suspense } from "../jsx-dev-runtime";

describe("Lifecycle Hooks", () => {
  it("should call preRender and postRender hooks for simple render", async () => {
    const preRenderCalls: number[] = [];
    const postRenderCalls: number[] = [];
    const postRenderCycleCalls: number[] = [];

    const element = <div>Hello</div>;

    const stream = renderToReadableStream(
      element,
      {},
      {
        preRender: async () => {
          preRenderCalls.push(Date.now());
        },
        postRender: async () => {
          postRenderCalls.push(Date.now());
        },
        postRenderCycle: async () => {
          postRenderCycleCalls.push(Date.now());
        },
      },
    );

    await readStreamToCompletion(stream);

    expect(preRenderCalls).toHaveLength(1);
    expect(postRenderCalls).toHaveLength(1);
    expect(postRenderCycleCalls).toHaveLength(1);
  });

  it("should call hooks in correct order: preRender -> postRender -> postRenderCycle", async () => {
    const callOrder: string[] = [];

    const element = <div>Test</div>;

    const stream = renderToReadableStream(
      element,
      {},
      {
        preRender: async () => {
          callOrder.push("preRender");
        },
        postRender: async () => {
          callOrder.push("postRender");
        },
        postRenderCycle: async () => {
          callOrder.push("postRenderCycle");
        },
      },
    );

    await readStreamToCompletion(stream);

    expect(callOrder).toEqual(["preRender", "postRender", "postRenderCycle"]);
  });

  it("should call preRender and postRender multiple times with Suspense", async () => {
    const preRenderCalls: number[] = [];
    const postRenderCalls: number[] = [];
    const postRenderCycleCalls: number[] = [];

    const { promise, resolve } = Promise.withResolvers<string>();

    const AsyncComponent: FC = () => {
      const data = use(promise);
      return <span>{data}</span>;
    };

    const element = Suspense({
      fallback: <div>Loading...</div>,
      children: <AsyncComponent />,
    });

    const stream = renderToReadableStream(
      element,
      {},
      {
        preRender: async () => {
          preRenderCalls.push(Date.now());
        },
        postRender: async () => {
          postRenderCalls.push(Date.now());
        },
        postRenderCycle: async () => {
          postRenderCycleCalls.push(Date.now());
        },
      },
    );

    // Start reading the stream
    const reader = stream.getReader();

    // First chunk (fallback)
    const { value: chunk1 } = await reader.read();
    expect(chunk1).toEqual({
      type: "intrinsic",
      name: "div",
      props: {},
      children: [{ type: "text", content: "Loading..." }],
    });

    // At this point, preRender and postRender should have been called once
    expect(preRenderCalls.length).toBeGreaterThanOrEqual(1);
    expect(postRenderCalls.length).toBeGreaterThanOrEqual(1);

    // Resolve the promise
    resolve("Loaded");

    // Second chunk (resolved)
    const { value: chunk2 } = await reader.read();
    expect(chunk2).toEqual({
      type: "intrinsic",
      name: "span",
      props: {},
      children: [{ type: "text", content: "Loaded" }],
    });

    // Read until done
    await reader.read();

    reader.releaseLock();

    // preRender and postRender should have been called multiple times
    expect(preRenderCalls.length).toBeGreaterThanOrEqual(2);
    expect(postRenderCalls.length).toBeGreaterThanOrEqual(2);
    // postRenderCycle should be called only once at the end
    expect(postRenderCycleCalls).toHaveLength(1);
  });

  it("should call postRenderCycle only after all promises resolve", async () => {
    const callOrder: string[] = [];

    const { promise, resolve } = Promise.withResolvers<string>();

    const AsyncComponent: FC = () => {
      const data = use(promise);
      return <span>{data}</span>;
    };

    const element = Suspense({
      fallback: <div>Loading...</div>,
      children: <AsyncComponent />,
    });

    const stream = renderToReadableStream(
      element,
      {},
      {
        preRender: async () => {
          callOrder.push("preRender");
        },
        postRender: async () => {
          callOrder.push("postRender");
        },
        postRenderCycle: async () => {
          callOrder.push("postRenderCycle");
        },
      },
    );

    const reader = stream.getReader();

    // Read first chunk (fallback)
    await reader.read();

    // postRenderCycle should not be called yet
    expect(callOrder).not.toContain("postRenderCycle");

    // Resolve promise
    resolve("Loaded");

    // Read remaining chunks
    await reader.read();
    await reader.read();

    reader.releaseLock();

    // postRenderCycle should be called last
    expect(callOrder[callOrder.length - 1]).toBe("postRenderCycle");
  });

  it("should handle async lifecycle hooks", async () => {
    const executionLog: string[] = [];

    const element = <div>Test</div>;

    const stream = renderToReadableStream(
      element,
      {},
      {
        preRender: async () => {
          await new Promise((resolve) => setTimeout(resolve, 10));
          executionLog.push("preRender completed");
        },
        postRender: async () => {
          await new Promise((resolve) => setTimeout(resolve, 10));
          executionLog.push("postRender completed");
        },
        postRenderCycle: async () => {
          await new Promise((resolve) => setTimeout(resolve, 10));
          executionLog.push("postRenderCycle completed");
        },
      },
    );

    await readStreamToCompletion(stream);

    expect(executionLog).toEqual([
      "preRender completed",
      "postRender completed",
      "postRenderCycle completed",
    ]);
  });

  it("should work without any hooks provided", async () => {
    const element = <div>Test</div>;

    const stream = renderToReadableStream(element, {});
    const chunks = await readStreamToCompletion(stream);

    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toEqual({
      type: "intrinsic",
      name: "div",
      props: {},
      children: [{ type: "text", content: "Test" }],
    });
  });

  it("should work with partial hooks provided", async () => {
    const preRenderCalls: number[] = [];

    const element = <div>Test</div>;

    const stream = renderToReadableStream(
      element,
      {},
      {
        preRender: async () => {
          preRenderCalls.push(1);
        },
        // postRender and postRenderCycle are not provided
      },
    );

    await readStreamToCompletion(stream);

    expect(preRenderCalls).toHaveLength(1);
  });

  it("should call preRender before each re-render in Suspense", async () => {
    const renderStates: string[] = [];

    // 2つの独立したPromiseが必要なため、別々に呼び出す
    const { promise: promise1, resolve: resolve1 } = Promise.withResolvers<string>();
    // oxlint-disable-next-line p42
    const { promise: promise2, resolve: resolve2 } = Promise.withResolvers<string>();

    const AsyncComponent1: FC = () => {
      const data = use(promise1);
      return <span>{data}</span>;
    };

    const AsyncComponent2: FC = () => {
      const data = use(promise2);
      return <span>{data}</span>;
    };

    const element = (
      <div>
        <Suspense fallback={<div>Loading 1...</div>}>
          <AsyncComponent1 />
        </Suspense>
        <Suspense fallback={<div>Loading 2...</div>}>
          <AsyncComponent2 />
        </Suspense>
      </div>
    );

    const stream = renderToReadableStream(
      element,
      {},
      {
        preRender: async () => {
          renderStates.push("preRender");
        },
        postRender: async () => {
          renderStates.push("postRender");
        },
      },
    );

    const reader = stream.getReader();

    // Initial render with both fallbacks
    await reader.read();
    expect(renderStates.length).toBeGreaterThanOrEqual(2); // preRender + postRender

    const statesBefore = renderStates.length;

    // Resolve first promise
    resolve1("Data 1");
    await reader.read();

    // preRender and postRender should be called again
    expect(renderStates.length).toBeGreaterThan(statesBefore);

    const statesBefore2 = renderStates.length;

    // Resolve second promise
    resolve2("Data 2");
    await reader.read();

    // preRender and postRender should be called again
    expect(renderStates.length).toBeGreaterThan(statesBefore2);

    await reader.read();
    reader.releaseLock();
  });
});
