import { ComponentType } from "discord-api-types/v10";
import type { FC } from "../../..";

export type FileProps = {
  id?: number;
  spoiler?: boolean;
  file: {
    url: string;
  };
};

/**
 * File - ファイルコンポーネント
 *
 * @example
 * ```tsx
 * <File file={{ url: "https://example.com/file.png" }} />
 * ```
 */
export const File: FC<FileProps> = (props) => {
  return <message-component type={ComponentType.File} {...props} />;
};
