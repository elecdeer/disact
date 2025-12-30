/** @jsxImportSource . */

import { Suspense, use } from "@disact/engine";
import { describe, expect, it } from "vitest";
import { ActionRow } from "./components/core/ActionRow/ActionRow";
import { Button } from "./components/core/Button/Button";
import { Container } from "./components/core/Container/Container";
import { TextDisplay } from "./components/core/TextDisplay/TextDisplay";
import { testRender, waitFor } from "./testing";

describe("test", () => {
  it("render", async () => {
    const name = "alice";
    const Component = () => {
      return (
        <Container>
          <ActionRow>
            <Button style="primary" customId="btn_click">
              Click me
            </Button>
          </ActionRow>
          <TextDisplay>hello {name}</TextDisplay>
        </Container>
      );
    };

    const { result } = await testRender(<Component />);

    expect(result.current).toMatchInlineSnapshot(`
      [
        {
          "components": [
            {
              "components": [
                {
                  "custom_id": "btn_click",
                  "disabled": false,
                  "label": "Click me",
                  "style": 1,
                  "type": 2,
                },
              ],
              "type": 1,
            },
            {
              "content": "hello alice",
              "type": 10,
            },
          ],
          "type": 17,
        },
      ]
    `);
    expect(result.history).toHaveLength(1);
  });

  it("render with Suspense", async () => {
    const { promise, resolve } = Promise.withResolvers<string>();

    const AsyncData = () => {
      const data = use(promise);
      return <TextDisplay>{data}</TextDisplay>;
    };

    const Component = () => {
      return (
        <Container>
          <Suspense fallback={<TextDisplay>Loading...</TextDisplay>}>
            <AsyncData />
          </Suspense>
        </Container>
      );
    };

    // testRenderを開始（この時点ではPromiseは未解決）
    const { result } = await testRender(<Component />);

    // 最初は fallback が表示される
    expect(result.current).toMatchInlineSnapshot(`
      [
        {
          "components": [
            {
              "content": "Loading...",
              "type": 10,
            },
          ],
          "type": 17,
        },
      ]
    `);

    // Promiseを解決してデータをロード
    resolve("Loaded data");
    await waitFor(() => {
      if (result.history.length !== 2) {
        throw new Error("Not yet loaded");
      }
    });

    // 非同期処理が完了すると実際のコンテンツが表示される
    expect(result.current).toMatchInlineSnapshot(`
      [
        {
          "components": [
            {
              "content": "Loaded data",
              "type": 10,
            },
          ],
          "type": 17,
        },
      ]
    `);

    // 2回レンダリングされる（fallback + 完了後）
    expect(result.history).toHaveLength(2);
  });
});
