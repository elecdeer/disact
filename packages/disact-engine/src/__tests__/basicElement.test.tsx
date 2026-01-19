/** @jsxImportSource ../ */

import { describe, expect, it } from "vitest";
import { renderToReadableStream } from "../render";
import { readStreamToCompletion } from "./testUtil";

describe("Basic Element Processing", () => {
  it("should render a text element", async () => {
    const element = <div>Hello World</div>;

    const stream = renderToReadableStream(element, {});
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

    const stream = renderToReadableStream(element, {});
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

    const stream = renderToReadableStream(element, {});
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

    const stream = renderToReadableStream(element, {});
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
