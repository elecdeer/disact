/** @jsxImportSource ../ */

import { describe, expect, it } from "vitest";
import { renderToReadableStream } from "../render";
import { readStreamToCompletion } from "./testUtil";
import type { FC } from "../element";

describe("Function Component", () => {
  it("should render a basic function component", async () => {
    const TestComponent: FC<{ name: string }> = ({ name }) => <span>{`Hello ${name}`}</span>;

    const element = <TestComponent name="World" />;

    const stream = renderToReadableStream(element, {});
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

    const stream = renderToReadableStream(element, {});
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

    const stream = renderToReadableStream(element, {});
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

    const stream = renderToReadableStream(primaryElement, {});
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
