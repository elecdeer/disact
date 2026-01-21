/** @jsxImportSource . */

// 統合テスト: 複数コンポーネントの組み合わせとレンダリング動作を検証

import { Suspense, use } from "@disact/engine";
import { describe, expect, it } from "vitest";
import { ActionRow } from "./components/core/ActionRow/ActionRow";
import { Button } from "./components/core/Button/Button";
import { Container } from "./components/core/Container/Container";
import { MediaGallery } from "./components/core/MediaGallery/MediaGallery";
import { Section } from "./components/core/Section/Section";
import { Separator } from "./components/core/Separator/Separator";
import { StringSelect } from "./components/core/StringSelect/StringSelect";
import { TextDisplay } from "./components/core/TextDisplay/TextDisplay";
import { UserSelect } from "./components/core/UserSelect/UserSelect";
import { testRender, waitFor } from "./testing";

describe.skip("Integration Tests", () => {
  describe("Basic Rendering", () => {
    it("Container + ActionRow + Button + TextDisplay の基本レンダリング", async () => {
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
  });

  describe("Async Rendering with Suspense", () => {
    it("基本的な Suspense + use hook でのレンダリング", async () => {
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
      expect(result.history).toHaveLength(2);
    });

    it("複数の Suspense 境界での非同期レンダリング", async () => {
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

      const { result } = await testRender(<Component />);

      // 最初は両方のfallbackが表示される
      expect(result.current).toMatchInlineSnapshot(`
        [
          {
            "components": [
              {
                "content": "Loading 1...",
                "type": 10,
              },
              {
                "content": "Loading 2...",
                "type": 10,
              },
            ],
            "type": 17,
          },
        ]
      `);

      // 1つ目を解決
      resolve1("Data 1");
      await waitFor(() => {
        if (result.history.length !== 2) {
          throw new Error("Not yet updated");
        }
      });
      expect(result.current).toMatchInlineSnapshot(`
        [
          {
            "components": [
              {
                "content": "Data 1",
                "type": 10,
              },
              {
                "content": "Loading 2...",
                "type": 10,
              },
            ],
            "type": 17,
          },
        ]
      `);

      // 2つ目を解決
      resolve2("Data 2");
      await waitFor(() => {
        if (result.history.length !== 3) {
          throw new Error("Not yet updated");
        }
      });
      expect(result.current).toMatchInlineSnapshot(`
        [
          {
            "components": [
              {
                "content": "Data 1",
                "type": 10,
              },
              {
                "content": "Data 2",
                "type": 10,
              },
            ],
            "type": 17,
          },
        ]
      `);
      expect(result.history).toHaveLength(3);
    });

    it("Suspense + MediaGallery の組み合わせ", async () => {
      const { promise, resolve } = Promise.withResolvers<string>();

      const AsyncMediaGallery = () => {
        const imageUrl = use(promise);
        return (
          <MediaGallery
            items={[
              {
                media: { url: imageUrl },
                description: "Loaded image",
              },
            ]}
          />
        );
      };

      const Component = () => (
        <Container>
          <TextDisplay>画像ギャラリー</TextDisplay>
          <Suspense
            fallback={
              <MediaGallery
                items={[
                  {
                    media: { url: "https://example.com/loading.png" },
                    description: "Loading...",
                  },
                ]}
              />
            }
          >
            <AsyncMediaGallery />
          </Suspense>
        </Container>
      );

      const { result } = await testRender(<Component />);

      // 最初はfallbackが表示される
      expect(result.current).toMatchInlineSnapshot(`
        [
          {
            "components": [
              {
                "content": "画像ギャラリー",
                "type": 10,
              },
              {
                "items": [
                  {
                    "description": "Loading...",
                    "media": {
                      "url": "https://example.com/loading.png",
                    },
                  },
                ],
                "type": 12,
              },
            ],
            "type": 17,
          },
        ]
      `);

      resolve("https://example.com/image.png");
      await waitFor(() => {
        if (result.history.length !== 2) {
          throw new Error("Not yet loaded");
        }
      });

      // MediaGalleryが表示される
      expect(result.current).toMatchInlineSnapshot(`
        [
          {
            "components": [
              {
                "content": "画像ギャラリー",
                "type": 10,
              },
              {
                "items": [
                  {
                    "description": "Loaded image",
                    "media": {
                      "url": "https://example.com/image.png",
                    },
                  },
                ],
                "type": 12,
              },
            ],
            "type": 17,
          },
        ]
      `);
      expect(result.history).toHaveLength(2);
    });
  });

  describe("Complex Component Combinations", () => {
    it("Section + MediaGallery の組み合わせ", async () => {
      const Component = () => (
        <Container>
          <Section
            accessory={
              <Button style="primary" customId="view_details">
                詳細
              </Button>
            }
          >
            <TextDisplay>画像ギャラリー</TextDisplay>
          </Section>
          <MediaGallery
            items={[
              {
                media: { url: "https://example.com/image1.png" },
                description: "Image 1",
              },
              {
                media: { url: "https://example.com/image2.png" },
                description: "Image 2",
                spoiler: true,
              },
            ]}
          />
        </Container>
      );

      const { result } = await testRender(<Component />);

      expect(result.current).toMatchInlineSnapshot(`
        [
          {
            "components": [
              {
                "accessory": {
                  "custom_id": "view_details",
                  "disabled": false,
                  "label": "詳細",
                  "style": 1,
                  "type": 2,
                },
                "components": [
                  {
                    "content": "画像ギャラリー",
                    "type": 10,
                  },
                ],
                "type": 9,
              },
              {
                "items": [
                  {
                    "description": "Image 1",
                    "media": {
                      "url": "https://example.com/image1.png",
                    },
                  },
                  {
                    "description": "Image 2",
                    "media": {
                      "url": "https://example.com/image2.png",
                    },
                    "spoiler": true,
                  },
                ],
                "type": 12,
              },
            ],
            "type": 17,
          },
        ]
      `);
      expect(result.history).toHaveLength(1);
    });

    it("複数種類のセレクトメニューの組み合わせ", async () => {
      const Component = () => (
        <Container>
          <ActionRow>
            <StringSelect
              customId="string_select"
              placeholder="オプションを選択"
              options={[
                { label: "オプション1", value: "opt1" },
                { label: "オプション2", value: "opt2", description: "説明2" },
                { label: "オプション3", value: "opt3", default: true },
              ]}
            />
          </ActionRow>
          <ActionRow>
            <UserSelect
              customId="user_select"
              placeholder="ユーザーを選択"
              minValues={1}
              maxValues={3}
            />
          </ActionRow>
          <TextDisplay>複数のセレクトメニューから選択してください</TextDisplay>
        </Container>
      );

      const { result } = await testRender(<Component />);

      expect(result.current).toMatchInlineSnapshot(`
        [
          {
            "components": [
              {
                "components": [
                  {
                    "custom_id": "string_select",
                    "options": [
                      {
                        "label": "オプション1",
                        "value": "opt1",
                      },
                      {
                        "description": "説明2",
                        "label": "オプション2",
                        "value": "opt2",
                      },
                      {
                        "default": true,
                        "label": "オプション3",
                        "value": "opt3",
                      },
                    ],
                    "placeholder": "オプションを選択",
                    "type": 3,
                  },
                ],
                "type": 1,
              },
              {
                "components": [
                  {
                    "custom_id": "user_select",
                    "max_values": 3,
                    "min_values": 1,
                    "placeholder": "ユーザーを選択",
                    "type": 5,
                  },
                ],
                "type": 1,
              },
              {
                "content": "複数のセレクトメニューから選択してください",
                "type": 10,
              },
            ],
            "type": 17,
          },
        ]
      `);
      expect(result.history).toHaveLength(1);
    });

    it("複数のSectionとMediaGalleryを含む複雑なレイアウト", async () => {
      const Component = () => (
        <Container>
          <Section
            accessory={
              <Button style="primary" customId="view_gallery1">
                表示
              </Button>
            }
          >
            <TextDisplay>ギャラリー1</TextDisplay>
          </Section>
          <MediaGallery
            items={[
              {
                media: { url: "https://example.com/gallery1-1.png" },
                description: "Gallery 1 - Image 1",
              },
            ]}
          />
          <Separator divider spacing={2} />
          <Section
            accessory={
              <Button style="secondary" customId="view_gallery2">
                表示
              </Button>
            }
          >
            <TextDisplay>ギャラリー2</TextDisplay>
          </Section>
          <MediaGallery
            items={[
              {
                media: { url: "https://example.com/gallery2-1.png" },
                description: "Gallery 2 - Image 1",
                spoiler: true,
              },
            ]}
          />
          <ActionRow>
            <Button style="success" customId="download_all">
              すべてダウンロード
            </Button>
          </ActionRow>
        </Container>
      );

      const { result } = await testRender(<Component />);

      expect(result.current).toMatchInlineSnapshot(`
        [
          {
            "components": [
              {
                "accessory": {
                  "custom_id": "view_gallery1",
                  "disabled": false,
                  "label": "表示",
                  "style": 1,
                  "type": 2,
                },
                "components": [
                  {
                    "content": "ギャラリー1",
                    "type": 10,
                  },
                ],
                "type": 9,
              },
              {
                "items": [
                  {
                    "description": "Gallery 1 - Image 1",
                    "media": {
                      "url": "https://example.com/gallery1-1.png",
                    },
                  },
                ],
                "type": 12,
              },
              {
                "divider": true,
                "spacing": 2,
                "type": 14,
              },
              {
                "accessory": {
                  "custom_id": "view_gallery2",
                  "disabled": false,
                  "label": "表示",
                  "style": 2,
                  "type": 2,
                },
                "components": [
                  {
                    "content": "ギャラリー2",
                    "type": 10,
                  },
                ],
                "type": 9,
              },
              {
                "items": [
                  {
                    "description": "Gallery 2 - Image 1",
                    "media": {
                      "url": "https://example.com/gallery2-1.png",
                    },
                    "spoiler": true,
                  },
                ],
                "type": 12,
              },
              {
                "components": [
                  {
                    "custom_id": "download_all",
                    "disabled": false,
                    "label": "すべてダウンロード",
                    "style": 3,
                    "type": 2,
                  },
                ],
                "type": 1,
              },
            ],
            "type": 17,
          },
        ]
      `);
      expect(result.history).toHaveLength(1);
    });

    it("Separator を使用した複数セクションの区切り", async () => {
      const Component = () => (
        <Container>
          <TextDisplay>セクション1</TextDisplay>
          <Separator />
          <ActionRow>
            <Button style="primary" customId="action1">
              アクション1
            </Button>
          </ActionRow>
          <Separator divider spacing={3} />
          <TextDisplay>セクション2</TextDisplay>
          <ActionRow>
            <Button style="secondary" customId="action2">
              アクション2
            </Button>
          </ActionRow>
        </Container>
      );

      const { result } = await testRender(<Component />);

      expect(result.current).toMatchInlineSnapshot(`
        [
          {
            "components": [
              {
                "content": "セクション1",
                "type": 10,
              },
              {
                "type": 14,
              },
              {
                "components": [
                  {
                    "custom_id": "action1",
                    "disabled": false,
                    "label": "アクション1",
                    "style": 1,
                    "type": 2,
                  },
                ],
                "type": 1,
              },
              {
                "divider": true,
                "spacing": 3,
                "type": 14,
              },
              {
                "content": "セクション2",
                "type": 10,
              },
              {
                "components": [
                  {
                    "custom_id": "action2",
                    "disabled": false,
                    "label": "アクション2",
                    "style": 2,
                    "type": 2,
                  },
                ],
                "type": 1,
              },
            ],
            "type": 17,
          },
        ]
      `);
      expect(result.history).toHaveLength(1);
    });
  });
});
