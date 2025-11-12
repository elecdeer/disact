/**
 * Instance types for the React reconciler
 */

import type { PropsBase } from "../element.js";

/**
 * Represents a rendered element instance
 */
export type Instance = {
  type: "intrinsic";
  name: string;
  props: PropsBase;
  children: (Instance | TextInstance)[];
};

/**
 * Represents a text node instance
 */
export type TextInstance = {
  type: "text";
  content: string;
};

/**
 * Container type that holds the root of the rendered tree
 */
export type Container = {
  root: (Instance | TextInstance)[];
};

/**
 * Child set type used in persistent mode
 */
export type ChildSet = (Instance | TextInstance)[];
