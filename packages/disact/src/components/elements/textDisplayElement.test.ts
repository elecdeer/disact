import { ComponentType } from "discord-api-types/v10";
import { describe, expect, test } from "vitest";
import { textDisplayElementSchema } from "./textDisplayElement";

describe("textDisplayElement", () => {
  test("基本的なtextDisplayを変換", () => {
    const result = textDisplayElementSchema.parse({
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
          children: [
            { type: "text", content: "Hello, World!" },
          ],
        },
      ],
    });

    expect(result).toMatchInlineSnapshot(`
      {
        "content": "Hello, World!",
        "type": 10,
      }
    `);
  });

  test("複数のtext要素を結合", () => {
    const result = textDisplayElementSchema.parse({
      type: "intrinsic",
      name: "message-component",
      props: {
        type: ComponentType.TextDisplay,
        id: 456,
      },
      children: [
        {
          type: "intrinsic",
          name: "slot",
          props: { name: "children" },
          children: [
            { type: "text", content: "Hello" },
            { type: "text", content: ", " },
            { type: "text", content: "World!" },
          ],
        },
      ],
    });

    expect(result).toMatchInlineSnapshot(`
      {
        "content": "Hello, World!",
        "id": 456,
        "type": 10,
      }
    `);
  });

  test("不正なname値でエラー", () => {
    expect(() => {
      textDisplayElementSchema.parse({
        type: "intrinsic",
        name: "textDisplay",
        props: {
          type: ComponentType.TextDisplay,
        },
        children: [{ type: "text", content: "Test" }],
      });
    }).toThrow();
  });

  test("空文字列でエラー", () => {
    expect(() => {
      textDisplayElementSchema.parse({
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
            children: [
              { type: "text", content: "" },
            ],
          },
        ],
      });
    }).toThrow();
  });

  test("4000文字を超えるとエラー", () => {
    expect(() => {
      textDisplayElementSchema.parse({
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
            children: [
              { type: "text", content: "a".repeat(4001) },
            ],
          },
        ],
      });
    }).toThrow();
  });
});
