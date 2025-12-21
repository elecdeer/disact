import type { DisactNode } from "@disact/engine";
import type { MediaGalleryElement } from "../elements/mediaGalleryElement";

export type MediaGalleryProps = MediaGalleryElement;

/**
 * MediaGallery - メディアギャラリーコンポーネント
 *
 * @example
 * ```tsx
 * <MediaGallery items={[{ url: "https://example.com/image.png" }]} />
 * ```
 */
export const MediaGallery = (props: MediaGalleryProps): DisactNode => {
  return <mediaGallery {...props} />;
};
