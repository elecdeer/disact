import type { DisactNode } from "@disact/engine";
import { ComponentType } from "discord-api-types/v10";

export type SectionProps = {
  id?: number;
  accessory: DisactNode;
  children: DisactNode;
};

/**
 * Section - セクションコンポーネント
 *
 * @example
 * ```tsx
 * <Section accessory={<Button style="primary" customId="btn">Click</Button>}>
 *   <TextDisplay>Content</TextDisplay>
 * </Section>
 * ```
 */
export const Section = ({ accessory, children, ...rest }: SectionProps): DisactNode => {
  return (
    <message-component type={ComponentType.Section} {...rest}>
      <slot name="accessory">{accessory}</slot>
      <slot name="components">{children}</slot>
    </message-component>
  );
};

/*
 * transformTo
 * {
 *   type: ComponentType.Section,
 *   id: 885,
 *   components: [{...}, {...}],
 *   accessory: {...}
 * }
 */
