import { describe, expect, it } from "vitest";
import type {
  DisactElement,
  DisactNode,
  FunctionComponent,
  IntrinsicElementName,
  PropsBase,
  RenderedElement,
} from "./element";
import { use } from "./jsx";
import { renderToReadableStream } from "./render";

/**
 * preactのh関数のようなヘルパー関数
 * テストでの要素作成を簡単にするために使用
 */
function h(
  type: IntrinsicElementName,
  props?: Omit<PropsBase, "children"> | null,
  children?: DisactNode | DisactNode[],
): DisactElement;
function h<P extends PropsBase>(
  type: FunctionComponent<P>,
  props: Omit<P, "children">,
  children?: DisactNode | DisactNode[],
): DisactElement;
function h(
  type: IntrinsicElementName | FunctionComponent,
  props?: Omit<PropsBase, "children"> | null,
  children?: DisactNode | DisactNode[],
): DisactElement {
  const actualProps = props || {};

  const mergedProps = {
    ...actualProps,
    children,
  };

  if (typeof type === "string") {
    return {
      type: "intrinsic",
      name: type,
      props: mergedProps,
    };
  } else {
    return {
      type: "function",
      fc: type,
      props: mergedProps,
    };
  }
}

/**
 * Suspense要素を作成するヘルパー関数
 */
function Suspense(props: {
  fallback: DisactNode;
  children: DisactNode;
}): DisactElement {
  return {
    type: "suspense",
    props,
  };
}

/**
 * Fragment相当のヘルパー関数
 */
function Fragment(props: { children: DisactNode }): DisactNode {
  return props.children;
}

describe("renderToReadableStream", () => {
  const mockContext = { theme: "dark" };

  // ストリームから結果を読み取るヘルパー関数
  const readStreamToCompletion = async (
    stream: ReadableStream,
  ): Promise<RenderedElement[]> => {
    const reader = stream.getReader();
    const chunks: RenderedElement[] = [];

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
      const element = h("div", null, "Hello World");

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
      const element = h(
        "button",
        {
          disabled: true,
          className: "primary",
        },
        "Click me",
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
      const element = h("div", null, h("span", null, "Nested content"));

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
      const element = h("div", null, [
        "First child",
        h("span", null, "Second child"),
        "Third child",
      ]);

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
      const element = h("div", null, [
        "Valid text",
        null,
        undefined,
        "Another valid text",
        "",
      ]);

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
      const TestComponent: FunctionComponent<{ name: string }> = ({ name }) =>
        h("span", null, `Hello ${name}`);

      const element = h(TestComponent, { name: "World" });

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
      const InnerComponent: FunctionComponent<{ text: string }> = ({ text }) =>
        h("span", null, text);

      const OuterComponent: FunctionComponent<{ message: string }> = ({
        message,
      }) => h("div", null, h(InnerComponent, { text: message }));

      const element = h(OuterComponent, {
        message: "Hello from nested component",
      });

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
            children: [
              { type: "text", content: "Hello from nested component" },
            ],
          },
        ],
      });
    });

    it("should handle FC returning another FC", async () => {
      const Button: FunctionComponent<{ text: string; variant?: string }> = ({
        text,
        variant = "primary",
      }) =>
        h(
          "button",
          {
            className: `btn btn-${variant}`,
          },
          text,
        );

      const ButtonWrapper: FunctionComponent<{
        label: string;
        type?: string;
      }> = ({ label, type = "secondary" }) =>
        h(Button, {
          text: label,
          variant: type,
        });

      const element = h(ButtonWrapper, {
        label: "Submit",
        type: "primary",
      });

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
      const PrimaryButton: FunctionComponent<{ children: string }> = ({
        children,
      }) =>
        h(
          "button",
          {
            className: "btn-primary",
          },
          children,
        );

      const SecondaryButton: FunctionComponent<{ children: string }> = ({
        children,
      }) =>
        h(
          "button",
          {
            className: "btn-secondary",
          },
          children,
        );

      const AdaptiveButton: FunctionComponent<{
        isPrimary: boolean;
        text: string;
      }> = ({ isPrimary, text }) =>
        h(isPrimary ? PrimaryButton : SecondaryButton, {}, text);

      // Test primary variant
      const primaryElement = h(AdaptiveButton, {
        isPrimary: true,
        text: "Primary Action",
      });

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
      const ConditionalComponent: FunctionComponent<{
        type: "button" | "link";
        text: string;
        href?: string;
      }> = ({ type, text, href }) => {
        if (type === "button") {
          return h("button", null, text);
        }
        return h("a", { href }, text);
      };

      // Test button variant
      const buttonElement = h(ConditionalComponent, {
        type: "button",
        text: "Click me",
      });

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
      const linkElement = h(ConditionalComponent, {
        type: "link",
        text: "Go to page",
        href: "/page",
      });

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
      const StatusComponent: FunctionComponent<{
        status: "loading" | "success" | "error";
        message?: string;
      }> = ({ status, message }) => {
        switch (status) {
          case "loading":
            return h(
              "div",
              {
                className: "loading",
              },
              "Loading...",
            );
          case "success":
            return h(
              "div",
              {
                className: "success",
              },
              [h("span", null, "✓"), message || "Success"],
            );
          case "error":
            return h(
              "div",
              {
                className: "error",
              },
              h("strong", null, message || "Error occurred"),
            );
        }
      };

      // Test success status
      const successElement = h(StatusComponent, {
        status: "success",
        message: "Data saved",
      });

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
      const ListComponent: FunctionComponent<{
        items: string[];
        ordered?: boolean;
      }> = ({ items, ordered = false }) =>
        h(
          ordered ? "ol" : "ul",
          null,
          items.map((item) => h("li", null, item)),
        );

      const element = h(ListComponent, {
        items: ["Item 1", "Item 2", "Item 3"],
      });

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
      const Modal: FunctionComponent<{
        title: string;
        renderContent: () => DisactNode;
        renderFooter?: () => DisactNode;
      }> = ({ title, renderContent, renderFooter }) =>
        h(
          "div",
          {
            className: "modal",
          },
          [
            h("header", null, title),
            h("main", null, renderContent()),
            renderFooter ? h("footer", null, renderFooter()) : null,
          ],
        );

      const element = h(Modal, {
        title: "Confirmation",
        renderContent: () => "Are you sure you want to continue?",
        renderFooter: () => h("button", null, "OK"),
      });

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
            children: [
              { type: "text", content: "Are you sure you want to continue?" },
            ],
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
      const Wrapper: FunctionComponent<{
        prefix: DisactElement;
        suffix: DisactElement;
        children: string;
      }> = ({ prefix, suffix, children }) =>
        h(
          "div",
          {
            className: "wrapper",
          },
          [prefix, children, suffix],
        );

      const prefixElement = h(
        "span",
        {
          className: "prefix",
        },
        "→ ",
      );

      const suffixElement = h(
        "span",
        {
          className: "suffix",
        },
        " ←",
      );

      const element = h(
        Wrapper,
        {
          prefix: prefixElement,
          suffix: suffixElement,
        },
        "Main content",
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
      const IconComponent: FunctionComponent<{ name: string }> = ({ name }) =>
        h(
          "i",
          {
            className: `icon-${name}`,
          },
          "",
        );

      const Button: FunctionComponent<{
        icon: DisactElement;
        text: string;
        variant?: string;
      }> = ({ icon, text, variant = "default" }) =>
        h(
          "button",
          {
            className: `btn btn-${variant}`,
          },
          [icon, " ", text],
        );

      const iconElement = h(IconComponent, { name: "save" });

      const element = h(Button, {
        icon: iconElement,
        text: "Save Document",
        variant: "primary",
      });

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
      const containerElement = h(
        "div",
        {
          className: "container",
        },
        h(Fragment, {}, [
          h("h2", null, "Title"),
          h("p", null, "Content goes here"),
          h("button", null, "Action"),
        ]),
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
      const Fragment = ({
        children,
      }: {
        children: DisactElement[];
      }): DisactNode => children;

      const containerElement = h(
        "article",
        null,
        h(Fragment, {}, [
          h(
            "header",
            null,
            h(Fragment, {}, [
              h("h1", null, "Main Title"),
              h("p", null, "Subtitle"),
            ]),
          ),
          h("main", null, "Main content"),
        ]),
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
      const Button: FunctionComponent<{
        children: string;
        onClick?: () => void;
      }> = ({ children }) => h("button", null, children);

      // HOC that adds styling
      const withStyling = <P extends PropsBase>(
        Component: FunctionComponent<P>,
        className: string,
      ): FunctionComponent<P> => {
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
      const withContainer = <P extends PropsBase>(
        Component: FunctionComponent<P>,
      ): FunctionComponent<P> => {
        return (props: P) =>
          h(
            "div",
            {
              className: "container",
            },
            Component(props),
          );
      };

      // Apply HOCs
      const StyledButton = withStyling(Button, "btn btn-primary");
      const ContainerButton = withContainer(StyledButton);

      const element = h(ContainerButton, {}, "Click me");

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
      const Input: FunctionComponent<{
        value: string;
        placeholder?: string;
      }> = ({ value, placeholder }) => h("input", { value, placeholder });

      // HOC that adds validation
      const withValidation = <P extends { value: string }>(
        Component: FunctionComponent<P>,
      ): FunctionComponent<P & { required?: boolean }> => {
        return ({ required = false, ...props }) => {
          const baseElement = Component(props as P);

          if (required && (!props.value || props.value.trim() === "")) {
            return h(
              "div",
              {
                className: "field-error",
              },
              [
                baseElement,
                h(
                  "span",
                  {
                    className: "error-message",
                  },
                  "This field is required",
                ),
              ],
            );
          }

          return baseElement;
        };
      };

      const ValidatedInput = withValidation(Input);

      // Test with validation error
      const errorElement = h(ValidatedInput, {
        value: "",
        placeholder: "Enter your name",
        required: true,
      });

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
      const NullComponent: FunctionComponent = () => null;

      const element = h(NullComponent, {});

      const stream = renderToReadableStream(element, mockContext);

      await expect(readStreamToCompletion(stream)).rejects.toThrow(
        "Root element cannot be null",
      );
    });

    it("should handle function component returning array", async () => {
      const ArrayComponent: FunctionComponent = () => ["item1", "item2"];

      const element = h(ArrayComponent, {});

      const stream = renderToReadableStream(element, mockContext);

      await expect(readStreamToCompletion(stream)).rejects.toThrow(
        "Root element cannot be an array",
      );
    });

    it("should handle Fragment pattern at root level", async () => {
      const fragmentElement = h(Fragment, {}, [
        h("p", null, "First paragraph"),
        h("p", null, "Second paragraph"),
      ]);

      // Fragment returns array, so stream should throw
      const stream = renderToReadableStream(fragmentElement, mockContext);

      await expect(readStreamToCompletion(stream)).rejects.toThrow(
        "Root element cannot be an array",
      );
    });
  });

  describe("同期レンダリング", () => {
    it("should render a simple text element and stream the result", async () => {
      const element = h("div", null, "Hello World");

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

    it("should render function components and stream the result", async () => {
      const TestComponent: FunctionComponent<{ name: string }> = ({ name }) =>
        h("span", null, `Hello ${name}`);

      const element = h(TestComponent, { name: "World" });

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

    it("should handle complex nested structures", async () => {
      const element = h("div", null, [
        "First child",
        h("span", null, "Second child"),
        "Third child",
      ]);

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
  });

  describe("Suspense機能", () => {
    it("should render Suspense with fallback when child uses Promise", async () => {
      const { promise, resolve } = Promise.withResolvers<string>();

      const AsyncComponent: FunctionComponent = () => {
        const result = use(promise);
        return result;
      };

      const element = Suspense({
        fallback: "Loading...",
        children: h(AsyncComponent, {}),
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
      const NormalComponent: FunctionComponent = () =>
        h("div", null, "Normal content");

      const element = Suspense({
        fallback: "Loading...",
        children: h(NormalComponent, {}),
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

      const ErrorComponent: FunctionComponent = () => {
        throw error;
      };

      const element = Suspense({
        fallback: "Loading...",
        children: h(ErrorComponent, {}),
      });

      const stream = renderToReadableStream(element, mockContext);

      // エラーが投げられた場合はストリームエラーになる
      await expect(readStreamToCompletion(stream)).rejects.toThrow(
        "Test error",
      );
    });

    it("should handle Suspense as non-root element", async () => {
      const { promise, resolve } = Promise.withResolvers<string>();

      const AsyncComponent: FunctionComponent = () => {
        const result = use(promise);
        return result;
      };

      const suspenseElement = Suspense({
        fallback: "Loading async...",
        children: h(AsyncComponent, {}),
      });

      const element = h(
        "div",
        {
          className: "container",
        },
        ["Before Suspense", suspenseElement, "After Suspense"],
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

      const GrandChild: FunctionComponent = () => {
        const result = use(promise);
        return result;
      };

      const Child: FunctionComponent = () =>
        h("span", null, [
          "Child prefix: ",
          h(GrandChild, {}),
          " - Child suffix",
        ]);

      const element = Suspense({
        fallback: "Loading grandchild...",
        children: h(Child, {}),
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
      const { promise: promise1, resolve: resolve1 } =
        Promise.withResolvers<string>();
      const { promise: promise2, resolve: resolve2 } =
        Promise.withResolvers<string>();

      const AsyncComponent1: FunctionComponent = () => {
        const result = use(promise1);
        return result;
      };

      const AsyncComponent2: FunctionComponent = () => {
        const result = use(promise2);
        return result;
      };

      const element = h("div", null, [
        Suspense({
          fallback: "Loading 1...",
          children: h(AsyncComponent1, {}),
        }),
        " and ",
        Suspense({
          fallback: "Loading 2...",
          children: h(AsyncComponent2, {}),
        }),
      ]);

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

      const AsyncComponent: FunctionComponent = () => {
        const result = use(resolvedPromise);
        return result;
      };

      const element = Suspense({
        fallback: "Loading...",
        children: h(AsyncComponent, {}),
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

      const AsyncComponent: FunctionComponent = () => {
        const result = use(rejectedPromise);
        return result;
      };

      const element = Suspense({
        fallback: "Loading...",
        children: h(AsyncComponent, {}),
      });

      const stream = renderToReadableStream(element, mockContext);

      // 拒否されたPromiseの場合はエラーがストリームに伝播される
      await expect(readStreamToCompletion(stream)).rejects.toThrow(
        "Promise rejected",
      );
    });

    it("should handle parallel Suspense boundaries", async () => {
      const { promise: promise1, resolve: resolve1 } =
        Promise.withResolvers<string>();
      const { promise: promise2, resolve: resolve2 } =
        Promise.withResolvers<string>();

      const AsyncComponent1: FunctionComponent = () => {
        const result = use(promise1);
        return `First: ${result}`;
      };

      const AsyncComponent2: FunctionComponent = () => {
        const result = use(promise2);
        return `Second: ${result}`;
      };

      const App: FunctionComponent = () =>
        h("div", null, [
          Suspense({
            fallback: "Loading first...",
            children: h(AsyncComponent1, {}),
          }),
          " | ",
          Suspense({
            fallback: "Loading second...",
            children: h(AsyncComponent2, {}),
          }),
        ]);

      // Promiseを事前に解決
      resolve1("Data A");
      resolve2("Data B");

      const stream = renderToReadableStream(h(App, {}), mockContext);

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
      const { promise: promise1, resolve: resolve1 } =
        Promise.withResolvers<string>();
      const { promise: promise2, resolve: resolve2 } =
        Promise.withResolvers<string>();

      const AsyncComponent1: FunctionComponent = () => {
        const result = use(promise1);
        return `First: ${result}`;
      };

      const AsyncComponent2: FunctionComponent = () => {
        const result = use(promise2);
        return `Second: ${result}`;
      };

      const App: FunctionComponent = () => ({
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

      const stream = renderToReadableStream(h(App, {}), mockContext);
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
      const { promise: fastPromise, resolve: resolveFast } =
        Promise.withResolvers<string>();
      const { promise: slowPromise, resolve: resolveSlow } =
        Promise.withResolvers<string>();

      const FastComponent: FunctionComponent = () => {
        const result = use(fastPromise);
        return `Fast: ${result}`;
      };

      const SlowComponent: FunctionComponent = () => {
        const result = use(slowPromise);
        return `Slow: ${result}`;
      };

      const App: FunctionComponent = () =>
        h("section", null, [
          h(
            "div",
            null,
            Suspense({
              fallback: "Fast loading...",
              children: h(FastComponent, {}),
            }),
          ),
          h(
            "div",
            null,
            Suspense({
              fallback: "Slow loading...",
              children: h(SlowComponent, {}),
            }),
          ),
        ]);

      const stream = renderToReadableStream(h(App, {}), mockContext);
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
      const { promise: sharedPromise, resolve: resolveShared } =
        Promise.withResolvers<string>();

      const AsyncComponent1: FunctionComponent = () => {
        const result = use(sharedPromise);
        return `Component1: ${result}`;
      };

      const AsyncComponent2: FunctionComponent = () => {
        const result = use(sharedPromise);
        return `Component2: ${result}`;
      };

      const App: FunctionComponent = () =>
        h("main", null, [
          Suspense({
            fallback: "Loading component 1...",
            children: h(AsyncComponent1, {}),
          }),
          " and ",
          Suspense({
            fallback: "Loading component 2...",
            children: h(AsyncComponent2, {}),
          }),
        ]);

      const stream = renderToReadableStream(h(App, {}), mockContext);
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
      const { promise: sharedPromise, resolve: resolveShared } =
        Promise.withResolvers<string>();
      const { promise: uniquePromise, resolve: resolveUnique } =
        Promise.withResolvers<string>();

      const SharedComponent1: FunctionComponent = () => {
        const result = use(sharedPromise);
        return `Shared1: ${result}`;
      };

      const SharedComponent2: FunctionComponent = () => {
        const result = use(sharedPromise);
        return `Shared2: ${result}`;
      };

      const UniqueComponent: FunctionComponent = () => {
        const result = use(uniquePromise);
        return `Unique: ${result}`;
      };

      const App: FunctionComponent = () =>
        h("container", null, [
          Suspense({
            fallback: "Loading shared 1...",
            children: h(SharedComponent1, {}),
          }),
          " | ",
          Suspense({
            fallback: "Loading shared 2...",
            children: h(SharedComponent2, {}),
          }),
          " | ",
          Suspense({
            fallback: "Loading unique...",
            children: h(UniqueComponent, {}),
          }),
        ]);

      const stream = renderToReadableStream(h(App, {}), mockContext);
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
      const { promise: innerPromise, resolve: resolveInner } =
        Promise.withResolvers<string>();

      const InnerAsyncComponent: FunctionComponent = () => {
        const result = use(innerPromise);
        return result;
      };

      const MiddleComponent: FunctionComponent = () =>
        h("div", { className: "middle" }, [
          "Middle start - ",
          Suspense({
            fallback: "Inner loading...",
            children: h(InnerAsyncComponent, {}),
          }),
          " - Middle end",
        ]);

      const element = Suspense({
        fallback: "Outer loading...",
        children: h(MiddleComponent, {}),
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
      const { promise: outerPromise, resolve: resolveOuter } =
        Promise.withResolvers<string>();

      const OuterAsyncComponent: FunctionComponent = () => {
        const result = use(outerPromise);
        return h("section", { className: "outer" }, [
          "Outer content: ",
          result,
          " - ",
          Suspense({
            fallback: "Inner loading...",
            children: h("span", null, "Inner sync content"),
          }),
        ]);
      };

      const element = Suspense({
        fallback: "Outer loading...",
        children: h(OuterAsyncComponent, {}),
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
      const { promise: outerPromise, resolve: resolveOuter } =
        Promise.withResolvers<string>();
      const { promise: innerPromise, resolve: resolveInner } =
        Promise.withResolvers<string>();

      const InnerAsyncComponent: FunctionComponent = () => {
        const result = use(innerPromise);
        return `Inner: ${result}`;
      };

      const OuterAsyncComponent: FunctionComponent = () => {
        const result = use(outerPromise);
        return h("article", { className: "outer-async" }, [
          `Outer: ${result}`,
          " | ",
          Suspense({
            fallback: "Inner loading...",
            children: h(InnerAsyncComponent, {}),
          }),
        ]);
      };

      const element = Suspense({
        fallback: "Outer loading...",
        children: h(OuterAsyncComponent, {}),
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
      const { promise: outerPromise, resolve: resolveOuter } =
        Promise.withResolvers<string>();
      const { promise: innerPromise, resolve: resolveInner } =
        Promise.withResolvers<string>();

      const InnerAsyncComponent: FunctionComponent = () => {
        const result = use(innerPromise);
        return `Inner: ${result}`;
      };

      const OuterAsyncComponent: FunctionComponent = () => {
        const result = use(outerPromise);
        return h("section", { className: "outer-resolved" }, [
          `Outer: ${result}`,
          " | ",
          Suspense({
            fallback: "Inner loading...",
            children: h(InnerAsyncComponent, {}),
          }),
        ]);
      };

      const element = Suspense({
        fallback: "Outer loading...",
        children: h(OuterAsyncComponent, {}),
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
      const timeoutPromise = new Promise(resolve => setTimeout(() => resolve("timeout"), 50));
      const secondChunkPromise = reader.read().then(chunk => ({ type: "chunk", chunk }));

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
      const { getCurrentContext } = await import("./context-manager");

      interface TestContext {
        theme: string;
        userId: number;
      }

      const testContext: TestContext = { theme: "dark", userId: 123 };

      const ContextAwareComponent: FunctionComponent = () => {
        const ctx = getCurrentContext<TestContext>();
        return h("div", null, `Theme: ${ctx.theme}, User: ${ctx.userId}`);
      };

      const element = h(ContextAwareComponent, {});

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
      const { getCurrentContext } = await import("./context-manager");

      const testContext = { message: "Hello from context!" };

      const NestedComponent: FunctionComponent = () => {
        const ctx = getCurrentContext<typeof testContext>();
        return h("span", null, ctx.message);
      };

      const WrapperComponent: FunctionComponent = () =>
        h("div", null, [
          "Wrapper start - ",
          h(NestedComponent, {}),
          " - Wrapper end",
        ]);

      const element = h(WrapperComponent, {});

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
      const { getCurrentContext } = await import("./context-manager");
      const { promise, resolve } = Promise.withResolvers<string>();

      const testContext = { prefix: "Context:" };

      const AsyncComponent: FunctionComponent = () => {
        const ctx = getCurrentContext<typeof testContext>();
        const result = use(promise);
        return h("span", null, `${ctx.prefix} ${result}`);
      };

      const element = Suspense({
        fallback: "Loading...",
        children: h(AsyncComponent, {}),
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
      const { getCurrentContext } = await import("./context-manager");

      const testContext = { value: "test" };

      const TestComponent: FunctionComponent = () => {
        const ctx = getCurrentContext<typeof testContext>();
        return h("div", null, ctx.value);
      };

      const element = h(TestComponent, {});

      const stream = renderToReadableStream(element, testContext);
      await readStreamToCompletion(stream);

      // レンダリング完了後はcontextにアクセスできない
      expect(() => getCurrentContext()).toThrow(
        "getCurrentContext can only be called during rendering"
      );
    });
  });
});
