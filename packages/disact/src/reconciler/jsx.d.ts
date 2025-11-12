/**
 * Internal JSX type definitions for reconciler
 * These intrinsic elements are used internally and not exposed to users
 */

import type { ReactNode } from "react";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      // Core component primitives (internal use only)
      button: {
        children?: ReactNode;
        // biome-ignore lint/suspicious/noExplicitAny: internal intrinsic element with loose typing
        [key: string]: any;
      };
      section: {
        children?: ReactNode;
        // biome-ignore lint/suspicious/noExplicitAny: internal intrinsic element with loose typing
        [key: string]: any;
      };
      slot: {
        name: string;
        children?: ReactNode;
      };
      // Add more as needed
    }
  }
}
