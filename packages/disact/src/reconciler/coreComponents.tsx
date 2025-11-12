/**
 * Example core components using internal intrinsic elements
 * These demonstrate how to define Discord-specific components
 */

import type { ReactNode } from "../types.js";

/**
 * Button component example
 */
type ButtonProps = {
  children?: ReactNode;
  disabled?: boolean;
} & (
  | { style: "primary" | "secondary" | "success" | "danger"; customId: string }
  | { style: "link"; url: string }
  | { style: "premium"; skuId: string }
);

export const Button = ({ children, ...props }: ButtonProps) => {
  return <button {...props}>{children}</button>;
};

/**
 * Section component example with multiple slots
 */
type SectionProps = {
  id?: number;
  children?: ReactNode;
  accessory?: ReactNode;
};

export const Section = ({ children, accessory, ...props }: SectionProps) => {
  return (
    <section {...props}>
      <slot name="components">{children}</slot>
      <slot name="accessory">{accessory}</slot>
    </section>
  );
};
