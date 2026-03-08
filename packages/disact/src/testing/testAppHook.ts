import type { DisactElement } from "@disact/engine";
import type {
  APIInteraction,
  APIMessageComponentButtonInteraction,
  APIMessageComponentSelectMenuInteraction,
} from "discord-api-types/v10";
import { createDisactApp } from "../app/disactApp";
import { createButtonInteraction, createSelectInteraction } from "./interactionFactory";
import { createMockSession } from "./mockSession";

/**
 * testAppHook のオプション
 */
export type TestAppHookOptions = {
  /** 初期インタラクション（useCurrentInteraction を初回から呼びたい場合に指定） */
  initialInteraction?: APIInteraction;
};

/**
 * testAppHook の戻り値
 */
export type TestAppHookResult<R> = {
  /**
   * フックの現在の戻り値。
   * getter で取得するため、常に最新の状態が返される。
   */
  result: {
    readonly current: R;
  };

  /**
   * 再レンダリングを強制する。
   * stable状態到達後にresolveする。
   * useInteraction コールバックは実行されない。
   */
  rerender: () => Promise<void>;

  /**
   * 任意のインタラクションをシミュレートする。
   * インタラクションがセットされた状態で再レンダリングされ、
   * useInteraction / useEmbedState コールバックが実行される。
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
 * フックをテストするためのユーティリティ。react-testing-library の renderHook に相当。
 *
 * createDisactApp + createMockSession をベースに、
 * コンポーネントのレンダリング結果ではなくフックの戻り値に特化したテスト API を提供する。
 * フックはラッパーコンポーネント内で呼び出され、その戻り値が `result.current` に格納される。
 *
 * @param hookFn - テスト対象のフックを呼び出す関数
 * @param options - オプション
 * @returns フックの結果とインタラクション操作オブジェクト
 *
 * @example
 * ```tsx
 * // useEmbedState のテスト
 * const { result, clickButton } = await testAppHook(() =>
 *   useEmbedState(0, {
 *     increment: (prev: number) => prev + 1,
 *   })
 * );
 *
 * const [count, actions] = result.current;
 * expect(count).toBe(0);
 *
 * await clickButton(actions.increment());
 * expect(result.current[0]).toBe(1);
 * ```
 *
 * @example
 * ```tsx
 * // useInteraction のテスト
 * const spy = vi.fn();
 * const { clickButton } = await testAppHook(() => {
 *   useInteraction<APIMessageComponentButtonInteraction>((i) => {
 *     spy(i.data.custom_id);
 *   });
 * });
 *
 * await clickButton("my-button");
 * expect(spy).toHaveBeenCalledTimes(1);
 * expect(spy).toHaveBeenCalledWith("my-button");
 * ```
 */
export const testAppHook = async <R>(
  hookFn: () => R,
  options?: TestAppHookOptions,
): Promise<TestAppHookResult<R>> => {
  // フックの戻り値をキャプチャする変数
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let capturedResult: R = undefined as any;

  const { session, state: _state } = createMockSession();

  const app = createDisactApp();

  /**
   * フックを呼び出して結果をキャプチャするラッパーコンポーネント。
   * レンダリング結果は null（Discord ペイロードなし）だが、
   * フックのコンテキストで呼び出されるため全フックが正常に動作する。
   */
  const HookWrapper = (): null => {
    capturedResult = hookFn();
    return null;
  };

  // DisactElement としてラッパーコンポーネントを作成
  const element: DisactElement = {
    type: "function",
    fc: HookWrapper,
    props: {},
  };

  // 初回レンダリングを開始し、stableになるまで待機
  const instance = await app.connect<APIInteraction>(session, element);

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

  return {
    result: {
      get current(): R {
        return capturedResult;
      },
    },

    rerender: () => instance.rerender(),

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
