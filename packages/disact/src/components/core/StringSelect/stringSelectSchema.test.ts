import { describe, expect, test } from "vitest";
import { stringSelectElementSchema } from "./stringSelectSchema";

describe("stringSelectElement", () => {
  test("基本的なstring selectを変換", () => {
    const result = stringSelectElementSchema.parse({
      customId: "test-string-select",
      placeholder: "Select an option",
      options: [
        { label: "Option 1", value: "opt1" },
        { label: "Option 2", value: "opt2" },
      ],
    });

    expect(result).toMatchInlineSnapshot(`
      {
        "custom_id": "test-string-select",
        "options": [
          {
            "label": "Option 1",
            "value": "opt1",
          },
          {
            "label": "Option 2",
            "value": "opt2",
          },
        ],
        "placeholder": "Select an option",
        "type": 3,
      }
    `);
  });

  test("descriptionを含むoptionsを変換", () => {
    const result = stringSelectElementSchema.parse({
      customId: "string-with-desc",
      options: [
        {
          label: "Option A",
          value: "a",
          description: "This is option A",
        },
        {
          label: "Option B",
          value: "b",
          description: "This is option B",
        },
      ],
    });

    expect(result).toMatchInlineSnapshot(`
      {
        "custom_id": "string-with-desc",
        "options": [
          {
            "description": "This is option A",
            "label": "Option A",
            "value": "a",
          },
          {
            "description": "This is option B",
            "label": "Option B",
            "value": "b",
          },
        ],
        "type": 3,
      }
    `);
  });

  test("defaultオプションを含むstring selectを変換", () => {
    const result = stringSelectElementSchema.parse({
      customId: "string-with-default",
      options: [
        { label: "First", value: "first", default: true },
        { label: "Second", value: "second" },
        { label: "Third", value: "third" },
      ],
    });

    expect(result).toMatchInlineSnapshot(`
      {
        "custom_id": "string-with-default",
        "options": [
          {
            "default": true,
            "label": "First",
            "value": "first",
          },
          {
            "label": "Second",
            "value": "second",
          },
          {
            "label": "Third",
            "value": "third",
          },
        ],
        "type": 3,
      }
    `);
  });

  test("emojiを含むoptionsを変換", () => {
    const result = stringSelectElementSchema.parse({
      customId: "string-with-emoji",
      options: [
        {
          label: "Happy",
          value: "happy",
          emoji: { name: "😊" },
        },
        {
          label: "Custom",
          value: "custom",
          emoji: { id: "123456789", name: "custom_emoji" },
        },
      ],
    });

    expect(result).toMatchInlineSnapshot(`
      {
        "custom_id": "string-with-emoji",
        "options": [
          {
            "emoji": {
              "name": "😊",
            },
            "label": "Happy",
            "value": "happy",
          },
          {
            "emoji": {
              "id": "123456789",
              "name": "custom_emoji",
            },
            "label": "Custom",
            "value": "custom",
          },
        ],
        "type": 3,
      }
    `);
  });

  test("全てのオプションを含むstring selectを変換", () => {
    const result = stringSelectElementSchema.parse({
      id: 42,
      customId: "full-string-select",
      placeholder: "Choose an option",
      minValues: 2,
      maxValues: 3,
      disabled: true,
      required: true,
      options: [
        {
          label: "First Option",
          value: "first",
          description: "The first option",
          default: true,
          emoji: { name: "1️⃣" },
        },
        {
          label: "Second Option",
          value: "second",
          description: "The second option",
        },
        {
          label: "Third Option",
          value: "third",
        },
      ],
    });

    expect(result).toMatchInlineSnapshot(`
      {
        "custom_id": "full-string-select",
        "disabled": true,
        "id": 42,
        "max_values": 3,
        "min_values": 2,
        "options": [
          {
            "default": true,
            "description": "The first option",
            "emoji": {
              "name": "1️⃣",
            },
            "label": "First Option",
            "value": "first",
          },
          {
            "description": "The second option",
            "label": "Second Option",
            "value": "second",
          },
          {
            "label": "Third Option",
            "value": "third",
          },
        ],
        "placeholder": "Choose an option",
        "required": true,
        "type": 3,
      }
    `);
  });

  test("customIdが100文字を超えるとエラー", () => {
    expect(() => {
      stringSelectElementSchema.parse({
        customId: "a".repeat(101),
        options: [{ label: "Test", value: "test" }],
      });
    }).toThrow("String must contain at most 100 character(s)");
  });

  test("placeholderが150文字を超えるとエラー", () => {
    expect(() => {
      stringSelectElementSchema.parse({
        customId: "test",
        placeholder: "a".repeat(151),
        options: [{ label: "Test", value: "test" }],
      });
    }).toThrow("String must contain at most 150 character(s)");
  });

  test("optionsが空の配列でエラー", () => {
    expect(() => {
      stringSelectElementSchema.parse({
        customId: "test",
        options: [],
      });
    }).toThrow("Array must contain at least 1 element(s)");
  });

  test("optionsが25を超えるとエラー", () => {
    expect(() => {
      stringSelectElementSchema.parse({
        customId: "test",
        options: Array.from({ length: 26 }, (_, i) => ({
          label: `Option ${i}`,
          value: `opt${i}`,
        })),
      });
    }).toThrow("Array must contain at most 25 element(s)");
  });

  test("option labelが空文字列でエラー", () => {
    expect(() => {
      stringSelectElementSchema.parse({
        customId: "test",
        options: [{ label: "", value: "test" }],
      });
    }).toThrow("String must contain at least 1 character(s)");
  });

  test("option labelが100文字を超えるとエラー", () => {
    expect(() => {
      stringSelectElementSchema.parse({
        customId: "test",
        options: [{ label: "a".repeat(101), value: "test" }],
      });
    }).toThrow("String must contain at most 100 character(s)");
  });

  test("option valueが空文字列でエラー", () => {
    expect(() => {
      stringSelectElementSchema.parse({
        customId: "test",
        options: [{ label: "Test", value: "" }],
      });
    }).toThrow("String must contain at least 1 character(s)");
  });

  test("option valueが100文字を超えるとエラー", () => {
    expect(() => {
      stringSelectElementSchema.parse({
        customId: "test",
        options: [{ label: "Test", value: "a".repeat(101) }],
      });
    }).toThrow("String must contain at most 100 character(s)");
  });

  test("option descriptionが100文字を超えるとエラー", () => {
    expect(() => {
      stringSelectElementSchema.parse({
        customId: "test",
        options: [
          {
            label: "Test",
            value: "test",
            description: "a".repeat(101),
          },
        ],
      });
    }).toThrow("String must contain at most 100 character(s)");
  });

  test("minValuesが0未満でエラー", () => {
    expect(() => {
      stringSelectElementSchema.parse({
        customId: "test",
        minValues: -1,
        options: [{ label: "Test", value: "test" }],
      });
    }).toThrow("Number must be greater than or equal to 0");
  });

  test("minValuesが25を超えるとエラー", () => {
    expect(() => {
      stringSelectElementSchema.parse({
        customId: "test",
        minValues: 26,
        options: [{ label: "Test", value: "test" }],
      });
    }).toThrow("Number must be less than or equal to 25");
  });

  test("maxValuesが1未満でエラー", () => {
    expect(() => {
      stringSelectElementSchema.parse({
        customId: "test",
        maxValues: 0,
        options: [{ label: "Test", value: "test" }],
      });
    }).toThrow("Number must be greater than or equal to 1");
  });

  test("maxValuesが25を超えるとエラー", () => {
    expect(() => {
      stringSelectElementSchema.parse({
        customId: "test",
        maxValues: 26,
        options: [{ label: "Test", value: "test" }],
      });
    }).toThrow("Number must be less than or equal to 25");
  });
});
