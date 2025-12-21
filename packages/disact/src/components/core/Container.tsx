import type { DisactNode } from "@disact/engine";
import type { ContainerElement } from "../elements/containerElement";

export type ContainerProps = ContainerElement;

/**
 * Container - コンテナコンポーネント
 *
 * @example
 * ```tsx
 * <Container>
 *   <TextDisplay>Content</TextDisplay>
 * </Container>
 * ```
 */
export const Container = (props: ContainerProps): DisactNode => {
  return <container {...props} />;
};
