import { ComponentType } from "discord-api-types/v10";
import { describe, expect, test } from "vitest";
import { containerElementSchema } from "./containerSchema";

describe("containerElement", () => {
  test("textDisplayを含む基本的なcontainerを変換", () => {
    const result = containerElementSchema.parse({
      type: "intrinsic",
      name: "message-component",
      props: {
        type: ComponentType.Container,
      },
      children: [
        {
          type: "intrinsic",
          name: "slot",
          props: { name: "components" },
          children: [
            {
              type: "intrinsic",
              name: "message-component",
              props: {
                type: ComponentType.TextDisplay,
              },
              children: [
                {
                  type: "intrinsic",
                  name: "slot",
                  props: { name: "children" },
                  children: [{ type: "text", content: "Hello, world!" }],
                },
              ],
            },
          ],
        },
      ],
    });

    expect(result).toMatchInlineSnapshot(`
      {
        "components": [
          {
            "content": "Hello, world!",
            "type": 10,
          },
        ],
        "type": 17,
      }
    `);
  });

  test("separatorを含むcontainerを変換", () => {
    const result = containerElementSchema.parse({
      type: "intrinsic",
      name: "message-component",
      props: {
        type: ComponentType.Container,
      },
      children: [
        {
          type: "intrinsic",
          name: "slot",
          props: { name: "components" },
          children: [
            {
              type: "intrinsic",
              name: "message-component",
              props: {
                type: ComponentType.Separator,
                divider: true,
              },
              children: null,
            },
          ],
        },
      ],
    });

    expect(result).toMatchInlineSnapshot(`
      {
        "components": [
          {
            "divider": true,
            "type": 14,
          },
        ],
        "type": 17,
      }
    `);
  });

  test("accentColorとspoilerを含むcontainerを変換", () => {
    const result = containerElementSchema.parse({
      type: "intrinsic",
      name: "message-component",
      props: {
        type: ComponentType.Container,
        id: 42,
        accentColor: 0xff0000,
        spoiler: true,
      },
      children: [
        {
          type: "intrinsic",
          name: "slot",
          props: { name: "components" },
          children: [
            {
              type: "intrinsic",
              name: "message-component",
              props: {
                type: ComponentType.TextDisplay,
              },
              children: [
                {
                  type: "intrinsic",
                  name: "slot",
                  props: { name: "children" },
                  children: [{ type: "text", content: "Spoiler content" }],
                },
              ],
            },
          ],
        },
      ],
    });

    expect(result).toMatchInlineSnapshot(`
      {
        "accent_color": 16711680,
        "components": [
          {
            "content": "Spoiler content",
            "type": 10,
          },
        ],
        "id": 42,
        "spoiler": true,
        "type": 17,
      }
    `);
  });

  test("複数のコンポーネントを含むcontainerを変換", () => {
    const result = containerElementSchema.parse({
      type: "intrinsic",
      name: "message-component",
      props: {
        type: ComponentType.Container,
      },
      children: [
        {
          type: "intrinsic",
          name: "slot",
          props: { name: "components" },
          children: [
            {
              type: "intrinsic",
              name: "message-component",
              props: {
                type: ComponentType.TextDisplay,
              },
              children: [
                {
                  type: "intrinsic",
                  name: "slot",
                  props: { name: "children" },
                  children: [{ type: "text", content: "First text" }],
                },
              ],
            },
            {
              type: "intrinsic",
              name: "message-component",
              props: {
                type: ComponentType.Separator,
                divider: true,
              },
              children: null,
            },
            {
              type: "intrinsic",
              name: "message-component",
              props: {
                type: ComponentType.TextDisplay,
              },
              children: [
                {
                  type: "intrinsic",
                  name: "slot",
                  props: { name: "children" },
                  children: [{ type: "text", content: "Second text" }],
                },
              ],
            },
          ],
        },
      ],
    });

    expect(result).toMatchInlineSnapshot(`
      {
        "components": [
          {
            "content": "First text",
            "type": 10,
          },
          {
            "divider": true,
            "type": 14,
          },
          {
            "content": "Second text",
            "type": 10,
          },
        ],
        "type": 17,
      }
    `);
  });

  test("accentColorが0xffffffを超えるとエラー", () => {
    const result = containerElementSchema.safeParse({
      type: "intrinsic",
      name: "message-component",
      props: {
        type: ComponentType.Container,
        accentColor: 0x1000000,
      },
      children: [
        {
          type: "intrinsic",
          name: "slot",
          props: { name: "components" },
          children: [
            {
              type: "intrinsic",
              name: "message-component",
              props: {
                type: ComponentType.TextDisplay,
              },
              children: [
                {
                  type: "intrinsic",
                  name: "slot",
                  props: { name: "children" },
                  children: [{ type: "text", content: "Test" }],
                },
              ],
            },
          ],
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  test("accentColorが0未満でエラー", () => {
    const result = containerElementSchema.safeParse({
      type: "intrinsic",
      name: "message-component",
      props: {
        type: ComponentType.Container,
        accentColor: -1,
      },
      children: [
        {
          type: "intrinsic",
          name: "slot",
          props: { name: "components" },
          children: [
            {
              type: "intrinsic",
              name: "message-component",
              props: {
                type: ComponentType.TextDisplay,
              },
              children: [
                {
                  type: "intrinsic",
                  name: "slot",
                  props: { name: "children" },
                  children: [{ type: "text", content: "Test" }],
                },
              ],
            },
          ],
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  test("componentsが空の配列でエラー", () => {
    const result = containerElementSchema.safeParse({
      type: "intrinsic",
      name: "message-component",
      props: {
        type: ComponentType.Container,
      },
      children: [
        {
          type: "intrinsic",
          name: "slot",
          props: { name: "components" },
          children: [],
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  test("componentsが40を超えるとエラー", () => {
    const result = containerElementSchema.safeParse({
      type: "intrinsic",
      name: "message-component",
      props: {
        type: ComponentType.Container,
      },
      children: [
        {
          type: "intrinsic",
          name: "slot",
          props: { name: "components" },
          children: Array.from({ length: 41 }, () => ({
            type: "intrinsic",
            name: "message-component",
            props: {
              type: ComponentType.TextDisplay,
            },
            children: [
              {
                type: "intrinsic",
                name: "slot",
                props: { name: "children" },
                children: [{ type: "text", content: "Test" }],
              },
            ],
          })),
        },
      ],
    });
    expect(result.success).toBe(false);
  });
});
