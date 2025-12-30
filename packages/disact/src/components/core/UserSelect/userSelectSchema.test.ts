import { ComponentType } from "discord-api-types/v10";
import { describe, expect, test } from "vitest";
import { userSelectElementSchema } from "./userSelectSchema";

describe("userSelectElement", () => {
  test("基本的なuser selectを変換", () => {
    const result = userSelectElementSchema.parse({
      type: "intrinsic",
      name: "message-component",
      props: {
        type: ComponentType.UserSelect,
        customId: "test-user-select",
        placeholder: "Select a user",
        minValues: 1,
        maxValues: 5,
        disabled: false,
      },
      children: null,
    });

    expect(result).toMatchInlineSnapshot(`
      {
        "custom_id": "test-user-select",
        "disabled": false,
        "max_values": 5,
        "min_values": 1,
        "placeholder": "Select a user",
        "type": 5,
      }
    `);
  });

  test("defaultValuesを含むuser selectを変換", () => {
    const result = userSelectElementSchema.parse({
      type: "intrinsic",
      name: "message-component",
      props: {
        type: ComponentType.UserSelect,
        customId: "user-with-defaults",
        defaultValues: [
          { id: "123456789012345678", type: "user" },
          { id: "987654321098765432", type: "user" },
        ],
      },
      children: null,
    });

    expect(result).toMatchInlineSnapshot(`
      {
        "custom_id": "user-with-defaults",
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
        "type": 5,
      }
    `);
  });

  test("全てのオプションを含むuser selectを変換", () => {
    const result = userSelectElementSchema.parse({
      type: "intrinsic",
      name: "message-component",
      props: {
        type: ComponentType.UserSelect,
        id: 42,
        customId: "full-user-select",
        placeholder: "Choose users",
        minValues: 2,
        maxValues: 10,
        disabled: true,
        required: true,
        defaultValues: [{ id: "111111111111111111", type: "user" }],
      },
      children: null,
    });

    expect(result).toMatchInlineSnapshot(`
      {
        "custom_id": "full-user-select",
        "default_values": [
          {
            "id": "111111111111111111",
            "type": "user",
          },
        ],
        "disabled": true,
        "id": 42,
        "max_values": 10,
        "min_values": 2,
        "placeholder": "Choose users",
        "required": true,
        "type": 5,
      }
    `);
  });

  test("customIdが100文字を超えるとエラー", () => {
    const result = userSelectElementSchema.safeParse({
      type: "intrinsic",
      name: "message-component",
      props: {
        type: ComponentType.UserSelect,
        customId: "a".repeat(101),
      },
      children: null,
    });
    expect(result.success).toBe(false);
  });

  test("placeholderが150文字を超えるとエラー", () => {
    const result = userSelectElementSchema.safeParse({
      type: "intrinsic",
      name: "message-component",
      props: {
        type: ComponentType.UserSelect,
        customId: "test",
        placeholder: "a".repeat(151),
      },
      children: null,
    });
    expect(result.success).toBe(false);
  });

  test("minValuesが0未満でエラー", () => {
    const result = userSelectElementSchema.safeParse({
      type: "intrinsic",
      name: "message-component",
      props: {
        type: ComponentType.UserSelect,
        customId: "test",
        minValues: -1,
      },
      children: null,
    });
    expect(result.success).toBe(false);
  });

  test("minValuesが25を超えるとエラー", () => {
    const result = userSelectElementSchema.safeParse({
      type: "intrinsic",
      name: "message-component",
      props: {
        type: ComponentType.UserSelect,
        customId: "test",
        minValues: 26,
      },
      children: null,
    });
    expect(result.success).toBe(false);
  });

  test("maxValuesが1未満でエラー", () => {
    const result = userSelectElementSchema.safeParse({
      type: "intrinsic",
      name: "message-component",
      props: {
        type: ComponentType.UserSelect,
        customId: "test",
        maxValues: 0,
      },
      children: null,
    });
    expect(result.success).toBe(false);
  });

  test("maxValuesが25を超えるとエラー", () => {
    const result = userSelectElementSchema.safeParse({
      type: "intrinsic",
      name: "message-component",
      props: {
        type: ComponentType.UserSelect,
        customId: "test",
        maxValues: 26,
      },
      children: null,
    });
    expect(result.success).toBe(false);
  });

  test("defaultValuesが25を超えるとエラー", () => {
    const result = userSelectElementSchema.safeParse({
      type: "intrinsic",
      name: "message-component",
      props: {
        type: ComponentType.UserSelect,
        customId: "test",
        defaultValues: Array.from({ length: 26 }, (_, i) => ({
          id: `${i}`.padStart(18, "0"),
          type: "user" as const,
        })),
      },
      children: null,
    });
    expect(result.success).toBe(false);
  });
});
