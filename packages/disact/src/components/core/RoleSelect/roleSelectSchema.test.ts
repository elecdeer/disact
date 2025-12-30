import { ComponentType } from "discord-api-types/v10";
import { describe, expect, test } from "vitest";
import { roleSelectElementSchema } from "./roleSelectSchema";

describe("roleSelectElement", () => {
  test("基本的なrole selectを変換", () => {
    const result = roleSelectElementSchema.parse({
      type: "intrinsic",
      name: "message-component",
      props: {
        type: ComponentType.RoleSelect,
        customId: "test-role-select",
        placeholder: "Select a role",
        minValues: 1,
        maxValues: 5,
        disabled: false,
      },
      children: null,
    });

    expect(result).toMatchInlineSnapshot(`
      {
        "custom_id": "test-role-select",
        "disabled": false,
        "max_values": 5,
        "min_values": 1,
        "placeholder": "Select a role",
        "type": 6,
      }
    `);
  });

  test("defaultValuesを含むrole selectを変換", () => {
    const result = roleSelectElementSchema.parse({
      type: "intrinsic",
      name: "message-component",
      props: {
        type: ComponentType.RoleSelect,
        customId: "role-with-defaults",
        defaultValues: [
          { id: "123456789012345678", type: "role" },
          { id: "987654321098765432", type: "role" },
        ],
      },
      children: null,
    });

    expect(result).toMatchInlineSnapshot(`
      {
        "custom_id": "role-with-defaults",
        "default_values": [
          {
            "id": "123456789012345678",
            "type": "role",
          },
          {
            "id": "987654321098765432",
            "type": "role",
          },
        ],
        "type": 6,
      }
    `);
  });

  test("全てのオプションを含むrole selectを変換", () => {
    const result = roleSelectElementSchema.parse({
      type: "intrinsic",
      name: "message-component",
      props: {
        type: ComponentType.RoleSelect,
        id: 42,
        customId: "full-role-select",
        placeholder: "Choose roles",
        minValues: 2,
        maxValues: 10,
        disabled: true,
        required: true,
        defaultValues: [{ id: "111111111111111111", type: "role" }],
      },
      children: null,
    });

    expect(result).toMatchInlineSnapshot(`
      {
        "custom_id": "full-role-select",
        "default_values": [
          {
            "id": "111111111111111111",
            "type": "role",
          },
        ],
        "disabled": true,
        "id": 42,
        "max_values": 10,
        "min_values": 2,
        "placeholder": "Choose roles",
        "required": true,
        "type": 6,
      }
    `);
  });

  test("customIdが100文字を超えるとエラー", () => {
    const result = roleSelectElementSchema.safeParse({
      type: "intrinsic",
      name: "message-component",
      props: {
        type: ComponentType.RoleSelect,
        customId: "a".repeat(101),
      },
      children: null,
    });
    expect(result.success).toBe(false);
  });

  test("placeholderが150文字を超えるとエラー", () => {
    const result = roleSelectElementSchema.safeParse({
      type: "intrinsic",
      name: "message-component",
      props: {
        type: ComponentType.RoleSelect,
        customId: "test",
        placeholder: "a".repeat(151),
      },
      children: null,
    });
    expect(result.success).toBe(false);
  });

  test("minValuesが0未満でエラー", () => {
    const result = roleSelectElementSchema.safeParse({
      type: "intrinsic",
      name: "message-component",
      props: {
        type: ComponentType.RoleSelect,
        customId: "test",
        minValues: -1,
      },
      children: null,
    });
    expect(result.success).toBe(false);
  });

  test("minValuesが25を超えるとエラー", () => {
    const result = roleSelectElementSchema.safeParse({
      type: "intrinsic",
      name: "message-component",
      props: {
        type: ComponentType.RoleSelect,
        customId: "test",
        minValues: 26,
      },
      children: null,
    });
    expect(result.success).toBe(false);
  });

  test("maxValuesが1未満でエラー", () => {
    const result = roleSelectElementSchema.safeParse({
      type: "intrinsic",
      name: "message-component",
      props: {
        type: ComponentType.RoleSelect,
        customId: "test",
        maxValues: 0,
      },
      children: null,
    });
    expect(result.success).toBe(false);
  });

  test("maxValuesが25を超えるとエラー", () => {
    const result = roleSelectElementSchema.safeParse({
      type: "intrinsic",
      name: "message-component",
      props: {
        type: ComponentType.RoleSelect,
        customId: "test",
        maxValues: 26,
      },
      children: null,
    });
    expect(result.success).toBe(false);
  });

  test("defaultValuesが25を超えるとエラー", () => {
    const result = roleSelectElementSchema.safeParse({
      type: "intrinsic",
      name: "message-component",
      props: {
        type: ComponentType.RoleSelect,
        customId: "test",
        defaultValues: Array.from({ length: 26 }, (_, i) => ({
          id: `${i}`.padStart(18, "0"),
          type: "role" as const,
        })),
      },
      children: null,
    });
    expect(result.success).toBe(false);
  });
});
