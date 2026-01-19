/** @jsxImportSource ../ */

import { describe, expect, it } from "vitest";
import { renderToReadableStream } from "../render";
import { readStreamToCompletion } from "./testUtil";
import type { DisactElement, FC } from "../element";

describe("elementProps", () => {
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

    const stream = renderToReadableStream(element, {});
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

    const stream = renderToReadableStream(element, {});
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
