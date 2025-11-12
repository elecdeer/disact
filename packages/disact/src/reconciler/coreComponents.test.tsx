/**
 * Core components tests
 */

import { describe, expect, it } from "vitest";
import { Button, Section } from "./coreComponents";
import { renderToInstance } from "./render";

describe("Button component", () => {
  it("renders button with children", async () => {
    const result = await renderToInstance(
      <Button style="primary" customId="test-btn">
        Click me
      </Button>,
    );

    expect(result[0]).toMatchObject({
      type: "intrinsic",
      name: "button",
      props: {
        style: "primary",
        customId: "test-btn",
      },
      children: [{ type: "text", content: "Click me" }],
    });
  });

  it("renders link button with url", async () => {
    const result = await renderToInstance(
      <Button style="link" url="https://example.com">
        Visit
      </Button>,
    );

    expect(result[0]).toMatchObject({
      type: "intrinsic",
      name: "button",
      props: {
        style: "link",
        url: "https://example.com",
      },
    });
  });

  it("renders disabled button", async () => {
    const result = await renderToInstance(
      <Button style="primary" customId="test" disabled>
        Disabled
      </Button>,
    );

    expect(result[0]).toMatchObject({
      type: "intrinsic",
      name: "button",
      props: {
        disabled: true,
      },
    });
  });
});

describe("Section component", () => {
  it("renders section with slots", async () => {
    const result = await renderToInstance(
      <Section id={1}>
        <div>Main content</div>
      </Section>,
    );

    expect(result[0]).toMatchObject({
      type: "intrinsic",
      name: "section",
      props: { id: 1 },
      children: [
        {
          type: "intrinsic",
          name: "slot",
          props: { name: "components" },
          children: [
            {
              type: "intrinsic",
              name: "div",
              children: [{ type: "text", content: "Main content" }],
            },
          ],
        },
        {
          type: "intrinsic",
          name: "slot",
          props: { name: "accessory" },
          children: [],
        },
      ],
    });
  });

  it("renders section with accessory", async () => {
    const result = await renderToInstance(
      <Section accessory={<img alt="accessory" />}>Main</Section>,
    );

    const section = result[0];
    if (section?.type !== "intrinsic") throw new Error("Expected intrinsic");

    // Find slots
    const componentsSlot = section.children.find(
      (child) =>
        child.type === "intrinsic" &&
        child.name === "slot" &&
        child.props.name === "components",
    );
    const accessorySlot = section.children.find(
      (child) =>
        child.type === "intrinsic" &&
        child.name === "slot" &&
        child.props.name === "accessory",
    );

    expect(componentsSlot).toMatchObject({
      type: "intrinsic",
      name: "slot",
      props: { name: "components" },
      children: [{ type: "text", content: "Main" }],
    });

    expect(accessorySlot).toMatchObject({
      type: "intrinsic",
      name: "slot",
      props: { name: "accessory" },
      children: [
        {
          type: "intrinsic",
          name: "img",
          props: { alt: "accessory" },
        },
      ],
    });
  });

  it("renders nested components in slots", async () => {
    const result = await renderToInstance(
      <Section
        accessory={
          <Button style="primary" customId="action">
            Action
          </Button>
        }
      >
        <div>Content</div>
      </Section>,
    );

    const section = result[0];
    if (section?.type !== "intrinsic") throw new Error("Expected intrinsic");

    const accessorySlot = section.children.find(
      (child) =>
        child.type === "intrinsic" &&
        child.name === "slot" &&
        child.props.name === "accessory",
    );

    if (accessorySlot?.type !== "intrinsic")
      throw new Error("Expected intrinsic");

    expect(accessorySlot.children[0]).toMatchObject({
      type: "intrinsic",
      name: "button",
      props: {
        style: "primary",
        customId: "action",
      },
      children: [{ type: "text", content: "Action" }],
    });
  });
});
