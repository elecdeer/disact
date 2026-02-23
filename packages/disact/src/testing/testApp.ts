import type { DisactElement } from "@disact/engine";
import type {
  APIInteraction,
  APIMessageComponentButtonInteraction,
  APIMessageComponentSelectMenuInteraction,
} from "discord-api-types/v10";
import { createDisactApp } from "../app/disactApp";
import type { PayloadElements } from "../components";
import { createButtonInteraction, createSelectInteraction } from "./interactionFactory";
import { createMockSession } from "./mockSession";

/**
 * 条件が満たされるまでポーリングで待機する内部ユーティリティ
 */
const waitForInternal = async (
  callback: () => void | Promise<void>,
  options: { timeout?: number; interval?: number } = {},
): Promise<void> => {
  const { timeout = 1000, interval = 50 } = options;
  const startTime = Date.now();

  while (true) {
    try {
      await callback();
      return;
    } catch (error) {
      if (Date.now() - startTime >= timeout) {
        throw error;
      }
      await new Promise<void>((resolve) => setTimeout(resolve, interval));
    }
  }
};

/**
 * testApp のオプション
 */
export type TestAppOptions = {
  /** 初期インタラクション（useInteraction を初回から呼びたい場合に指定） */
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
   * 新しい要素で再レンダリングする。
   * レンダリングが完了するまで待機する。
   *
   * @param element - 再レンダリングする要素
   */
  rerender: (element: DisactElement) => Promise<void>;

  /**
   * 任意のインタラクションをシミュレートする。
   * インタラクションがセッションにセットされた状態で再レンダリングされ、
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
 * // 更新後の状態を確認（current は getter なので常に最新）
 * await waitFor(() => {
 *   expect((current.payload?.[0] as any)?.components?.[0]).toMatchObject({ content: "Count: 1" });
 * });
 * ```
 */
export const testApp = async (
  element: DisactElement,
  options?: TestAppOptions,
): Promise<TestAppResult> => {
  const { session, state, setInteraction } = createMockSession({
    currentPayload: options?.initialPayload ?? null,
    interaction: options?.initialInteraction,
  });

  const app = createDisactApp();
  let currentElement = element;

  // 初回レンダリングを開始
  await app.connect(session, currentElement);

  // 初回コミットが完了するまで待機。
  // initialPayload が指定された場合は差分がなくコミットされない可能性があるため、
  // タイムアウト後に続行する（差分なし = 正常）。
  await waitForInternal(
    () => {
      if (state.commitCount === 0) {
        throw new Error("Waiting for initial commit");
      }
    },
    // initialPayload あり: 差分なしの場合はコミットされないため短いタイムアウトで続行
    // initialPayload なし: 必ずコミットされるため長いタイムアウトで確実に待つ
    { timeout: options?.initialPayload !== undefined ? 300 : 1000 },
  ).catch((error) => {
    if (options?.initialPayload === undefined) {
      // initialPayload なしの場合は必ずコミットされるべきなのでエラーを再 throw
      throw error;
    }
    // initialPayload あり + 差分なし = 正常なため続行
  });

  /**
   * インタラクションをセットして再レンダリングし、コールバック実行を待機する
   */
  const runInteraction = async <T extends APIInteraction>(interaction: T): Promise<void> => {
    setInteraction(interaction);
    const commitCountBefore = state.commitCount;

    await app.connect(session, currentElement);

    // コミットが発生するまで、またはタイムアウトまで待機
    // 差分がない場合はコミットが発生しないため、短いタイムアウトで完了とみなす
    await waitForInternal(
      () => {
        if (state.commitCount === commitCountBefore) {
          throw new Error("Waiting for interaction to complete");
        }
      },
      { timeout: 500 },
    ).catch(() => {
      // タイムアウトしても処理は続行（差分なしの場合）
    });

    setInteraction(undefined);
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
      currentElement = newElement;
      const commitCountBefore = state.commitCount;

      await app.connect(session, currentElement);

      await waitForInternal(() => {
        if (state.commitCount === commitCountBefore) {
          throw new Error("Waiting for rerender commit");
        }
      });
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
