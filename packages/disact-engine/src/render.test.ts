import { describe, expect, it } from "vitest";
import type {
  DisactElement,
  DisactNode,
  FunctionComponent,
  IntrinsicElement,
  PropsBase,
} from "./element";
import { renderRoot } from "./render";

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
      const TestComponent: FunctionComponent<{ name: string }> = ({ name }) => ({
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
      const InnerComponent: FunctionComponent<{ text: string }> = ({ text }) => ({
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
            children: [{ type: "text", content: "Hello from nested component" }],
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

      const ButtonWrapper: FunctionComponent<{ label: string; type?: string }> = ({
        label,
        type = "secondary",
      }) => ({
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
      const IconComponent: FunctionComponent<{ name: string }> = ({ name }) => ({
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