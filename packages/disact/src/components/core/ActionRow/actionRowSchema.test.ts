import { ComponentType } from "discord-api-types/v10";
import { describe, expect, test } from "vitest";
import { actionRowInMessageElementSchema } from "./actionRowSchema";

describe("actionRowInMessageElement", () => {
  test("ボタンを含むaction rowを変換", () => {
    const result = actionRowInMessageElementSchema.parse({
      type: "intrinsic",
      name: "message-component",
      props: {
        type: ComponentType.ActionRow,
      },
      children: [
        {
          type: "intrinsic",
          name: "slot",
          props: { name: "components" },
          children: [
            {
              customId: "button1",
              style: "primary",
            },
            {
              customId: "button2",
              style: "secondary",
            },
          ],
        },
      ],
    });

    expect(result).toMatchInlineSnapshot(`
      {
        "components": [
          {
            "custom_id": "button1",
            "style": "primary",
            "type": 2,
          },
          {
            "custom_id": "button2",
            "style": "secondary",
            "type": 2,
          },
        ],
        "type": 1,
      }
    `);
  });

  test("string selectを含むaction rowを変換", () => {
    const result = actionRowInMessageElementSchema.parse({
      type: "intrinsic",
      name: "message-component",
      props: {
        type: ComponentType.ActionRow,
      },
      children: [
        {
          type: "intrinsic",
          name: "slot",
          props: { name: "components" },
          children: [
            {
              customId: "select1",
              options: [
                { label: "Option 1", value: "1" },
                { label: "Option 2", value: "2" },
              ],
            },
          ],
        },
      ],
    });

    expect(result).toMatchInlineSnapshot(`
      {
        "components": [
          {
            "custom_id": "select1",
            "options": [
              {
                "label": "Option 1",
                "value": "1",
              },
              {
                "label": "Option 2",
                "value": "2",
              },
            ],
            "type": 3,
          },
        ],
        "type": 1,
      }
    `);
  });

  test("user selectを含むaction rowを変換", () => {
    const result = actionRowInMessageElementSchema.parse({
      type: "intrinsic",
      name: "message-component",
      props: {
        type: ComponentType.ActionRow,
      },
      children: [
        {
          type: "intrinsic",
          name: "slot",
          props: { name: "components" },
          children: [
            {
              customId: "user-select",
              placeholder: "Select users",
            },
          ],
        },
      ],
    });

    expect(result).toMatchInlineSnapshot(`
      {
        "components": [
          {
            "custom_id": "user-select",
            "placeholder": "Select users",
            "type": 5,
          },
        ],
        "type": 1,
      }
    `);
  });

  test("role selectを含むaction rowを変換", () => {
    const result = actionRowInMessageElementSchema.parse({
      type: "intrinsic",
      name: "message-component",
      props: {
        type: ComponentType.ActionRow,
      },
      children: [
        {
          type: "intrinsic",
          name: "slot",
          props: { name: "components" },
          children: [
            {
              customId: "role-select",
              placeholder: "Select roles",
            },
          ],
        },
      ],
    });

    expect(result).toMatchInlineSnapshot(`
      {
        "components": [
          {
            "custom_id": "role-select",
            "placeholder": "Select roles",
            "type": 6,
          },
        ],
        "type": 1,
      }
    `);
  });

  test("mentionable selectを含むaction rowを変換", () => {
    const result = actionRowInMessageElementSchema.parse({
      type: "intrinsic",
      name: "message-component",
      props: {
        type: ComponentType.ActionRow,
      },
      children: [
        {
          type: "intrinsic",
          name: "slot",
          props: { name: "components" },
          children: [
            {
              customId: "mentionable-select",
              placeholder: "Select users or roles",
            },
          ],
        },
      ],
    });

    expect(result).toMatchInlineSnapshot(`
      {
        "components": [
          {
            "custom_id": "mentionable-select",
            "placeholder": "Select users or roles",
            "type": 7,
          },
        ],
        "type": 1,
      }
    `);
  });

  test("channel selectを含むaction rowを変換", () => {
    const result = actionRowInMessageElementSchema.parse({
      type: "intrinsic",
      name: "message-component",
      props: {
        type: ComponentType.ActionRow,
      },
      children: [
        {
          type: "intrinsic",
          name: "slot",
          props: { name: "components" },
          children: [
            {
              customId: "channel-select",
              placeholder: "Select channels",
            },
          ],
        },
      ],
    });

    expect(result).toMatchInlineSnapshot(`
      {
        "components": [
          {
            "custom_id": "channel-select",
            "placeholder": "Select channels",
            "type": 8,
          },
        ],
        "type": 1,
      }
    `);
  });

  test("複数のボタンを含むaction rowを変換", () => {
    const result = actionRowInMessageElementSchema.parse({
      type: "intrinsic",
      name: "message-component",
      props: {
        type: ComponentType.ActionRow,
        id: 123,
      },
      children: [
        {
          type: "intrinsic",
          name: "slot",
          props: { name: "components" },
          children: [
            { customId: "btn1", style: "primary" },
            { customId: "btn2", style: "secondary" },
            { customId: "btn3", style: "success" },
            { customId: "btn4", style: "danger" },
            { style: "link", url: "https://example.com" },
          ],
        },
      ],
    });

    expect(result).toMatchInlineSnapshot(`
      {
        "components": [
          {
            "custom_id": "btn1",
            "style": "primary",
            "type": 2,
          },
          {
            "custom_id": "btn2",
            "style": "secondary",
            "type": 2,
          },
          {
            "custom_id": "btn3",
            "style": "success",
            "type": 2,
          },
          {
            "custom_id": "btn4",
            "style": "danger",
            "type": 2,
          },
          {
            "style": "link",
            "type": 2,
            "url": "https://example.com",
          },
        ],
        "id": 123,
        "type": 1,
      }
    `);
  });

  test("componentsが空の配列でエラー", () => {
    expect(() => {
      actionRowInMessageElementSchema.parse({
        type: "intrinsic",
        name: "message-component",
        props: {
          type: ComponentType.ActionRow,
        },
        children: [
          {
            type: "intrinsic",
            name: "slot",
            props: { name: "components" },
            children: [],
          },
        ],
      });
    }).toThrow("Array must contain at least 1 element(s)");
  });

  test("componentsが5つを超えるとエラー", () => {
    expect(() => {
      actionRowInMessageElementSchema.parse({
        type: "intrinsic",
        name: "message-component",
        props: {
          type: ComponentType.ActionRow,
        },
        children: [
          {
            type: "intrinsic",
            name: "slot",
            props: { name: "components" },
            children: [
              { customId: "btn1", style: "primary" },
              { customId: "btn2", style: "primary" },
              { customId: "btn3", style: "primary" },
              { customId: "btn4", style: "primary" },
              { customId: "btn5", style: "primary" },
              { customId: "btn6", style: "primary" },
            ],
          },
        ],
      });
    }).toThrow("Array must contain at most 5 element(s)");
  });
});
