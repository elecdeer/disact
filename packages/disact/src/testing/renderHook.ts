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
 * renderHook のオプション
 */
export type RenderHookOptions = {
  /** 初期インタラクション（useCurrentInteraction を初回から呼びたい場合に指定） */
  initialInteraction?: APIInteraction;
};

/**
 * renderHook の戻り値
 */
export type RenderHookResult<R> = {
  /**
   * フックの現在の戻り値。
   * getter で取得するため、常に最新の状態が返される。
   */
  result: {
    readonly current: R;
  };

  /**
   * 同じフックで再レンダリングする。
   * レンダリングが完了するまで待機する。
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
 * testApp と同じ仕組み（createDisactApp + createMockSession）をベースに、
 * コンポーネントのレンダリング結果ではなくフックの戻り値に特化したテスト API を提供する。
 * フックはラッパーコンポーネント内で呼び出され、その戻り値が `result.current` に格納される。
 *
 * 注意: testApp ベースのため、インタラクション発生時に useInteraction コールバックが
 * 複数回呼ばれる場合がある（既知の挙動）。また、useEmbedState の状態は各インタラクションで
 * 使用される customId に埋め込まれた prevState を通じて引き継がれる。
 *
 * @param hookFn - テスト対象のフックを呼び出す関数
 * @param options - オプション
 * @returns フックの結果とインタラクション操作オブジェクト
 *
 * @example
 * ```tsx
 * // useEmbedState のテスト
 * const { result, clickButton } = await renderHook(() =>
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
 * const { clickButton } = await renderHook(() => {
 *   useInteraction<APIMessageComponentButtonInteraction>((i) => {
 *     spy(i.data.custom_id);
 *   });
 * });
 *
 * await clickButton("my-button");
 * expect(spy).toHaveBeenCalledWith("my-button");
 * ```
 */
export const renderHook = async <R>(
  hookFn: () => R,
  options?: RenderHookOptions,
): Promise<RenderHookResult<R>> => {
  // フックの戻り値をキャプチャする変数
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let capturedResult: R = undefined as any;
  let renderCount = 0;

  const { session, state, setInteraction } = createMockSession({
    interaction: options?.initialInteraction,
  });

  const app = createDisactApp();

  /**
   * フックを呼び出して結果をキャプチャするラッパーコンポーネント。
   * レンダリング結果は null（Discord ペイロードなし）だが、
   * フックのコンテキストで呼び出されるため全フックが正常に動作する。
   */
  const HookWrapper = (): null => {
    capturedResult = hookFn();
    renderCount++;
    return null;
  };

  // DisactElement としてラッパーコンポーネントを作成
  const element: DisactElement = {
    type: "function",
    fc: HookWrapper,
    props: {},
  };

  // 初回レンダリングを開始（testApp と同じパターン）
  await app.connect(session, element);

  // 初回コミットが完了するまで待機（testApp と同じ）。
  // initialInteraction が指定された場合は差分がなくコミットされない可能性があるため、
  // タイムアウト後に続行する（差分なし = 正常）。
  await waitForInternal(
    () => {
      if (state.commitCount === 0) {
        throw new Error("Waiting for initial render");
      }
    },
    { timeout: options?.initialInteraction !== undefined ? 300 : 1000 },
  ).catch((error) => {
    if (options?.initialInteraction === undefined) {
      throw error;
    }
  });

  /**
   * インタラクションをセットして再レンダリングし、コールバック実行を待機する。
   * testApp の runInteraction と同じパターン。
   */
  const runInteraction = async <T extends APIInteraction>(interaction: T): Promise<void> => {
    setInteraction(interaction);
    const commitCountBefore = state.commitCount;

    await app.connect(session, element);

    // コミットが発生するまで、またはタイムアウトまで待機。
    // ラッパーコンポーネントは null を返すため差分が生じず、
    // コミットが発生しない場合はタイムアウト後に続行する。
    await waitForInternal(
      () => {
        if (state.commitCount === commitCountBefore) {
          throw new Error("Waiting for interaction to complete");
        }
      },
      { timeout: 500 },
    ).catch(() => {});

    setInteraction(undefined);
  };

  return {
    result: {
      get current(): R {
        return capturedResult;
      },
    },

    /**
     * 再レンダリング。
     * コミット差分がなくても renderCount の増加で完了を検知する。
     */
    rerender: async (): Promise<void> => {
      const renderCountBefore = renderCount;
      await app.connect(session, element);
      await waitForInternal(() => {
        if (renderCount <= renderCountBefore) {
          throw new Error("Waiting for rerender");
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
