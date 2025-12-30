import { describe, expect, test } from "vitest";
import { roleSelectElementSchema } from "./roleSelectSchema";

describe("roleSelectElement", () => {
  test("基本的なrole selectを変換", () => {
    const result = roleSelectElementSchema.parse({
      customId: "test-role-select",
      placeholder: "Select a role",
      minValues: 1,
      maxValues: 5,
      disabled: false,
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
      customId: "role-with-defaults",
      defaultValues: [
        { id: "123456789012345678", type: "role" },
        { id: "987654321098765432", type: "role" },
      ],
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
      id: 42,
      customId: "full-role-select",
      placeholder: "Choose roles",
      minValues: 2,
      maxValues: 10,
      disabled: true,
      required: true,
      defaultValues: [{ id: "111111111111111111", type: "role" }],
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
    expect(() => {
      roleSelectElementSchema.parse({
        customId: "a".repeat(101),
      });
    }).toThrow("String must contain at most 100 character(s)");
  });

  test("placeholderが150文字を超えるとエラー", () => {
    expect(() => {
      roleSelectElementSchema.parse({
        customId: "test",
        placeholder: "a".repeat(151),
      });
    }).toThrow("String must contain at most 150 character(s)");
  });

  test("minValuesが0未満でエラー", () => {
    expect(() => {
      roleSelectElementSchema.parse({
        customId: "test",
        minValues: -1,
      });
    }).toThrow("Number must be greater than or equal to 0");
  });

  test("minValuesが25を超えるとエラー", () => {
    expect(() => {
      roleSelectElementSchema.parse({
        customId: "test",
        minValues: 26,
      });
    }).toThrow("Number must be less than or equal to 25");
  });

  test("maxValuesが1未満でエラー", () => {
    expect(() => {
      roleSelectElementSchema.parse({
        customId: "test",
        maxValues: 0,
      });
    }).toThrow("Number must be greater than or equal to 1");
  });

  test("maxValuesが25を超えるとエラー", () => {
    expect(() => {
      roleSelectElementSchema.parse({
        customId: "test",
        maxValues: 26,
      });
    }).toThrow("Number must be less than or equal to 25");
  });

  test("defaultValuesが25を超えるとエラー", () => {
    expect(() => {
      roleSelectElementSchema.parse({
        customId: "test",
        defaultValues: Array.from({ length: 26 }, (_, i) => ({
          id: `${i}`.padStart(18, "0"),
          type: "role" as const,
        })),
      });
    }).toThrow("Array must contain at most 25 element(s)");
  });
});
