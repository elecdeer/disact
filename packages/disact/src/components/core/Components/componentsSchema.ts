import type { APIMessageTopLevelComponent } from "discord-api-types/v10";
import * as z from "zod";
import { actionRowInMessageElementSchema } from "../ActionRow/actionRowSchema";
import { containerElementSchema } from "../Container/containerSchema";
import { fileElementSchema } from "../File/fileSchema";
import { mediaGalleryElementSchema } from "../MediaGallery/mediaGallerySchema";
import { sectionElementSchema } from "../Section/sectionSchema";
import { separatorElementSchema } from "../Separator/separatorSchema";
import { textDisplayElementSchema } from "../TextDisplay/textDisplaySchema";

/**
 * メッセージコンポーネントのトップレベル要素の schema
 * Components (Fragment) の子要素として使用可能なコンポーネント
 */
const componentsChildrenSchema = z.union([
  actionRowInMessageElementSchema,
  containerElementSchema,
  fileElementSchema,
  mediaGalleryElementSchema,
  sectionElementSchema,
  separatorElementSchema,
  textDisplayElementSchema,
]);

/**
 * Components のレンダリング結果を Discord API のメッセージコンポーネント配列に変換する schema
 *
 * RenderResult (単一要素 | 配列 | null) を受け取り、APIMessageTopLevelComponent[] に変換する
 */
export const componentsRenderResultSchema = z
  .union([
    z.null(),
    componentsChildrenSchema,
    z.array(componentsChildrenSchema),
  ])
  .transform((renderResult): APIMessageTopLevelComponent[] => {
    if (renderResult === null) {
      return [];
    }

    if (Array.isArray(renderResult)) {
      // Fragment の場合: 各要素をそのまま返す
      return renderResult;
    }

    // 単一要素の場合: 配列にラップして返す
    return [renderResult];
  });
