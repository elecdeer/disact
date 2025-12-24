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

    expect(result).toMatchInlineSnapshot(`
      {
        "custom_id": "test-button",
        "disabled": false,
        "label": "Click me",
        "style": 1,
        "type": 2,
      }
    `);
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

    expect(result).toMatchInlineSnapshot(`
      {
        "custom_id": "secondary-btn",
        "disabled": false,
        "id": 123,
        "label": "Secondary",
        "style": 2,
        "type": 2,
      }
    `);
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

    expect(result).toMatchInlineSnapshot(`
      {
        "custom_id": "success-btn",
        "disabled": false,
        "label": "Success",
        "style": 3,
        "type": 2,
      }
    `);
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

    expect(result).toMatchInlineSnapshot(`
      {
        "custom_id": "danger-btn",
        "disabled": true,
        "label": "Danger",
        "style": 4,
        "type": 2,
      }
    `);
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

    expect(result).toMatchInlineSnapshot(`
      {
        "disabled": false,
        "label": "Visit",
        "style": 5,
        "type": 2,
        "url": "https://example.com",
      }
    `);
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

    expect(result).toMatchInlineSnapshot(`
      {
        "disabled": false,
        "label": "Premium",
        "sku_id": "1234567890",
        "style": 6,
        "type": 2,
      }
    `);
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

    expect(result).toMatchInlineSnapshot(`
      {
        "custom_id": "no-label",
        "disabled": false,
        "style": 1,
        "type": 2,
      }
    `);
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

    expect(result).toMatchInlineSnapshot(`
      {
        "custom_id": "multi-text",
        "disabled": false,
        "label": "Click me",
        "style": 1,
        "type": 2,
      }
    `);
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
    }).toThrow("Invalid input");
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
    }).toThrow("Too big");
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
    }).toThrow("Too big");
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
    }).toThrow("Too big");
  });
});
