import { ComponentType } from "discord-api-types/v10";
import { describe, expect, test } from "vitest";
import { fileElementSchema } from "./fileElement";

describe("fileElement", () => {
  test("基本的なfileを変換", () => {
    const result = fileElementSchema.parse({
      type: "intrinsic",
      name: "message-component",
      props: {
        type: ComponentType.File,
        file: {
          url: "https://example.com/document.pdf",
        },
      },
      children: null,
    });

    expect(result).toMatchInlineSnapshot(`
      {
        "file": {
          "url": "https://example.com/document.pdf",
        },
        "type": 13,
      }
    `);
  });

  test("全てのプロパティを持つfile", () => {
    const result = fileElementSchema.parse({
      type: "intrinsic",
      name: "message-component",
      props: {
        type: ComponentType.File,
        id: 789,
        spoiler: true,
        file: {
          url: "https://example.com/secret.zip",
        },
      },
      children: null,
    });

    expect(result).toMatchInlineSnapshot(`
      {
        "file": {
          "url": "https://example.com/secret.zip",
        },
        "id": 789,
        "spoiler": true,
        "type": 13,
      }
    `);
  });

  test("不正なname値でエラー", () => {
    expect(() => {
      fileElementSchema.parse({
        type: "intrinsic",
        name: "file",
        props: {
          type: ComponentType.File,
          file: { url: "https://example.com/file.txt" },
        },
        children: null,
      });
    }).toThrow();
  });

  test("childrenがnull以外でエラー", () => {
    expect(() => {
      fileElementSchema.parse({
        type: "intrinsic",
        name: "message-component",
        props: {
          type: ComponentType.File,
          file: { url: "https://example.com/file.txt" },
        },
        children: [{ type: "text", content: "invalid" }],
      });
    }).toThrow();
  });

  test("URLが長すぎるとエラー", () => {
    expect(() => {
      fileElementSchema.parse({
        type: "intrinsic",
        name: "message-component",
        props: {
          type: ComponentType.File,
          file: { url: "https://example.com/" + "a".repeat(2048) },
        },
        children: null,
      });
    }).toThrow();
  });
});
