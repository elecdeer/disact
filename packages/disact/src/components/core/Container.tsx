import { ComponentType } from "discord-api-types/v10";

import type { DisactNode, FC } from "../..";

export type ContainerProps = {
  id?: number;
  accentColor?: number;
  spoiler?: boolean;
  children: DisactNode;
};

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
export const Container: FC<ContainerProps> = ({ children, ...rest }) => {
  return (
    <message-component type={ComponentType.Container} {...rest}>
      <slot name="components">{children}</slot>
    </message-component>
  );
};
