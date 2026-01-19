/** @jsxImportSource . */
import { describe, expect, it } from "vitest";
import type { DisactElement, DisactNode, FC, PropsBase, RenderedElement } from "./element";
import { Fragment, Suspense } from "./jsx";
import { renderToReadableStream } from "./render";
import { use } from "./thenable";

describe("renderToReadableStream", () => {
  const mockContext = {
    theme: "dark",
  };

  // ストリームから結果を読み取るヘルパー関数
  const readStreamToCompletion = async (
    stream: ReadableStream,
  ): Promise<(RenderedElement | RenderedElement[] | null)[]> => {
    const reader = stream.getReader();
    const chunks: (RenderedElement | RenderedElement[] | null)[] = [];

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }
    } finally {
      reader.releaseLock();
    }

    return chunks;
  };

  describe("Basic Element Processing", () => {
    it("should render a text element", async () => {
      const element = <div>Hello World</div>;

      const stream = renderToReadableStream(element, mockContext);
      const chunks = await readStreamToCompletion(stream);

      expect(chunks).toHaveLength(1);
      expect(chunks[0]).toEqual({
        type: "intrinsic",
        name: "div",
        props: {},
        children: [{ type: "text", content: "Hello World" }],
      });
    });

    it("should render an intrinsic element with props", async () => {
      const element = (
        <button disabled={true} className="primary">
          Click me
        </button>
      );

      const stream = renderToReadableStream(element, mockContext);
      const chunks = await readStreamToCompletion(stream);

      expect(chunks).toHaveLength(1);
      expect(chunks[0]).toEqual({
        type: "intrinsic",
        name: "button",
        props: {
          disabled: true,
          className: "primary",
        },
        children: [{ type: "text", content: "Click me" }],
      });
    });

    it("should render nested elements", async () => {
      const element = (
        <div>
          <span>Nested content</span>
        </div>
      );

      const stream = renderToReadableStream(element, mockContext);
      const chunks = await readStreamToCompletion(stream);

      expect(chunks).toHaveLength(1);
      expect(chunks[0]).toEqual({
        type: "intrinsic",
        name: "div",
        props: {},
        children: [
          {
            type: "intrinsic",
            name: "span",
            props: {},
            children: [{ type: "text", content: "Nested content" }],
          },
        ],
      });
    });

    it("should handle multiple children", async () => {
      const element = (
        <div>
          First child
          <span>Second child</span>
          Third child
        </div>
      );

      const stream = renderToReadableStream(element, mockContext);
      const chunks = await readStreamToCompletion(stream);

      expect(chunks).toHaveLength(1);
      expect(chunks[0]).toEqual({
        type: "intrinsic",
        name: "div",
        props: {},
        children: [
          { type: "text", content: "First child" },
          {
            type: "intrinsic",
            name: "span",
            props: {},
            children: [{ type: "text", content: "Second child" }],
          },
          { type: "text", content: "Third child" },
        ],
      });
    });

    it("should filter out null and undefined children", async () => {
      const element = <div>{["Valid text", null, undefined, "Another valid text", ""]}</div>;

      const stream = renderToReadableStream(element, mockContext);
      const chunks = await readStreamToCompletion(stream);

      expect(chunks).toHaveLength(1);
      expect(chunks[0]).toEqual({
        type: "intrinsic",
        name: "div",
        props: {},
        children: [
          { type: "text", content: "Valid text" },
          { type: "text", content: "Another valid text" },
        ],
      });
    });
  });

  describe("Function Component", () => {
    it("should render a basic function component", async () => {
      const TestComponent: FC<{ name: string }> = ({ name }) => <span>{`Hello ${name}`}</span>;

      const element = <TestComponent name="World" />;

      const stream = renderToReadableStream(element, mockContext);
      const chunks = await readStreamToCompletion(stream);

      expect(chunks).toHaveLength(1);
      expect(chunks[0]).toEqual({
        type: "intrinsic",
        name: "span",
        props: {},
        children: [{ type: "text", content: "Hello World" }],
      });
    });

    it("should handle nested function components", async () => {
      const InnerComponent: FC<{ text: string }> = ({ text }) => <span>{text}</span>;

      const OuterComponent: FC<{ message: string }> = ({ message }) => (
        <div>
          <InnerComponent text={message} />
        </div>
      );

      const element = <OuterComponent message="Hello from nested component" />;

      const stream = renderToReadableStream(element, mockContext);
      const chunks = await readStreamToCompletion(stream);

      expect(chunks).toHaveLength(1);
      expect(chunks[0]).toEqual({
        type: "intrinsic",
        name: "div",
        props: {},
        children: [
          {
            type: "intrinsic",
            name: "span",
            props: {},
            children: [{ type: "text", content: "Hello from nested component" }],
          },
        ],
      });
    });

    it("should handle FC returning another FC", async () => {
      const Button: FC<{ text: string; variant?: string }> = ({ text, variant = "primary" }) => (
        <button className={`btn btn-${variant}`}>{text}</button>
      );

      const ButtonWrapper: FC<{
        label: string;
        type?: string;
      }> = ({ label, type = "secondary" }) => <Button text={label} variant={type} />;

      const element = <ButtonWrapper label="Submit" type="primary" />;

      const stream = renderToReadableStream(element, mockContext);
      const chunks = await readStreamToCompletion(stream);

      expect(chunks).toHaveLength(1);
      expect(chunks[0]).toEqual({
        type: "intrinsic",
        name: "button",
        props: {
          className: "btn btn-primary",
        },
        children: [{ type: "text", content: "Submit" }],
      });
    });

    it("should handle FC returning conditional FC based on props", async () => {
      const PrimaryButton: FC<{ children: string }> = ({ children }) => (
        <button className="btn-primary">{children}</button>
      );

      const SecondaryButton: FC<{ children: string }> = ({ children }) => (
        <button className="btn-secondary">{children}</button>
      );

      const AdaptiveButton: FC<{
        isPrimary: boolean;
        text: string;
      }> = ({ isPrimary, text }) => {
        const Component = isPrimary ? PrimaryButton : SecondaryButton;
        return <Component>{text}</Component>;
      };

      // Test primary variant
      const primaryElement = <AdaptiveButton isPrimary={true} text="Primary Action" />;

      const stream = renderToReadableStream(primaryElement, mockContext);
      const chunks = await readStreamToCompletion(stream);

      expect(chunks).toHaveLength(1);
      expect(chunks[0]).toEqual({
        type: "intrinsic",
        name: "button",
        props: {
          className: "btn-primary",
        },
        children: [{ type: "text", content: "Primary Action" }],
      });
    });
  });

  describe("Conditional Rendering and Dynamic Behavior", () => {
    it("should handle component with conditional rendering based on props", async () => {
      const ConditionalComponent: FC<{
        type: "button" | "link";
        text: string;
        href?: string;
      }> = ({ type, text, href }) => {
        if (type === "button") {
          return <button>{text}</button>;
        }
        return <a href={href}>{text}</a>;
      };

      // Test button variant
      const buttonElement = <ConditionalComponent type="button" text="Click me" />;

      const stream1 = renderToReadableStream(buttonElement, mockContext);
      const chunks1 = await readStreamToCompletion(stream1);
      expect(chunks1).toHaveLength(1);
      const buttonResult = chunks1[0];

      expect(buttonResult).toEqual({
        type: "intrinsic",
        name: "button",
        props: {},
        children: [{ type: "text", content: "Click me" }],
      });

      // Test link variant
      const linkElement = <ConditionalComponent type="link" text="Go to page" href="/page" />;

      const stream2 = renderToReadableStream(linkElement, mockContext);
      const chunks2 = await readStreamToCompletion(stream2);
      expect(chunks2).toHaveLength(1);
      const linkResult = chunks2[0];

      expect(linkResult).toEqual({
        type: "intrinsic",
        name: "a",
        props: { href: "/page" },
        children: [{ type: "text", content: "Go to page" }],
      });
    });

    it("should handle component with different structures based on props", async () => {
      const StatusComponent: FC<{
        status: "loading" | "success" | "error";
        message?: string;
      }> = ({ status, message }) => {
        switch (status) {
          case "loading":
            return <div className="loading">Loading...</div>;
          case "success":
            return (
              <div className="success">
                <span>✓</span>
                {message || "Success"}
              </div>
            );
          case "error":
            return (
              <div className="error">
                <strong>{message || "Error occurred"}</strong>
              </div>
            );
        }
      };

      // Test success status
      const successElement = <StatusComponent status="success" message="Data saved" />;

      const stream = renderToReadableStream(successElement, mockContext);
      const chunks = await readStreamToCompletion(stream);
      expect(chunks).toHaveLength(1);
      const successResult = chunks[0];

      expect(successResult).toEqual({
        type: "intrinsic",
        name: "div",
        props: { className: "success" },
        children: [
          {
            type: "intrinsic",
            name: "span",
            props: {},
            children: [{ type: "text", content: "✓" }],
          },
          { type: "text", content: "Data saved" },
        ],
      });
    });

    it("should handle component with array children manipulation", async () => {
      const ListComponent: FC<{
        items: string[];
        ordered?: boolean;
      }> = ({ items, ordered = false }) => {
        const Tag = ordered ? "ol" : "ul";
        return (
          <Tag>
            {items.map((item) => (
              <li>{item}</li>
            ))}
          </Tag>
        );
      };

      const element = <ListComponent items={["Item 1", "Item 2", "Item 3"]} />;

      const stream = renderToReadableStream(element, mockContext);
      const chunks = await readStreamToCompletion(stream);

      expect(chunks).toHaveLength(1);
      expect(chunks[0]).toEqual({
        type: "intrinsic",
        name: "ul",
        props: {},
        children: [
          {
            type: "intrinsic",
            name: "li",
            props: {},
            children: [{ type: "text", content: "Item 1" }],
          },
          {
            type: "intrinsic",
            name: "li",
            props: {},
            children: [{ type: "text", content: "Item 2" }],
          },
          {
            type: "intrinsic",
            name: "li",
            props: {},
            children: [{ type: "text", content: "Item 3" }],
          },
        ],
      });
    });
  });

  describe("Render Functions and DisactElement Props", () => {
    it("should handle component with renderContent-like function props", async () => {
      const Modal: FC<{
        title: string;
        renderContent: () => DisactNode;
        renderFooter?: () => DisactNode;
      }> = ({ title, renderContent, renderFooter }) => (
        <div className="modal">
          <header>{title}</header>
          <main>{renderContent()}</main>
          {renderFooter ? <footer>{renderFooter()}</footer> : null}
        </div>
      );

      const element = (
        <Modal
          title="Confirmation"
          renderContent={() => "Are you sure you want to continue?"}
          renderFooter={() => <button>OK</button>}
        />
      );

      const stream = renderToReadableStream(element, mockContext);
      const chunks = await readStreamToCompletion(stream);

      expect(chunks).toHaveLength(1);
      expect(chunks[0]).toEqual({
        type: "intrinsic",
        name: "div",
        props: { className: "modal" },
        children: [
          {
            type: "intrinsic",
            name: "header",
            props: {},
            children: [{ type: "text", content: "Confirmation" }],
          },
          {
            type: "intrinsic",
            name: "main",
            props: {},
            children: [{ type: "text", content: "Are you sure you want to continue?" }],
          },
          {
            type: "intrinsic",
            name: "footer",
            props: {},
            children: [
              {
                type: "intrinsic",
                name: "button",
                props: {},
                children: [{ type: "text", content: "OK" }],
              },
            ],
          },
        ],
      });
    });

    it("should handle component with DisactElement as props", async () => {
      const Wrapper: FC<{
        prefix: DisactElement;
        suffix: DisactElement;
        children: string;
      }> = ({ prefix, suffix, children }) => (
        <div className="wrapper">
          {prefix}
          {children}
          {suffix}
        </div>
      );

      const prefixElement = <span className="prefix">→ </span>;

      const suffixElement = <span className="suffix"> ←</span>;

      const element = (
        <Wrapper prefix={prefixElement} suffix={suffixElement}>
          Main content
        </Wrapper>
      );

      const stream = renderToReadableStream(element, mockContext);
      const chunks = await readStreamToCompletion(stream);

      expect(chunks).toHaveLength(1);
      expect(chunks[0]).toEqual({
        type: "intrinsic",
        name: "div",
        props: { className: "wrapper" },
        children: [
          {
            type: "intrinsic",
            name: "span",
            props: { className: "prefix" },
            children: [{ type: "text", content: "→ " }],
          },
          { type: "text", content: "Main content" },
          {
            type: "intrinsic",
            name: "span",
            props: { className: "suffix" },
            children: [{ type: "text", content: " ←" }],
          },
        ],
      });
    });

    it("should handle component with function component as props", async () => {
      const IconComponent: FC<{ name: string }> = ({ name }) => <i className={`icon-${name}`}></i>;

      const Button: FC<{
        icon: DisactElement;
        text: string;
        variant?: string;
      }> = ({ icon, text, variant = "default" }) => (
        <button className={`btn btn-${variant}`}>
          {icon} {text}
        </button>
      );

      const iconElement = <IconComponent name="save" />;

      const element = <Button icon={iconElement} text="Save Document" variant="primary" />;

      const stream = renderToReadableStream(element, mockContext);
      const chunks = await readStreamToCompletion(stream);

      expect(chunks).toHaveLength(1);
      expect(chunks[0]).toEqual({
        type: "intrinsic",
        name: "button",
        props: { className: "btn btn-primary" },
        children: [
          {
            type: "intrinsic",
            name: "i",
            props: { className: "icon-save" },
            children: null,
          },
          { type: "text", content: " " },
          { type: "text", content: "Save Document" },
        ],
      });
    });
  });

  describe("Fragment Pattern", () => {
    it("should handle Fragment as children in intrinsic element", async () => {
      const containerElement = (
        <div className="container">
          <Fragment>
            <h2>Title</h2>
            <p>Content goes here</p>
            <button>Action</button>
          </Fragment>
        </div>
      );

      const stream = renderToReadableStream(containerElement, mockContext);
      const chunks = await readStreamToCompletion(stream);
      expect(chunks).toHaveLength(1);
      const result = chunks[0];

      expect(result).toEqual({
        type: "intrinsic",
        name: "div",
        props: { className: "container" },
        children: [
          {
            type: "intrinsic",
            name: "h2",
            props: {},
            children: [{ type: "text", content: "Title" }],
          },
          {
            type: "intrinsic",
            name: "p",
            props: {},
            children: [{ type: "text", content: "Content goes here" }],
          },
          {
            type: "intrinsic",
            name: "button",
            props: {},
            children: [{ type: "text", content: "Action" }],
          },
        ],
      });
    });

    it("should handle nested Fragment pattern", async () => {
      const Fragment = ({ children }: { children: DisactElement[] }): DisactNode => children;

      const containerElement = (
        <article>
          <Fragment>
            <header>
              <Fragment>
                <h1>Main Title</h1>
                <p>Subtitle</p>
              </Fragment>
            </header>
            <main>Main content</main>
          </Fragment>
        </article>
      );

      const stream = renderToReadableStream(containerElement, mockContext);
      const chunks = await readStreamToCompletion(stream);
      expect(chunks).toHaveLength(1);
      const result = chunks[0];

      expect(result).toEqual({
        type: "intrinsic",
        name: "article",
        props: {},
        children: [
          {
            type: "intrinsic",
            name: "header",
            props: {},
            children: [
              {
                type: "intrinsic",
                name: "h1",
                props: {},
                children: [{ type: "text", content: "Main Title" }],
              },
              {
                type: "intrinsic",
                name: "p",
                props: {},
                children: [{ type: "text", content: "Subtitle" }],
              },
            ],
          },
          {
            type: "intrinsic",
            name: "main",
            props: {},
            children: [{ type: "text", content: "Main content" }],
          },
        ],
      });
    });
  });

  describe("HOC (Higher-Order Component) Pattern", () => {
    it("should handle HOC with styling and container wrapping", async () => {
      // Base component
      const Button: FC<{
        children: string;
        onClick?: () => void;
      }> = ({ children }) => <button>{children}</button>;

      // HOC that adds styling
      const withStyling = <P extends PropsBase>(Component: FC<P>, className: string): FC<P> => {
        return (props: P) => {
          const element = Component(props);
          if (element && typeof element === "object" && "type" in element) {
            if (element.type === "intrinsic") {
              return {
                ...element,
                props: {
                  ...element.props,
                  className,
                },
              };
            }
          }
          return element;
        };
      };

      // HOC that wraps with container
      const withContainer = <P extends PropsBase>(Component: FC<P>): FC<P> => {
        return (props: P) => <div className="container">{Component(props)}</div>;
      };

      // Apply HOCs
      const StyledButton = withStyling(Button, "btn btn-primary");
      const ContainerButton = withContainer(StyledButton);

      const element = <ContainerButton>Click me</ContainerButton>;

      const stream = renderToReadableStream(element, mockContext);
      const chunks = await readStreamToCompletion(stream);

      expect(chunks).toHaveLength(1);
      expect(chunks[0]).toEqual({
        type: "intrinsic",
        name: "div",
        props: { className: "container" },
        children: [
          {
            type: "intrinsic",
            name: "button",
            props: { className: "btn btn-primary" },
            children: [{ type: "text", content: "Click me" }],
          },
        ],
      });
    });

    it("should handle HOC with props transformation and validation", async () => {
      // Base input component
      const Input: FC<{
        value: string;
        placeholder?: string;
      }> = ({ value, placeholder }) => <input value={value} placeholder={placeholder} />;

      // HOC that adds validation
      const withValidation = <P extends { value: string }>(
        Component: FC<P>,
      ): FC<P & { required?: boolean }> => {
        return ({ required = false, ...props }) => {
          const baseElement = Component(props as P);

          if (required && (!props.value || props.value.trim() === "")) {
            return (
              <div className="field-error">
                {baseElement}
                <span className="error-message">This field is required</span>
              </div>
            );
          }

          return baseElement;
        };
      };

      const ValidatedInput = withValidation(Input);

      // Test with validation error
      const errorElement = (
        <ValidatedInput value="" placeholder="Enter your name" required={true} />
      );

      const stream = renderToReadableStream(errorElement, mockContext);
      const chunks = await readStreamToCompletion(stream);
      expect(chunks).toHaveLength(1);
      const errorResult = chunks[0];

      expect(errorResult).toEqual({
        type: "intrinsic",
        name: "div",
        props: { className: "field-error" },
        children: [
          {
            type: "intrinsic",
            name: "input",
            props: { value: "", placeholder: "Enter your name" },
            children: null,
          },
          {
            type: "intrinsic",
            name: "span",
            props: { className: "error-message" },
            children: [{ type: "text", content: "This field is required" }],
          },
        ],
      });
    });
  });

  describe("Error Handling", () => {
    it("should handle function component returning null", async () => {
      const NullComponent: FC = () => null;

      const element = <NullComponent />;

      const stream = renderToReadableStream(element, mockContext);

      const results = await readStreamToCompletion(stream);
      expect(results).toEqual([null]);
    });

    it("should handle function component returning array", async () => {
      const ArrayComponent: FC = () => ["item1", "item2"];

      const element = <ArrayComponent />;

      const stream = renderToReadableStream(element, mockContext);

      const results = await readStreamToCompletion(stream);
      expect(results).toEqual([
        [
          { type: "text", content: "item1" },
          { type: "text", content: "item2" },
        ],
      ]);
    });

    it("should handle Fragment pattern at root level", async () => {
      const fragmentElement = (
        <Fragment>
          <p>First paragraph</p>
          <p>Second paragraph</p>
        </Fragment>
      );

      // Fragment returns array, which is now allowed
      const stream = renderToReadableStream(fragmentElement, mockContext);

      const results = await readStreamToCompletion(stream);
      expect(results).toEqual([
        [
          {
            type: "intrinsic",
            name: "p",
            props: {},
            children: [{ type: "text", content: "First paragraph" }],
          },
          {
            type: "intrinsic",
            name: "p",
            props: {},
            children: [{ type: "text", content: "Second paragraph" }],
          },
        ],
      ]);
    });
  });

  describe("Suspense機能", () => {
    it("should render Suspense with fallback when child uses Promise", async () => {
      const { promise, resolve } = Promise.withResolvers<string>();

      const AsyncComponent: FC = () => {
        const result = use(promise);
        return result;
      };

      const element = Suspense({
        fallback: "Loading...",
        children: <AsyncComponent />,
      });

      const stream = renderToReadableStream(element, mockContext);
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

      const element = Suspense({
        fallback: "Loading...",
        children: <NormalComponent />,
      });

      const stream = renderToReadableStream(element, mockContext);
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

      const element = Suspense({
        fallback: "Loading...",
        children: <ErrorComponent />,
      });

      const stream = renderToReadableStream(element, mockContext);

      // エラーが投げられた場合はストリームエラーになる
      await expect(readStreamToCompletion(stream)).rejects.toThrow("Test error");
    });

    it("should handle Suspense as non-root element", async () => {
      const { promise, resolve } = Promise.withResolvers<string>();

      const AsyncComponent: FC = () => {
        const result = use(promise);
        return result;
      };

      const suspenseElement = Suspense({
        fallback: "Loading async...",
        children: <AsyncComponent />,
      });

      const element = (
        <div className="container">
          Before Suspense
          {suspenseElement}
          After Suspense
        </div>
      );

      const stream = renderToReadableStream(element, mockContext);
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

      const element = Suspense({
        fallback: "Loading grandchild...",
        children: <Child />,
      });

      const stream = renderToReadableStream(element, mockContext);
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

      const stream = renderToReadableStream(element, mockContext);
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

      const element = Suspense({
        fallback: "Loading...",
        children: <AsyncComponent />,
      });

      const stream = renderToReadableStream(element, mockContext);
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

      const element = Suspense({
        fallback: "Loading...",
        children: <AsyncComponent />,
      });

      const stream = renderToReadableStream(element, mockContext);

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

      const stream = renderToReadableStream(<App />, mockContext);

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

      const stream = renderToReadableStream(<App />, mockContext);
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

      const stream = renderToReadableStream(<App />, mockContext);
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

      const stream = renderToReadableStream(<App />, mockContext);
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

      const stream = renderToReadableStream(<App />, mockContext);
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
  });

  describe("ネストしたSuspense機能", () => {
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

      const element = Suspense({
        fallback: "Outer loading...",
        children: <MiddleComponent />,
      });

      const stream = renderToReadableStream(element, mockContext);
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

      const element = Suspense({
        fallback: "Outer loading...",
        children: <OuterAsyncComponent />,
      });

      const stream = renderToReadableStream(element, mockContext);
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

      const element = Suspense({
        fallback: "Outer loading...",
        children: <OuterAsyncComponent />,
      });

      const stream = renderToReadableStream(element, mockContext);
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

      const element = Suspense({
        fallback: "Outer loading...",
        children: <OuterAsyncComponent />,
      });

      const stream = renderToReadableStream(element, mockContext);
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

  describe("Context参照機能", () => {
    it("should provide access to context during component rendering", async () => {
      const { getCurrentContext } = await import("./context");

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
      const { getCurrentContext } = await import("./context");

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
      const { getCurrentContext } = await import("./context");
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
      const { getCurrentContext } = await import("./context");

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

      const stream = renderToReadableStream(element, mockContext);
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

      const stream = renderToReadableStream(element, mockContext);

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

      const stream = renderToReadableStream(element, mockContext);
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

      const stream = renderToReadableStream(element, mockContext);
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

      const stream = renderToReadableStream(element, mockContext);
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

      const stream = renderToReadableStream(element, mockContext);
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

      const stream = renderToReadableStream(element, mockContext);
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

      const stream = renderToReadableStream(element, mockContext);
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

      const stream = renderToReadableStream(element, mockContext);
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

      const stream = renderToReadableStream(element, mockContext);
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

      const stream = renderToReadableStream(element, mockContext);
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

  describe("Lifecycle Hooks", () => {
    it("should call preRender and postRender hooks for simple render", async () => {
      const preRenderCalls: number[] = [];
      const postRenderCalls: number[] = [];
      const postRenderCycleCalls: number[] = [];

      const element = <div>Hello</div>;

      const stream = renderToReadableStream(element, mockContext, {
        preRender: async () => {
          preRenderCalls.push(Date.now());
        },
        postRender: async () => {
          postRenderCalls.push(Date.now());
        },
        postRenderCycle: async () => {
          postRenderCycleCalls.push(Date.now());
        },
      });

      await readStreamToCompletion(stream);

      expect(preRenderCalls).toHaveLength(1);
      expect(postRenderCalls).toHaveLength(1);
      expect(postRenderCycleCalls).toHaveLength(1);
    });

    it("should call hooks in correct order: preRender -> postRender -> postRenderCycle", async () => {
      const callOrder: string[] = [];

      const element = <div>Test</div>;

      const stream = renderToReadableStream(element, mockContext, {
        preRender: async () => {
          callOrder.push("preRender");
        },
        postRender: async () => {
          callOrder.push("postRender");
        },
        postRenderCycle: async () => {
          callOrder.push("postRenderCycle");
        },
      });

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

      const stream = renderToReadableStream(element, mockContext, {
        preRender: async () => {
          preRenderCalls.push(Date.now());
        },
        postRender: async () => {
          postRenderCalls.push(Date.now());
        },
        postRenderCycle: async () => {
          postRenderCycleCalls.push(Date.now());
        },
      });

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

      const stream = renderToReadableStream(element, mockContext, {
        preRender: async () => {
          callOrder.push("preRender");
        },
        postRender: async () => {
          callOrder.push("postRender");
        },
        postRenderCycle: async () => {
          callOrder.push("postRenderCycle");
        },
      });

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

      const stream = renderToReadableStream(element, mockContext, {
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
      });

      await readStreamToCompletion(stream);

      expect(executionLog).toEqual([
        "preRender completed",
        "postRender completed",
        "postRenderCycle completed",
      ]);
    });

    it("should work without any hooks provided", async () => {
      const element = <div>Test</div>;

      const stream = renderToReadableStream(element, mockContext);
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

      const stream = renderToReadableStream(element, mockContext, {
        preRender: async () => {
          preRenderCalls.push(1);
        },
        // postRender and postRenderCycle are not provided
      });

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

      const stream = renderToReadableStream(element, mockContext, {
        preRender: async () => {
          renderStates.push("preRender");
        },
        postRender: async () => {
          renderStates.push("postRender");
        },
      });

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
});
