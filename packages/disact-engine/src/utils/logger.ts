import { getLogger } from "@logtape/logtape";

/**
 * disact-engineパッケージ用のロガーを取得
 *
 * @example
 * ```typescript
 * const logger = getEngineLogger("render");
 * logger.debug("Starting render", { elementType });
 * ```
 */
export const getEngineLogger = (...category: string[]) => {
  return getLogger(["disact-engine", ...category]);
};
