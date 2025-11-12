/**
 * React Reconciler instance
 */

import ReactReconciler from "react-reconciler";
import { hostConfig } from "./hostConfig.js";

export const reconciler = ReactReconciler(hostConfig);
