/**
 * Example core components using internal intrinsic elements
 * These demonstrate how to define Discord-specific components
 */

/// <reference path="./jsx.d.ts" />

import type { ReactNode } from "react";

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
  // biome-ignore lint/suspicious/noExplicitAny: using internal intrinsic element
  return <button {...(props as any)}>{children}</button>;
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
    // biome-ignore lint/suspicious/noExplicitAny: using internal intrinsic element
    <section {...(props as any)}>
      <slot name="components">{children}</slot>
      <slot name="accessory">{accessory}</slot>
    </section>
  );
};
