/**
 * Rendering API using React Reconciler
 */

import type { ReactElement } from "react";
import { reconciler } from "./reconciler.js";
import type { Instance, RenderContainer, TextInstance } from "./types.js";

/**
 * Renders a React element using the reconciler
 * @param element - React element to render
 * @returns Promise that resolves to the rendered instance tree
 */
export const renderToInstance = (
  element: ReactElement,
): Promise<(Instance | TextInstance)[]> => {
  return new Promise((resolve, reject) => {
    try {
      // Create container
      const container: RenderContainer = { root: [] };

      // Create root
      const root = reconciler.createContainer(
        container,
        0, // ConcurrentRoot
        null, // hydrationCallbacks
        false, // isStrictMode
        null, // concurrentUpdatesByDefaultOverride
        "", // identifierPrefix
        (error: Error) => reject(error), // onUncaughtError
        (error: Error) => reject(error), // onCaughtError
        (error: Error) => console.error("Recoverable error:", error), // onRecoverableError
        () => {}, // onDefaultTransitionIndicator
        null, // transitionCallbacks
      );

      // Render element
      reconciler.updateContainer(element, root, null, () => {
        // Commit is complete, resolve with the instance tree
        resolve(container.root);
      });
    } catch (error) {
      reject(error);
    }
  });
};
