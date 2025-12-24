import { ComponentType } from "discord-api-types/v10";
import { describe, expect, test } from "vitest";
import { buttonElementSchema } from "./buttonElement";

describe("buttonElement", () => {
  test("primary buttonをラベル付きで変換", () => {
    const result = buttonElementSchema.parse({
      type: "intrinsic",
      name: "message-component",
      props: {
        type: ComponentType.Button,
        style: "primary",
        customId: "test-button",
      },
      children: [
        {
          type: "intrinsic",
          name: "slot",
          props: { name: "children" },
          children: [{ type: "text", content: "Click me" }],
        },
      ],
    });

    expect(result).toMatchInlineSnapshot();
  });

  test("secondary buttonをラベル付きで変換", () => {
    const result = buttonElementSchema.parse({
      type: "intrinsic",
      name: "message-component",
      props: {
        type: ComponentType.Button,
        style: "secondary",
        customId: "secondary-btn",
        id: 123,
      },
      children: [
        {
          type: "intrinsic",
          name: "slot",
          props: { name: "children" },
          children: [{ type: "text", content: "Secondary" }],
        },
      ],
    });

    expect(result).toMatchInlineSnapshot();
  });

  test("success buttonをラベル付きで変換", () => {
    const result = buttonElementSchema.parse({
      type: "intrinsic",
      name: "message-component",
      props: {
        type: ComponentType.Button,
        style: "success",
        customId: "success-btn",
      },
      children: [
        {
          type: "intrinsic",
          name: "slot",
          props: { name: "children" },
          children: [{ type: "text", content: "Success" }],
        },
      ],
    });

    expect(result).toMatchInlineSnapshot();
  });

  test("danger buttonをラベル付きで変換", () => {
    const result = buttonElementSchema.parse({
      type: "intrinsic",
      name: "message-component",
      props: {
        type: ComponentType.Button,
        style: "danger",
        customId: "danger-btn",
        disabled: true,
      },
      children: [
        {
          type: "intrinsic",
          name: "slot",
          props: { name: "children" },
          children: [{ type: "text", content: "Danger" }],
        },
      ],
    });

    expect(result).toMatchInlineSnapshot();
  });

  test("link buttonを変換", () => {
    const result = buttonElementSchema.parse({
      type: "intrinsic",
      name: "message-component",
      props: {
        type: ComponentType.Button,
        style: "link",
        url: "https://example.com",
      },
      children: [
        {
          type: "intrinsic",
          name: "slot",
          props: { name: "children" },
          children: [{ type: "text", content: "Visit" }],
        },
      ],
    });

    expect(result).toMatchInlineSnapshot();
  });

  test("premium buttonを変換", () => {
    const result = buttonElementSchema.parse({
      type: "intrinsic",
      name: "message-component",
      props: {
        type: ComponentType.Button,
        style: "premium",
        skuId: "1234567890",
      },
      children: [
        {
          type: "intrinsic",
          name: "slot",
          props: { name: "children" },
          children: [{ type: "text", content: "Premium" }],
        },
      ],
    });

    expect(result).toMatchInlineSnapshot();
  });

  test("ラベルなしのbuttonを変換", () => {
    const result = buttonElementSchema.parse({
      type: "intrinsic",
      name: "message-component",
      props: {
        type: ComponentType.Button,
        style: "primary",
        customId: "no-label",
      },
      children: undefined,
    });

    expect(result).toMatchInlineSnapshot();
  });

  test("複数のtext要素を結合", () => {
    const result = buttonElementSchema.parse({
      type: "intrinsic",
      name: "message-component",
      props: {
        type: ComponentType.Button,
        style: "primary",
        customId: "multi-text",
      },
      children: [
        {
          type: "intrinsic",
          name: "slot",
          props: { name: "children" },
          children: [
            { type: "text", content: "Click" },
            { type: "text", content: " " },
            { type: "text", content: "me" },
          ],
        },
      ],
    });

    expect(result).toMatchInlineSnapshot();
  });

  test("不正なname値でエラー", () => {
    expect(() => {
      buttonElementSchema.parse({
        type: "intrinsic",
        name: "button",
        props: {
          type: ComponentType.Button,
          style: "primary",
          customId: "test",
        },
        children: [{ type: "text", content: "Test" }],
      });
    }).toThrow("Expected");
  });

  test("80文字を超えるラベルでエラー", () => {
    expect(() => {
      buttonElementSchema.parse({
        type: "intrinsic",
        name: "message-component",
        props: {
          type: ComponentType.Button,
          style: "primary",
          customId: "long-label",
        },
        children: [
          {
            type: "intrinsic",
            name: "slot",
            props: { name: "children" },
            children: [{ type: "text", content: "a".repeat(81) }],
          },
        ],
      });
    }).toThrow("String must contain at most 80 character(s)");
  });

  test("customIdが100文字を超えるとエラー", () => {
    expect(() => {
      buttonElementSchema.parse({
        type: "intrinsic",
        name: "message-component",
        props: {
          type: ComponentType.Button,
          style: "primary",
          customId: "a".repeat(101),
        },
        children: [
          {
            type: "intrinsic",
            name: "slot",
            props: { name: "children" },
            children: [{ type: "text", content: "Test" }],
          },
        ],
      });
    }).toThrow("String must contain at most 100 character(s)");
  });

  test("link buttonのURLが512文字を超えるとエラー", () => {
    expect(() => {
      buttonElementSchema.parse({
        type: "intrinsic",
        name: "message-component",
        props: {
          type: ComponentType.Button,
          style: "link",
          url: "https://example.com/" + "a".repeat(500),
        },
        children: [
          {
            type: "intrinsic",
            name: "slot",
            props: { name: "children" },
            children: [{ type: "text", content: "Link" }],
          },
        ],
      });
    }).toThrow("String must contain at most 512 character(s)");
  });
});
