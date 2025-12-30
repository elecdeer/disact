import { describe, expect, test } from "vitest";
import { mentionableSelectElementSchema } from "./mentionableSelectSchema";

describe("mentionableSelectElement", () => {
  test("基本的なmentionable selectを変換", () => {
    const result = mentionableSelectElementSchema.parse({
      customId: "test-mentionable-select",
      placeholder: "Select users or roles",
      minValues: 1,
      maxValues: 5,
      disabled: false,
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
      customId: "mentionable-with-user-defaults",
      defaultValues: [
        { id: "123456789012345678", type: "user" },
        { id: "987654321098765432", type: "user" },
      ],
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
      customId: "mentionable-with-role-defaults",
      defaultValues: [
        { id: "111111111111111111", type: "role" },
        { id: "222222222222222222", type: "role" },
      ],
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
      customId: "mentionable-mixed-defaults",
      defaultValues: [
        { id: "123456789012345678", type: "user" },
        { id: "987654321098765432", type: "role" },
        { id: "111111111111111111", type: "user" },
      ],
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
    expect(() => {
      mentionableSelectElementSchema.parse({
        customId: "a".repeat(101),
      });
    }).toThrow("String must contain at most 100 character(s)");
  });

  test("placeholderが150文字を超えるとエラー", () => {
    expect(() => {
      mentionableSelectElementSchema.parse({
        customId: "test",
        placeholder: "a".repeat(151),
      });
    }).toThrow("String must contain at most 150 character(s)");
  });

  test("minValuesが0未満でエラー", () => {
    expect(() => {
      mentionableSelectElementSchema.parse({
        customId: "test",
        minValues: -1,
      });
    }).toThrow("Number must be greater than or equal to 0");
  });

  test("minValuesが25を超えるとエラー", () => {
    expect(() => {
      mentionableSelectElementSchema.parse({
        customId: "test",
        minValues: 26,
      });
    }).toThrow("Number must be less than or equal to 25");
  });

  test("maxValuesが1未満でエラー", () => {
    expect(() => {
      mentionableSelectElementSchema.parse({
        customId: "test",
        maxValues: 0,
      });
    }).toThrow("Number must be greater than or equal to 1");
  });

  test("maxValuesが25を超えるとエラー", () => {
    expect(() => {
      mentionableSelectElementSchema.parse({
        customId: "test",
        maxValues: 26,
      });
    }).toThrow("Number must be less than or equal to 25");
  });

  test("defaultValuesが25を超えるとエラー", () => {
    expect(() => {
      mentionableSelectElementSchema.parse({
        customId: "test",
        defaultValues: Array.from({ length: 26 }, (_, i) => ({
          id: `${i}`.padStart(18, "0"),
          type: i % 2 === 0 ? ("user" as const) : ("role" as const),
        })),
      });
    }).toThrow("Array must contain at most 25 element(s)");
  });
});
