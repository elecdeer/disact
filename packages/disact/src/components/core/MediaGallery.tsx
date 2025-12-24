import type { DisactNode } from "@disact/engine";
import { ComponentType } from "discord-api-types/v10";
import type { MediaGalleryElement } from "../elements/mediaGalleryElement";

export type MediaGalleryProps = MediaGalleryElement;

/**
 * MediaGallery - メディアギャラリーコンポーネント
 *
 * @example
 * ```tsx
 * <MediaGallery items={[{ media: { url: "https://example.com/image.png" } }]} />
 * ```
 */
export const MediaGallery = (props: MediaGalleryProps): DisactNode => {
  return <message-component type={ComponentType.MediaGallery} {...props} />;
};
