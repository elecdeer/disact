import type { PayloadElements } from "../components";
import type { Session } from "../app/session";

/**
 * Mock Session の内部状態
 */
export type MockSessionState = {
  /** 現在コミットされているペイロード */
  currentPayload: PayloadElements | null;
  /** コミット履歴 */
  history: PayloadElements[];
  /** コミット回数 */
  commitCount: number;
};

/**
 * テスト用 Mock Session を作成する
 *
 * @param initialState - 初期状態（省略時はデフォルト値）
 * @returns session オブジェクト、内部状態への参照
 *
 * @example
 * ```ts
 * const { session, state } = createMockSession();
 *
 * const instance = await app.connect(session, <Component />);
 * expect(state.commitCount).toBe(1);
 * expect(state.currentPayload).toEqual([...]);
 * ```
 */
export const createMockSession = (
  initialState?: Partial<MockSessionState>,
): {
  session: Session;
  state: MockSessionState;
} => {
  const state: MockSessionState = {
    currentPayload: initialState?.currentPayload ?? null,
    history: initialState?.history ?? [],
    commitCount: initialState?.commitCount ?? 0,
  };

  const session: Session = {
    commit: async (payload: PayloadElements): Promise<void> => {
      state.currentPayload = payload;
      state.history.push(payload);
      state.commitCount++;
    },
    getCurrent: async (): Promise<PayloadElements | null> => {
      return state.currentPayload;
    },
  };

  return { session, state };
};
