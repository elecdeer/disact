import { describe, expect, test } from "vitest";
import { sectionElementSchema } from "./sectionElement";

describe("sectionElement", () => {
  test("schema", () => {
    expect(
      sectionElementSchema.parse({
        type: "intrinsic",
        name: "section",
        props: {},
        children: [
          {
            type: "intrinsic",
            name: "slot",
            props: {
              name: "accessory",
            },
            children: [
              {
                type: "intrinsic",
                name: "button",
                props: {
                  customId: "section_button",
                  style: "primary",
                },
                children: [
                  {
                    type: "text",
                    content: "アクション",
                  },
                ],
              },
            ],
          },
          {
            type: "intrinsic",
            name: "slot",
            props: {
              name: "components",
            },
            children: [
              {
                type: "intrinsic",
                name: "textDisplay",
                props: {},
                children: [
                  {
                    type: "text",
                    content: "✨ Hello from disact!",
                  },
                ],
              },
              {
                type: "intrinsic",
                name: "textDisplay",
                props: {},
                children: [
                  {
                    type: "text",
                    content: "実行されたコマンド: /",
                  },
                  {
                    type: "text",
                    content: "test",
                  },
                ],
              },
              {
                type: "intrinsic",
                name: "textDisplay",
                props: {},
                children: [
                  {
                    type: "text",
                    content: "disactを使用してDiscord Message ComponentsをJSXで記述しています！",
                  },
                ],
              },
            ],
          },
        ],
      }),
    ).toMatchInlineSnapshot(`
      {
        "accessory": {
          "custom_id": "section_button",
          "disabled": false,
          "label": "アクション",
          "style": 1,
          "type": 2,
        },
        "components": [
          {
            "content": "✨ Hello from disact!",
            "type": 10,
          },
          {
            "content": "実行されたコマンド: /test",
            "type": 10,
          },
          {
            "content": "disactを使用してDiscord Message ComponentsをJSXで記述しています！",
            "type": 10,
          },
        ],
        "type": 9,
      }
    `);
  });
});
