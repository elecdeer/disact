import { ComponentType } from "discord-api-types/v10";
import { describe, expect, test } from "vitest";
import * as z from "zod";
import {
  createMessageComponentSchemaBase,
  createNamedSlotSchema,
  createPropsOnlyComponentSchema,
  createSingleSlotComponentSchema,
  extractSlotContent,
  extractSingleSlotTextContent,
  extractTextContent,
  requireSlotContent,
} from "./schemaUtils";

describe("schemaUtils", () => {
  describe("createMessageComponentSchemaBase", () => {
    test("基本的なmessage-componentスキーマを作成", () => {
      const schema = createMessageComponentSchemaBase(
        ComponentType.Separator,
        z.object({ id: z.optional(z.number()) }),
        z.null(),
      );

      const result = schema.parse({
        type: "intrinsic",
        name: "message-component",
        props: {
          type: ComponentType.Separator,
          id: 123,
        },
        children: null,
      });

      expect(result).toEqual({
        type: "intrinsic",
        name: "message-component",
        props: {
          type: ComponentType.Separator,
          id: 123,
        },
        children: null,
      });
    });

    test("不正なname値でエラー", () => {
      const schema = createMessageComponentSchemaBase(
        ComponentType.Separator,
        z.object({}),
        z.null(),
      );

      const result = schema.safeParse({
        type: "intrinsic",
        name: "invalid-name",
        props: { type: ComponentType.Separator },
        children: null,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("createPropsOnlyComponentSchema", () => {
    test("props-onlyコンポーネントのスキーマを作成", () => {
      const schema = createPropsOnlyComponentSchema(
        ComponentType.Separator,
        z.object({
          id: z.optional(z.number()),
          spacing: z.optional(z.number().nullable()),
        }),
        (props) => ({
          type: props.type,
          id: props.id,
          spacing: props.spacing,
        }),
      );

      const result = schema.parse({
        type: "intrinsic",
        name: "message-component",
        props: {
          type: ComponentType.Separator,
          id: 456,
          spacing: 10,
        },
        children: null,
      });

      expect(result).toEqual({
        type: ComponentType.Separator,
        id: 456,
        spacing: 10,
      });
    });

    test("childrenがnull以外でエラー", () => {
      const schema = createPropsOnlyComponentSchema(
        ComponentType.Separator,
        z.object({}),
        (props) => ({ type: props.type }),
      );

      const result = schema.safeParse({
        type: "intrinsic",
        name: "message-component",
        props: { type: ComponentType.Separator },
        children: [{ type: "text", content: "invalid" }],
      });
      expect(result.success).toBe(false);
    });
  });

  describe("createNamedSlotSchema", () => {
    test("名前付きslotスキーマを作成", () => {
      const schema = createNamedSlotSchema(
        "children",
        z.object({ type: z.literal("text"), content: z.string() }),
      );

      const result = schema.parse({
        type: "intrinsic",
        name: "slot",
        props: { name: "children" },
        children: [
          { type: "text", content: "Hello" },
          { type: "text", content: " World" },
        ],
      });

      expect(result).toEqual({
        type: "intrinsic",
        name: "slot",
        props: { name: "children" },
        children: [
          { type: "text", content: "Hello" },
          { type: "text", content: " World" },
        ],
      });
    });

    test("min/max制約付きslotスキーマ", () => {
      const schema = createNamedSlotSchema("components", z.object({ id: z.number() }), {
        min: 1,
        max: 3,
      });

      // 正常: 1個
      expect(() => {
        schema.parse({
          type: "intrinsic",
          name: "slot",
          props: { name: "components" },
          children: [{ id: 1 }],
        });
      }).not.toThrow();

      // エラー: 0個 (min未満)
      const result1 = schema.safeParse({
        type: "intrinsic",
        name: "slot",
        props: { name: "components" },
        children: [],
      });
      expect(result1.success).toBe(false);

      // エラー: 4個 (max超過)
      const result2 = schema.safeParse({
        type: "intrinsic",
        name: "slot",
        props: { name: "components" },
        children: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }],
      });
      expect(result2.success).toBe(false);
    });
  });

  describe("createSingleSlotComponentSchema", () => {
    test("単一slot（必須）のコンポーネントスキーマ", () => {
      const schema = createSingleSlotComponentSchema(
        ComponentType.TextDisplay,
        z.object({ id: z.optional(z.number()) }),
        "children",
        z.object({ type: z.literal("text"), content: z.string() }),
        ({ props, slotContent }) => ({
          type: props.type,
          id: props.id,
          text: slotContent.map((node) => node.content).join(""),
        }),
      );

      const result = schema.parse({
        type: "intrinsic",
        name: "message-component",
        props: {
          type: ComponentType.TextDisplay,
          id: 789,
        },
        children: [
          {
            type: "intrinsic",
            name: "slot",
            props: { name: "children" },
            children: [
              { type: "text", content: "Hello" },
              { type: "text", content: " Test" },
            ],
          },
        ],
      });

      expect(result).toEqual({
        type: ComponentType.TextDisplay,
        id: 789,
        text: "Hello Test",
      });
    });

    test("単一slot（オプショナル）のコンポーネントスキーマ", () => {
      const schema = createSingleSlotComponentSchema(
        ComponentType.Button,
        z.object({ customId: z.string() }),
        "children",
        z.object({ type: z.literal("text"), content: z.string() }),
        ({ props, slotContent }) => ({
          type: props.type,
          custom_id: props.customId,
          label: slotContent.length > 0 ? slotContent[0]!.content : undefined,
        }),
        { optional: true },
      );

      // slot有り
      const resultWithSlot = schema.parse({
        type: "intrinsic",
        name: "message-component",
        props: {
          type: ComponentType.Button,
          customId: "btn1",
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

      expect(resultWithSlot).toEqual({
        type: ComponentType.Button,
        custom_id: "btn1",
        label: "Click me",
      });

      // slot無し
      const resultWithoutSlot = schema.parse({
        type: "intrinsic",
        name: "message-component",
        props: {
          type: ComponentType.Button,
          customId: "btn2",
        },
        children: undefined,
      });

      expect(resultWithoutSlot).toEqual({
        type: ComponentType.Button,
        custom_id: "btn2",
        label: undefined,
      });
    });
  });

  describe("extractSlotContent", () => {
    test("指定名のslot内容を抽出", () => {
      const children = [
        {
          name: "slot",
          props: { name: "accessory" },
          children: [{ type: "button", id: 1 }],
        },
        {
          name: "slot",
          props: { name: "components" },
          children: [
            { type: "text", id: 2 },
            { type: "text", id: 3 },
          ],
        },
      ];

      const accessory = extractSlotContent(children, "accessory");
      expect(accessory).toEqual([{ type: "button", id: 1 }]);

      const components = extractSlotContent(children, "components");
      expect(components).toEqual([
        { type: "text", id: 2 },
        { type: "text", id: 3 },
      ]);
    });

    test("存在しないslot名でundefined", () => {
      const children = [
        {
          name: "slot",
          props: { name: "children" },
          children: [{ type: "text" }],
        },
      ];

      const result = extractSlotContent(children, "nonexistent");
      expect(result).toBeUndefined();
    });
  });

  describe("extractTextContent", () => {
    test("text要素を結合", () => {
      const textNodes: Array<{ type: "text"; content: string }> = [
        { type: "text", content: "Hello" },
        { type: "text", content: " " },
        { type: "text", content: "World" },
      ];

      const result = extractTextContent(textNodes);
      expect(result).toBe("Hello World");
    });

    test("空配列で空文字列", () => {
      const result = extractTextContent([]);
      expect(result).toBe("");
    });
  });

  describe("extractSingleSlotTextContent", () => {
    test("slot内のtext要素を抽出して結合", () => {
      const children = [
        {
          name: "slot",
          props: { name: "children" },
          children: [
            { type: "text", content: "Button" },
            { type: "text", content: " Label" },
          ],
        },
      ];

      const result = extractSingleSlotTextContent(children, "children");
      expect(result).toBe("Button Label");
    });

    test("childrenがundefinedでundefined", () => {
      const result = extractSingleSlotTextContent(undefined, "children");
      expect(result).toBeUndefined();
    });

    test("slotが見つからない場合undefined", () => {
      const children = [
        {
          name: "slot",
          props: { name: "other" },
          children: [{ type: "text", content: "Test" }],
        },
      ];

      const result = extractSingleSlotTextContent(children, "children");
      expect(result).toBeUndefined();
    });

    test("text以外の要素は無視", () => {
      const children = [
        {
          name: "slot",
          props: { name: "children" },
          children: [
            { type: "text", content: "Hello" },
            { type: "other", content: "ignored" },
            { type: "text", content: " World" },
          ],
        },
      ];

      const result = extractSingleSlotTextContent(children, "children");
      expect(result).toBe("Hello World");
    });
  });

  describe("requireSlotContent", () => {
    test("指定名のslot内容を取得", () => {
      const children = [
        {
          name: "slot",
          props: { name: "components" },
          children: [{ id: 1 }, { id: 2 }],
        },
      ];

      const result = requireSlotContent(children, "components");
      expect(result).toEqual([{ id: 1 }, { id: 2 }]);
    });

    test("slotが見つからない場合エラー", () => {
      const children = [
        {
          name: "slot",
          props: { name: "other" },
          children: [{ id: 1 }],
        },
      ];

      expect(() => {
        requireSlotContent(children, "components");
      }).toThrow('Required slot "components" not found');
    });
  });
});
