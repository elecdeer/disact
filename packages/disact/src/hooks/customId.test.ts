import { describe, expect, it } from "vitest";
import { defaultSerializer, generateCustomId, parseCustomId } from "./customId";

describe("parseCustomId", () => {
  it("正しいフォーマットのcustomIdをパースできる", () => {
    const result = parseCustomId("dsct|counter|5|6");
    expect(result).toEqual({
      name: "counter",
      current: "5",
      next: "6",
    });
  });

  it("マジックナンバーが異なる場合はnullを返す", () => {
    const result = parseCustomId("invalid|counter|5|6");
    expect(result).toBeNull();
  });

  it("部品数が不正な場合はnullを返す", () => {
    expect(parseCustomId("dsct|counter|5")).toBeNull();
    expect(parseCustomId("dsct|counter|5|6|extra")).toBeNull();
  });

  it("空文字列の場合はnullを返す", () => {
    const result = parseCustomId("");
    expect(result).toBeNull();
  });

  it("nameが空文字列の場合はnullを返す", () => {
    const result = parseCustomId("dsct||5|6");
    expect(result).toBeNull();
  });

  it("currentが空文字列の場合はnullを返す", () => {
    const result = parseCustomId("dsct|counter||6");
    expect(result).toBeNull();
  });

  it("nextが空文字列の場合はnullを返す", () => {
    const result = parseCustomId("dsct|counter|5|");
    expect(result).toBeNull();
  });

  it("全ての部品が空文字列の場合はnullを返す", () => {
    const result = parseCustomId("dsct|||");
    expect(result).toBeNull();
  });
});

describe("generateCustomId", () => {
  it("正しいフォーマットのcustomIdを生成できる", () => {
    const result = generateCustomId("counter", "5", "6");
    expect(result).toBe("dsct|counter|5|6");
  });

  it("複雑なnameでも正しく生成できる", () => {
    const result = generateCustomId("my-component-state", "100", "101");
    expect(result).toBe("dsct|my-component-state|100|101");
  });
});

describe("defaultSerializer", () => {
  describe("serialize", () => {
    it("数値をシリアライズできる", () => {
      expect(defaultSerializer.serialize(42)).toBe("42");
      expect(defaultSerializer.serialize(0)).toBe("0");
      expect(defaultSerializer.serialize(-10)).toBe("-10");
    });

    it("文字列をそのまま返す", () => {
      expect(defaultSerializer.serialize("hello")).toBe("hello");
      expect(defaultSerializer.serialize("")).toBe("");
    });

    it("真偽値をシリアライズできる", () => {
      expect(defaultSerializer.serialize(true)).toBe("true");
      expect(defaultSerializer.serialize(false)).toBe("false");
    });

    it("nullとundefinedをシリアライズできる", () => {
      expect(defaultSerializer.serialize(null)).toBe("null");
      expect(defaultSerializer.serialize(undefined)).toBe("undefined");
    });

    it("オブジェクトをJSONとしてシリアライズできる", () => {
      expect(defaultSerializer.serialize({ a: 1 })).toBe('{"a":1}');
    });
  });

  describe("deserialize", () => {
    it("数値をデシリアライズできる", () => {
      expect(defaultSerializer.deserialize("42")).toBe(42);
      expect(defaultSerializer.deserialize("0")).toBe(0);
      expect(defaultSerializer.deserialize("-10")).toBe(-10);
    });

    it("文字列をデシリアライズできる", () => {
      // JSON文字列でない場合はそのまま返す
      expect(defaultSerializer.deserialize("hello")).toBe("hello");
    });

    it("真偽値をデシリアライズできる", () => {
      expect(defaultSerializer.deserialize("true")).toBe(true);
      expect(defaultSerializer.deserialize("false")).toBe(false);
    });

    it("nullとundefinedをデシリアライズできる", () => {
      expect(defaultSerializer.deserialize("null")).toBe(null);
      expect(defaultSerializer.deserialize("undefined")).toBe(undefined);
    });

    it("JSONオブジェクトをデシリアライズできる", () => {
      expect(defaultSerializer.deserialize('{"a":1}')).toEqual({ a: 1 });
    });
  });

  describe("round-trip", () => {
    it("数値の往復変換ができる", () => {
      const original = 42;
      const serialized = defaultSerializer.serialize(original);
      const deserialized = defaultSerializer.deserialize(serialized);
      expect(deserialized).toBe(original);
    });

    it("文字列の往復変換ができる", () => {
      const original = "hello";
      const serialized = defaultSerializer.serialize(original);
      const deserialized = defaultSerializer.deserialize(serialized);
      expect(deserialized).toBe(original);
    });

    it("真偽値の往復変換ができる", () => {
      const originalTrue = true;
      const serializedTrue = defaultSerializer.serialize(originalTrue);
      const deserializedTrue = defaultSerializer.deserialize(serializedTrue);
      expect(deserializedTrue).toBe(originalTrue);

      const originalFalse = false;
      const serializedFalse = defaultSerializer.serialize(originalFalse);
      const deserializedFalse = defaultSerializer.deserialize(serializedFalse);
      expect(deserializedFalse).toBe(originalFalse);
    });
  });
});
