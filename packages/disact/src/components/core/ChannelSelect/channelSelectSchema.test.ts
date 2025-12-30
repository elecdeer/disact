import { describe, expect, test } from "vitest";
import { channelSelectElementSchema } from "./channelSelectSchema";

describe("channelSelectElement", () => {
  test("基本的なchannel selectを変換", () => {
    const result = channelSelectElementSchema.parse({
      customId: "test-channel-select",
      placeholder: "Select a channel",
      minValues: 1,
      maxValues: 5,
      disabled: false,
    });

    expect(result).toMatchInlineSnapshot(`
      {
        "custom_id": "test-channel-select",
        "disabled": false,
        "max_values": 5,
        "min_values": 1,
        "placeholder": "Select a channel",
        "type": 8,
      }
    `);
  });

  test("defaultValuesを含むchannel selectを変換", () => {
    const result = channelSelectElementSchema.parse({
      customId: "channel-with-defaults",
      defaultValues: [
        { id: "123456789012345678", type: "channel" },
        { id: "987654321098765432", type: "channel" },
      ],
    });

    expect(result).toMatchInlineSnapshot(`
      {
        "custom_id": "channel-with-defaults",
        "default_values": [
          {
            "id": "123456789012345678",
            "type": "channel",
          },
          {
            "id": "987654321098765432",
            "type": "channel",
          },
        ],
        "type": 8,
      }
    `);
  });

  test("channelTypesを含むchannel selectを変換", () => {
    const result = channelSelectElementSchema.parse({
      customId: "typed-channel-select",
      channelTypes: [0, 2], // GUILD_TEXT, GUILD_VOICE
    });

    expect(result).toMatchInlineSnapshot(`
      {
        "channel_types": [
          0,
          2,
        ],
        "custom_id": "typed-channel-select",
        "type": 8,
      }
    `);
  });

  test("全てのオプションを含むchannel selectを変換", () => {
    const result = channelSelectElementSchema.parse({
      id: 42,
      customId: "full-channel-select",
      placeholder: "Choose channels",
      minValues: 2,
      maxValues: 10,
      disabled: true,
      required: true,
      defaultValues: [{ id: "111111111111111111", type: "channel" }],
      channelTypes: [0, 5], // GUILD_TEXT, GUILD_ANNOUNCEMENT
    });

    expect(result).toMatchInlineSnapshot(`
      {
        "channel_types": [
          0,
          5,
        ],
        "custom_id": "full-channel-select",
        "default_values": [
          {
            "id": "111111111111111111",
            "type": "channel",
          },
        ],
        "disabled": true,
        "id": 42,
        "max_values": 10,
        "min_values": 2,
        "placeholder": "Choose channels",
        "required": true,
        "type": 8,
      }
    `);
  });

  test("customIdが100文字を超えるとエラー", () => {
    expect(() => {
      channelSelectElementSchema.parse({
        customId: "a".repeat(101),
      });
    }).toThrow("String must contain at most 100 character(s)");
  });

  test("placeholderが150文字を超えるとエラー", () => {
    expect(() => {
      channelSelectElementSchema.parse({
        customId: "test",
        placeholder: "a".repeat(151),
      });
    }).toThrow("String must contain at most 150 character(s)");
  });

  test("minValuesが0未満でエラー", () => {
    expect(() => {
      channelSelectElementSchema.parse({
        customId: "test",
        minValues: -1,
      });
    }).toThrow("Number must be greater than or equal to 0");
  });

  test("minValuesが25を超えるとエラー", () => {
    expect(() => {
      channelSelectElementSchema.parse({
        customId: "test",
        minValues: 26,
      });
    }).toThrow("Number must be less than or equal to 25");
  });

  test("maxValuesが1未満でエラー", () => {
    expect(() => {
      channelSelectElementSchema.parse({
        customId: "test",
        maxValues: 0,
      });
    }).toThrow("Number must be greater than or equal to 1");
  });

  test("maxValuesが25を超えるとエラー", () => {
    expect(() => {
      channelSelectElementSchema.parse({
        customId: "test",
        maxValues: 26,
      });
    }).toThrow("Number must be less than or equal to 25");
  });

  test("defaultValuesが25を超えるとエラー", () => {
    expect(() => {
      channelSelectElementSchema.parse({
        customId: "test",
        defaultValues: Array.from({ length: 26 }, (_, i) => ({
          id: `${i}`.padStart(18, "0"),
          type: "channel" as const,
        })),
      });
    }).toThrow("Array must contain at most 25 element(s)");
  });
});
