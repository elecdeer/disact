/**
 * Core type definitions for disact
 * Re-exports React types with disact-specific customizations
 */

import type React from "react";

/**
 * Represents any valid child node in disact
 */
export type ReactNode = React.ReactNode;

/**
 * Represents a disact element
 */
export type ReactElement = React.ReactElement;

/**
 * Function component type
 */
export type FC<P = Record<string, never>> = React.FC<P>;

/**
 * Props with children
 */
export type PropsWithChildren<P = unknown> = P & {
  children?: ReactNode;
};
