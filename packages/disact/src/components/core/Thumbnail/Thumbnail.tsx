import { ComponentType } from "discord-api-types/v10";
import type { FC } from "../../..";

export type ThumbnailProps = {
  id?: number;
  description?: string;
  spoiler?: boolean;
  media: {
    url: string;
  };
};

/**
 * Thumbnail - サムネイルコンポーネント
 *
 * @example
 * ```tsx
 * <Thumbnail media={{ url: "https://example.com/thumbnail.png" }} />
 * ```
 */
export const Thumbnail: FC<ThumbnailProps> = (props) => {
  return <message-component type={ComponentType.Thumbnail} {...props} />;
};
