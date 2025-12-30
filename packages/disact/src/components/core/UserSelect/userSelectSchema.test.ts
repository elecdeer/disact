import { describe, expect, test } from "vitest";
import { userSelectElementSchema } from "./userSelectSchema";

describe("userSelectElement", () => {
  test("基本的なuser selectを変換", () => {
    const result = userSelectElementSchema.parse({
      customId: "test-user-select",
      placeholder: "Select a user",
      minValues: 1,
      maxValues: 5,
      disabled: false,
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
      customId: "user-with-defaults",
      defaultValues: [
        { id: "123456789012345678", type: "user" },
        { id: "987654321098765432", type: "user" },
      ],
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
      id: 42,
      customId: "full-user-select",
      placeholder: "Choose users",
      minValues: 2,
      maxValues: 10,
      disabled: true,
      required: true,
      defaultValues: [{ id: "111111111111111111", type: "user" }],
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
    expect(() => {
      userSelectElementSchema.parse({
        customId: "a".repeat(101),
      });
    }).toThrow("String must contain at most 100 character(s)");
  });

  test("placeholderが150文字を超えるとエラー", () => {
    expect(() => {
      userSelectElementSchema.parse({
        customId: "test",
        placeholder: "a".repeat(151),
      });
    }).toThrow("String must contain at most 150 character(s)");
  });

  test("minValuesが0未満でエラー", () => {
    expect(() => {
      userSelectElementSchema.parse({
        customId: "test",
        minValues: -1,
      });
    }).toThrow("Number must be greater than or equal to 0");
  });

  test("minValuesが25を超えるとエラー", () => {
    expect(() => {
      userSelectElementSchema.parse({
        customId: "test",
        minValues: 26,
      });
    }).toThrow("Number must be less than or equal to 25");
  });

  test("maxValuesが1未満でエラー", () => {
    expect(() => {
      userSelectElementSchema.parse({
        customId: "test",
        maxValues: 0,
      });
    }).toThrow("Number must be greater than or equal to 1");
  });

  test("maxValuesが25を超えるとエラー", () => {
    expect(() => {
      userSelectElementSchema.parse({
        customId: "test",
        maxValues: 26,
      });
    }).toThrow("Number must be less than or equal to 25");
  });

  test("defaultValuesが25を超えるとエラー", () => {
    expect(() => {
      userSelectElementSchema.parse({
        customId: "test",
        defaultValues: Array.from({ length: 26 }, (_, i) => ({
          id: `${i}`.padStart(18, "0"),
          type: "user" as const,
        })),
      });
    }).toThrow("Array must contain at most 25 element(s)");
  });
});
