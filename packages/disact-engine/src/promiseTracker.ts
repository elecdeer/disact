/**
 * レンダリング中のPromise追跡機能
 */
export interface PromiseTracker {
  trackPromises(promises: Promise<unknown>[]): void;
  areAllResolved(): boolean;
  getPendingPromises(): Promise<unknown>[];
  waitForAnyResolution(): Promise<void>;
  hasPendingPromises(): boolean;
}

/**
 * Promise の追跡機能を作成する
 * レンダリング中に投げられたPromiseの解決状況を管理
 */
export const createPromiseTracker = (): PromiseTracker => {
  const settledPromises = new Set<Promise<unknown>>();
  const allPromises: Promise<unknown>[] = [];

  const trackPromise = (promise: Promise<unknown>) => {
    if (!allPromises.includes(promise)) {
      allPromises.push(promise);
    }
    promise.then(
      () => settledPromises.add(promise),
      () => settledPromises.add(promise),
    );
  };

  const trackPromises = (promises: Promise<unknown>[]) => {
    for (const promise of promises) {
      trackPromise(promise);
    }
  };

  const areAllResolved = (): boolean => {
    return allPromises.every((promise) => settledPromises.has(promise));
  };

  const getPendingPromises = (): Promise<unknown>[] => {
    return allPromises.filter((promise) => !settledPromises.has(promise));
  };

  const waitForAnyResolution = async (): Promise<void> => {
    const pendingPromises = getPendingPromises();
    if (pendingPromises.length > 0) {
      await Promise.race(pendingPromises);
    }
  };

  const hasPendingPromises = (): boolean => {
    return getPendingPromises().length > 0;
  };

  return {
    trackPromises,
    areAllResolved,
    getPendingPromises,
    waitForAnyResolution,
    hasPendingPromises,
  };
};
