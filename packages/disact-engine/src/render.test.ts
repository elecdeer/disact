import { describe, expect, it } from "vitest";
import type {
  DisactElement,
  DisactNode,
  FunctionComponent,
  IntrinsicElement,
  PropsBase,
} from "./element";
import { use } from "./jsx";
import { renderRoot, renderToReadableStream } from "./render";

describe("renderRoot", () => {
  const mockContext = { theme: "dark" };

  describe("Basic Element Processing", () => {
    it("should render a text element", () => {
      const element: DisactElement = {
        type: "intrinsic",
        name: "div",
        props: { children: "Hello World" },
      };

      const result = renderRoot(element, mockContext);

      expect(result).toEqual({
        type: "intrinsic",
        name: "div",
        props: {},
        children: [{ type: "text", content: "Hello World" }],
      });
    });

    it("should render an intrinsic element with props", () => {
      const element: IntrinsicElement = {
        type: "intrinsic",
        name: "button",
        props: {
          disabled: true,
          className: "primary",
          children: "Click me",
        },
      };

      const result = renderRoot(element, mockContext);

      expect(result).toEqual({
        type: "intrinsic",
        name: "button",
        props: {
          disabled: true,
          className: "primary",
        },
        children: [{ type: "text", content: "Click me" }],
      });
    });

    it("should render nested elements", () => {
      const element: IntrinsicElement = {
        type: "intrinsic",
        name: "div",
        props: {
          children: {
            type: "intrinsic",
            name: "span",
            props: { children: "Nested content" },
          },
        },
      };

      const result = renderRoot(element, mockContext);

      expect(result).toEqual({
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

    it("should handle multiple children", () => {
      const element: IntrinsicElement = {
        type: "intrinsic",
        name: "div",
        props: {
          children: [
            "First child",
            {
              type: "intrinsic",
              name: "span",
              props: { children: "Second child" },
            },
            "Third child",
          ],
        },
      };

      const result = renderRoot(element, mockContext);

      expect(result).toEqual({
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

    it("should filter out null and undefined children", () => {
      const element: IntrinsicElement = {
        type: "intrinsic",
        name: "div",
        props: {
          children: ["Valid text", null, undefined, "Another valid text", ""],
        },
      };

      const result = renderRoot(element, mockContext);

      expect(result).toEqual({
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
    it("should render a basic function component", () => {
      const TestComponent: FunctionComponent<{ name: string }> = ({
        name,
      }) => ({
        type: "intrinsic",
        name: "span",
        props: { children: `Hello ${name}` },
      });

      const element: DisactElement = {
        type: "function",
        fc: TestComponent,
        props: { name: "World" },
      };

      const result = renderRoot(element, mockContext);

      expect(result).toEqual({
        type: "intrinsic",
        name: "span",
        props: {},
        children: [{ type: "text", content: "Hello World" }],
      });
    });

    it("should handle nested function components", () => {
      const InnerComponent: FunctionComponent<{ text: string }> = ({
        text,
      }) => ({
        type: "intrinsic",
        name: "span",
        props: { children: text },
      });

      const OuterComponent: FunctionComponent<{ message: string }> = ({
        message,
      }) => ({
        type: "intrinsic",
        name: "div",
        props: {
          children: {
            type: "function",
            fc: InnerComponent,
            props: { text: message },
          },
        },
      });

      const element: DisactElement = {
        type: "function",
        fc: OuterComponent,
        props: { message: "Hello from nested component" },
      };

      const result = renderRoot(element, mockContext);

      expect(result).toEqual({
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

    it("should handle FC returning another FC", () => {
      const Button: FunctionComponent<{ text: string; variant?: string }> = ({
        text,
        variant = "primary",
      }) => ({
        type: "intrinsic",
        name: "button",
        props: {
          className: `btn btn-${variant}`,
          children: text,
        },
      });

      const ButtonWrapper: FunctionComponent<{
        label: string;
        type?: string;
      }> = ({ label, type = "secondary" }) => ({
        type: "function",
        fc: Button,
        props: { text: label, variant: type },
      });

      const element: DisactElement = {
        type: "function",
        fc: ButtonWrapper,
        props: { label: "Submit", type: "primary" },
      };

      const result = renderRoot(element, mockContext);

      expect(result).toEqual({
        type: "intrinsic",
        name: "button",
        props: {
          className: "btn btn-primary",
        },
        children: [{ type: "text", content: "Submit" }],
      });
    });

    it("should handle FC returning conditional FC based on props", () => {
      const PrimaryButton: FunctionComponent<{ children: string }> = ({
        children,
      }) => ({
        type: "intrinsic",
        name: "button",
        props: {
          className: "btn-primary",
          children,
        },
      });

      const SecondaryButton: FunctionComponent<{ children: string }> = ({
        children,
      }) => ({
        type: "intrinsic",
        name: "button",
        props: {
          className: "btn-secondary",
          children,
        },
      });

      const AdaptiveButton: FunctionComponent<{
        isPrimary: boolean;
        text: string;
      }> = ({ isPrimary, text }) => ({
        type: "function",
        fc: isPrimary ? PrimaryButton : SecondaryButton,
        props: { children: text },
      });

      // Test primary variant
      const primaryElement: DisactElement = {
        type: "function",
        fc: AdaptiveButton,
        props: { isPrimary: true, text: "Primary Action" },
      };

      const primaryResult = renderRoot(primaryElement, mockContext);

      expect(primaryResult).toEqual({
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
    it("should handle component with conditional rendering based on props", () => {
      const ConditionalComponent: FunctionComponent<{
        type: "button" | "link";
        text: string;
        href?: string;
      }> = ({ type, text, href }) => {
        if (type === "button") {
          return {
            type: "intrinsic",
            name: "button",
            props: { children: text },
          };
        }
        return {
          type: "intrinsic",
          name: "a",
          props: { href, children: text },
        };
      };

      // Test button variant
      const buttonElement: DisactElement = {
        type: "function",
        fc: ConditionalComponent,
        props: { type: "button", text: "Click me" },
      };

      const buttonResult = renderRoot(buttonElement, mockContext);

      expect(buttonResult).toEqual({
        type: "intrinsic",
        name: "button",
        props: {},
        children: [{ type: "text", content: "Click me" }],
      });

      // Test link variant
      const linkElement: DisactElement = {
        type: "function",
        fc: ConditionalComponent,
        props: { type: "link", text: "Go to page", href: "/page" },
      };

      const linkResult = renderRoot(linkElement, mockContext);

      expect(linkResult).toEqual({
        type: "intrinsic",
        name: "a",
        props: { href: "/page" },
        children: [{ type: "text", content: "Go to page" }],
      });
    });

    it("should handle component with different structures based on props", () => {
      const StatusComponent: FunctionComponent<{
        status: "loading" | "success" | "error";
        message?: string;
      }> = ({ status, message }) => {
        switch (status) {
          case "loading":
            return {
              type: "intrinsic",
              name: "div",
              props: {
                className: "loading",
                children: "Loading...",
              },
            };
          case "success":
            return {
              type: "intrinsic",
              name: "div",
              props: {
                className: "success",
                children: [
                  {
                    type: "intrinsic",
                    name: "span",
                    props: { children: "✓" },
                  },
                  message || "Success",
                ],
              },
            };
          case "error":
            return {
              type: "intrinsic",
              name: "div",
              props: {
                className: "error",
                children: {
                  type: "intrinsic",
                  name: "strong",
                  props: { children: message || "Error occurred" },
                },
              },
            };
        }
      };

      // Test success status
      const successElement: DisactElement = {
        type: "function",
        fc: StatusComponent,
        props: { status: "success", message: "Data saved" },
      };

      const successResult = renderRoot(successElement, mockContext);

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

    it("should handle component with array children manipulation", () => {
      const ListComponent: FunctionComponent<{
        items: string[];
        ordered?: boolean;
      }> = ({ items, ordered = false }) => ({
        type: "intrinsic",
        name: ordered ? "ol" : "ul",
        props: {
          children: items.map((item) => ({
            type: "intrinsic",
            name: "li",
            props: { children: item },
          })),
        },
      });

      const element: DisactElement = {
        type: "function",
        fc: ListComponent,
        props: { items: ["Item 1", "Item 2", "Item 3"] },
      };

      const result = renderRoot(element, mockContext);

      expect(result).toEqual({
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
    it("should handle component with renderContent-like function props", () => {
      const Modal: FunctionComponent<{
        title: string;
        renderContent: () => DisactNode;
        renderFooter?: () => DisactNode;
      }> = ({ title, renderContent, renderFooter }) => ({
        type: "intrinsic",
        name: "div",
        props: {
          className: "modal",
          children: [
            {
              type: "intrinsic",
              name: "header",
              props: { children: title },
            },
            {
              type: "intrinsic",
              name: "main",
              props: { children: renderContent() },
            },
            renderFooter
              ? {
                  type: "intrinsic",
                  name: "footer",
                  props: { children: renderFooter() },
                }
              : null,
          ],
        },
      });

      const element: DisactElement = {
        type: "function",
        fc: Modal,
        props: {
          title: "Confirmation",
          renderContent: () => "Are you sure you want to continue?",
          renderFooter: () => ({
            type: "intrinsic",
            name: "button",
            props: { children: "OK" },
          }),
        },
      };

      const result = renderRoot(element, mockContext);

      expect(result).toEqual({
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

    it("should handle component with DisactElement as props", () => {
      const Wrapper: FunctionComponent<{
        prefix: DisactElement;
        suffix: DisactElement;
        children: string;
      }> = ({ prefix, suffix, children }) => ({
        type: "intrinsic",
        name: "div",
        props: {
          className: "wrapper",
          children: [prefix, children, suffix],
        },
      });

      const prefixElement: DisactElement = {
        type: "intrinsic",
        name: "span",
        props: {
          className: "prefix",
          children: "→ ",
        },
      };

      const suffixElement: DisactElement = {
        type: "intrinsic",
        name: "span",
        props: {
          className: "suffix",
          children: " ←",
        },
      };

      const element: DisactElement = {
        type: "function",
        fc: Wrapper,
        props: {
          prefix: prefixElement,
          suffix: suffixElement,
          children: "Main content",
        },
      };

      const result = renderRoot(element, mockContext);

      expect(result).toEqual({
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

    it("should handle component with function component as props", () => {
      const IconComponent: FunctionComponent<{ name: string }> = ({
        name,
      }) => ({
        type: "intrinsic",
        name: "i",
        props: {
          className: `icon-${name}`,
          children: "",
        },
      });

      const Button: FunctionComponent<{
        icon: DisactElement;
        text: string;
        variant?: string;
      }> = ({ icon, text, variant = "default" }) => ({
        type: "intrinsic",
        name: "button",
        props: {
          className: `btn btn-${variant}`,
          children: [icon, " ", text],
        },
      });

      const iconElement: DisactElement = {
        type: "function",
        fc: IconComponent,
        props: { name: "save" },
      };

      const element: DisactElement = {
        type: "function",
        fc: Button,
        props: {
          icon: iconElement,
          text: "Save Document",
          variant: "primary",
        },
      };

      const result = renderRoot(element, mockContext);

      expect(result).toEqual({
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
    it("should handle Fragment as children in intrinsic element", () => {
      const Fragment = ({
        children,
      }: {
        children: DisactElement[];
      }): DisactNode => children;

      const containerElement: DisactElement = {
        type: "intrinsic",
        name: "div",
        props: {
          className: "container",
          children: {
            type: "function",
            fc: Fragment,
            props: {
              children: [
                {
                  type: "intrinsic",
                  name: "h2",
                  props: { children: "Title" },
                },
                {
                  type: "intrinsic",
                  name: "p",
                  props: { children: "Content goes here" },
                },
                {
                  type: "intrinsic",
                  name: "button",
                  props: { children: "Action" },
                },
              ],
            },
          },
        },
      };

      const result = renderRoot(containerElement, mockContext);

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

    it("should handle nested Fragment pattern", () => {
      const Fragment = ({
        children,
      }: {
        children: DisactElement[];
      }): DisactNode => children;

      const containerElement: DisactElement = {
        type: "intrinsic",
        name: "article",
        props: {
          children: {
            type: "function",
            fc: Fragment,
            props: {
              children: [
                {
                  type: "intrinsic",
                  name: "header",
                  props: {
                    children: {
                      type: "function",
                      fc: Fragment,
                      props: {
                        children: [
                          {
                            type: "intrinsic",
                            name: "h1",
                            props: { children: "Main Title" },
                          },
                          {
                            type: "intrinsic",
                            name: "p",
                            props: { children: "Subtitle" },
                          },
                        ],
                      },
                    },
                  },
                },
                {
                  type: "intrinsic",
                  name: "main",
                  props: { children: "Main content" },
                },
              ],
            },
          },
        },
      };

      const result = renderRoot(containerElement, mockContext);

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
    it("should handle HOC with styling and container wrapping", () => {
      // Base component
      const Button: FunctionComponent<{
        children: string;
        onClick?: () => void;
      }> = ({ children }) => ({
        type: "intrinsic",
        name: "button",
        props: { children },
      });

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
        return (props: P) => ({
          type: "intrinsic",
          name: "div",
          props: {
            className: "container",
            children: Component(props),
          },
        });
      };

      // Apply HOCs
      const StyledButton = withStyling(Button, "btn btn-primary");
      const ContainerButton = withContainer(StyledButton);

      const element: DisactElement = {
        type: "function",
        fc: ContainerButton,
        props: { children: "Click me" },
      };

      const result = renderRoot(element, mockContext);

      expect(result).toEqual({
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

    it("should handle HOC with props transformation and validation", () => {
      // Base input component
      const Input: FunctionComponent<{
        value: string;
        placeholder?: string;
      }> = ({ value, placeholder }) => ({
        type: "intrinsic",
        name: "input",
        props: { value, placeholder },
      });

      // HOC that adds validation
      const withValidation = <P extends { value: string }>(
        Component: FunctionComponent<P>,
      ): FunctionComponent<P & { required?: boolean }> => {
        return ({ required = false, ...props }) => {
          const baseElement = Component(props as P);

          if (required && (!props.value || props.value.trim() === "")) {
            return {
              type: "intrinsic",
              name: "div",
              props: {
                className: "field-error",
                children: [
                  baseElement,
                  {
                    type: "intrinsic",
                    name: "span",
                    props: {
                      className: "error-message",
                      children: "This field is required",
                    },
                  },
                ],
              },
            };
          }

          return baseElement;
        };
      };

      const ValidatedInput = withValidation(Input);

      // Test with validation error
      const errorElement: DisactElement = {
        type: "function",
        fc: ValidatedInput,
        props: {
          value: "",
          placeholder: "Enter your name",
          required: true,
        },
      };

      const errorResult = renderRoot(errorElement, mockContext);

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
    it("should handle function component returning null", () => {
      const NullComponent: FunctionComponent = () => null;

      const element: DisactElement = {
        type: "function",
        fc: NullComponent,
        props: {},
      };

      expect(() => renderRoot(element, mockContext)).toThrow(
        "Root element cannot be null",
      );
    });

    it("should handle function component returning array", () => {
      const ArrayComponent: FunctionComponent = () => ["item1", "item2"];

      const element: DisactElement = {
        type: "function",
        fc: ArrayComponent,
        props: {},
      };

      expect(() => renderRoot(element, mockContext)).toThrow(
        "Root element cannot be an array",
      );
    });

    it("should handle Fragment pattern at root level", () => {
      const Fragment = ({
        children,
      }: {
        children: DisactElement[];
      }): DisactNode => children;

      const fragmentElement: DisactElement = {
        type: "function",
        fc: Fragment,
        props: {
          children: [
            {
              type: "intrinsic",
              name: "p",
              props: { children: "First paragraph" },
            },
            {
              type: "intrinsic",
              name: "p",
              props: { children: "Second paragraph" },
            },
          ],
        },
      };

      // Fragment returns array, so renderRoot should throw
      expect(() => renderRoot(fragmentElement, mockContext)).toThrow(
        "Root element cannot be an array",
      );
    });
  });
});

describe("renderToReadableStream", () => {
  const mockContext = { theme: "dark" };

  // ストリームから結果を読み取るヘルパー関数
  const readStreamToCompletion = async (
    stream: ReadableStream,
  ): Promise<any[]> => {
    const reader = stream.getReader();
    const chunks: any[] = [];

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

  describe("同期レンダリング", () => {
    it("should render a simple text element and stream the result", async () => {
      const element: DisactElement = {
        type: "intrinsic",
        name: "div",
        props: { children: "Hello World" },
      };

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
      const TestComponent: FunctionComponent<{ name: string }> = ({
        name,
      }) => ({
        type: "intrinsic",
        name: "span",
        props: { children: `Hello ${name}` },
      });

      const element: DisactElement = {
        type: "function",
        fc: TestComponent,
        props: { name: "World" },
      };

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
      const element: IntrinsicElement = {
        type: "intrinsic",
        name: "div",
        props: {
          children: [
            "First child",
            {
              type: "intrinsic",
              name: "span",
              props: { children: "Second child" },
            },
            "Third child",
          ],
        },
      };

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

      const element: DisactElement = {
        type: "suspense",
        props: {
          fallback: "Loading...",
          children: {
            type: "function",
            fc: AsyncComponent,
            props: {},
          },
        },
      };

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
      const NormalComponent: FunctionComponent = () => ({
        type: "intrinsic",
        name: "div",
        props: { children: "Normal content" },
      });

      const element: DisactElement = {
        type: "suspense",
        props: {
          fallback: "Loading...",
          children: {
            type: "function",
            fc: NormalComponent,
            props: {},
          },
        },
      };

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

      const element: DisactElement = {
        type: "suspense",
        props: {
          fallback: "Loading...",
          children: {
            type: "function",
            fc: ErrorComponent,
            props: {},
          },
        },
      };

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

      const suspenseElement: DisactElement = {
        type: "suspense",
        props: {
          fallback: "Loading async...",
          children: {
            type: "function",
            fc: AsyncComponent,
            props: {},
          },
        },
      };

      const element: DisactElement = {
        type: "intrinsic",
        name: "div",
        props: {
          className: "container",
          children: ["Before Suspense", suspenseElement, "After Suspense"],
        },
      };

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

      const Child: FunctionComponent = () => ({
        type: "intrinsic",
        name: "span",
        props: {
          children: [
            "Child prefix: ",
            {
              type: "function",
              fc: GrandChild,
              props: {},
            },
            " - Child suffix",
          ],
        },
      });

      const element: DisactElement = {
        type: "suspense",
        props: {
          fallback: "Loading grandchild...",
          children: {
            type: "function",
            fc: Child,
            props: {},
          },
        },
      };

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

      const element: DisactElement = {
        type: "intrinsic",
        name: "div",
        props: {
          children: [
            {
              type: "suspense",
              props: {
                fallback: "Loading 1...",
                children: {
                  type: "function",
                  fc: AsyncComponent1,
                  props: {},
                },
              },
            },
            " and ",
            {
              type: "suspense",
              props: {
                fallback: "Loading 2...",
                children: {
                  type: "function",
                  fc: AsyncComponent2,
                  props: {},
                },
              },
            },
          ],
        },
      };

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

      const element: DisactElement = {
        type: "suspense",
        props: {
          fallback: "Loading...",
          children: {
            type: "function",
            fc: AsyncComponent,
            props: {},
          },
        },
      };

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

      const element: DisactElement = {
        type: "suspense",
        props: {
          fallback: "Loading...",
          children: {
            type: "function",
            fc: AsyncComponent,
            props: {},
          },
        },
      };

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

      // Promiseを事前に解決
      resolve1("Data A");
      resolve2("Data B");

      const stream = renderToReadableStream(
        {
          type: "function",
          fc: App,
          props: {},
        },
        mockContext,
      );

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

      const stream = renderToReadableStream(
        {
          type: "function",
          fc: App,
          props: {},
        },
        mockContext,
      );
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

      const App: FunctionComponent = () => ({
        type: "intrinsic",
        name: "section",
        props: {
          children: [
            {
              type: "intrinsic",
              name: "div",
              props: {
                children: {
                  type: "suspense",
                  props: {
                    fallback: "Fast loading...",
                    children: {
                      type: "function",
                      fc: FastComponent,
                      props: {},
                    },
                  },
                },
              },
            },
            {
              type: "intrinsic",
              name: "div",
              props: {
                children: {
                  type: "suspense",
                  props: {
                    fallback: "Slow loading...",
                    children: {
                      type: "function",
                      fc: SlowComponent,
                      props: {},
                    },
                  },
                },
              },
            },
          ],
        },
      });

      const stream = renderToReadableStream(
        {
          type: "function",
          fc: App,
          props: {},
        },
        mockContext,
      );
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

      const App: FunctionComponent = () => ({
        type: "intrinsic",
        name: "main",
        props: {
          children: [
            {
              type: "suspense",
              props: {
                fallback: "Loading component 1...",
                children: {
                  type: "function",
                  fc: AsyncComponent1,
                  props: {},
                },
              },
            },
            " and ",
            {
              type: "suspense",
              props: {
                fallback: "Loading component 2...",
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

      const stream = renderToReadableStream(
        {
          type: "function",
          fc: App,
          props: {},
        },
        mockContext,
      );
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

      const App: FunctionComponent = () => ({
        type: "intrinsic",
        name: "container",
        props: {
          children: [
            {
              type: "suspense",
              props: {
                fallback: "Loading shared 1...",
                children: {
                  type: "function",
                  fc: SharedComponent1,
                  props: {},
                },
              },
            },
            " | ",
            {
              type: "suspense",
              props: {
                fallback: "Loading shared 2...",
                children: {
                  type: "function",
                  fc: SharedComponent2,
                  props: {},
                },
              },
            },
            " | ",
            {
              type: "suspense",
              props: {
                fallback: "Loading unique...",
                children: {
                  type: "function",
                  fc: UniqueComponent,
                  props: {},
                },
              },
            },
          ],
        },
      });

      const stream = renderToReadableStream(
        {
          type: "function",
          fc: App,
          props: {},
        },
        mockContext,
      );
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
});
