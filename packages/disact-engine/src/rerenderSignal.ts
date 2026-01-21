/**
 * 再レンダリングのトリガー機能を提供
 * - 手動での再レンダリング要求
 * - Promiseの追跡と自動再レンダリング
 */
export interface RerenderSignal {
  /**
   * 即時再レンダリングを要求
   */
  requestRerender(): void;

  /**
   * Promiseを追跡し、解決時に自動的に再レンダリングをトリガー
   */
  trackPromise(promise: Promise<unknown>): void;

  /**
   * 複数のPromiseを追跡
   */
  trackPromises(promises: Promise<unknown>[]): void;

  /**
   * 再レンダリングが必要かどうか（手動要求 or Promise解決）
   */
  shouldRerender(): boolean;

  /**
   * 次の再レンダリングトリガーを待機
   */
  waitForRerenderTrigger(): Promise<void>;

  /**
   * 再レンダリング要求フラグをクリア
   */
  clearRerenderRequest(): void;

  /**
   * 全てのPromiseが解決済みかどうか
   */
  areAllPromisesResolved(): boolean;
}

/**
 * RerenderSignalを作成
 */
export const createRerenderSignal = (): RerenderSignal => {
  // Promise追跡用
  const settledPromises = new Set<Promise<unknown>>();
  const allPromises: Promise<unknown>[] = [];

  // 手動再レンダリング要求用
  let rerenderRequested = false;
  let rerenderResolvers: Array<() => void> = [];

  const trackPromise = (promise: Promise<unknown>) => {
    if (!allPromises.includes(promise)) {
      allPromises.push(promise);
    }

    promise.then(
      () => {
        settledPromises.add(promise);
        // Promise解決時に待機中のresolverを全て呼び出す
        const resolvers = rerenderResolvers;
        rerenderResolvers = [];
        for (const resolve of resolvers) {
          resolve();
        }
      },
      () => {
        settledPromises.add(promise);
        // Promise解決時に待機中のresolverを全て呼び出す
        const resolvers = rerenderResolvers;
        rerenderResolvers = [];
        for (const resolve of resolvers) {
          resolve();
        }
      },
    );
  };

  const trackPromises = (promises: Promise<unknown>[]) => {
    for (const promise of promises) {
      trackPromise(promise);
    }
  };

  const requestRerender = () => {
    rerenderRequested = true;
    // 手動要求時も待機中のresolverを全て呼び出す
    const resolvers = rerenderResolvers;
    rerenderResolvers = [];
    resolvers.forEach((resolve) => resolve());
  };

  const areAllPromisesResolved = (): boolean => {
    return allPromises.every((promise) => settledPromises.has(promise));
  };

  const getPendingPromises = (): Promise<unknown>[] => {
    return allPromises.filter((promise) => !settledPromises.has(promise));
  };

  const hasPendingPromises = (): boolean => {
    return getPendingPromises().length > 0;
  };

  const shouldRerender = (): boolean => {
    // 手動要求があるか、または未解決のPromiseがある
    return rerenderRequested || hasPendingPromises();
  };

  const waitForRerenderTrigger = async (): Promise<void> => {
    // 既に再レンダリング要求がある場合は即座に解決
    if (rerenderRequested) {
      return;
    }

    const pendingPromises = getPendingPromises();
    if (pendingPromises.length === 0) {
      return;
    }

    // Promiseの解決または手動要求を待機
    await new Promise<void>((resolve) => {
      rerenderResolvers.push(resolve);
    });
  };

  const clearRerenderRequest = () => {
    rerenderRequested = false;
  };

  return {
    requestRerender,
    trackPromise,
    trackPromises,
    shouldRerender,
    waitForRerenderTrigger,
    clearRerenderRequest,
    areAllPromisesResolved,
  };
};
