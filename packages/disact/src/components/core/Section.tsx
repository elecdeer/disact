import type { DisactNode } from "@disact/engine";
import type { SectionElement } from "../elements/sectionElement";

export type SectionProps = SectionElement;

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
    <section {...rest} accessory={<slot>{accessory}</slot>}>
      {children}
    </section>
  );
};
