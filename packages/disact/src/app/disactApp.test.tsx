/** @jsxImportSource .. */

import { Suspense, use } from "@disact/engine";
import { test as base, describe, expect, vi } from "vitest";
import { ActionRow } from "../components/core/ActionRow/ActionRow";
import { Button } from "../components/core/Button/Button";
import { Container } from "../components/core/Container/Container";
import { TextDisplay } from "../components/core/TextDisplay/TextDisplay";
import type { PayloadElements } from "../components";
import { waitFor } from "../testing";
import { createDisactApp } from "./disactApp";
import type { Session } from "./session";
import { useInteraction } from "../hooks/useInteraction";

type TestContext<T = unknown> = {
  mockSession: Session<T>;
  commitSpy: ReturnType<typeof vi.fn<Session["commit"]>>;
  currentPayload: { value: PayloadElements | null };
  mockInteraction: { value: T | undefined };
};

const test = base.extend<TestContext>({
  // oxlint-disable-next-line no-empty-pattern
  currentPayload: async ({}, use) => {
    // 初期状態は null (未コミット)
    const payload: {
      value: PayloadElements | null;
    } = {
      value: null,
    };
    await use(payload);
  },
  // oxlint-disable-next-line no-empty-pattern
  mockInteraction: async ({}, use) => {
    const interaction: { value: unknown } = {
      value: undefined,
    };
    await use(interaction);
  },
  commitSpy: async ({ currentPayload }, use) => {
    const spy = vi.fn(async (payload: PayloadElements) => {
      currentPayload.value = payload;
    });
    await use(spy);
  },
  mockSession: async ({ commitSpy, currentPayload, mockInteraction }, use) => {
    const session: Session = {
      commit: commitSpy,
      getCurrent: vi.fn(async () => currentPayload.value),
      getInteraction: vi.fn(() => mockInteraction.value),
    };
    await use(session);
  },
});

describe("createDisactApp", () => {
  test("初回レンダリング時に commit が呼ばれる", async ({ mockSession, commitSpy }) => {
    const app = createDisactApp();

    const Component = () => (
      <Container>
        <TextDisplay>Hello World</TextDisplay>
      </Container>
    );

    await app.connect(mockSession, <Component />);

    await waitFor(() => {
      expect(commitSpy).toHaveBeenCalledTimes(1);
    });

    expect(commitSpy).toHaveBeenCalledWith([
      {
        type: 17,
        components: [
          {
            type: 10,
            content: "Hello World",
          },
        ],
      },
    ]);
  });

  test("差分がある場合に commit が呼ばれる", async ({ mockSession, commitSpy, currentPayload }) => {
    // 初期状態を設定
    currentPayload.value = [
      {
        type: 17,
        components: [{ type: 10, content: "Initial" }],
      },
    ];

    const app = createDisactApp();

    const Component = () => (
      <Container>
        <TextDisplay>Updated</TextDisplay>
      </Container>
    );

    await app.connect(mockSession, <Component />);

    await waitFor(() => {
      expect(commitSpy).toHaveBeenCalledTimes(1);
    });

    expect(commitSpy).toHaveBeenCalledWith([
      {
        type: 17,
        components: [
          {
            type: 10,
            content: "Updated",
          },
        ],
      },
    ]);
  });

  test("差分がない場合に commit が呼ばれない", async ({
    mockSession,
    commitSpy,
    currentPayload,
  }) => {
    // toPayload の結果と同じ形式で初期状態を設定
    currentPayload.value = [
      {
        type: 17,
        components: [
          {
            type: 10,
            content: "Same Content",
          },
        ],
      },
    ];

    const app = createDisactApp();

    const Component = () => (
      <Container>
        <TextDisplay>Same Content</TextDisplay>
      </Container>
    );

    await app.connect(mockSession, <Component />);

    // 少し待機
    await new Promise((resolve) => setTimeout(resolve, 100));

    // commit が呼ばれていないことを確認
    expect(commitSpy).not.toHaveBeenCalled();
  });

  test("Suspense で複数のチャンクが処理される", async ({ mockSession, commitSpy }) => {
    const { promise, resolve } = Promise.withResolvers<string>();

    const AsyncData = () => {
      const data = use(promise);
      return <TextDisplay>{data}</TextDisplay>;
    };

    const Component = () => (
      <Container>
        <Suspense fallback={<TextDisplay>Loading...</TextDisplay>}>
          <AsyncData />
        </Suspense>
      </Container>
    );

    const app = createDisactApp();
    await app.connect(mockSession, <Component />);

    // 最初の fallback が commit される
    await waitFor(() => {
      expect(commitSpy).toHaveBeenCalledTimes(1);
    });

    expect(commitSpy).toHaveBeenCalledWith([
      {
        type: 17,
        components: [
          {
            type: 10,
            content: "Loading...",
          },
        ],
      },
    ]);

    // Promise を解決
    resolve("Loaded data");

    // 2回目の commit が呼ばれる
    await waitFor(() => {
      expect(commitSpy).toHaveBeenCalledTimes(2);
    });

    expect(commitSpy).toHaveBeenLastCalledWith([
      {
        type: 17,
        components: [
          {
            type: 10,
            content: "Loaded data",
          },
        ],
      },
    ]);
  });

  test("複数の更新で差分がある場合のみ commit する", async ({ mockSession, commitSpy }) => {
    // 2つの独立したPromiseが必要なため、別々に呼び出す
    const { promise: promise1, resolve: resolve1 } = Promise.withResolvers<string>();
    const { promise: promise2, resolve: resolve2 } = Promise.withResolvers<string>();

    const AsyncData1 = () => {
      const data = use(promise1);
      return <TextDisplay>{data}</TextDisplay>;
    };

    const AsyncData2 = () => {
      const data = use(promise2);
      return <TextDisplay>{data}</TextDisplay>;
    };

    const Component = () => (
      <Container>
        <Suspense fallback={<TextDisplay>Loading 1...</TextDisplay>}>
          <AsyncData1 />
        </Suspense>
        <Suspense fallback={<TextDisplay>Loading 2...</TextDisplay>}>
          <AsyncData2 />
        </Suspense>
      </Container>
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

    expect(commitSpy).toHaveBeenLastCalledWith([
      {
        type: 17,
        components: [
          { type: 10, content: "Data 1" },
          { type: 10, content: "Data 2" },
        ],
      },
    ]);
  });

  test("ボタンとテキストを含む複雑なコンポーネントをレンダリングできる", async ({
    mockSession,
    commitSpy,
  }) => {
    const app = createDisactApp();

    const Component = () => (
      <Container>
        <ActionRow>
          <Button style="primary" customId="btn_click">
            Click me
          </Button>
          <Button style="secondary" customId="btn_cancel">
            Cancel
          </Button>
        </ActionRow>
        <TextDisplay>Choose an action</TextDisplay>
      </Container>
    );

    await app.connect(mockSession, <Component />);

    await waitFor(() => {
      expect(commitSpy).toHaveBeenCalledTimes(1);
    });

    expect(commitSpy).toHaveBeenCalledWith([
      {
        type: 17,
        components: [
          {
            type: 1,
            components: [
              {
                type: 2,
                style: 1,
                custom_id: "btn_click",
                label: "Click me",
                disabled: false,
              },
              {
                type: 2,
                style: 2,
                custom_id: "btn_cancel",
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
      },
    ]);
  });
});

describe("useInteraction Integration", () => {
  test("useInteraction callback が最終レンダリング後に実行される", async ({
    mockSession,
    mockInteraction,
  }) => {
    const callbackExecuted = vi.fn();
    const interaction = { id: "123", type: 2 };
    mockInteraction.value = interaction;

    const Component = () => {
      useInteraction((interaction) => {
        callbackExecuted(interaction);
      });
      return (
        <Container>
          <TextDisplay>Test</TextDisplay>
        </Container>
      );
    };

    const app = createDisactApp();
    await app.connect(mockSession, <Component />);

    // callback が実行されるまで待機
    await waitFor(() => {
      expect(callbackExecuted).toHaveBeenCalledTimes(1);
    });

    // 正しい interaction オブジェクトが渡されたことを確認
    expect(callbackExecuted).toHaveBeenCalledWith(interaction);
  });

  test("複数の useInteraction callback が登録順に実行される", async ({
    mockSession,
    mockInteraction,
  }) => {
    const executionOrder: number[] = [];
    const interaction = { id: "456", type: 2 };
    mockInteraction.value = interaction;

    const Component = () => {
      useInteraction(() => {
        executionOrder.push(1);
      });
      useInteraction(() => {
        executionOrder.push(2);
      });
      useInteraction(() => {
        executionOrder.push(3);
      });
      return (
        <Container>
          <TextDisplay>Test</TextDisplay>
        </Container>
      );
    };

    const app = createDisactApp();
    await app.connect(mockSession, <Component />);

    await waitFor(() => {
      expect(executionOrder).toHaveLength(3);
    });

    expect(executionOrder).toEqual([1, 2, 3]);
  });

  test("Suspense がある場合、最終レンダリングの callback のみ実行される", async ({
    mockSession,
    mockInteraction,
  }) => {
    const { promise, resolve } = Promise.withResolvers<string>();
    const fallbackCallbackExecuted = vi.fn();
    const finalCallbackExecuted = vi.fn();
    const interactionCallbackExecuted = vi.fn();
    const interaction = { id: "789", type: 2 };
    mockInteraction.value = interaction;

    const AsyncData = () => {
      const data = use(promise);
      finalCallbackExecuted();
      return <TextDisplay>{data}</TextDisplay>;
    };

    const FallbackComponent = () => {
      fallbackCallbackExecuted();
      return <TextDisplay>Loading...</TextDisplay>;
    };

    const Component = () => {
      useInteraction((interaction) => {
        // このcallbackは最終レンダリング時のみ実行される
        interactionCallbackExecuted(interaction);
      });

      return (
        <Container>
          <Suspense fallback={<FallbackComponent />}>
            <AsyncData />
          </Suspense>
        </Container>
      );
    };

    const app = createDisactApp();
    await app.connect(mockSession, <Component />);

    // fallback がレンダリングされる
    await waitFor(() => {
      expect(fallbackCallbackExecuted).toHaveBeenCalled();
    });

    // fallback段階ではinteractionCallbackは実行されていない
    expect(interactionCallbackExecuted).not.toHaveBeenCalled();

    // Promise を解決
    resolve("Loaded data");

    // 最終レンダリングが完了する
    await waitFor(() => {
      expect(finalCallbackExecuted).toHaveBeenCalled();
    });

    // 最終レンダリング後にinteractionCallbackが実行される
    await waitFor(() => {
      expect(interactionCallbackExecuted).toHaveBeenCalledTimes(1);
    });

    // fallback と final の両方がレンダリングされたことを確認
    expect(fallbackCallbackExecuted).toHaveBeenCalledTimes(1);
    expect(finalCallbackExecuted).toHaveBeenCalledTimes(1);
    // interactionCallbackは最終レンダリング時のみ実行される（1回のみ）
    expect(interactionCallbackExecuted).toHaveBeenCalledWith(interaction);
  });

  test("非同期 callback が正しく実行される", async ({ mockSession, mockInteraction }) => {
    const asyncCallbackExecuted = vi.fn();
    const interaction = { id: "async-123", type: 2 };
    mockInteraction.value = interaction;

    const Component = () => {
      useInteraction(async (interaction) => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        asyncCallbackExecuted(interaction);
      });
      return (
        <Container>
          <TextDisplay>Test</TextDisplay>
        </Container>
      );
    };

    const app = createDisactApp();
    await app.connect(mockSession, <Component />);

    await waitFor(() => {
      expect(asyncCallbackExecuted).toHaveBeenCalledTimes(1);
    });

    expect(asyncCallbackExecuted).toHaveBeenCalledWith(interaction);
  });

  test("callback でエラーが発生しても他の callback は実行される", async ({
    mockSession,
    mockInteraction,
  }) => {
    const callback1 = vi.fn();
    const callback2 = vi.fn(() => {
      throw new Error("Test error");
    });
    const callback3 = vi.fn();
    const interaction = { id: "error-test", type: 2 };
    mockInteraction.value = interaction;

    const Component = () => {
      useInteraction(callback1);
      useInteraction(callback2);
      useInteraction(callback3);
      return (
        <Container>
          <TextDisplay>Test</TextDisplay>
        </Container>
      );
    };

    const app = createDisactApp();
    await app.connect(mockSession, <Component />);

    await waitFor(() => {
      expect(callback1).toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
      expect(callback3).toHaveBeenCalled();
    });

    // すべての callback が実行されたことを確認
    expect(callback1).toHaveBeenCalledTimes(1);
    expect(callback2).toHaveBeenCalledTimes(1);
    expect(callback3).toHaveBeenCalledTimes(1);
  });

  test("interaction が渡されない場合、callback は実行されない", async ({ mockSession }) => {
    const callbackExecuted = vi.fn();

    const Component = () => {
      useInteraction(callbackExecuted);
      return (
        <Container>
          <TextDisplay>Test</TextDisplay>
        </Container>
      );
    };

    const app = createDisactApp();
    // mockInteraction.value を設定しない（undefined のまま）
    await app.connect(mockSession, <Component />);

    // 少し待機
    await new Promise((resolve) => setTimeout(resolve, 100));

    // callback が実行されていないことを確認
    expect(callbackExecuted).not.toHaveBeenCalled();
  });

  test("型安全な interaction オブジェクトの受け渡し", async ({ mockSession, mockInteraction }) => {
    interface CustomInteraction {
      id: string;
      type: number;
      customField: string;
    }

    const callbackExecuted = vi.fn<(interaction: CustomInteraction) => void>();
    const interaction: CustomInteraction = {
      id: "type-safe",
      type: 2,
      customField: "custom value",
    };
    mockInteraction.value = interaction;

    const Component = () => {
      useInteraction<CustomInteraction>((interaction) => {
        // 型安全にカスタムフィールドにアクセス
        callbackExecuted(interaction);
      });
      return (
        <Container>
          <TextDisplay>Test</TextDisplay>
        </Container>
      );
    };

    const app = createDisactApp();
    await app.connect(mockSession, <Component />);

    await waitFor(() => {
      expect(callbackExecuted).toHaveBeenCalledTimes(1);
    });

    expect(callbackExecuted).toHaveBeenCalledWith(interaction);
    // customField が正しく渡されたことを確認
    const firstCall = callbackExecuted.mock.calls[0];
    expect(firstCall?.[0]?.customField).toBe("custom value");
  });
});
