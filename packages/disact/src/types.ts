/**
 * Core type definitions for disact
 * Re-exports React types with disact-specific customizations
 */

import type React from "react";

/**
 * Represents any valid child node in disact
 */
export type DisactNode = React.ReactNode;

/**
 * Represents a disact element
 */
export type DisactElement = React.ReactElement;

/**
 * Function component type
 */
export type FC<P = Record<string, never>> = React.FC<P>;

/**
 * Props with children
 */
export type PropsWithChildren<P = unknown> = P & {
  children?: DisactNode;
};
