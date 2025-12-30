import { ComponentType } from "discord-api-types/v10";
import { describe, expect, test } from "vitest";
import { fileElementSchema } from "./fileSchema";

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
    const result = fileElementSchema.safeParse({
      type: "intrinsic",
      name: "file",
      props: {
        type: ComponentType.File,
        file: { url: "https://example.com/file.txt" },
      },
      children: null,
    });
    expect(result.success).toBe(false);
  });

  test("childrenがnull以外でエラー", () => {
    const result = fileElementSchema.safeParse({
      type: "intrinsic",
      name: "message-component",
      props: {
        type: ComponentType.File,
        file: { url: "https://example.com/file.txt" },
      },
      children: [{ type: "text", content: "invalid" }],
    });
    expect(result.success).toBe(false);
  });

  test("URLが長すぎるとエラー", () => {
    const result = fileElementSchema.safeParse({
      type: "intrinsic",
      name: "message-component",
      props: {
        type: ComponentType.File,
        file: { url: `https://example.com/${"a".repeat(2048)}` },
      },
      children: null,
    });
    expect(result.success).toBe(false);
  });
});
