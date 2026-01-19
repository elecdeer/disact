/** @jsxImportSource ../ */

import { describe, expect, it } from "vitest";
import { renderToReadableStream } from "../render";
import { readStreamToCompletion } from "./testUtil";
import type { DisactElement, DisactNode, FC } from "../element";
import { Suspense } from "../jsx-dev-runtime";
import { use } from "../thenable";

describe("ErrorBoundary機能", () => {
  it("should catch synchronous errors and render fallback", async () => {
    const error = new Error("Test error");

    const ErrorComponent: FC = () => {
      throw error;
    };

    const ErrorBoundary = (props: {
      fallback: (error: Error) => DisactNode;
      children: DisactNode;
    }): DisactElement => {
      return {
        type: "errorBoundary",
        props,
      };
    };

    const element = ErrorBoundary({
      fallback: (err: Error) => <div className="error">{err.message}</div>,
      children: <ErrorComponent />,
    });

    const stream = renderToReadableStream(element, {});
    const chunks = await readStreamToCompletion(stream);

    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toEqual({
      type: "intrinsic",
      name: "div",
      props: { className: "error" },
      children: [{ type: "text", content: "Test error" }],
    });
  });

  it("should not catch errors when no ErrorBoundary is present", async () => {
    const error = new Error("Uncaught error");

    const ErrorComponent: FC = () => {
      throw error;
    };

    const element = <ErrorComponent />;

    const stream = renderToReadableStream(element, {});

    await expect(readStreamToCompletion(stream)).rejects.toThrow("Uncaught error");
  });

  it("should handle nested ErrorBoundary with inner error", async () => {
    const innerError = new Error("Inner error");

    const InnerErrorComponent: FC = () => {
      throw innerError;
    };

    const ErrorBoundary = (props: {
      fallback: (error: Error) => DisactNode;
      children: DisactNode;
    }): DisactElement => {
      return {
        type: "errorBoundary",
        props,
      };
    };

    const element = ErrorBoundary({
      fallback: () => "Outer fallback",
      children: (
        <div>
          {"Before error - "}
          {ErrorBoundary({
            fallback: (err: Error) => `Inner fallback: ${err.message}`,
            children: <InnerErrorComponent />,
          })}
          {" - After error"}
        </div>
      ),
    });

    const stream = renderToReadableStream(element, {});
    const chunks = await readStreamToCompletion(stream);

    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toEqual({
      type: "intrinsic",
      name: "div",
      props: {},
      children: [
        { type: "text", content: "Before error - " },
        { type: "text", content: "Inner fallback: Inner error" },
        { type: "text", content: " - After error" },
      ],
    });
  });

  it("should handle multiple independent ErrorBoundaries", async () => {
    const error1 = new Error("Error 1");
    const error2 = new Error("Error 2");

    const ErrorComponent1: FC = () => {
      throw error1;
    };

    const ErrorComponent2: FC = () => {
      throw error2;
    };

    const ErrorBoundary = (props: {
      fallback: (error: Error) => DisactNode;
      children: DisactNode;
    }): DisactElement => {
      return {
        type: "errorBoundary",
        props,
      };
    };

    const element = (
      <div>
        <ErrorBoundary fallback={(err: Error) => `Fallback 1: ${err.message}`}>
          <ErrorComponent1 />
        </ErrorBoundary>
        {" and "}
        <ErrorBoundary fallback={(err: Error) => `Fallback 2: ${err.message}`}>
          <ErrorComponent2 />
        </ErrorBoundary>
      </div>
    );

    const stream = renderToReadableStream(element, {});
    const chunks = await readStreamToCompletion(stream);

    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toEqual({
      type: "intrinsic",
      name: "div",
      props: {},
      children: [
        { type: "text", content: "Fallback 1: Error 1" },
        { type: "text", content: " and " },
        { type: "text", content: "Fallback 2: Error 2" },
      ],
    });
  });

  it("should not catch errors when child renders successfully", async () => {
    const NormalComponent: FC = () => <span>Normal content</span>;

    const ErrorBoundary = (props: {
      fallback: (error: Error) => DisactNode;
      children: DisactNode;
    }): DisactElement => {
      return {
        type: "errorBoundary",
        props,
      };
    };

    const element = ErrorBoundary({
      fallback: () => "Error fallback",
      children: <NormalComponent />,
    });

    const stream = renderToReadableStream(element, {});
    const chunks = await readStreamToCompletion(stream);

    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toEqual({
      type: "intrinsic",
      name: "span",
      props: {},
      children: [{ type: "text", content: "Normal content" }],
    });
  });

  it("should handle ErrorBoundary with Suspense", async () => {
    const { promise, resolve } = Promise.withResolvers<string>();

    const AsyncComponent: FC = () => {
      const result = use(promise);
      throw new Error(`Error after async: ${result}`);
    };

    const ErrorBoundary = (props: {
      fallback: (error: Error) => DisactNode;
      children: DisactNode;
    }): DisactElement => {
      return {
        type: "errorBoundary",
        props,
      };
    };

    const element = ErrorBoundary({
      fallback: (err: Error) => `Caught: ${err.message}`,
      children: Suspense({
        fallback: "Loading...",
        children: <AsyncComponent />,
      }),
    });

    const stream = renderToReadableStream(element, {});
    const reader = stream.getReader();

    // 最初のチャンク（Suspense fallback）
    const firstChunk = await reader.read();
    expect(firstChunk.value).toEqual({
      type: "text",
      content: "Loading...",
    });

    // Promiseを解決
    resolve("data");

    // 次のチャンク（エラーがキャッチされてfallback表示）
    const secondChunk = await reader.read();
    expect(secondChunk.value).toEqual({
      type: "text",
      content: "Caught: Error after async: data",
    });

    reader.releaseLock();
  });

  it("should propagate errors to outer ErrorBoundary when inner has no boundary", async () => {
    const error = new Error("Deep error");

    const DeepErrorComponent: FC = () => {
      throw error;
    };

    const MiddleComponent: FC = () => (
      <div>
        Middle - <DeepErrorComponent /> - End
      </div>
    );

    const ErrorBoundary = (props: {
      fallback: (error: Error) => DisactNode;
      children: DisactNode;
    }): DisactElement => {
      return {
        type: "errorBoundary",
        props,
      };
    };

    const element = ErrorBoundary({
      fallback: (err: Error) => `Outer caught: ${err.message}`,
      children: <MiddleComponent />,
    });

    const stream = renderToReadableStream(element, {});
    const chunks = await readStreamToCompletion(stream);

    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toEqual({
      type: "text",
      content: "Outer caught: Deep error",
    });
  });

  it("should handle nested ErrorBoundaries with both catching errors", async () => {
    const outerError = new Error("Outer error");
    const innerError = new Error("Inner error");

    const InnerErrorComponent: FC = () => {
      throw innerError;
    };

    const OuterErrorComponent: FC = () => {
      throw outerError;
    };

    const ErrorBoundary = (props: {
      fallback: (error: Error) => DisactNode;
      children: DisactNode;
    }): DisactElement => {
      return {
        type: "errorBoundary",
        props,
      };
    };

    const element = ErrorBoundary({
      fallback: (err: Error) => `Outer: ${err.message}`,
      children: (
        <section>
          <OuterErrorComponent /> |
          {ErrorBoundary({
            fallback: (err: Error) => `Inner: ${err.message}`,
            children: <InnerErrorComponent />,
          })}
        </section>
      ),
    });

    const stream = renderToReadableStream(element, {});
    const chunks = await readStreamToCompletion(stream);

    // 外側のコンポーネントでエラーが発生するため、外側のfallbackが表示される
    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toEqual({
      type: "text",
      content: "Outer: Outer error",
    });
  });

  it("should handle deeply nested ErrorBoundaries", async () => {
    const level3Error = new Error("Level 3 error");

    const Level3ErrorComponent: FC = () => {
      throw level3Error;
    };

    const ErrorBoundary = (props: {
      fallback: (error: Error) => DisactNode;
      children: DisactNode;
    }): DisactElement => {
      return {
        type: "errorBoundary",
        props,
      };
    };

    const element = ErrorBoundary({
      fallback: (err: Error) => `L1: ${err.message}`,
      children: (
        <div className="level1">
          {"Level 1 start - "}
          {ErrorBoundary({
            fallback: (err: Error) => `L2: ${err.message}`,
            children: (
              <div className="level2">
                {"Level 2 start - "}
                {ErrorBoundary({
                  fallback: (err: Error) => `L3: ${err.message}`,
                  children: <Level3ErrorComponent />,
                })}
                {" - Level 2 end"}
              </div>
            ),
          })}
          {" - Level 1 end"}
        </div>
      ),
    });

    const stream = renderToReadableStream(element, {});
    const chunks = await readStreamToCompletion(stream);

    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toEqual({
      type: "intrinsic",
      name: "div",
      props: { className: "level1" },
      children: [
        { type: "text", content: "Level 1 start - " },
        {
          type: "intrinsic",
          name: "div",
          props: { className: "level2" },
          children: [
            { type: "text", content: "Level 2 start - " },
            { type: "text", content: "L3: Level 3 error" },
            { type: "text", content: " - Level 2 end" },
          ],
        },
        { type: "text", content: " - Level 1 end" },
      ],
    });
  });

  it("should handle ErrorBoundary nested in ErrorBoundary where outer catches error", async () => {
    const outerError = new Error("Outer component error");

    const OuterErrorComponent: FC = () => {
      throw outerError;
    };

    const NormalComponent: FC = () => <span>Inner normal content</span>;

    const ErrorBoundary = (props: {
      fallback: (error: Error) => DisactNode;
      children: DisactNode;
    }): DisactElement => {
      return {
        type: "errorBoundary",
        props,
      };
    };

    const element = ErrorBoundary({
      fallback: (err: Error) => `Outer fallback: ${err.message}`,
      children: (
        <div>
          <OuterErrorComponent />
          {ErrorBoundary({
            fallback: (err: Error) => `Inner fallback: ${err.message}`,
            children: <NormalComponent />,
          })}
        </div>
      ),
    });

    const stream = renderToReadableStream(element, {});
    const chunks = await readStreamToCompletion(stream);

    // 外側でエラーが発生するため、内側のErrorBoundaryは評価されない
    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toEqual({
      type: "text",
      content: "Outer fallback: Outer component error",
    });
  });

  it("should handle mixed ErrorBoundary and Suspense nesting", async () => {
    const { promise, resolve } = Promise.withResolvers<string>();

    const AsyncErrorComponent: FC = () => {
      const result = use(promise);
      throw new Error(`${result} error`);
    };

    const ErrorBoundary = (props: {
      fallback: (error: Error) => DisactNode;
      children: DisactNode;
    }): DisactElement => {
      return {
        type: "errorBoundary",
        props,
      };
    };

    const element = (
      <container>
        <ErrorBoundary fallback={(err: Error) => `Outer caught: ${err.message}`}>
          <div>
            {"Outer start - "}
            <Suspense fallback="Inner loading...">
              <ErrorBoundary fallback={(err: Error) => `Inner caught: ${err.message}`}>
                <AsyncErrorComponent />
              </ErrorBoundary>
            </Suspense>
            {" - Outer end"}
          </div>
        </ErrorBoundary>
      </container>
    );

    const stream = renderToReadableStream(element, {});
    const reader = stream.getReader();

    // 最初のチャンク（Suspense fallback）
    const firstChunk = await reader.read();
    expect(firstChunk.value).toEqual({
      type: "intrinsic",
      name: "container",
      props: {},
      children: [
        {
          type: "intrinsic",
          name: "div",
          props: {},
          children: [
            { type: "text", content: "Outer start - " },
            { type: "text", content: "Inner loading..." },
            { type: "text", content: " - Outer end" },
          ],
        },
      ],
    });

    // Promiseを解決
    resolve("Async");

    // 次のチャンク（内側のErrorBoundaryがエラーをキャッチ）
    const secondChunk = await reader.read();
    expect(secondChunk.value).toEqual({
      type: "intrinsic",
      name: "container",
      props: {},
      children: [
        {
          type: "intrinsic",
          name: "div",
          props: {},
          children: [
            { type: "text", content: "Outer start - " },
            { type: "text", content: "Inner caught: Async error" },
            { type: "text", content: " - Outer end" },
          ],
        },
      ],
    });

    reader.releaseLock();
  });
});
