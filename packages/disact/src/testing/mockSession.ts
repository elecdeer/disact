import type { APIInteraction } from "discord-api-types/v10";
import type { PayloadElements } from "../components";
import type { Session } from "../app/session";

/**
 * Mock Session の内部状態
 */
export type MockSessionState<T = APIInteraction> = {
  /** 現在コミットされているペイロード */
  currentPayload: PayloadElements | null;
  /** コミット履歴 */
  history: PayloadElements[];
  /** 現在のインタラクション */
  interaction: T | undefined;
  /** コミット回数 */
  commitCount: number;
};

/**
 * テスト用 Mock Session を作成する
 *
 * @param initialState - 初期状態（省略時はデフォルト値）
 * @returns session オブジェクト、内部状態への参照、interaction 更新関数
 *
 * @example
 * ```ts
 * const { session, state, setInteraction } = createMockSession();
 *
 * await app.connect(session, <Component />);
 * expect(state.commitCount).toBe(1);
 * expect(state.currentPayload).toEqual([...]);
 * ```
 */
export const createMockSession = <T = APIInteraction>(
  initialState?: Partial<MockSessionState<T>>,
): {
  session: Session<T>;
  state: MockSessionState<T>;
  setInteraction: (interaction: T | undefined) => void;
} => {
  const state: MockSessionState<T> = {
    currentPayload: initialState?.currentPayload ?? null,
    history: initialState?.history ?? [],
    interaction: initialState?.interaction,
    commitCount: initialState?.commitCount ?? 0,
  };

  const session: Session<T> = {
    commit: async (payload: PayloadElements): Promise<void> => {
      state.currentPayload = payload;
      state.history.push(payload);
      state.commitCount++;
    },
    getCurrent: async (): Promise<PayloadElements | null> => {
      return state.currentPayload;
    },
    getInteraction: (): T | undefined => {
      return state.interaction;
    },
  };

  const setInteraction = (interaction: T | undefined): void => {
    state.interaction = interaction;
  };

  return { session, state, setInteraction };
};
