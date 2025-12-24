import type { DisactNode } from "@disact/engine";
import { ComponentType } from "discord-api-types/v10";
import type { FileElement } from "../elements/fileElement";

export type FileProps = FileElement;

/**
 * File - ファイルコンポーネント
 *
 * @example
 * ```tsx
 * <File file={{ url: "https://example.com/file.png" }} />
 * ```
 */
export const File = (props: FileProps): DisactNode => {
  return <message-component type={ComponentType.File} {...props} />;
};
