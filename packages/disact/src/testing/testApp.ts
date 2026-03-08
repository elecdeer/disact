import type { DisactElement } from "@disact/engine";
import type {
  APIInteraction,
  APIMessageComponentButtonInteraction,
  APIMessageComponentSelectMenuInteraction,
} from "discord-api-types/v10";
import { createDisactApp } from "../app/disactApp";
import type { DisactAppInstance } from "../app/disactApp";
import type { PayloadElements } from "../components";
import { createButtonInteraction, createSelectInteraction } from "./interactionFactory";
import { createMockSession } from "./mockSession";

/**
 * testApp のオプション
 */
export type TestAppOptions = {
  /** 初期インタラクション（初回からインタラクションとして処理したい場合に指定） */
  initialInteraction?: APIInteraction;
  /** 初期ペイロード（継続セッションのシミュレーション用） */
  initialPayload?: PayloadElements;
};

/**
 * 最新のレンダリング状態を保持するオブジェクト。
 * getter で取得するため、常に最新の状態が返される。
 */
export type TestAppCurrent = {
  /** 現在のペイロード */
  readonly payload: PayloadElements | null;
  /** コミット履歴 */
  readonly history: PayloadElements[];
  /** コミット回数 */
  readonly commitCount: number;
};

/**
 * testApp の戻り値
 */
export type TestAppResult = {
  /**
   * 現在のレンダリング状態。
   * `current.payload`, `current.history`, `current.commitCount` でアクセスする。
   */
  current: TestAppCurrent;

  /**
   * 新しい要素で再レンダリングする（同じセッションを使用）。
   * stable状態到達後にresolveする。
   *
   * @param element - 再レンダリングする要素
   */
  rerender: (element: DisactElement) => Promise<void>;

  /**
   * 任意のインタラクションをシミュレートする。
   * インタラクションがセットされた状態で再レンダリングされ、
   * useInteraction コールバックが実行される。
   *
   * @param interaction - シミュレートするインタラクション
   */
  interact: <T extends APIInteraction>(interaction: T) => Promise<void>;

  /**
   * ボタンクリックをシミュレートする。
   *
   * @param customId - クリックするボタンの customId
   * @param overrides - インタラクションオブジェクトの上書きフィールド
   */
  clickButton: (
    customId: string,
    overrides?: Partial<APIMessageComponentButtonInteraction>,
  ) => Promise<void>;

  /**
   * セレクトメニュー選択をシミュレートする。
   *
   * @param customId - セレクトメニューの customId
   * @param values - 選択する値の配列
   * @param overrides - インタラクションオブジェクトの上書きフィールド
   */
  selectOption: (
    customId: string,
    values: string[],
    overrides?: Partial<APIMessageComponentSelectMenuInteraction>,
  ) => Promise<void>;
};

/**
 * `createDisactApp` を使用したテストユーティリティ。
 *
 * react-testing-library スタイルの API でコンポーネントをレンダリングし、
 * ボタンクリックやセレクト選択などのインタラクションをシミュレートできる。
 * Session はモックされており、実際の Discord API へのリクエストは発生しない。
 *
 * @param element - レンダリングする要素
 * @param options - オプション
 * @returns テスト操作オブジェクト
 *
 * @example
 * ```tsx
 * const { current, clickButton } = await testApp(<Counter />);
 *
 * // 初期状態の確認
 * expect(current.payload?.[0]).toMatchObject({ type: 17 });
 *
 * // ボタンクリック
 * const customId = (current.payload?.[0] as any)?.components?.[1]?.components?.[0]?.custom_id;
 * await clickButton(customId);
 *
 * // 更新後の状態を確認
 * expect((current.payload?.[0] as any)?.components?.[0]).toMatchObject({ content: "Count: 1" });
 * ```
 */
export const testApp = async (
  element: DisactElement,
  options?: TestAppOptions,
): Promise<TestAppResult> => {
  const { session, state } = createMockSession({
    currentPayload: options?.initialPayload ?? null,
  });

  const app = createDisactApp();

  // 初回レンダリングを開始し、stableになるまで待機
  let instance: DisactAppInstance<APIInteraction> = await app.connect<APIInteraction>(
    session,
    element,
  );

  // initialInteraction が指定された場合は初回インタラクションを処理
  if (options?.initialInteraction) {
    await instance.handleInteraction(options.initialInteraction);
  }

  /**
   * インタラクションをシミュレートする。
   * handleInteraction() がstableになるまで待機するため、
   * コールバック実行完了後にresolveされる。
   */
  const runInteraction = async <T extends APIInteraction>(interaction: T): Promise<void> => {
    await instance.handleInteraction(interaction);
  };

  const current: TestAppCurrent = {
    get payload() {
      return state.currentPayload;
    },
    get history() {
      return state.history;
    },
    get commitCount() {
      return state.commitCount;
    },
  };

  return {
    current,

    rerender: async (newElement: DisactElement): Promise<void> => {
      // 新しい要素で再接続（同じセッションを使用）
      instance = await app.connect<APIInteraction>(session, newElement);
    },

    interact: runInteraction,

    clickButton: async (
      customId: string,
      overrides?: Partial<APIMessageComponentButtonInteraction>,
    ): Promise<void> => {
      const interaction = createButtonInteraction(customId, overrides);
      await runInteraction(interaction);
    },

    selectOption: async (
      customId: string,
      values: string[],
      overrides?: Partial<APIMessageComponentSelectMenuInteraction>,
    ): Promise<void> => {
      const interaction = createSelectInteraction(customId, values, overrides);
      await runInteraction(interaction);
    },
  };
};
