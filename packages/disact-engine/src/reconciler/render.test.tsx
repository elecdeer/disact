/**
 * Basic reconciler render tests
 */

import { describe, expect, it } from "vitest";
import { renderToInstance } from "./render";

describe("renderToInstance", () => {
  it("renders a simple element", async () => {
    const result = await renderToInstance(<div>Hello</div>);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      type: "intrinsic",
      name: "div",
      props: {},
      children: [{ type: "text", content: "Hello" }],
    });
  });

  it("renders nested elements", async () => {
    const result = await renderToInstance(
      <div>
        <span>Hello</span>
        <span>World</span>
      </div>,
    );

    expect(result[0]).toMatchObject({
      type: "intrinsic",
      name: "div",
      children: [
        {
          type: "intrinsic",
          name: "span",
          children: [{ type: "text", content: "Hello" }],
        },
        {
          type: "intrinsic",
          name: "span",
          children: [{ type: "text", content: "World" }],
        },
      ],
    });
  });

  it("renders with props", async () => {
    const result = await renderToInstance(<button id="test-btn" disabled />);

    expect(result[0]).toMatchObject({
      type: "intrinsic",
      name: "button",
      props: { id: "test-btn", disabled: true },
      children: [],
    });
  });

  it("renders function component", async () => {
    const Greeting = ({ name }: { name: string }) => <div>Hello, {name}!</div>;

    const result = await renderToInstance(<Greeting name="React" />);

    expect(result[0]).toMatchObject({
      type: "intrinsic",
      name: "div",
      children: [
        { type: "text", content: "Hello, " },
        { type: "text", content: "React" },
        { type: "text", content: "!" },
      ],
    });
  });

  it("renders fragments", async () => {
    const result = await renderToInstance(
      <>
        <div>First</div>
        <div>Second</div>
      </>,
    );

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      type: "intrinsic",
      name: "div",
      children: [{ type: "text", content: "First" }],
    });
    expect(result[1]).toMatchObject({
      type: "intrinsic",
      name: "div",
      children: [{ type: "text", content: "Second" }],
    });
  });

  it("filters out null and undefined", async () => {
    const result = await renderToInstance(
      <div>
        {null}
        <span>visible</span>
        {undefined}
      </div>,
    );

    expect(result[0]).toMatchObject({
      type: "intrinsic",
      name: "div",
      children: [
        {
          type: "intrinsic",
          name: "span",
          children: [{ type: "text", content: "visible" }],
        },
      ],
    });
  });

  it("renders boolean props correctly", async () => {
    const result = await renderToInstance(
      <input type="checkbox" checked={true} disabled={false} />,
    );

    expect(result[0]).toMatchObject({
      type: "intrinsic",
      name: "input",
      props: {
        type: "checkbox",
        checked: true,
        disabled: false,
      },
    });
  });
});
