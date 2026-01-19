import { runInContext } from "@disact/engine";
import { describe, expect, it } from "vitest";
import type { ReducerContext } from "./useReducer";
import { useReducer } from "./useReducer";

describe("useReducer", () => {
  it("初期値を使用してレンダリングできる", () => {
    const context: ReducerContext = {};

    const result = runInContext(context, () => {
      const [count] = useReducer("counter", 0, {
        increase: (curr: number) => curr + 1,
      });
      return count;
    });

    expect(result).toBe(0);
  });

  it("アクション関数がcustomIdを生成する", () => {
    const context: ReducerContext = {};

    const result = runInContext(context, () => {
      const [, dispatch] = useReducer("counter", 5, {
        increase: (curr: number) => curr + 1,
        decrease: (curr: number) => curr - 1,
      });
      return {
        increase: dispatch.increase(),
        decrease: dispatch.decrease(),
      };
    });

    expect(result.increase).toBe("dsct|counter|5|6");
    expect(result.decrease).toBe("dsct|counter|5|4");
  });

  it("引数を持つアクション関数が正しく動作する", () => {
    const context: ReducerContext = {};

    const result = runInContext(context, () => {
      const [, dispatch] = useReducer("counter", 10, {
        // Reducers型の制約により、具体的な型からunknownへの変換が必要
        add: (curr: number, amount: unknown) => curr + (amount as number),
        subtract: (curr: number, amount: unknown) => curr - (amount as number),
      });
      return {
        add5: dispatch.add(5),
        subtract3: dispatch.subtract(3),
      };
    });

    expect(result.add5).toBe("dsct|counter|10|15");
    expect(result.subtract3).toBe("dsct|counter|10|7");
  });

  it("コンテキストから値を復元する", () => {
    const context: ReducerContext = {
      __reducerValues: new Map([["counter", 42]]),
    };

    const result = runInContext(context, () => {
      const [count] = useReducer("counter", 0, {
        increase: (curr: number) => curr + 1,
      });
      return count;
    });

    expect(result).toBe(42);
  });

  it("複数のuseReducerを同時に使用できる", () => {
    const context: ReducerContext = {};

    const result = runInContext(context, () => {
      const [count1, dispatch1] = useReducer("counter1", 0, {
        increase: (curr: number) => curr + 1,
      });
      const [count2, dispatch2] = useReducer("counter2", 100, {
        increase: (curr: number) => curr + 1,
      });

      return {
        count1,
        count2,
        customId1: dispatch1.increase(),
        customId2: dispatch2.increase(),
      };
    });

    expect(result.count1).toBe(0);
    expect(result.count2).toBe(100);
    expect(result.customId1).toBe("dsct|counter1|0|1");
    expect(result.customId2).toBe("dsct|counter2|100|101");
  });

  it("文字列の状態を管理できる", () => {
    const context: ReducerContext = {};

    const result = runInContext(context, () => {
      const [name, dispatch] = useReducer("name", "John", {
        // Reducers型の制約により、unknown型のパラメータが必要
        changeTo: (_curr: string, newName: unknown) => newName as string,
      });

      return {
        name,
        customId: dispatch.changeTo("Jane"),
      };
    });

    expect(result.name).toBe("John");
    expect(result.customId).toBe("dsct|name|John|Jane");
  });

  it("真偽値の状態を管理できる", () => {
    const context: ReducerContext = {};

    const result = runInContext(context, () => {
      const [enabled, dispatch] = useReducer("enabled", false, {
        toggle: (curr: boolean) => !curr,
        setTrue: () => true,
        setFalse: () => false,
      });

      return {
        enabled,
        toggle: dispatch.toggle(),
        setTrue: dispatch.setTrue(),
        setFalse: dispatch.setFalse(),
      };
    });

    expect(result.enabled).toBe(false);
    expect(result.toggle).toBe("dsct|enabled|false|true");
    expect(result.setTrue).toBe("dsct|enabled|false|true");
    expect(result.setFalse).toBe("dsct|enabled|false|false");
  });

  it("カスタムシリアライザーを使用できる", () => {
    const context: ReducerContext = {};

    type User = { name: string; age: number };

    const result = runInContext(context, () => {
      const [user, dispatch] = useReducer(
        "user",
        { name: "John", age: 25 },
        {
          // Reducers型の制約により、unknown型のパラメータが必要
          setName: (curr: User, name: unknown) => ({ ...curr, name: name as string }),
          setAge: (curr: User, age: unknown) => ({ ...curr, age: age as number }),
        },
        {
          serializer: {
            serialize: (user: User) => `${user.name}:${user.age}`,
            deserialize: (str: string) => {
              const parts = str.split(":");
              // split結果のundefinedチェックのため、型アサーションが必要
              const name = parts[0] as string;
              const age = parts[1] as string;
              return { name, age: Number(age) };
            },
          },
        },
      );

      return {
        user,
        setName: dispatch.setName("Jane"),
        setAge: dispatch.setAge(30),
      };
    });

    expect(result.user).toEqual({ name: "John", age: 25 });
    expect(result.setName).toBe("dsct|user|John:25|Jane:25");
    expect(result.setAge).toBe("dsct|user|John:25|John:30");
  });
});
