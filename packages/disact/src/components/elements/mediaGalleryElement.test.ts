import { ComponentType } from "discord-api-types/v10";
import { describe, expect, test } from "vitest";
import { mediaGalleryElementSchema } from "./mediaGalleryElement";

describe("mediaGalleryElement", () => {
  test("基本的なmediaGalleryを変換", () => {
    const result = mediaGalleryElementSchema.parse({
      type: "intrinsic",
      name: "message-component",
      props: {
        type: ComponentType.MediaGallery,
        items: [
          {
            media: {
              url: "https://example.com/image1.png",
            },
          },
        ],
      },
      children: null,
    });

    expect(result).toMatchInlineSnapshot(`
      {
        "items": [
          {
            "description": null,
            "media": {
              "url": "https://example.com/image1.png",
            },
          },
        ],
        "type": 12,
      }
    `);
  });

  test("複数のアイテムを持つmediaGallery", () => {
    const result = mediaGalleryElementSchema.parse({
      type: "intrinsic",
      name: "message-component",
      props: {
        type: ComponentType.MediaGallery,
        id: 999,
        items: [
          {
            description: "First image",
            spoiler: false,
            media: {
              url: "https://example.com/image1.png",
            },
          },
          {
            description: "Second image",
            spoiler: true,
            media: {
              url: "https://example.com/image2.jpg",
            },
          },
        ],
      },
      children: null,
    });

    expect(result).toMatchInlineSnapshot(`
      {
        "id": 999,
        "items": [
          {
            "description": "First image",
            "media": {
              "url": "https://example.com/image1.png",
            },
            "spoiler": false,
          },
          {
            "description": "Second image",
            "media": {
              "url": "https://example.com/image2.jpg",
            },
            "spoiler": true,
          },
        ],
        "type": 12,
      }
    `);
  });

  test("不正なname値でエラー", () => {
    expect(() => {
      mediaGalleryElementSchema.parse({
        type: "intrinsic",
        name: "mediaGallery",
        props: {
          type: ComponentType.MediaGallery,
          items: [{ media: { url: "https://example.com/image.png" } }],
        },
        children: null,
      });
    }).toThrow();
  });

  test("childrenがnull以外でエラー", () => {
    expect(() => {
      mediaGalleryElementSchema.parse({
        type: "intrinsic",
        name: "message-component",
        props: {
          type: ComponentType.MediaGallery,
          items: [{ media: { url: "https://example.com/image.png" } }],
        },
        children: [{ type: "text", content: "invalid" }],
      });
    }).toThrow();
  });

  test("itemsが空でエラー", () => {
    expect(() => {
      mediaGalleryElementSchema.parse({
        type: "intrinsic",
        name: "message-component",
        props: {
          type: ComponentType.MediaGallery,
          items: [],
        },
        children: null,
      });
    }).toThrow();
  });

  test("itemsが10個を超えるとエラー", () => {
    expect(() => {
      mediaGalleryElementSchema.parse({
        type: "intrinsic",
        name: "message-component",
        props: {
          type: ComponentType.MediaGallery,
          items: Array.from({ length: 11 }, (_, i) => ({
            media: { url: `https://example.com/image${i}.png` },
          })),
        },
        children: null,
      });
    }).toThrow();
  });
});
