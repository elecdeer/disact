/** @jsxImportSource .. */

import { Suspense, use } from "@disact/engine";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PayloadElement } from "../components";
import { waitFor } from "../testing";
import { createDisactApp } from "./disactApp";
import type { Session } from "./session";

describe("createDisactApp", () => {
  let mockSession: Session;
  let commitSpy: ReturnType<typeof vi.fn>;
  let currentPayload: PayloadElement;

  beforeEach(() => {
    // 初期状態は空の container
    currentPayload = {
      type: 17,
      components: [{ type: 10, content: "" }],
    };

    commitSpy = vi.fn(async (payload: PayloadElement) => {
      currentPayload = payload;
    });

    mockSession = {
      commit: commitSpy,
      getCurrent: vi.fn(async () => currentPayload),
    };
  });

  it("初回レンダリング時に commit が呼ばれる", async () => {
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

  it("差分がある場合に commit が呼ばれる", async () => {
    // 初期状態を設定
    currentPayload = {
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

  it("差分がない場合に commit が呼ばれない", async () => {
    // toPayload の結果と同じ形式で初期状態を設定（undefined プロパティも含める）
    currentPayload = {
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

  it("Suspense で複数のチャンクが処理される", async () => {
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

  it("複数の更新で差分がある場合のみ commit する", async () => {
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

  it("ボタンとテキストを含む複雑なコンポーネントをレンダリングできる", async () => {
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
