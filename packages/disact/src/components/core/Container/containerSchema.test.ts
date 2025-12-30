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
            "type": 15,
          },
        ],
        "type": 14,
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
            "type": 16,
          },
        ],
        "type": 14,
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
            "type": 15,
          },
        ],
        "id": 42,
        "spoiler": true,
        "type": 14,
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
            "type": 15,
          },
          {
            "divider": true,
            "type": 16,
          },
          {
            "content": "Second text",
            "type": 15,
          },
        ],
        "type": 14,
      }
    `);
  });

  test("accentColorが0xffffffを超えるとエラー", () => {
    expect(() => {
      containerElementSchema.parse({
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
    }).toThrow("Number must be less than or equal to 16777215");
  });

  test("accentColorが0未満でエラー", () => {
    expect(() => {
      containerElementSchema.parse({
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
    }).toThrow("Number must be greater than or equal to 0");
  });

  test("componentsが空の配列でエラー", () => {
    expect(() => {
      containerElementSchema.parse({
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
    }).toThrow("Array must contain at least 1 element(s)");
  });

  test("componentsが40を超えるとエラー", () => {
    expect(() => {
      containerElementSchema.parse({
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
    }).toThrow("Array must contain at most 40 element(s)");
  });
});
