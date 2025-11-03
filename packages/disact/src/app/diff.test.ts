import { describe, expect, it } from "vitest";
import type { PayloadElement } from "../components/index";
import { isDifferentPayloadElement } from "./diff";

describe("isDifferentPayloadElement", () => {
  describe("基本的な比較", () => {
    it("完全に同じオブジェクトの場合は false を返す", () => {
      const payload: PayloadElement = {
        type: 10,
        id: 1,
        content: "Hello",
      };
      expect(isDifferentPayloadElement(payload, payload)).toBe(false);
    });

    it("同じ内容の異なるオブジェクトの場合は false を返す", () => {
      const prev: PayloadElement = {
        type: 10,
        id: 1,
        content: "Hello",
      };
      const next: PayloadElement = {
        type: 10,
        id: 1,
        content: "Hello",
      };
      expect(isDifferentPayloadElement(prev, next)).toBe(false);
    });

    it("type が異なる場合は true を返す", () => {
      const prev: PayloadElement = {
        type: 10,
        content: "Hello",
      };
      const next: PayloadElement = {
        type: 2,
        style: 1,
      };
      expect(isDifferentPayloadElement(prev, next)).toBe(true);
    });
  });

  describe("プロパティの比較", () => {
    it("プリミティブ値が異なる場合は true を返す", () => {
      const prev: PayloadElement = {
        type: 10,
        content: "Hello",
      };
      const next: PayloadElement = {
        type: 10,
        content: "World",
      };
      expect(isDifferentPayloadElement(prev, next)).toBe(true);
    });

    it("数値プロパティが異なる場合は true を返す", () => {
      const prev: PayloadElement = {
        type: 10,
        id: 1,
        content: "Hello",
      };
      const next: PayloadElement = {
        type: 10,
        id: 2,
        content: "Hello",
      };
      expect(isDifferentPayloadElement(prev, next)).toBe(true);
    });
  });

  describe("オプショナルプロパティの比較", () => {
    it("undefined と値の比較では true を返す", () => {
      const prev: PayloadElement = {
        type: 10,
        content: "Hello",
      };
      const next: PayloadElement = {
        type: 10,
        id: 1,
        content: "Hello",
      };
      expect(isDifferentPayloadElement(prev, next)).toBe(true);
    });

    it("値と undefined の比較では true を返す", () => {
      const prev: PayloadElement = {
        type: 10,
        id: 1,
        content: "Hello",
      };
      const next: PayloadElement = {
        type: 10,
        content: "Hello",
      };
      expect(isDifferentPayloadElement(prev, next)).toBe(true);
    });

    it("undefined 同士の比較では false を返す", () => {
      const prev: PayloadElement = {
        type: 10,
        content: "Hello",
      };
      const next: PayloadElement = {
        type: 10,
        content: "Hello",
      };
      expect(isDifferentPayloadElement(prev, next)).toBe(false);
    });
  });

  describe("ネストしたプロパティの比較", () => {
    it("配列の内容が同じ場合は false を返す", () => {
      const prev: PayloadElement = {
        type: 1,
        components: [
          { type: 2, style: 1, label: "Hello" },
          { type: 2, style: 1, label: "World" },
        ],
      };
      const next: PayloadElement = {
        type: 1,
        components: [
          { type: 2, style: 1, label: "Hello" },
          { type: 2, style: 1, label: "World" },
        ],
      };
      expect(isDifferentPayloadElement(prev, next)).toBe(false);
    });

    it("配列の内容が異なる場合は true を返す", () => {
      const prev: PayloadElement = {
        type: 1,
        components: [
          { type: 2, style: 1, label: "Hello" },
          { type: 2, style: 1, label: "World" },
        ],
      };
      const next: PayloadElement = {
        type: 1,
        components: [
          { type: 2, style: 1, label: "Hello" },
          { type: 2, style: 1, label: "Changed" },
        ],
      };
      expect(isDifferentPayloadElement(prev, next)).toBe(true);
    });

    it("配列の長さが異なる場合は true を返す", () => {
      const prev: PayloadElement = {
        type: 1,
        components: [{ type: 2, style: 1, label: "Hello" }],
      };
      const next: PayloadElement = {
        type: 1,
        components: [
          { type: 2, style: 1, label: "Hello" },
          { type: 2, style: 1, label: "World" },
        ],
      };
      expect(isDifferentPayloadElement(prev, next)).toBe(true);
    });

    it("配列の順序が異なる場合は true を返す", () => {
      const prev: PayloadElement = {
        type: 1,
        components: [
          { type: 2, style: 1, label: "Hello" },
          { type: 2, style: 1, label: "World" },
        ],
      };
      const next: PayloadElement = {
        type: 1,
        components: [
          { type: 2, style: 1, label: "World" },
          { type: 2, style: 1, label: "Hello" },
        ],
      };
      expect(isDifferentPayloadElement(prev, next)).toBe(true);
    });
  });
});
