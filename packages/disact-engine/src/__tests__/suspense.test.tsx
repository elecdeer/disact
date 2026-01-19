/** @jsxImportSource ../ */

import { describe, expect, it } from "vitest";
import { renderToReadableStream } from "../render";
import { readStreamToCompletion } from "./testUtil";
import type { FC } from "../element";
import { Suspense } from "../jsx-dev-runtime";
import { use } from "../thenable";

describe("Suspense機能", () => {
  it("should render Suspense with fallback when child uses Promise", async () => {
    const { promise, resolve } = Promise.withResolvers<string>();

    const AsyncComponent: FC = () => {
      const result = use(promise);
      return result;
    };

    const element = (
      <Suspense fallback="Loading...">
        <AsyncComponent />
      </Suspense>
    );

    const stream = renderToReadableStream(element, {});
    const reader = stream.getReader();

    // 最初のチャンク（fallback）を読み取る
    const firstChunk = await reader.read();
    expect(firstChunk.done).toBe(false);
    expect(firstChunk.value).toEqual({ type: "text", content: "Loading..." });

    // Promiseを解決してテストを制御
    resolve("Loaded!");

    // 次のチャンク（実際のコンテンツ）を読み取る
    const secondChunk = await reader.read();
    expect(secondChunk.done).toBe(false);
    expect(secondChunk.value).toEqual({ type: "text", content: "Loaded!" });

    // ストリームが完了していることを確認
    const endChunk = await reader.read();
    expect(endChunk.done).toBe(true);

    reader.releaseLock();
  });

  it("should render normally when child doesn't throw a Promise", async () => {
    const NormalComponent: FC = () => <div>Normal content</div>;

    const element = (
      <Suspense fallback="Loading...">
        <NormalComponent />
      </Suspense>
    );

    const stream = renderToReadableStream(element, {});
    const chunks = await readStreamToCompletion(stream);

    // Promiseが投げられなければ通常通りレンダリング
    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toEqual({
      type: "intrinsic",
      name: "div",
      props: {},
      children: [{ type: "text", content: "Normal content" }],
    });
  });

  it("should handle simple Promise error case", async () => {
    const error = new Error("Test error");

    const ErrorComponent: FC = () => {
      throw error;
    };

    const element = (
      <Suspense fallback="Loading...">
        <ErrorComponent />
      </Suspense>
    );

    const stream = renderToReadableStream(element, {});

    // エラーが投げられた場合はストリームエラーになる
    await expect(readStreamToCompletion(stream)).rejects.toThrow("Test error");
  });

  it("should handle Suspense as non-root element", async () => {
    const { promise, resolve } = Promise.withResolvers<string>();

    const AsyncComponent: FC = () => {
      const result = use(promise);
      return result;
    };

    const suspenseElement = (
      <Suspense fallback="Loading async...">
        <AsyncComponent />
      </Suspense>
    );

    const element = (
      <div className="container">
        Before Suspense
        {suspenseElement}
        After Suspense
      </div>
    );

    const stream = renderToReadableStream(element, {});
    const reader = stream.getReader();

    // 最初のチャンク（fallback付きの構造）を読み取る
    const firstChunk = await reader.read();
    expect(firstChunk.done).toBe(false);
    expect(firstChunk.value).toEqual({
      type: "intrinsic",
      name: "div",
      props: { className: "container" },
      children: [
        { type: "text", content: "Before Suspense" },
        { type: "text", content: "Loading async..." },
        { type: "text", content: "After Suspense" },
      ],
    });

    // Promiseを解決
    resolve("Async content loaded!");

    // 次のチャンク（実際のコンテンツ付きの構造）を読み取る
    const secondChunk = await reader.read();
    expect(secondChunk.done).toBe(false);
    expect(secondChunk.value).toEqual({
      type: "intrinsic",
      name: "div",
      props: { className: "container" },
      children: [
        { type: "text", content: "Before Suspense" },
        { type: "text", content: "Async content loaded!" },
        { type: "text", content: "After Suspense" },
      ],
    });

    // ストリームが完了していることを確認
    const endChunk = await reader.read();
    expect(endChunk.done).toBe(true);

    reader.releaseLock();
  });

  it("should handle grandchild component using Promise", async () => {
    const { promise, resolve } = Promise.withResolvers<string>();

    const GrandChild: FC = () => {
      const result = use(promise);
      return result;
    };

    const Child: FC = () => (
      <span>
        Child prefix: <GrandChild /> - Child suffix
      </span>
    );

    const element = (
      <Suspense fallback="Loading grandchild...">
        <Child />
      </Suspense>
    );

    const stream = renderToReadableStream(element, {});
    const reader = stream.getReader();

    // 最初のチャンク（fallback）を読み取る
    const firstChunk = await reader.read();
    expect(firstChunk.done).toBe(false);
    expect(firstChunk.value).toEqual({
      type: "text",
      content: "Loading grandchild...",
    });

    // Promiseを解決
    resolve("Grandchild loaded!");

    // 次のチャンク（実際のコンテンツ）を読み取る
    const secondChunk = await reader.read();
    expect(secondChunk.done).toBe(false);
    expect(secondChunk.value).toEqual({
      type: "intrinsic",
      name: "span",
      props: {},
      children: [
        { type: "text", content: "Child prefix: " },
        { type: "text", content: "Grandchild loaded!" },
        { type: "text", content: " - Child suffix" },
      ],
    });

    // ストリームが完了していることを確認
    const endChunk = await reader.read();
    expect(endChunk.done).toBe(true);

    reader.releaseLock();
  });

  it("should handle multiple async components", async () => {
    const { promise: promise1, resolve: resolve1 } = Promise.withResolvers<string>();
    const { promise: promise2, resolve: resolve2 } = Promise.withResolvers<string>();

    const AsyncComponent1: FC = () => {
      const result = use(promise1);
      return result;
    };

    const AsyncComponent2: FC = () => {
      const result = use(promise2);
      return result;
    };

    const element = (
      <div>
        <Suspense fallback="Loading 1...">
          <AsyncComponent1 />
        </Suspense>
        {" and "}
        <Suspense fallback="Loading 2...">
          <AsyncComponent2 />
        </Suspense>
      </div>
    );

    const stream = renderToReadableStream(element, {});
    const reader = stream.getReader();

    // 最初のチャンク（両方ともfallback）を読み取る
    const firstChunk = await reader.read();
    expect(firstChunk.done).toBe(false);
    expect(firstChunk.value).toEqual({
      type: "intrinsic",
      name: "div",
      props: {},
      children: [
        { type: "text", content: "Loading 1..." },
        { type: "text", content: " and " },
        { type: "text", content: "Loading 2..." },
      ],
    });

    // Promiseを解決
    resolve1("Content 1");
    resolve2("Content 2");

    // 次のチャンク（両方とも解決済み）を読み取る
    const secondChunk = await reader.read();
    expect(secondChunk.done).toBe(false);
    expect(secondChunk.value).toEqual({
      type: "intrinsic",
      name: "div",
      props: {},
      children: [
        { type: "text", content: "Content 1" },
        { type: "text", content: " and " },
        { type: "text", content: "Content 2" },
      ],
    });

    // ストリームが完了していることを確認
    const endChunk = await reader.read();
    expect(endChunk.done).toBe(true);

    reader.releaseLock();
  });

  it("should handle use() with already resolved Promise", async () => {
    const resolvedPromise = Promise.resolve("Already resolved!");

    const AsyncComponent: FC = () => {
      const result = use(resolvedPromise);
      return result;
    };

    const element = (
      <Suspense fallback="Loading...">
        <AsyncComponent />
      </Suspense>
    );

    const stream = renderToReadableStream(element, {});
    const chunks = await readStreamToCompletion(stream);

    // 即座に解決されるPromiseの場合、microtask実行後に解決状態を確認し
    // fallbackを表示せずに直接結果を返す
    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toEqual({ type: "text", content: "Already resolved!" });
  });

  it("should handle use() with rejected Promise", async () => {
    const rejectedPromise = Promise.reject(new Error("Promise rejected"));

    const AsyncComponent: FC = () => {
      const result = use(rejectedPromise);
      return result;
    };

    const element = (
      <Suspense fallback="Loading...">
        <AsyncComponent />
      </Suspense>
    );

    const stream = renderToReadableStream(element, {});

    // 拒否されたPromiseの場合はエラーがストリームに伝播される
    await expect(readStreamToCompletion(stream)).rejects.toThrow("Promise rejected");
  });

  it("should handle parallel Suspense boundaries", async () => {
    const { promise: promise1, resolve: resolve1 } = Promise.withResolvers<string>();
    const { promise: promise2, resolve: resolve2 } = Promise.withResolvers<string>();

    const AsyncComponent1: FC = () => {
      const result = use(promise1);
      return `First: ${result}`;
    };

    const AsyncComponent2: FC = () => {
      const result = use(promise2);
      return `Second: ${result}`;
    };

    const App: FC = () => (
      <div>
        <Suspense fallback="Loading first...">
          <AsyncComponent1 />
        </Suspense>
        {" | "}
        <Suspense fallback="Loading second...">
          <AsyncComponent2 />
        </Suspense>
      </div>
    );

    // Promiseを事前に解決
    resolve1("Data A");
    resolve2("Data B");

    const stream = renderToReadableStream(<App />, {});

    const chunks = await readStreamToCompletion(stream);

    // 並列Suspenseでfallbackが表示された後、最終結果が得られる
    expect(chunks.length).toBeGreaterThanOrEqual(1);

    // 最終結果が正しいことを確認
    const lastChunk = chunks[chunks.length - 1];
    expect(lastChunk).toEqual({
      type: "intrinsic",
      name: "div",
      props: {},
      children: [
        { type: "text", content: "First: Data A" },
        { type: "text", content: " | " },
        { type: "text", content: "Second: Data B" },
      ],
    });
  });

  it("should stream intermediate results when Promises resolve individually", async () => {
    const { promise: promise1, resolve: resolve1 } = Promise.withResolvers<string>();
    const { promise: promise2, resolve: resolve2 } = Promise.withResolvers<string>();

    const AsyncComponent1: FC = () => {
      const result = use(promise1);
      return `First: ${result}`;
    };

    const AsyncComponent2: FC = () => {
      const result = use(promise2);
      return `Second: ${result}`;
    };

    const App: FC = () => ({
      type: "intrinsic",
      name: "div",
      props: {
        children: [
          {
            type: "suspense",
            props: {
              fallback: "Loading first...",
              children: {
                type: "function",
                fc: AsyncComponent1,
                props: {},
              },
            },
          },
          " | ",
          {
            type: "suspense",
            props: {
              fallback: "Loading second...",
              children: {
                type: "function",
                fc: AsyncComponent2,
                props: {},
              },
            },
          },
        ],
      },
    });

    const stream = renderToReadableStream(<App />, {});
    const reader = stream.getReader();

    // 最初は両方ともfallbackが表示される
    const chunk1 = await reader.read();
    expect(chunk1.value).toEqual({
      type: "intrinsic",
      name: "div",
      props: {},
      children: [
        { type: "text", content: "Loading first..." },
        { type: "text", content: " | " },
        { type: "text", content: "Loading second..." },
      ],
    });

    // promise1を解決 - 最初のSuspenseだけが更新される
    resolve1("Data A");

    const chunk2 = await reader.read();
    expect(chunk2.value).toEqual({
      type: "intrinsic",
      name: "div",
      props: {},
      children: [
        { type: "text", content: "First: Data A" },
        { type: "text", content: " | " },
        { type: "text", content: "Loading second..." },
      ],
    });

    // promise2を解決 - 2番目のSuspenseも更新される
    resolve2("Data B");

    const chunk3 = await reader.read();
    expect(chunk3.value).toEqual({
      type: "intrinsic",
      name: "div",
      props: {},
      children: [
        { type: "text", content: "First: Data A" },
        { type: "text", content: " | " },
        { type: "text", content: "Second: Data B" },
      ],
    });

    // ストリーム終了
    const finalResult = await reader.read();
    expect(finalResult.done).toBe(true);

    reader.releaseLock();
  });

  it("should handle different resolution timing correctly", async () => {
    const { promise: fastPromise, resolve: resolveFast } = Promise.withResolvers<string>();
    const { promise: slowPromise, resolve: resolveSlow } = Promise.withResolvers<string>();

    const FastComponent: FC = () => {
      const result = use(fastPromise);
      return `Fast: ${result}`;
    };

    const SlowComponent: FC = () => {
      const result = use(slowPromise);
      return `Slow: ${result}`;
    };

    const App: FC = () => (
      <section>
        <div>
          <Suspense fallback="Fast loading...">
            <FastComponent />
          </Suspense>
        </div>
        <div>
          <Suspense fallback="Slow loading...">
            <SlowComponent />
          </Suspense>
        </div>
      </section>
    );

    const stream = renderToReadableStream(<App />, {});
    const reader = stream.getReader();

    // 初期状態：両方ともローディング中
    const chunk1 = await reader.read();
    expect(chunk1.value).toEqual({
      type: "intrinsic",
      name: "section",
      props: {},
      children: [
        {
          type: "intrinsic",
          name: "div",
          props: {},
          children: [{ type: "text", content: "Fast loading..." }],
        },
        {
          type: "intrinsic",
          name: "div",
          props: {},
          children: [{ type: "text", content: "Slow loading..." }],
        },
      ],
    });

    // 速いPromiseを先に解決
    resolveFast("Quick data");

    const chunk2 = await reader.read();
    expect(chunk2.value).toEqual({
      type: "intrinsic",
      name: "section",
      props: {},
      children: [
        {
          type: "intrinsic",
          name: "div",
          props: {},
          children: [{ type: "text", content: "Fast: Quick data" }],
        },
        {
          type: "intrinsic",
          name: "div",
          props: {},
          children: [{ type: "text", content: "Slow loading..." }],
        },
      ],
    });

    // 遅いPromiseを後で解決
    resolveSlow("Slow data");

    const chunk3 = await reader.read();
    expect(chunk3.value).toEqual({
      type: "intrinsic",
      name: "section",
      props: {},
      children: [
        {
          type: "intrinsic",
          name: "div",
          props: {},
          children: [{ type: "text", content: "Fast: Quick data" }],
        },
        {
          type: "intrinsic",
          name: "div",
          props: {},
          children: [{ type: "text", content: "Slow: Slow data" }],
        },
      ],
    });

    // ストリーム終了
    const finalResult = await reader.read();
    expect(finalResult.done).toBe(true);

    reader.releaseLock();
  });

  it("should enqueue only once when multiple Suspense boundaries share the same Promise", async () => {
    const { promise: sharedPromise, resolve: resolveShared } = Promise.withResolvers<string>();

    const AsyncComponent1: FC = () => {
      const result = use(sharedPromise);
      return `Component1: ${result}`;
    };

    const AsyncComponent2: FC = () => {
      const result = use(sharedPromise);
      return `Component2: ${result}`;
    };

    const App: FC = () => (
      <main>
        <Suspense fallback="Loading component 1...">
          <AsyncComponent1 />
        </Suspense>
        {" and "}
        <Suspense fallback="Loading component 2...">
          <AsyncComponent2 />
        </Suspense>
      </main>
    );

    const stream = renderToReadableStream(<App />, {});
    const reader = stream.getReader();

    // 初期状態：両方のSuspenseがfallbackを表示
    const chunk1 = await reader.read();
    expect(chunk1.value).toEqual({
      type: "intrinsic",
      name: "main",
      props: {},
      children: [
        { type: "text", content: "Loading component 1..." },
        { type: "text", content: " and " },
        { type: "text", content: "Loading component 2..." },
      ],
    });

    // 共有Promiseを解決 - 両方のSuspenseが同時に解決される
    resolveShared("Shared data");

    // 1度だけenqueueされるべき（同じPromiseなので重複しない）
    const chunk2 = await reader.read();
    expect(chunk2.value).toEqual({
      type: "intrinsic",
      name: "main",
      props: {},
      children: [
        { type: "text", content: "Component1: Shared data" },
        { type: "text", content: " and " },
        { type: "text", content: "Component2: Shared data" },
      ],
    });

    // ストリーム終了（追加のenqueueはない）
    const finalResult = await reader.read();
    expect(finalResult.done).toBe(true);

    reader.releaseLock();
  });

  it("should handle mixed shared and unique Promises correctly", async () => {
    const { promise: sharedPromise, resolve: resolveShared } = Promise.withResolvers<string>();
    const { promise: uniquePromise, resolve: resolveUnique } = Promise.withResolvers<string>();

    const SharedComponent1: FC = () => {
      const result = use(sharedPromise);
      return `Shared1: ${result}`;
    };

    const SharedComponent2: FC = () => {
      const result = use(sharedPromise);
      return `Shared2: ${result}`;
    };

    const UniqueComponent: FC = () => {
      const result = use(uniquePromise);
      return `Unique: ${result}`;
    };

    const App: FC = () => (
      <container>
        <Suspense fallback="Loading shared 1...">
          <SharedComponent1 />
        </Suspense>
        {" | "}
        <Suspense fallback="Loading shared 2...">
          <SharedComponent2 />
        </Suspense>
        {" | "}
        <Suspense fallback="Loading unique...">
          <UniqueComponent />
        </Suspense>
      </container>
    );

    const stream = renderToReadableStream(<App />, {});
    const reader = stream.getReader();

    // 初期状態：すべてがfallback表示
    const chunk1 = await reader.read();
    expect(chunk1.value).toEqual({
      type: "intrinsic",
      name: "container",
      props: {},
      children: [
        { type: "text", content: "Loading shared 1..." },
        { type: "text", content: " | " },
        { type: "text", content: "Loading shared 2..." },
        { type: "text", content: " | " },
        { type: "text", content: "Loading unique..." },
      ],
    });

    // 共有Promiseを解決 - 2つのSuspenseが同時に解決
    resolveShared("Shared data");

    const chunk2 = await reader.read();
    expect(chunk2.value).toEqual({
      type: "intrinsic",
      name: "container",
      props: {},
      children: [
        { type: "text", content: "Shared1: Shared data" },
        { type: "text", content: " | " },
        { type: "text", content: "Shared2: Shared data" },
        { type: "text", content: " | " },
        { type: "text", content: "Loading unique..." },
      ],
    });

    // ユニークPromiseを解決
    resolveUnique("Unique data");

    const chunk3 = await reader.read();
    expect(chunk3.value).toEqual({
      type: "intrinsic",
      name: "container",
      props: {},
      children: [
        { type: "text", content: "Shared1: Shared data" },
        { type: "text", content: " | " },
        { type: "text", content: "Shared2: Shared data" },
        { type: "text", content: " | " },
        { type: "text", content: "Unique: Unique data" },
      ],
    });

    // ストリーム終了
    const finalResult = await reader.read();
    expect(finalResult.done).toBe(true);

    reader.releaseLock();
  });

  it("should handle basic nested Suspense with inner component being async", async () => {
    const { promise: innerPromise, resolve: resolveInner } = Promise.withResolvers<string>();

    const InnerAsyncComponent: FC = () => {
      const result = use(innerPromise);
      return result;
    };

    const MiddleComponent: FC = () => (
      <div className="middle">
        {"Middle start - "}
        <Suspense fallback="Inner loading...">
          <InnerAsyncComponent />
        </Suspense>
        {" - Middle end"}
      </div>
    );

    const element = (
      <Suspense fallback="Outer loading...">
        <MiddleComponent />
      </Suspense>
    );

    const stream = renderToReadableStream(element, {});
    const reader = stream.getReader();

    // 最初のチャンク: 外側は同期なので、内側のfallbackが表示される
    const firstChunk = await reader.read();
    expect(firstChunk.done).toBe(false);
    expect(firstChunk.value).toEqual({
      type: "intrinsic",
      name: "div",
      props: { className: "middle" },
      children: [
        { type: "text", content: "Middle start - " },
        { type: "text", content: "Inner loading..." },
        { type: "text", content: " - Middle end" },
      ],
    });

    // 内側のPromiseを解決
    resolveInner("Inner content loaded!");

    // 次のチャンク: 内側の内容が解決される
    const secondChunk = await reader.read();
    expect(secondChunk.done).toBe(false);
    expect(secondChunk.value).toEqual({
      type: "intrinsic",
      name: "div",
      props: { className: "middle" },
      children: [
        { type: "text", content: "Middle start - " },
        { type: "text", content: "Inner content loaded!" },
        { type: "text", content: " - Middle end" },
      ],
    });

    // ストリームが完了していることを確認
    const endChunk = await reader.read();
    expect(endChunk.done).toBe(true);

    reader.releaseLock();
  });

  it("should handle nested Suspense with outer component being async", async () => {
    const { promise: outerPromise, resolve: resolveOuter } = Promise.withResolvers<string>();

    const OuterAsyncComponent: FC = () => {
      const result = use(outerPromise);
      return (
        <section className="outer">
          {"Outer content: "}
          {result}
          {" - "}
          <Suspense fallback="Inner loading...">
            <span>Inner sync content</span>
          </Suspense>
        </section>
      );
    };

    const element = (
      <Suspense fallback="Outer loading...">
        <OuterAsyncComponent />
      </Suspense>
    );

    const stream = renderToReadableStream(element, {});
    const reader = stream.getReader();

    // 最初のチャンク: 外側のfallback
    const firstChunk = await reader.read();
    expect(firstChunk.done).toBe(false);
    expect(firstChunk.value).toEqual({
      type: "text",
      content: "Outer loading...",
    });

    // 外側のPromiseを解決
    resolveOuter("Async data");

    // 次のチャンク: 外側が解決され、内側は同期なのですぐに表示
    const secondChunk = await reader.read();
    expect(secondChunk.done).toBe(false);
    expect(secondChunk.value).toEqual({
      type: "intrinsic",
      name: "section",
      props: { className: "outer" },
      children: [
        { type: "text", content: "Outer content: " },
        { type: "text", content: "Async data" },
        { type: "text", content: " - " },
        {
          type: "intrinsic",
          name: "span",
          props: {},
          children: [{ type: "text", content: "Inner sync content" }],
        },
      ],
    });

    // ストリームが完了していることを確認
    const endChunk = await reader.read();
    expect(endChunk.done).toBe(true);

    reader.releaseLock();
  });

  it("should handle nested Suspense with both components being async", async () => {
    const { promise: outerPromise, resolve: resolveOuter } = Promise.withResolvers<string>();
    const { promise: innerPromise, resolve: resolveInner } = Promise.withResolvers<string>();

    const InnerAsyncComponent: FC = () => {
      const result = use(innerPromise);
      return `Inner: ${result}`;
    };

    const OuterAsyncComponent: FC = () => {
      const result = use(outerPromise);
      return (
        <article className="outer-async">
          {`Outer: ${result}`}
          {" | "}
          <Suspense fallback="Inner loading...">
            <InnerAsyncComponent />
          </Suspense>
        </article>
      );
    };

    const element = (
      <Suspense fallback="Outer loading...">
        <OuterAsyncComponent />
      </Suspense>
    );

    const stream = renderToReadableStream(element, {});
    const reader = stream.getReader();

    // 最初のチャンク: 外側のfallback
    const firstChunk = await reader.read();
    expect(firstChunk.done).toBe(false);
    expect(firstChunk.value).toEqual({
      type: "text",
      content: "Outer loading...",
    });

    // 外側のPromiseを解決
    resolveOuter("Outer data");

    // 次のチャンク: 外側が解決され、内側のfallbackが表示
    const secondChunk = await reader.read();
    expect(secondChunk.done).toBe(false);
    expect(secondChunk.value).toEqual({
      type: "intrinsic",
      name: "article",
      props: { className: "outer-async" },
      children: [
        { type: "text", content: "Outer: Outer data" },
        { type: "text", content: " | " },
        { type: "text", content: "Inner loading..." },
      ],
    });

    // 内側のPromiseを解決
    resolveInner("Inner data");

    // 最後のチャンク: 両方が解決
    const thirdChunk = await reader.read();

    expect(thirdChunk.done).toBe(false);
    expect(thirdChunk.value).toEqual({
      type: "intrinsic",
      name: "article",
      props: { className: "outer-async" },
      children: [
        { type: "text", content: "Outer: Outer data" },
        { type: "text", content: " | " },
        { type: "text", content: "Inner: Inner data" },
      ],
    });

    // ストリームが完了していることを確認
    const endChunk = await reader.read();
    expect(endChunk.done).toBe(true);

    reader.releaseLock();
  });

  it("should handle nested Suspense with inner component resolving first", async () => {
    const { promise: outerPromise, resolve: resolveOuter } = Promise.withResolvers<string>();
    const { promise: innerPromise, resolve: resolveInner } = Promise.withResolvers<string>();

    const InnerAsyncComponent: FC = () => {
      const result = use(innerPromise);
      return `Inner: ${result}`;
    };

    const OuterAsyncComponent: FC = () => {
      const result = use(outerPromise);
      return (
        <section className="outer-resolved">
          {`Outer: ${result}`}
          {" | "}
          <Suspense fallback="Inner loading...">
            <InnerAsyncComponent />
          </Suspense>
        </section>
      );
    };

    const element = (
      <Suspense fallback="Outer loading...">
        <OuterAsyncComponent />
      </Suspense>
    );

    const stream = renderToReadableStream(element, {});
    const reader = stream.getReader();

    // 最初のチャンク: 外側のfallback
    const firstChunk = await reader.read();
    expect(firstChunk.done).toBe(false);
    expect(firstChunk.value).toEqual({
      type: "text",
      content: "Outer loading...",
    });

    // 内側のPromiseを先に解決
    resolveInner("Inner data first");

    // 内側だけが解決されても、外側がまだ未解決なのでチャンクは送信されない
    // Promise.raceでタイムアウトを使って確認
    const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve("timeout"), 50));
    const secondChunkPromise = reader.read().then((chunk) => ({ type: "chunk", chunk }));

    const raceResult = await Promise.race([timeoutPromise, secondChunkPromise]);
    expect(raceResult).toBe("timeout"); // チャンクではなくタイムアウトが先に発生

    // 外側のPromiseを解決
    resolveOuter("Outer data second");

    // 次のチャンク: 両方が一度に解決される（内側のPromiseは既に解決済み）
    const secondChunk = await reader.read();
    expect(secondChunk.done).toBe(false);
    expect(secondChunk.value).toEqual({
      type: "intrinsic",
      name: "section",
      props: { className: "outer-resolved" },
      children: [
        { type: "text", content: "Outer: Outer data second" },
        { type: "text", content: " | " },
        { type: "text", content: "Inner: Inner data first" },
      ],
    });

    // ストリームが完了していることを確認
    const endChunk = await reader.read();
    expect(endChunk.done).toBe(true);

    reader.releaseLock();
  });
});
