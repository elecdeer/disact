/** @jsxImportSource .. */

import { Suspense, use } from "@disact/engine";
import { test as base, describe, expect, vi } from "vitest";
import type { PayloadElements } from "../components";
import { waitFor } from "../testing";
import { createDisactApp } from "./disactApp";
import type { Session } from "./session";

type TestContext = {
  mockSession: Session;
  commitSpy: ReturnType<typeof vi.fn<Session["commit"]>>;
  currentPayload: { value: PayloadElements | null };
};

const test = base.extend<TestContext>({
  currentPayload: async ({}, use) => {
    // 初期状態は null (未コミット)
    const payload: {
      value: PayloadElements | null;
    } = {
      value: null,
    };
    await use(payload);
  },
  commitSpy: async ({ currentPayload }, use) => {
    const spy = vi.fn(async (payload: PayloadElements) => {
      currentPayload.value = payload;
    });
    await use(spy);
  },
  mockSession: async ({ commitSpy, currentPayload }, use) => {
    const session: Session = {
      commit: commitSpy,
      getCurrent: vi.fn(async () => currentPayload.value),
    };
    await use(session);
  },
});

describe("createDisactApp", () => {
  test("初回レンダリング時に commit が呼ばれる", async ({
    mockSession,
    commitSpy,
  }) => {
    const app = createDisactApp();

    const Component = () => (
      <container>
        <textDisplay>Hello World</textDisplay>
      </container>
    );

    await app.connect(mockSession, <Component />);

    await waitFor(() => {
      expect(commitSpy).toHaveBeenCalledTimes(1);
    });

    expect(commitSpy).toHaveBeenCalledWith({
      type: 17,
      components: [
        {
          type: 10,
          content: "Hello World",
        },
      ],
    });
  });

  test("差分がある場合に commit が呼ばれる", async ({
    mockSession,
    commitSpy,
    currentPayload,
  }) => {
    // 初期状態を設定
    currentPayload.value = {
      type: 17,
      components: [{ type: 10, content: "Initial" }],
    };

    const app = createDisactApp();

    const Component = () => (
      <container>
        <textDisplay>Updated</textDisplay>
      </container>
    );

    await app.connect(mockSession, <Component />);

    await waitFor(() => {
      expect(commitSpy).toHaveBeenCalledTimes(1);
    });

    expect(commitSpy).toHaveBeenCalledWith({
      type: 17,
      components: [
        {
          type: 10,
          content: "Updated",
        },
      ],
    });
  });

  test("差分がない場合に commit が呼ばれない", async ({
    mockSession,
    commitSpy,
    currentPayload,
  }) => {
    // toPayload の結果と同じ形式で初期状態を設定（undefined プロパティも含める）
    currentPayload.value = {
      type: 17,
      id: undefined,
      accent_color: undefined,
      spoiler: undefined,
      components: [
        {
          type: 10,
          id: undefined,
          content: "Same Content",
        },
      ],
    };

    const app = createDisactApp();

    const Component = () => (
      <container>
        <textDisplay>Same Content</textDisplay>
      </container>
    );

    await app.connect(mockSession, <Component />);

    // 少し待機
    await new Promise((resolve) => setTimeout(resolve, 100));

    // commit が呼ばれていないことを確認
    expect(commitSpy).not.toHaveBeenCalled();
  });

  test("Suspense で複数のチャンクが処理される", async ({
    mockSession,
    commitSpy,
  }) => {
    const { promise, resolve } = Promise.withResolvers<string>();

    const AsyncData = () => {
      const data = use(promise);
      return <textDisplay>{data}</textDisplay>;
    };

    const Component = () => (
      <container>
        <Suspense fallback={<textDisplay>Loading...</textDisplay>}>
          <AsyncData />
        </Suspense>
      </container>
    );

    const app = createDisactApp();
    await app.connect(mockSession, <Component />);

    // 最初の fallback が commit される
    await waitFor(() => {
      expect(commitSpy).toHaveBeenCalledTimes(1);
    });

    expect(commitSpy).toHaveBeenCalledWith({
      type: 17,
      components: [
        {
          type: 10,
          content: "Loading...",
        },
      ],
    });

    // Promise を解決
    resolve("Loaded data");

    // 2回目の commit が呼ばれる
    await waitFor(() => {
      expect(commitSpy).toHaveBeenCalledTimes(2);
    });

    expect(commitSpy).toHaveBeenLastCalledWith({
      type: 17,
      components: [
        {
          type: 10,
          content: "Loaded data",
        },
      ],
    });
  });

  test("複数の更新で差分がある場合のみ commit する", async ({
    mockSession,
    commitSpy,
  }) => {
    const { promise: promise1, resolve: resolve1 } =
      Promise.withResolvers<string>();
    const { promise: promise2, resolve: resolve2 } =
      Promise.withResolvers<string>();

    const AsyncData1 = () => {
      const data = use(promise1);
      return <textDisplay>{data}</textDisplay>;
    };

    const AsyncData2 = () => {
      const data = use(promise2);
      return <textDisplay>{data}</textDisplay>;
    };

    const Component = () => (
      <container>
        <Suspense fallback={<textDisplay>Loading 1...</textDisplay>}>
          <AsyncData1 />
        </Suspense>
        <Suspense fallback={<textDisplay>Loading 2...</textDisplay>}>
          <AsyncData2 />
        </Suspense>
      </container>
    );

    const app = createDisactApp();
    await app.connect(mockSession, <Component />);

    // 最初の fallback が commit される
    await waitFor(() => {
      expect(commitSpy).toHaveBeenCalledTimes(1);
    });

    // 1つ目を解決（内容が変わるので commit される）
    resolve1("Data 1");
    await waitFor(() => {
      expect(commitSpy).toHaveBeenCalledTimes(2);
    });

    // 2つ目を解決（内容が変わるので commit される）
    resolve2("Data 2");
    await waitFor(() => {
      expect(commitSpy).toHaveBeenCalledTimes(3);
    });

    expect(commitSpy).toHaveBeenLastCalledWith({
      type: 17,
      components: [
        { type: 10, content: "Data 1" },
        { type: 10, content: "Data 2" },
      ],
    });
  });

  test("ボタンとテキストを含む複雑なコンポーネントをレンダリングできる", async ({
    mockSession,
    commitSpy,
  }) => {
    const app = createDisactApp();

    const Component = () => (
      <container>
        <actionRow>
          <button style="primary">Click me</button>
          <button style="secondary">Cancel</button>
        </actionRow>
        <textDisplay>Choose an action</textDisplay>
      </container>
    );

    await app.connect(mockSession, <Component />);

    await waitFor(() => {
      expect(commitSpy).toHaveBeenCalledTimes(1);
    });

    expect(commitSpy).toHaveBeenCalledWith({
      type: 17,
      components: [
        {
          type: 1,
          components: [
            {
              type: 2,
              style: 1,
              label: "Click me",
              disabled: false,
            },
            {
              type: 2,
              style: 2,
              label: "Cancel",
              disabled: false,
            },
          ],
        },
        {
          type: 10,
          content: "Choose an action",
        },
      ],
    });
  });
});
