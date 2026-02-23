import {
  ComponentType,
  type APIButtonComponent,
  type APISelectMenuComponent,
} from "discord-api-types/v10";
import type { PayloadElements } from "../components";

/** マッチャー型: 文字列の完全一致または正規表現 */
export type TextMatch = string | RegExp;

/** クエリ対象のコンポーネントタイプ */

export type ComponentByTypeMap = {
  [ComponentType.Button]: APIButtonComponent;
  [ComponentType.StringSelect]: APISelectMenuComponent;
  [ComponentType.UserSelect]: APISelectMenuComponent;
  [ComponentType.RoleSelect]: APISelectMenuComponent;
  [ComponentType.MentionableSelect]: APISelectMenuComponent;
  [ComponentType.ChannelSelect]: APISelectMenuComponent;
};
export type QueryableComponentType = keyof ComponentByTypeMap;

/** ComponentType から返り値の型を推論 */
type ComponentByType<T extends QueryableComponentType> = ComponentByTypeMap[T];
/**
 * テキストマッチャーによる文字列の一致判定
 */
const matchesText = (text: string | undefined, matcher: TextMatch): boolean => {
  if (text === undefined) return false;
  if (typeof matcher === "string") return text === matcher;
  return matcher.test(text);
};

/**
 * コンポーネントのクエリ用ラベルフィールドを取得
 * - Button: label フィールド
 * - Select: placeholder フィールド
 */
const getQueryLabel = (
  component: APIButtonComponent | APISelectMenuComponent,
): string | undefined => {
  if (component.type === ComponentType.Button) {
    // APIButtonComponentWithSKUId は label を持たないため in 演算子でチェック
    return "label" in component ? component.label : undefined;
  }
  return component.placeholder;
};

/**
 * PayloadElements を再帰的に探索し、条件に一致するコンポーネントを収集する
 */
const findComponents = <T>(
  payload: PayloadElements | null,
  predicate: (component: unknown) => component is T,
): T[] => {
  if (!payload) return [];

  const results: T[] = [];

  const traverse = (items: unknown[]): void => {
    for (const item of items) {
      if (predicate(item)) {
        results.push(item);
      }

      if (typeof item === "object" && item !== null) {
        // components フィールドを持つ場合は再帰的に探索
        if ("components" in item && Array.isArray((item as { components: unknown[] }).components)) {
          traverse((item as { components: unknown[] }).components);
        }

        // accessory フィールドを持つ場合（Section コンポーネントのアクセサリ）
        if ("accessory" in item) {
          const accessory = (item as { accessory: unknown }).accessory;
          if (accessory !== null && typeof accessory === "object") {
            traverse([accessory]);
          }
        }
      }
    }
  };

  traverse(payload);
  return results;
};

/**
 * 指定した type のコンポーネントを型ガードで判定する
 */
const isComponentOfType =
  <T extends QueryableComponentType>(type: T) =>
  (component: unknown): component is ComponentByType<T> => {
    return (
      typeof component === "object" &&
      component !== null &&
      "type" in component &&
      (component as { type: number }).type === type
    );
  };

/**
 * 指定した type の全コンポーネントを取得
 *
 * @param payload - 検索対象のペイロード
 * @param type - 取得するコンポーネントタイプ
 * @returns 指定した type の全コンポーネントの配列
 *
 * @example
 * ```tsx
 * const allButtons = getAll(current.payload, ComponentType.Button);
 * expect(allButtons).toHaveLength(2);
 * ```
 */
export const getAll = <T extends QueryableComponentType>(
  payload: PayloadElements | null,
  type: T,
): ComponentByType<T>[] => {
  return findComponents(payload, isComponentOfType(type));
};

/**
 * ラベルまたは placeholder でコンポーネントを検索（見つからなければ null を返す）
 * - Button: label フィールドで検索
 * - Select: placeholder フィールドで検索
 *
 * @param payload - 検索対象のペイロード
 * @param label - 検索するラベル（完全一致文字列または正規表現）
 * @param type - 検索するコンポーネントタイプ
 * @returns 一致したコンポーネント、または null
 *
 * @example
 * ```tsx
 * // 存在しないことを確認
 * const deleteBtn = queryByLabel(current.payload, "Delete", ComponentType.Button);
 * expect(deleteBtn).toBeNull();
 * ```
 */
export const queryByLabel = <T extends QueryableComponentType>(
  payload: PayloadElements | null,
  label: TextMatch,
  type: T,
): ComponentByType<T> | null => {
  const allComponents = getAll(payload, type);

  for (const component of allComponents) {
    // ComponentByType<T> は必ず APIButtonComponent | APISelectMenuComponent のいずれかのため安全
    const queryLabel = getQueryLabel(component as APIButtonComponent | APISelectMenuComponent);
    if (matchesText(queryLabel, label)) {
      return component;
    }
  }

  return null;
};

/**
 * ラベルまたは placeholder でコンポーネントを検索（見つからなければ throw）
 * - Button: label フィールドで検索
 * - Select: placeholder フィールドで検索
 *
 * @param payload - 検索対象のペイロード
 * @param label - 検索するラベル（完全一致文字列または正規表現）
 * @param type - 検索するコンポーネントタイプ
 * @returns 一致したコンポーネント
 * @throws {Error} 一致するコンポーネントが見つからない場合
 *
 * @example
 * ```tsx
 * // 完全一致
 * const button = getByLabel(current.payload, "+1", ComponentType.Button);
 * await clickButton(button.custom_id);
 *
 * // 正規表現で部分一致
 * const incrementBtn = getByLabel(current.payload, /^\+/, ComponentType.Button);
 * ```
 */
export const getByLabel = <T extends QueryableComponentType>(
  payload: PayloadElements | null,
  label: TextMatch,
  type: T,
): ComponentByType<T> => {
  const result = queryByLabel(payload, label, type);
  if (result === null) {
    const matcherStr = label instanceof RegExp ? label.toString() : JSON.stringify(label);
    // ComponentType は通常の数値 enum のため逆引きで名前を取得できる
    const typeName = (ComponentType as Record<number, string>)[type] ?? String(type);
    throw new Error(
      `Unable to find component of type "${typeName}" with label matching ${matcherStr}`,
    );
  }
  return result;
};
