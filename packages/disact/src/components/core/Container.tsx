import type { DisactNode } from "@disact/engine";
import { ComponentType } from "discord-api-types/v10";
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
export const Container = ({ children, ...rest }: ContainerProps): DisactNode => {
  return (
    <message-component type={ComponentType.Container} {...rest}>
      <slot name="components">{children}</slot>
    </message-component>
  );
};
