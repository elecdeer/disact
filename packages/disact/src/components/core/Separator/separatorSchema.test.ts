import { ComponentType } from "discord-api-types/v10";
import { describe, expect, test } from "vitest";
import { separatorElementSchema } from "./separatorSchema";

describe("separatorElement", () => {
  test("基本的なseparatorを変換", () => {
    const result = separatorElementSchema.parse({
      type: "intrinsic",
      name: "message-component",
      props: {
        type: ComponentType.Separator,
      },
      children: null,
    });

    expect(result).toMatchInlineSnapshot(`
      {
        "type": 14,
      }
    `);
  });

  test("全てのプロパティを持つseparator", () => {
    const result = separatorElementSchema.parse({
      type: "intrinsic",
      name: "message-component",
      props: {
        type: ComponentType.Separator,
        id: 123,
        spacing: 10,
        divider: true,
      },
      children: null,
    });

    expect(result).toMatchInlineSnapshot(`
      {
        "divider": true,
        "id": 123,
        "spacing": 10,
        "type": 14,
      }
    `);
  });

  test("spacingがnull", () => {
    const result = separatorElementSchema.parse({
      type: "intrinsic",
      name: "message-component",
      props: {
        type: ComponentType.Separator,
        spacing: null,
      },
      children: null,
    });

    expect(result).toMatchInlineSnapshot(`
      {
        "spacing": null,
        "type": 14,
      }
    `);
  });

  test("不正なname値でエラー", () => {
    const result = separatorElementSchema.safeParse({
      type: "intrinsic",
      name: "separator",
      props: {
        type: ComponentType.Separator,
      },
      children: null,
    });
    expect(result.success).toBe(false);
  });

  test("childrenがnull以外でエラー", () => {
    const result = separatorElementSchema.safeParse({
      type: "intrinsic",
      name: "message-component",
      props: {
        type: ComponentType.Separator,
      },
      children: [{ type: "text", content: "invalid" }],
    });
    expect(result.success).toBe(false);
  });

  test("負のidでエラー", () => {
    const result = separatorElementSchema.safeParse({
      type: "intrinsic",
      name: "message-component",
      props: {
        type: ComponentType.Separator,
        id: -1,
      },
      children: null,
    });
    expect(result.success).toBe(false);
  });
});
