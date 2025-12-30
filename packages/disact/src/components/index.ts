import type { DisactNode, RenderedElement } from "@disact/engine";
import type { APIMessageTopLevelComponent } from "discord-api-types/v10";
import { ComponentType } from "discord-api-types/v10";
import { messageComponentsRootElementSchema } from "./elements/messageComponentRoot";

export type IntrinsicElements = {
  slot: { children: DisactNode; name: string };
  "message-component": { children?: DisactNode; type: number; [key: string]: unknown };
  element: { children?: DisactNode; type: number; [key: string]: unknown };
};

export type PayloadElements = APIMessageTopLevelComponent[];

export const toMessageComponentsPayload = (element: RenderedElement): PayloadElements => {
  if (element.type === "intrinsic") {
    const parsed = messageComponentsRootElementSchema.parse(element);

    // Containerの場合はcomponentsを返す
    if ("components" in parsed && parsed.type === ComponentType.Container) {
      return parsed.components;
    }

    // それ以外のトップレベルコンポーネントは配列にラップして返す
    return [parsed];
  }

  throw new Error(
    `Invalid root element type: ${element.type}. Only intrinsic elements are allowed at root level.`,
  );
};
