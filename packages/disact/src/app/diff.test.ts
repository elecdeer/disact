import { describe, expect, it } from "vitest";
import type { PayloadElements } from "../components/index";
import { isDifferentPayloadElement } from "./diff";

describe("isDifferentPayloadElement", () => {
  describe("基本的な比較", () => {
    it("完全に同じ配列の場合は false を返す", () => {
      const payload: PayloadElements = [
        {
          type: 1,
          components: [
            { type: 2, style: 1, custom_id: "btn_1", label: "Hello" },
          ],
        },
      ];
      expect(isDifferentPayloadElement(payload, payload)).toBe(false);
    });

    it("同じ内容の異なる配列の場合は false を返す", () => {
      const prev: PayloadElements = [
        {
          type: 1,
          components: [
            { type: 2, style: 1, custom_id: "btn_1", label: "Hello" },
          ],
        },
      ];
      const next: PayloadElements = [
        {
          type: 1,
          components: [
            { type: 2, style: 1, custom_id: "btn_1", label: "Hello" },
          ],
        },
      ];
      expect(isDifferentPayloadElement(prev, next)).toBe(false);
    });

    it("空配列同士の比較は false を返す", () => {
      const prev: PayloadElements = [];
      const next: PayloadElements = [];
      expect(isDifferentPayloadElement(prev, next)).toBe(false);
    });
  });

  describe("配列の長さの比較", () => {
    it("配列の長さが異なる場合は true を返す", () => {
      const prev: PayloadElements = [
        {
          type: 1,
          components: [
            { type: 2, style: 1, custom_id: "btn_1", label: "Hello" },
          ],
        },
      ];
      const next: PayloadElements = [
        {
          type: 1,
          components: [
            { type: 2, style: 1, custom_id: "btn_1", label: "Hello" },
          ],
        },
        {
          type: 1,
          components: [
            { type: 2, style: 1, custom_id: "btn_2", label: "World" },
          ],
        },
      ];
      expect(isDifferentPayloadElement(prev, next)).toBe(true);
    });

    it("空配列と要素がある配列は true を返す", () => {
      const prev: PayloadElements = [];
      const next: PayloadElements = [
        {
          type: 1,
          components: [
            { type: 2, style: 1, custom_id: "btn_1", label: "Hello" },
          ],
        },
      ];
      expect(isDifferentPayloadElement(prev, next)).toBe(true);
    });
  });

  describe("要素の内容の比較", () => {
    it("要素のプリミティブ値が異なる場合は true を返す", () => {
      const prev: PayloadElements = [
        {
          type: 1,
          components: [
            { type: 2, style: 1, custom_id: "btn_1", label: "Hello" },
          ],
        },
      ];
      const next: PayloadElements = [
        {
          type: 1,
          components: [
            { type: 2, style: 1, custom_id: "btn_1", label: "World" },
          ],
        },
      ];
      expect(isDifferentPayloadElement(prev, next)).toBe(true);
    });

    it("要素の数値プロパティが異なる場合は true を返す", () => {
      const prev: PayloadElements = [
        {
          type: 1,
          components: [
            { type: 2, style: 1, custom_id: "btn_1", label: "Hello" },
          ],
        },
      ];
      const next: PayloadElements = [
        {
          type: 1,
          components: [
            { type: 2, style: 2, custom_id: "btn_1", label: "Hello" },
          ],
        },
      ];
      expect(isDifferentPayloadElement(prev, next)).toBe(true);
    });

    it("要素のtype が異なる場合は true を返す", () => {
      const prev: PayloadElements = [
        {
          type: 1,
          components: [
            { type: 2, style: 1, custom_id: "btn_1", label: "Hello" },
          ],
        },
      ];
      const next: PayloadElements = [
        {
          type: 1,
          components: [
            {
              type: 3,
              custom_id: "select_1",
              options: [{ label: "Hello", value: "hello" }],
            },
          ],
        },
      ];
      expect(isDifferentPayloadElement(prev, next)).toBe(true);
    });
  });

  describe("ネストした配列の比較", () => {
    it("ネストした配列の内容が同じ場合は false を返す", () => {
      const prev: PayloadElements = [
        {
          type: 1,
          components: [
            { type: 2, style: 1, custom_id: "btn_1", label: "Hello" },
            { type: 2, style: 1, custom_id: "btn_2", label: "World" },
          ],
        },
      ];
      const next: PayloadElements = [
        {
          type: 1,
          components: [
            { type: 2, style: 1, custom_id: "btn_1", label: "Hello" },
            { type: 2, style: 1, custom_id: "btn_2", label: "World" },
          ],
        },
      ];
      expect(isDifferentPayloadElement(prev, next)).toBe(false);
    });

    it("ネストした配列の内容が異なる場合は true を返す", () => {
      const prev: PayloadElements = [
        {
          type: 1,
          components: [
            { type: 2, style: 1, custom_id: "btn_1", label: "Hello" },
            { type: 2, style: 1, custom_id: "btn_2", label: "World" },
          ],
        },
      ];
      const next: PayloadElements = [
        {
          type: 1,
          components: [
            { type: 2, style: 1, custom_id: "btn_1", label: "Hello" },
            { type: 2, style: 1, custom_id: "btn_2", label: "Changed" },
          ],
        },
      ];
      expect(isDifferentPayloadElement(prev, next)).toBe(true);
    });

    it("ネストした配列の長さが異なる場合は true を返す", () => {
      const prev: PayloadElements = [
        {
          type: 1,
          components: [
            { type: 2, style: 1, custom_id: "btn_1", label: "Hello" },
          ],
        },
      ];
      const next: PayloadElements = [
        {
          type: 1,
          components: [
            { type: 2, style: 1, custom_id: "btn_1", label: "Hello" },
            { type: 2, style: 1, custom_id: "btn_2", label: "World" },
          ],
        },
      ];
      expect(isDifferentPayloadElement(prev, next)).toBe(true);
    });

    it("ネストした配列の順序が異なる場合は true を返す", () => {
      const prev: PayloadElements = [
        {
          type: 1,
          components: [
            { type: 2, style: 1, custom_id: "btn_1", label: "Hello" },
            { type: 2, style: 1, custom_id: "btn_2", label: "World" },
          ],
        },
      ];
      const next: PayloadElements = [
        {
          type: 1,
          components: [
            { type: 2, style: 1, custom_id: "btn_2", label: "World" },
            { type: 2, style: 1, custom_id: "btn_1", label: "Hello" },
          ],
        },
      ];
      expect(isDifferentPayloadElement(prev, next)).toBe(true);
    });
  });

  describe("オプショナルプロパティの比較", () => {
    it("undefined と値の比較では true を返す", () => {
      const prev: PayloadElements = [
        {
          type: 1,
          components: [
            { type: 2, style: 1, custom_id: "btn_1", label: "Hello" },
          ],
        },
      ];
      const next: PayloadElements = [
        {
          type: 1,
          components: [
            {
              type: 2,
              style: 1,
              custom_id: "btn_1",
              label: "Hello",
              disabled: true,
            },
          ],
        },
      ];
      expect(isDifferentPayloadElement(prev, next)).toBe(true);
    });

    it("値と undefined の比較では true を返す", () => {
      const prev: PayloadElements = [
        {
          type: 1,
          components: [
            {
              type: 2,
              style: 1,
              custom_id: "btn_1",
              label: "Hello",
              disabled: true,
            },
          ],
        },
      ];
      const next: PayloadElements = [
        {
          type: 1,
          components: [
            { type: 2, style: 1, custom_id: "btn_1", label: "Hello" },
          ],
        },
      ];
      expect(isDifferentPayloadElement(prev, next)).toBe(true);
    });

    it("undefined 同士の比較では false を返す", () => {
      const prev: PayloadElements = [
        {
          type: 1,
          components: [
            { type: 2, style: 1, custom_id: "btn_1", label: "Hello" },
          ],
        },
      ];
      const next: PayloadElements = [
        {
          type: 1,
          components: [
            { type: 2, style: 1, custom_id: "btn_1", label: "Hello" },
          ],
        },
      ];
      expect(isDifferentPayloadElement(prev, next)).toBe(false);
    });
  });

  describe("複数の要素の比較", () => {
    it("複数の要素が同じ場合は false を返す", () => {
      const prev: PayloadElements = [
        {
          type: 1,
          components: [
            { type: 2, style: 1, custom_id: "btn_1", label: "First" },
          ],
        },
        {
          type: 1,
          components: [
            { type: 2, style: 1, custom_id: "btn_2", label: "Second" },
          ],
        },
      ];
      const next: PayloadElements = [
        {
          type: 1,
          components: [
            { type: 2, style: 1, custom_id: "btn_1", label: "First" },
          ],
        },
        {
          type: 1,
          components: [
            { type: 2, style: 1, custom_id: "btn_2", label: "Second" },
          ],
        },
      ];
      expect(isDifferentPayloadElement(prev, next)).toBe(false);
    });

    it("複数の要素の一部が異なる場合は true を返す", () => {
      const prev: PayloadElements = [
        {
          type: 1,
          components: [
            { type: 2, style: 1, custom_id: "btn_1", label: "First" },
          ],
        },
        {
          type: 1,
          components: [
            { type: 2, style: 1, custom_id: "btn_2", label: "Second" },
          ],
        },
      ];
      const next: PayloadElements = [
        {
          type: 1,
          components: [
            { type: 2, style: 1, custom_id: "btn_1", label: "First" },
          ],
        },
        {
          type: 1,
          components: [
            { type: 2, style: 1, custom_id: "btn_2", label: "Changed" },
          ],
        },
      ];
      expect(isDifferentPayloadElement(prev, next)).toBe(true);
    });
  });
});
