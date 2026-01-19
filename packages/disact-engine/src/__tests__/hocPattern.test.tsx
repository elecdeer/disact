/** @jsxImportSource ../ */

import { describe, expect, it } from "vitest";
import { renderToReadableStream } from "../render";
import { readStreamToCompletion } from "./testUtil";
import type { FC, PropsBase } from "../element";

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

    const stream = renderToReadableStream(element, {});
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
    const errorElement = <ValidatedInput value="" placeholder="Enter your name" required={true} />;

    const stream = renderToReadableStream(errorElement, {});
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
