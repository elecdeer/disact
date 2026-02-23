import { ButtonStyle, ComponentType } from "discord-api-types/v10";
import { describe, expect, test } from "vitest";
import type { PayloadElements } from "../components";
import { getAll, getByLabel, queryByLabel } from "./queries";

/** テスト用の Container > ActionRow > Button 構造 */
const makeContainerWithButtons = (
  buttons: Array<{ label: string; custom_id: string }>,
): PayloadElements => [
  {
    type: ComponentType.Container,
    components: [
      {
        type: ComponentType.ActionRow,
        components: buttons.map((btn) => ({
          type: ComponentType.Button as const,
          style: ButtonStyle.Primary,
          label: btn.label,
          custom_id: btn.custom_id,
        })),
      },
    ],
  },
];

/** テスト用のトップレベル ActionRow > Button 構造 */
const makeTopLevelActionRowWithButton = (label: string, custom_id: string): PayloadElements => [
  {
    type: ComponentType.ActionRow,
    components: [
      {
        type: ComponentType.Button as const,
        style: ButtonStyle.Secondary,
        label,
        custom_id,
      },
    ],
  },
];

/** テスト用の Section > accessory = Button 構造 */
const makeSectionWithAccessoryButton = (label: string, custom_id: string): PayloadElements => [
  {
    type: ComponentType.Section,
    components: [
      {
        type: ComponentType.TextDisplay,
        content: "Some text",
      },
    ],
    accessory: {
      type: ComponentType.Button as const,
      style: ButtonStyle.Primary,
      label,
      custom_id,
    },
  },
];

/** テスト用の StringSelect 構造 */
const makeContainerWithStringSelect = (placeholder: string, custom_id: string): PayloadElements => [
  {
    type: ComponentType.Container,
    components: [
      {
        type: ComponentType.ActionRow,
        components: [
          {
            type: ComponentType.StringSelect as const,
            placeholder,
            custom_id,
            options: [{ label: "Option 1", value: "opt1" }],
          },
        ],
      },
    ],
  },
];

describe("queryByLabel", () => {
  test("ラベルが一致するボタンを返す", () => {
    const payload = makeContainerWithButtons([{ label: "Click me", custom_id: "btn-1" }]);

    const result = queryByLabel(payload, "Click me", ComponentType.Button);

    // APIButtonComponent は APIButtonComponentWithSKUId を含む union 型のため
    // toMatchObject で custom_id の存在を確認する
    expect(result).toMatchObject({ custom_id: "btn-1" });
  });

  test("ラベルが一致しない場合は null を返す", () => {
    const payload = makeContainerWithButtons([{ label: "Click me", custom_id: "btn-1" }]);

    const result = queryByLabel(payload, "Not found", ComponentType.Button);

    expect(result).toBeNull();
  });

  test("正規表現でボタンを検索できる", () => {
    const payload = makeContainerWithButtons([
      { label: "+1", custom_id: "increment" },
      { label: "-1", custom_id: "decrement" },
    ]);

    const result = queryByLabel(payload, /^\+/, ComponentType.Button);

    expect(result).toMatchObject({ custom_id: "increment" });
  });

  test("payload が null の場合は null を返す", () => {
    const result = queryByLabel(null, "Click me", ComponentType.Button);

    expect(result).toBeNull();
  });

  test("StringSelect の placeholder で検索できる", () => {
    const payload = makeContainerWithStringSelect("Choose an option", "select-1");

    const result = queryByLabel(payload, "Choose an option", ComponentType.StringSelect);

    // APISelectMenuComponent は全バリアントが custom_id を持つ
    expect(result).not.toBeNull();
    expect(result?.custom_id).toBe("select-1");
  });

  test("ボタン検索の返り値は type: 2 (Button) を持つ", () => {
    const payload = makeContainerWithButtons([{ label: "Click me", custom_id: "btn-1" }]);

    const result = queryByLabel(payload, "Click me", ComponentType.Button);

    expect(result).toMatchObject({ type: ComponentType.Button, label: "Click me" });
  });
});

describe("getByLabel", () => {
  test("ラベルが一致するボタンを返す", () => {
    const payload = makeContainerWithButtons([{ label: "Submit", custom_id: "submit-btn" }]);

    const result = getByLabel(payload, "Submit", ComponentType.Button);

    expect(result).toMatchObject({ custom_id: "submit-btn" });
  });

  test("一致するコンポーネントが存在しない場合は throw する", () => {
    const payload = makeContainerWithButtons([{ label: "Click me", custom_id: "btn-1" }]);

    expect(() => getByLabel(payload, "Not found", ComponentType.Button)).toThrow(
      /Unable to find component of type "Button"/,
    );
  });

  test("エラーメッセージに検索文字列が含まれる", () => {
    const payload = makeContainerWithButtons([]);

    expect(() => getByLabel(payload, "Missing", ComponentType.Button)).toThrow(/"Missing"/);
  });

  test("エラーメッセージに正規表現が含まれる", () => {
    const payload = makeContainerWithButtons([]);

    expect(() => getByLabel(payload, /^Missing/, ComponentType.Button)).toThrow(/\/\^Missing\//);
  });
});

describe("getAll", () => {
  test("全てのボタンを取得できる", () => {
    const payload = makeContainerWithButtons([
      { label: "Button 1", custom_id: "btn-1" },
      { label: "Button 2", custom_id: "btn-2" },
      { label: "Button 3", custom_id: "btn-3" },
    ]);

    const results = getAll(payload, ComponentType.Button);

    expect(results).toHaveLength(3);
  });

  test("payload が null の場合は空配列を返す", () => {
    const results = getAll(null, ComponentType.Button);

    expect(results).toEqual([]);
  });

  test("一致するコンポーネントがない場合は空配列を返す", () => {
    const payload = makeContainerWithButtons([]);

    const results = getAll(payload, ComponentType.StringSelect);

    expect(results).toEqual([]);
  });

  test("ネストした複数のコンテナを横断して取得できる", () => {
    const payload: PayloadElements = [
      {
        type: ComponentType.Container,
        components: [
          {
            type: ComponentType.ActionRow,
            components: [
              {
                type: ComponentType.Button as const,
                style: ButtonStyle.Primary,
                label: "Button A",
                custom_id: "btn-a",
              },
            ],
          },
        ],
      },
      {
        type: ComponentType.ActionRow,
        components: [
          {
            type: ComponentType.Button as const,
            style: ButtonStyle.Secondary,
            label: "Button B",
            custom_id: "btn-b",
          },
        ],
      },
    ];

    const results = getAll(payload, ComponentType.Button);

    expect(results).toHaveLength(2);
    expect(results).toContainEqual(expect.objectContaining({ custom_id: "btn-a" }));
    expect(results).toContainEqual(expect.objectContaining({ custom_id: "btn-b" }));
  });
});

describe("traversal", () => {
  test("トップレベル ActionRow 内のボタンを検索できる", () => {
    const payload = makeTopLevelActionRowWithButton("Top-level btn", "top-btn");

    const result = queryByLabel(payload, "Top-level btn", ComponentType.Button);

    expect(result).toMatchObject({ custom_id: "top-btn" });
  });

  test("Section の accessory ボタンを検索できる", () => {
    const payload = makeSectionWithAccessoryButton("Accessory btn", "accessory-btn");

    const result = queryByLabel(payload, "Accessory btn", ComponentType.Button);

    expect(result).toMatchObject({ custom_id: "accessory-btn" });
  });

  test("Container > ActionRow > Button の深いネストを検索できる", () => {
    const payload = makeContainerWithButtons([{ label: "Deep button", custom_id: "deep-btn" }]);

    const result = queryByLabel(payload, "Deep button", ComponentType.Button);

    expect(result).toMatchObject({ custom_id: "deep-btn" });
  });
});
