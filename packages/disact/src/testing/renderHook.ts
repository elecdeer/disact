import type { DisactElement, RenderLifecycleCallbacks } from "@disact/engine";
import { renderToReadableStream } from "@disact/engine";
import type {
  APIInteraction,
  APIMessageComponentButtonInteraction,
  APIMessageComponentSelectMenuInteraction,
} from "discord-api-types/v10";
import type { InteractionCallback, InteractionCallbacksContext } from "../hooks/useInteraction";
import type { EmbedStateContext } from "../state/embedStateContext";
import { createButtonInteraction, createSelectInteraction } from "./interactionFactory";

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
 * testApp をベースに、コンポーネントのレンダリング結果ではなくフックの戻り値に
 * フォーカスしたテスト API を提供する。フックはラッパーコンポーネント内で呼び出され、
 * その戻り値が `result.current` に格納される。
 *
 * useEmbedState の状態はレンダリングサイクルをまたいで保持されるため、
 * 複数回のインタラクションでも正しい状態遷移をテストできる。
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

  /**
   * useEmbedState の状態をレンダリングサイクルをまたいで保持するマップ。
   * 各 runRenderCycle 呼び出しで同じ Map を渡すことで、
   * インタラクションによる状態更新が次のサイクルにも引き継がれる。
   */
  const persistedComputedStates = new Map<string, unknown>();

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

  /**
   * 1回のレンダリングサイクルを実行する。
   *
   * interaction が指定された場合、レンダリング完了後に useInteraction / useEmbedState
   * のコールバックを1回だけ実行する（無限ループを防ぐため）。
   * useEmbedState のように rerender() を呼ぶ場合は再レンダリングが発生し、
   * ストリームが完全にクローズするまで待機する。
   *
   * @param interaction - 実行するインタラクション（省略時はインタラクションなし）
   */
  const runRenderCycle = async (interaction?: APIInteraction): Promise<void> => {
    const interactionCallbacks: InteractionCallback<APIInteraction>[] = [];

    // interaction のコールバックが1度だけ実行されるよう制御するフラグ
    // 2回目以降の postRenderCycle ではスキップする（無限ループ防止）
    let interactionFired = false;

    const context: EmbedStateContext & InteractionCallbacksContext<APIInteraction> = {
      __interactionCallbacks: interactionCallbacks,
      __embedStateInstanceCounter: 0,
      // サイクルをまたいで状態を保持するため、共有の Map を渡す
      __embedStateComputedStates: persistedComputedStates,
    };

    if (interaction !== undefined) {
      context.__interaction = interaction;
    }

    const lifecycleCallbacks: RenderLifecycleCallbacks = {
      preRender: async () => {
        // 各レンダリング前に callback 配列をクリア（最終レンダリングの callback のみを保持）
        interactionCallbacks.length = 0;
        // instance カウンターをリセット（再レンダリング時に同じ instanceId を生成するため）
        context.__embedStateInstanceCounter = 0;
      },
      postRenderCycle: async () => {
        // interaction callback は最初の postRenderCycle で1回だけ実行する。
        // useEmbedState の rerender() により再レンダリングが発生しても
        // 2回目以降の postRenderCycle では実行しない（無限ループ防止）。
        if (interactionFired || interaction === undefined || interactionCallbacks.length === 0) {
          return;
        }

        interactionFired = true;

        for (const callback of interactionCallbacks) {
          try {
            await callback(interaction);
          } catch {
            // エラーが発生しても続行
          }
        }
      },
    };

    const stream = renderToReadableStream(element, context, lifecycleCallbacks);

    // ストリームを最後まで処理して完了を待つ（ペイロードは不要なので破棄）
    for await (const _chunk of stream) {
      // drain
    }
  };

  // 初回レンダリング（initialInteraction があれば interaction ありで実行）
  await runRenderCycle(options?.initialInteraction);

  return {
    result: {
      get current(): R {
        return capturedResult;
      },
    },

    rerender: (): Promise<void> => runRenderCycle(),

    interact: <T extends APIInteraction>(interaction: T): Promise<void> =>
      runRenderCycle(interaction as APIInteraction),

    clickButton: async (
      customId: string,
      overrides?: Partial<APIMessageComponentButtonInteraction>,
    ): Promise<void> => {
      const interaction = createButtonInteraction(customId, overrides);
      await runRenderCycle(interaction);
    },

    selectOption: async (
      customId: string,
      values: string[],
      overrides?: Partial<APIMessageComponentSelectMenuInteraction>,
    ): Promise<void> => {
      const interaction = createSelectInteraction(customId, values, overrides);
      await runRenderCycle(interaction);
    },
  };
};
