import { ComponentType } from "discord-api-types/v10";
import { describe, expect, test } from "vitest";
import { mentionableSelectElementSchema } from "./mentionableSelectSchema";

describe("mentionableSelectElement", () => {
  test("基本的なmentionable selectを変換", () => {
    const result = mentionableSelectElementSchema.parse({
      type: "intrinsic",
      name: "message-component",
      props: {
        type: ComponentType.MentionableSelect,
        customId: "test-mentionable-select",
        placeholder: "Select users or roles",
        minValues: 1,
        maxValues: 5,
        disabled: false,
      },
      children: null,
    });

    expect(result).toMatchInlineSnapshot(`
      {
        "custom_id": "test-mentionable-select",
        "disabled": false,
        "max_values": 5,
        "min_values": 1,
        "placeholder": "Select users or roles",
        "type": 7,
      }
    `);
  });

  test("user defaultValuesを含むmentionable selectを変換", () => {
    const result = mentionableSelectElementSchema.parse({
      type: "intrinsic",
      name: "message-component",
      props: {
        type: ComponentType.MentionableSelect,
        customId: "mentionable-with-user-defaults",
        defaultValues: [
          { id: "123456789012345678", type: "user" },
          { id: "987654321098765432", type: "user" },
        ],
      },
      children: null,
    });

    expect(result).toMatchInlineSnapshot(`
      {
        "custom_id": "mentionable-with-user-defaults",
        "default_values": [
          {
            "id": "123456789012345678",
            "type": "user",
          },
          {
            "id": "987654321098765432",
            "type": "user",
          },
        ],
        "type": 7,
      }
    `);
  });

  test("role defaultValuesを含むmentionable selectを変換", () => {
    const result = mentionableSelectElementSchema.parse({
      type: "intrinsic",
      name: "message-component",
      props: {
        type: ComponentType.MentionableSelect,
        customId: "mentionable-with-role-defaults",
        defaultValues: [
          { id: "111111111111111111", type: "role" },
          { id: "222222222222222222", type: "role" },
        ],
      },
      children: null,
    });

    expect(result).toMatchInlineSnapshot(`
      {
        "custom_id": "mentionable-with-role-defaults",
        "default_values": [
          {
            "id": "111111111111111111",
            "type": "role",
          },
          {
            "id": "222222222222222222",
            "type": "role",
          },
        ],
        "type": 7,
      }
    `);
  });

  test("userとrole混合のdefaultValuesを含むmentionable selectを変換", () => {
    const result = mentionableSelectElementSchema.parse({
      type: "intrinsic",
      name: "message-component",
      props: {
        type: ComponentType.MentionableSelect,
        customId: "mentionable-mixed-defaults",
        defaultValues: [
          { id: "123456789012345678", type: "user" },
          { id: "987654321098765432", type: "role" },
          { id: "111111111111111111", type: "user" },
        ],
      },
      children: null,
    });

    expect(result).toMatchInlineSnapshot(`
      {
        "custom_id": "mentionable-mixed-defaults",
        "default_values": [
          {
            "id": "123456789012345678",
            "type": "user",
          },
          {
            "id": "987654321098765432",
            "type": "role",
          },
          {
            "id": "111111111111111111",
            "type": "user",
          },
        ],
        "type": 7,
      }
    `);
  });

  test("全てのオプションを含むmentionable selectを変換", () => {
    const result = mentionableSelectElementSchema.parse({
      type: "intrinsic",
      name: "message-component",
      props: {
        type: ComponentType.MentionableSelect,
        id: 42,
        customId: "full-mentionable-select",
        placeholder: "Choose users or roles",
        minValues: 2,
        maxValues: 10,
        disabled: true,
        required: true,
        defaultValues: [
          { id: "111111111111111111", type: "user" },
          { id: "222222222222222222", type: "role" },
        ],
      },
      children: null,
    });

    expect(result).toMatchInlineSnapshot(`
      {
        "custom_id": "full-mentionable-select",
        "default_values": [
          {
            "id": "111111111111111111",
            "type": "user",
          },
          {
            "id": "222222222222222222",
            "type": "role",
          },
        ],
        "disabled": true,
        "id": 42,
        "max_values": 10,
        "min_values": 2,
        "placeholder": "Choose users or roles",
        "required": true,
        "type": 7,
      }
    `);
  });

  test("customIdが100文字を超えるとエラー", () => {
    const result = mentionableSelectElementSchema.safeParse({
      type: "intrinsic",
      name: "message-component",
      props: {
        type: ComponentType.MentionableSelect,
        customId: "a".repeat(101),
      },
      children: null,
    });
    expect(result.success).toBe(false);
  });

  test("placeholderが150文字を超えるとエラー", () => {
    const result = mentionableSelectElementSchema.safeParse({
      type: "intrinsic",
      name: "message-component",
      props: {
        type: ComponentType.MentionableSelect,
        customId: "test",
        placeholder: "a".repeat(151),
      },
      children: null,
    });
    expect(result.success).toBe(false);
  });

  test("minValuesが0未満でエラー", () => {
    const result = mentionableSelectElementSchema.safeParse({
      type: "intrinsic",
      name: "message-component",
      props: {
        type: ComponentType.MentionableSelect,
        customId: "test",
        minValues: -1,
      },
      children: null,
    });
    expect(result.success).toBe(false);
  });

  test("minValuesが25を超えるとエラー", () => {
    const result = mentionableSelectElementSchema.safeParse({
      type: "intrinsic",
      name: "message-component",
      props: {
        type: ComponentType.MentionableSelect,
        customId: "test",
        minValues: 26,
      },
      children: null,
    });
    expect(result.success).toBe(false);
  });

  test("maxValuesが1未満でエラー", () => {
    const result = mentionableSelectElementSchema.safeParse({
      type: "intrinsic",
      name: "message-component",
      props: {
        type: ComponentType.MentionableSelect,
        customId: "test",
        maxValues: 0,
      },
      children: null,
    });
    expect(result.success).toBe(false);
  });

  test("maxValuesが25を超えるとエラー", () => {
    const result = mentionableSelectElementSchema.safeParse({
      type: "intrinsic",
      name: "message-component",
      props: {
        type: ComponentType.MentionableSelect,
        customId: "test",
        maxValues: 26,
      },
      children: null,
    });
    expect(result.success).toBe(false);
  });

  test("defaultValuesが25を超えるとエラー", () => {
    const result = mentionableSelectElementSchema.safeParse({
      type: "intrinsic",
      name: "message-component",
      props: {
        type: ComponentType.MentionableSelect,
        customId: "test",
        defaultValues: Array.from({ length: 26 }, (_, i) => ({
          id: `${i}`.padStart(18, "0"),
          type: i % 2 === 0 ? ("user" as const) : ("role" as const),
        })),
      },
      children: null,
    });
    expect(result.success).toBe(false);
  });
});
