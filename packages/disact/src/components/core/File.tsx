import type { DisactNode } from "@disact/engine";
import type { FileElement } from "../elements/fileElement";

export type FileProps = FileElement;

/**
 * File - ファイルコンポーネント
 *
 * @example
 * ```tsx
 * <File url="https://example.com/file.png" />
 * ```
 */
export const File = (props: FileProps): DisactNode => {
  return <file {...props} />;
};
