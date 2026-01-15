import type { APIMessageTopLevelComponent } from "discord-api-types/v10";
import { ComponentType } from "discord-api-types/v10";

/**
 * Discord メッセージコンポーネントからすべての customId を抽出する
 *
 * ActionRow、Container、Section内のコンポーネントを再帰的に探索し、
 * customIdを持つすべてのコンポーネント（Button、SelectMenuなど）からcustomIdを抽出する。
 *
 * @param components - Discord APIメッセージのトップレベルコンポーネント配列
 * @returns 抽出されたcustomIdの配列
 *
 * @example
 * ```typescript
 * const customIds = extractCustomIds(interaction.message.components);
 * // ["dsct|counter|5|6", "dsct|page|2|3"]
 * ```
 */
export const extractCustomIds = (
  components: APIMessageTopLevelComponent[] | undefined,
): string[] => {
  const customIds: string[] = [];

  if (!components) {
    return customIds;
  }

  for (const component of components) {
    // 型チェックのためunknownを経由
    const comp = component as unknown;

    if (typeof comp !== "object" || comp === null) {
      continue;
    }

    if (!("type" in comp)) {
      continue;
    }

    const typedComp = comp as { type: ComponentType };

    switch (typedComp.type) {
      case ComponentType.ActionRow:
        // ActionRowの中のコンポーネントを走査
        if ("components" in comp && Array.isArray(comp.components)) {
          for (const child of comp.components as unknown[]) {
            // customIdを持つコンポーネント（Button、SelectMenuなど）
            if (
              typeof child === "object" &&
              child !== null &&
              "custom_id" in child &&
              typeof child.custom_id === "string"
            ) {
              customIds.push(child.custom_id);
            }
          }
        }
        break;

      case ComponentType.Container:
        // Containerの中のコンポーネントを再帰的に探索
        if ("components" in comp && Array.isArray(comp.components)) {
          const nestedCustomIds = extractCustomIds(
            comp.components as APIMessageTopLevelComponent[],
          );
          customIds.push(...nestedCustomIds);
        }
        break;

      case ComponentType.Section:
        // Sectionのaccessory（ButtonまたはThumbnail）を確認
        if ("accessory" in comp) {
          const accessory = comp.accessory as unknown;
          if (
            typeof accessory === "object" &&
            accessory !== null &&
            "custom_id" in accessory &&
            typeof accessory.custom_id === "string"
          ) {
            customIds.push(accessory.custom_id);
          }
        }
        break;

      // File、MediaGallery、Separator、TextDisplayはcustomIdを持たない
      default:
        break;
    }
  }

  return customIds;
};
