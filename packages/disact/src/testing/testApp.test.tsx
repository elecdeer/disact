/** @jsxImportSource .. */

import { Suspense, use } from "@disact/engine";
import { describe, expect, test, vi } from "vitest";
import { ActionRow } from "../components/core/ActionRow/ActionRow";
import { Button } from "../components/core/Button/Button";
import { Container } from "../components/core/Container/Container";
import { TextDisplay } from "../components/core/TextDisplay/TextDisplay";
import { useInteraction } from "../hooks/useInteraction";
import { useEmbedState } from "../hooks/useEmbedState";
import type { APIMessageComponentInteraction } from "discord-api-types/v10";
import { testApp } from "./testApp";
import { waitFor } from "./index";

describe("testApp", () => {
  test("初回レンダリングで payload が設定される", async () => {
    const { current } = await testApp(
      <Container>
        <TextDisplay>Hello World</TextDisplay>
      </Container>,
    );

    expect(current.payload).toEqual([
      {
        type: 17,
        components: [{ type: 10, content: "Hello World" }],
      },
    ]);
  });

  test("commitCount が正しくカウントされる", async () => {
    const { current } = await testApp(
      <Container>
        <TextDisplay>Test</TextDisplay>
      </Container>,
    );

    expect(current.commitCount).toBe(1);
  });

  test("history に初回コミットが記録される", async () => {
    const { current } = await testApp(
      <Container>
        <TextDisplay>Test</TextDisplay>
      </Container>,
    );

    expect(current.history).toHaveLength(1);
  });

  test("Suspense がある場合、fallback と解決後のペイロードが記録される", async () => {
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

    const { current } = await testApp(<Component />);

    // 初期状態は fallback
    expect(current.payload).toEqual([
      {
        type: 17,
        components: [{ type: 10, content: "Loading..." }],
      },
    ]);

    // Promise を解決
    resolve("Loaded!");

    // 更新を待機
    await waitFor(() => {
      expect(current.history).toHaveLength(2);
    });

    expect(current.payload).toEqual([
      {
        type: 17,
        components: [{ type: 10, content: "Loaded!" }],
      },
    ]);
  });

  test("rerender で新しい要素を描画できる", async () => {
    const { current, rerender } = await testApp(
      <Container>
        <TextDisplay>Initial</TextDisplay>
      </Container>,
    );

    expect(current.payload?.[0]).toMatchObject({
      components: [{ content: "Initial" }],
    });

    await rerender(
      <Container>
        <TextDisplay>Updated</TextDisplay>
      </Container>,
    );

    expect(current.payload?.[0]).toMatchObject({
      components: [{ content: "Updated" }],
    });
    expect(current.commitCount).toBe(2);
  });

  test("clickButton で useInteraction callback がトリガーされる", async () => {
    const onClickSpy = vi.fn();

    const Component = () => {
      useInteraction<APIMessageComponentInteraction>((interaction) => {
        if (interaction.data.custom_id === "test-btn") {
          onClickSpy(interaction);
        }
      });

      return (
        <Container>
          <ActionRow>
            <Button style="primary" customId="test-btn">
              Click
            </Button>
          </ActionRow>
        </Container>
      );
    };

    const { clickButton } = await testApp(<Component />);

    await clickButton("test-btn");

    expect(onClickSpy).toHaveBeenCalledTimes(1);
    expect(onClickSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ custom_id: "test-btn" }),
      }),
    );
  });

  test("useEmbedState を使ったカウンターが動作する", async () => {
    const Counter = () => {
      const [count, actions] = useEmbedState(0, {
        increment: (prev: number) => prev + 1,
      });

      return (
        <Container>
          <TextDisplay>Count: {String(count)}</TextDisplay>
          <ActionRow>
            <Button style="primary" customId={actions.increment()}>
              +1
            </Button>
          </ActionRow>
        </Container>
      );
    };

    const { current, clickButton } = await testApp(<Counter />);

    // 初期状態（components[0] が TextDisplay）
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((current.payload?.[0] as any)?.components?.[0]).toMatchObject({
      content: "Count: 0",
    });

    // ボタンの customId を payload から取得
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const row = current.payload?.[0] as any;
    const buttonCustomId = row?.components?.[1]?.components?.[0]?.custom_id as string;
    expect(buttonCustomId).toMatch(/^DSCT\|/);

    // ボタンをクリック
    await clickButton(buttonCustomId);

    // 更新後の状態を確認
    await waitFor(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updatedRow = current.payload?.[0] as any;
      expect(updatedRow?.components?.[0]?.content).toBe("Count: 1");
    });
  });

  test("initialPayload を指定すると継続セッションとして扱われる", async () => {
    const initialPayload = [
      {
        type: 17 as const,
        components: [{ type: 10 as const, content: "Initial" }],
      },
    ];

    const { current } = await testApp(
      <Container>
        <TextDisplay>Updated</TextDisplay>
      </Container>,
      { initialPayload },
    );

    // 差分があるのでコミットされる
    expect(current.payload?.[0]).toMatchObject({
      components: [{ content: "Updated" }],
    });
  });
});
