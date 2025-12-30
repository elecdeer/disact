import { ComponentType } from "discord-api-types/v10";
import { describe, expect, test } from "vitest";
import { channelSelectElementSchema } from "./channelSelectSchema";

describe("channelSelectElement", () => {
  test("基本的なchannel selectを変換", () => {
    const result = channelSelectElementSchema.parse({
      type: "intrinsic",
      name: "message-component",
      props: {
        type: ComponentType.ChannelSelect,
        customId: "test-channel-select",
        placeholder: "Select a channel",
        minValues: 1,
        maxValues: 5,
        disabled: false,
      },
      children: null,
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
      type: "intrinsic",
      name: "message-component",
      props: {
        type: ComponentType.ChannelSelect,
        customId: "channel-with-defaults",
        defaultValues: [
          { id: "123456789012345678", type: "channel" },
          { id: "987654321098765432", type: "channel" },
        ],
      },
      children: null,
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
      type: "intrinsic",
      name: "message-component",
      props: {
        type: ComponentType.ChannelSelect,
        customId: "typed-channel-select",
        channelTypes: [0, 2], // GUILD_TEXT, GUILD_VOICE
      },
      children: null,
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
      type: "intrinsic",
      name: "message-component",
      props: {
        type: ComponentType.ChannelSelect,
        id: 42,
        customId: "full-channel-select",
        placeholder: "Choose channels",
        minValues: 2,
        maxValues: 10,
        disabled: true,
        required: true,
        defaultValues: [{ id: "111111111111111111", type: "channel" }],
        channelTypes: [0, 5], // GUILD_TEXT, GUILD_ANNOUNCEMENT
      },
      children: null,
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
    const result = channelSelectElementSchema.safeParse({
      type: "intrinsic",
      name: "message-component",
      props: {
        type: ComponentType.ChannelSelect,
        customId: "a".repeat(101),
      },
      children: null,
    });
    expect(result.success).toBe(false);
  });

  test("placeholderが150文字を超えるとエラー", () => {
    const result = channelSelectElementSchema.safeParse({
      type: "intrinsic",
      name: "message-component",
      props: {
        type: ComponentType.ChannelSelect,
        customId: "test",
        placeholder: "a".repeat(151),
      },
      children: null,
    });
    expect(result.success).toBe(false);
  });

  test("minValuesが0未満でエラー", () => {
    const result = channelSelectElementSchema.safeParse({
      type: "intrinsic",
      name: "message-component",
      props: {
        type: ComponentType.ChannelSelect,
        customId: "test",
        minValues: -1,
      },
      children: null,
    });
    expect(result.success).toBe(false);
  });

  test("minValuesが25を超えるとエラー", () => {
    const result = channelSelectElementSchema.safeParse({
      type: "intrinsic",
      name: "message-component",
      props: {
        type: ComponentType.ChannelSelect,
        customId: "test",
        minValues: 26,
      },
      children: null,
    });
    expect(result.success).toBe(false);
  });

  test("maxValuesが1未満でエラー", () => {
    const result = channelSelectElementSchema.safeParse({
      type: "intrinsic",
      name: "message-component",
      props: {
        type: ComponentType.ChannelSelect,
        customId: "test",
        maxValues: 0,
      },
      children: null,
    });
    expect(result.success).toBe(false);
  });

  test("maxValuesが25を超えるとエラー", () => {
    const result = channelSelectElementSchema.safeParse({
      type: "intrinsic",
      name: "message-component",
      props: {
        type: ComponentType.ChannelSelect,
        customId: "test",
        maxValues: 26,
      },
      children: null,
    });
    expect(result.success).toBe(false);
  });

  test("defaultValuesが25を超えるとエラー", () => {
    const result = channelSelectElementSchema.safeParse({
      type: "intrinsic",
      name: "message-component",
      props: {
        type: ComponentType.ChannelSelect,
        customId: "test",
        defaultValues: Array.from({ length: 26 }, (_, i) => ({
          id: `${i}`.padStart(18, "0"),
          type: "channel" as const,
        })),
      },
      children: null,
    });
    expect(result.success).toBe(false);
  });
});
