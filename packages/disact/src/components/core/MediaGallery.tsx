import { ComponentType } from "discord-api-types/v10";

import type { FC } from "../..";

export type MediaGalleryProps = {
  id?: number;
  items: {
    description?: string;
    spoiler?: boolean;
    media: {
      url: string;
    };
  }[];
};

/**
 * MediaGallery - メディアギャラリーコンポーネント
 *
 * @example
 * ```tsx
 * <MediaGallery items={[{ media: { url: "https://example.com/image.png" } }]} />
 * ```
 */
export const MediaGallery: FC<MediaGalleryProps> = (props) => {
  return <message-component type={ComponentType.MediaGallery} {...props} />;
};
