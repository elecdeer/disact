import { describe, expect, expectTypeOf, it } from "vitest";
import { removeUndefined } from "./removeUndefined";

describe("removeUndefined", () => {
  describe("実行時の動作", () => {
    it("undefinedの値を持つプロパティを除外する", () => {
      const obj = {
        a: 1,
        b: undefined,
        c: "hello",
      };
      const result = removeUndefined(obj);
      expect(result).toEqual({
        a: 1,
        c: "hello",
      });
      expect(Object.keys(result)).toEqual(["a", "c"]);
    });

    it("すべてのプロパティが定義されている場合はそのまま返す", () => {
      const obj = {
        a: 1,
        b: 2,
        c: "hello",
      };
      const result = removeUndefined(obj);
      expect(result).toEqual({
        a: 1,
        b: 2,
        c: "hello",
      });
    });

    it("すべてのプロパティがundefinedの場合は空オブジェクトを返す", () => {
      const obj = {
        a: undefined,
        b: undefined,
      };
      const result = removeUndefined(obj);
      expect(result).toEqual({});
    });

    it("nullは除外しない", () => {
      const obj = {
        a: null,
        b: undefined,
        c: 0,
        d: false,
        e: "",
      };
      const result = removeUndefined(obj);
      expect(result).toEqual({
        a: null,
        c: 0,
        d: false,
        e: "",
      });
    });

    it("ネストされたオブジェクトのundefinedは除外しない", () => {
      const obj = {
        a: 1,
        b: undefined,
        c: {
          d: undefined,
          e: 2,
        },
      };
      const result = removeUndefined(obj);
      expect(result).toEqual({
        a: 1,
        c: {
          d: undefined,
          e: 2,
        },
      });
    });

    it("空オブジェクトを渡すと空オブジェクトを返す", () => {
      const obj = {};
      const result = removeUndefined(obj);
      expect(result).toEqual({});
    });
  });

  describe("型テスト", () => {
    it("必須プロパティは必須のまま", () => {
      const obj = {
        a: 1,
        b: "hello",
      };
      const result = removeUndefined(obj);
      expectTypeOf(result).toEqualTypeOf<{
        a: number;
        b: string;
      }>();
    });

    it("オプショナルプロパティ(T | undefined)はオプショナルになる", () => {
      const obj: {
        a: number;
        b: string | undefined;
      } = {
        a: 1,
        b: undefined,
      };
      const result = removeUndefined(obj);
      expectTypeOf(result).toEqualTypeOf<{
        a: number;
        b?: string;
      }>();
    });

    it("undefinedのみの型のプロパティは除外される", () => {
      const obj: {
        a: number;
        b: undefined;
      } = {
        a: 1,
        b: undefined,
      };
      const result = removeUndefined(obj);
      expectTypeOf(result).toEqualTypeOf<{
        a: number;
      }>();
    });

    it("複数のオプショナルプロパティを正しく処理する", () => {
      const obj: {
        required: string;
        optional1: number | undefined;
        optional2: boolean | undefined;
        alreadyOptional?: string;
        alreadyOptional2?: string | undefined;
        onlyUndefined: undefined;
      } = {
        required: "test",
        optional1: undefined,
        optional2: undefined,
        onlyUndefined: undefined,
      };
      const result = removeUndefined(obj);
      expectTypeOf(result).toEqualTypeOf<{
        required: string;
        optional1?: number;
        optional2?: boolean;
        alreadyOptional?: string;
        alreadyOptional2?: string;
      }>();
    });

    it("nullableな型は保持される", () => {
      const obj: {
        a: number;
        b: string | null | undefined;
        c: null;
      } = {
        a: 1,
        b: null,
        c: null,
      };
      const result = removeUndefined(obj);
      // string | null | undefined の場合、undefinedを除外して string | null になる
      expectTypeOf(result).toMatchTypeOf<{
        a: number;
        c: null;
      }>();
      // bプロパティの型をより正確にチェック
      expectTypeOf(result).toHaveProperty("b");
    });

    it("様々な型の組み合わせ", () => {
      const obj: {
        str: string;
        num: number | undefined;
        bool: boolean | undefined;
        nullish: string | null | undefined;
        undef: undefined;
        arr: number[];
        obj: { x: number };
      } = {
        str: "test",
        num: undefined,
        bool: undefined,
        nullish: undefined,
        undef: undefined,
        arr: [1, 2, 3],
        obj: { x: 1 },
      };
      const result = removeUndefined(obj);
      // 必須プロパティのチェック
      expectTypeOf(result).toMatchTypeOf<{
        str: string;
        arr: number[];
        obj: { x: number };
      }>();
      // オプショナルになるプロパティの存在チェック
      expectTypeOf(result).toHaveProperty("num");
      expectTypeOf(result).toHaveProperty("bool");
      expectTypeOf(result).toHaveProperty("nullish");
      // undefプロパティは除外される
      expectTypeOf(result).not.toHaveProperty("undef");
    });
  });
});
