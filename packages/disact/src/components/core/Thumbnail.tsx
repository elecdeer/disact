import type { DisactNode } from "@disact/engine";
import { ComponentType } from "discord-api-types/v10";
import type { ThumbnailElement } from "../elements/thumbnailElement";

export type ThumbnailProps = ThumbnailElement;

/**
 * Thumbnail - サムネイルコンポーネント
 *
 * @example
 * ```tsx
 * <Thumbnail media={{ url: "https://example.com/thumbnail.png" }} />
 * ```
 */
export const Thumbnail = (props: ThumbnailProps): DisactNode => {
  return <message-component type={ComponentType.Thumbnail} {...props} />;
};
