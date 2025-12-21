import type { DisactNode } from "@disact/engine";
import type { ThumbnailElement } from "../elements/thumbnailElement";

export type ThumbnailProps = ThumbnailElement;

/**
 * Thumbnail - サムネイルコンポーネント
 *
 * @example
 * ```tsx
 * <Thumbnail url="https://example.com/thumbnail.png" />
 * ```
 */
export const Thumbnail = (props: ThumbnailProps): DisactNode => {
  return <thumbnail {...props} />;
};
