import { ComponentType } from "discord-api-types/v10";
import { describe, expect, test } from "vitest";
import { thumbnailElementSchema } from "./thumbnailSchema";

describe("thumbnailElement", () => {
  test("基本的なthumbnailを変換", () => {
    const result = thumbnailElementSchema.parse({
      type: "intrinsic",
      name: "message-component",
      props: {
        type: ComponentType.Thumbnail,
        media: {
          url: "https://example.com/image.png",
        },
      },
      children: null,
    });

    expect(result).toMatchInlineSnapshot(`
      {
        "description": null,
        "media": {
          "url": "https://example.com/image.png",
        },
        "type": 11,
      }
    `);
  });

  test("全てのプロパティを持つthumbnail", () => {
    const result = thumbnailElementSchema.parse({
      type: "intrinsic",
      name: "message-component",
      props: {
        type: ComponentType.Thumbnail,
        id: 456,
        description: "A sample thumbnail",
        spoiler: true,
        media: {
          url: "https://example.com/spoiler.jpg",
        },
      },
      children: null,
    });

    expect(result).toMatchInlineSnapshot(`
      {
        "description": "A sample thumbnail",
        "id": 456,
        "media": {
          "url": "https://example.com/spoiler.jpg",
        },
        "spoiler": true,
        "type": 11,
      }
    `);
  });

  test("不正なname値でエラー", () => {
    expect(() => {
      thumbnailElementSchema.parse({
        type: "intrinsic",
        name: "thumbnail",
        props: {
          type: ComponentType.Thumbnail,
          media: { url: "https://example.com/image.png" },
        },
        children: null,
      });
    }).toThrow();
  });

  test("childrenがnull以外でエラー", () => {
    expect(() => {
      thumbnailElementSchema.parse({
        type: "intrinsic",
        name: "message-component",
        props: {
          type: ComponentType.Thumbnail,
          media: { url: "https://example.com/image.png" },
        },
        children: [{ type: "text", content: "invalid" }],
      });
    }).toThrow();
  });

  test("descriptionが長すぎるとエラー", () => {
    expect(() => {
      thumbnailElementSchema.parse({
        type: "intrinsic",
        name: "message-component",
        props: {
          type: ComponentType.Thumbnail,
          description: "a".repeat(1025),
          media: { url: "https://example.com/image.png" },
        },
        children: null,
      });
    }).toThrow();
  });

  test("URLが長すぎるとエラー", () => {
    expect(() => {
      thumbnailElementSchema.parse({
        type: "intrinsic",
        name: "message-component",
        props: {
          type: ComponentType.Thumbnail,
          media: { url: "https://example.com/" + "a".repeat(2048) },
        },
        children: null,
      });
    }).toThrow();
  });
});
