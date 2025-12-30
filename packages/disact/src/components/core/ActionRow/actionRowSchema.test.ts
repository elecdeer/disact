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
              type: "intrinsic",
              name: "message-component",
              props: {
                type: ComponentType.Button,
                customId: "button1",
                style: "primary",
              },
              children: null,
            },
            {
              type: "intrinsic",
              name: "message-component",
              props: {
                type: ComponentType.Button,
                customId: "button2",
                style: "secondary",
              },
              children: null,
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
            "disabled": false,
            "style": 1,
            "type": 2,
          },
          {
            "custom_id": "button2",
            "disabled": false,
            "style": 2,
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
              type: "intrinsic",
              name: "message-component",
              props: {
                type: ComponentType.StringSelect,
                customId: "select1",
                options: [
                  { label: "Option 1", value: "1" },
                  { label: "Option 2", value: "2" },
                ],
              },
              children: null,
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
              type: "intrinsic",
              name: "message-component",
              props: {
                type: ComponentType.UserSelect,
                customId: "user-select",
                placeholder: "Select users",
              },
              children: null,
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
              type: "intrinsic",
              name: "message-component",
              props: {
                type: ComponentType.RoleSelect,
                customId: "role-select",
                placeholder: "Select roles",
              },
              children: null,
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
              type: "intrinsic",
              name: "message-component",
              props: {
                type: ComponentType.MentionableSelect,
                customId: "mentionable-select",
                placeholder: "Select users or roles",
              },
              children: null,
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
              type: "intrinsic",
              name: "message-component",
              props: {
                type: ComponentType.ChannelSelect,
                customId: "channel-select",
                placeholder: "Select channels",
              },
              children: null,
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
            {
              type: "intrinsic",
              name: "message-component",
              props: { type: ComponentType.Button, customId: "btn1", style: "primary" },
              children: null,
            },
            {
              type: "intrinsic",
              name: "message-component",
              props: { type: ComponentType.Button, customId: "btn2", style: "secondary" },
              children: null,
            },
            {
              type: "intrinsic",
              name: "message-component",
              props: { type: ComponentType.Button, customId: "btn3", style: "success" },
              children: null,
            },
            {
              type: "intrinsic",
              name: "message-component",
              props: { type: ComponentType.Button, customId: "btn4", style: "danger" },
              children: null,
            },
            {
              type: "intrinsic",
              name: "message-component",
              props: { type: ComponentType.Button, style: "link", url: "https://example.com" },
              children: null,
            },
          ],
        },
      ],
    });

    expect(result).toMatchInlineSnapshot(`
      {
        "components": [
          {
            "custom_id": "btn1",
            "disabled": false,
            "style": 1,
            "type": 2,
          },
          {
            "custom_id": "btn2",
            "disabled": false,
            "style": 2,
            "type": 2,
          },
          {
            "custom_id": "btn3",
            "disabled": false,
            "style": 3,
            "type": 2,
          },
          {
            "custom_id": "btn4",
            "disabled": false,
            "style": 4,
            "type": 2,
          },
          {
            "disabled": false,
            "style": 5,
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
              {
                type: "intrinsic",
                name: "message-component",
                props: { type: ComponentType.Button, customId: "btn1", style: "primary" },
                children: null,
              },
              {
                type: "intrinsic",
                name: "message-component",
                props: { type: ComponentType.Button, customId: "btn2", style: "primary" },
                children: null,
              },
              {
                type: "intrinsic",
                name: "message-component",
                props: { type: ComponentType.Button, customId: "btn3", style: "primary" },
                children: null,
              },
              {
                type: "intrinsic",
                name: "message-component",
                props: { type: ComponentType.Button, customId: "btn4", style: "primary" },
                children: null,
              },
              {
                type: "intrinsic",
                name: "message-component",
                props: { type: ComponentType.Button, customId: "btn5", style: "primary" },
                children: null,
              },
              {
                type: "intrinsic",
                name: "message-component",
                props: { type: ComponentType.Button, customId: "btn6", style: "primary" },
                children: null,
              },
            ],
          },
        ],
      });
    }).toThrow("Array must contain at most 5 element(s)");
  });
});
