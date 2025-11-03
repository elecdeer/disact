import type { PayloadElement } from "../components";

/**
 * 再帰的にPayloadElementを比較し、異なる場合にtrueを返す
 */
export const isDifferentPayloadElement = (
  prev: PayloadElement,
  next: PayloadElement,
): boolean => {
  // 同じ参照なら false
  if (prev === next) return false;

  // 型が異なる場合は true
  const prevType = typeof prev;
  const nextType = typeof next;
  if (prevType !== nextType) return true;

  // プリミティブ値の比較
  if (prevType !== "object" || prev === null || next === null) {
    return prev !== next;
  }

  // 配列の比較
  if (Array.isArray(prev) && Array.isArray(next)) {
    if (prev.length !== next.length) return true;
    return prev.some((item, index) =>
      isDifferentPayloadElement(item, next[index]),
    );
  }

  // 配列と非配列の比較
  if (Array.isArray(prev) !== Array.isArray(next)) return true;

  // オブジェクトの比較
  const prevKeys = Object.keys(prev);
  const nextKeys = Object.keys(next);

  // キーの数が異なる場合は true
  if (prevKeys.length !== nextKeys.length) return true;

  // すべてのキーの値を再帰的に比較
  for (const key of prevKeys) {
    if (!(key in next)) return true;
    const prevValue = prev[key as keyof typeof prev];
    const nextValue = next[key as keyof typeof next];
    if (isDifferent(prevValue, nextValue)) {
      return true;
    }
  }

  return false;
};

/**
 * 任意の値を比較する内部ヘルパー関数
 */
const isDifferent = (prev: unknown, next: unknown): boolean => {
  // 同じ参照なら false
  if (prev === next) return false;

  // 型が異なる場合は true
  const prevType = typeof prev;
  const nextType = typeof next;
  if (prevType !== nextType) return true;

  // プリミティブ値の比較
  if (
    prevType !== "object" ||
    nextType !== "object" ||
    prev === null ||
    next === null
  ) {
    return prev !== next;
  }

  // 配列の比較
  if (Array.isArray(prev) && Array.isArray(next)) {
    if (prev.length !== next.length) return true;
    return prev.some((item, index) => isDifferent(item, next[index]));
  }

  // 配列と非配列の比較
  if (Array.isArray(prev) !== Array.isArray(next)) return true;

  // この時点で prev と next は非 null のオブジェクトで配列でもない
  // 型ガードで絞り込む
  if (!isRecord(prev) || !isRecord(next)) {
    // オブジェクトだが Record でない場合（関数など）
    return true;
  }

  // オブジェクトの比較
  const prevKeys = Object.keys(prev);
  const nextKeys = Object.keys(next);

  // キーの数が異なる場合は true
  if (prevKeys.length !== nextKeys.length) return true;

  // すべてのキーの値を再帰的に比較
  for (const key of prevKeys) {
    if (!(key in next)) return true;
    if (isDifferent(prev[key], next[key])) {
      return true;
    }
  }

  return false;
};

/**
 * 値が Record<string, unknown> かどうかを判定する型ガード
 */
const isRecord = (value: unknown): value is Record<string, unknown> => {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype
  );
};
