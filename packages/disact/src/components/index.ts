import type { DisactNode, RenderResult } from "@disact/engine";
import type { APIMessageTopLevelComponent } from "discord-api-types/v10";
import { componentsRenderResultSchema } from "./core/Components/componentsSchema";

export type IntrinsicElements = {
  slot: { children: DisactNode; name: string };
  "message-component": { children?: DisactNode; type: number; [key: string]: unknown };
  element: { children?: DisactNode; type: number; [key: string]: unknown };
};

export type PayloadElements = APIMessageTopLevelComponent[];

/**
 * レンダリングされた要素を Discord API のメッセージコンポーネント配列に変換
 *
 * @param renderResult - レンダリング結果（単一要素、配列、または null）
 * @returns Discord API のメッセージコンポーネント配列
 */
export const toMessageComponentsPayload = (renderResult: RenderResult): PayloadElements => {
  return componentsRenderResultSchema.parse(renderResult);
};
