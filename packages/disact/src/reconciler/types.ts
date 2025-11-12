/**
 * Instance types for the React reconciler
 */

/**
 * Base type for component props
 */
export type PropsBase = Record<PropertyKey, unknown>;

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
export type RenderContainer = {
  root: (Instance | TextInstance)[];
};

/**
 * Child set type used in persistent mode
 */
export type ChildSet = (Instance | TextInstance)[];
