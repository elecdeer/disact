/**
 * React Reconciler Host Config for Persistent Mode
 */

import React from "react";
import type { HostConfig, ReactContext } from "react-reconciler";
import { DefaultEventPriority } from "react-reconciler/constants";
import type { PropsBase } from "../element.js";
import type { ChildSet, Container, Instance, TextInstance } from "./types.js";

type Type = string;
type Props = PropsBase;
type SuspenseInstance = Instance;
type HydratableInstance = never;
type FormInstance = never;
type PublicInstance = Instance | TextInstance;
type HostContext = Record<string, never>;
type TimeoutHandle = ReturnType<typeof setTimeout>;
type NoTimeout = -1;
type TransitionStatus = null;

/**
 * Creates a new instance node
 */
const createInstance = (
  type: Type,
  props: Props,
  _rootContainer: Container,
  _hostContext: HostContext,
  _internalHandle: unknown,
): Instance => {
  // Filter out children from props
  const filteredProps = { ...props };
  delete filteredProps.children;
  return {
    type: "intrinsic",
    name: type,
    props: filteredProps,
    children: [],
  };
};

/**
 * Creates a text instance
 */
const createTextInstance = (
  text: string,
  _rootContainer: Container,
  _hostContext: HostContext,
  _internalHandle: unknown,
): TextInstance => {
  return {
    type: "text",
    content: text,
  };
};

/**
 * Clones an instance for persistent updates
 */
const cloneInstance = (
  instance: Instance,
  _type: Type,
  _oldProps: Props,
  newProps: Props,
  keepChildren: boolean,
  _recyclableInstance: Instance | null,
): Instance => {
  // Filter out children from props
  const filteredProps = { ...newProps };
  delete filteredProps.children;
  return {
    type: "intrinsic",
    name: instance.name,
    props: filteredProps,
    children: keepChildren ? [...instance.children] : [],
  };
};

/**
 * Clones a text instance
 */
const cloneHiddenInstance = (
  instance: Instance,
  _type: Type,
  props: Props,
  _internalHandle: unknown,
): Instance => {
  // Filter out children from props
  const filteredProps = { ...props };
  delete filteredProps.children;
  return {
    ...instance,
    props: filteredProps,
  };
};

/**
 * Clones a hidden text instance
 */
const cloneHiddenTextInstance = (
  _instance: Instance | TextInstance,
  text: string,
  _internalHandle: unknown,
): TextInstance => {
  return {
    type: "text",
    content: text,
  };
};

/**
 * Creates a container child set for batching children
 */
const createContainerChildSet = (_container: Container): ChildSet => {
  return [];
};

/**
 * Appends a child to a child set
 */
const appendChildToContainerChildSet = (
  childSet: ChildSet,
  child: Instance | TextInstance,
): void => {
  childSet.push(child);
};

/**
 * Finalizes the container children by replacing them
 */
const finalizeContainerChildren = (
  _container: Container,
  _newChildren: ChildSet,
): void => {
  // Nothing to do here for our use case
};

/**
 * Replaces container children with a new set
 */
const replaceContainerChildren = (
  container: Container,
  newChildren: ChildSet,
): void => {
  container.root = newChildren;
};

/**
 * Appends child to container
 */
const appendChildToContainer = (
  container: Container,
  child: Instance | TextInstance,
): void => {
  container.root.push(child);
};

/**
 * Inserts child before another child in container
 */
const insertInContainerBefore = (
  container: Container,
  child: Instance | TextInstance,
  beforeChild: Instance | TextInstance,
): void => {
  const index = container.root.indexOf(beforeChild);
  if (index !== -1) {
    container.root.splice(index, 0, child);
  }
};

/**
 * Removes child from container
 */
const removeChildFromContainer = (
  container: Container,
  child: Instance | TextInstance,
): void => {
  const index = container.root.indexOf(child);
  if (index !== -1) {
    container.root.splice(index, 1);
  }
};

/**
 * Host config for React Reconciler (Persistent Mode)
 */
export const hostConfig: HostConfig<
  Type,
  Props,
  Container,
  Instance,
  TextInstance,
  SuspenseInstance,
  HydratableInstance,
  FormInstance,
  PublicInstance,
  HostContext,
  ChildSet,
  TimeoutHandle,
  NoTimeout,
  TransitionStatus
> = {
  // Persistent mode configuration
  supportsMutation: false,
  supportsPersistence: true,
  supportsHydration: false,
  isPrimaryRenderer: false,

  // Core instance methods
  createInstance,
  createTextInstance,
  appendInitialChild: (parent: Instance, child: Instance | TextInstance) => {
    parent.children.push(child);
  },
  finalizeInitialChildren: () => false,

  // Persistent mode methods
  cloneInstance,
  cloneHiddenInstance,
  cloneHiddenTextInstance,
  createContainerChildSet,
  appendChildToContainerChildSet,
  finalizeContainerChildren,
  replaceContainerChildren,

  // Container methods (for compatibility)
  appendChildToContainer,
  insertInContainerBefore,
  removeChildFromContainer,

  // Public instance
  getPublicInstance: (instance: Instance | TextInstance) => instance,

  // Context methods
  getRootHostContext: () => ({}),
  getChildHostContext: (parentContext: HostContext) => parentContext,

  // Preparation methods
  prepareForCommit: () => null,
  resetAfterCommit: () => {},
  preparePortalMount: () => {},

  // Update methods
  commitUpdate: () => {},
  commitTextUpdate: () => {},

  // Timing
  scheduleTimeout: setTimeout,
  cancelTimeout: clearTimeout,
  noTimeout: -1 as NoTimeout,

  // Features
  shouldSetTextContent: () => false,
  clearContainer: () => false,
  hideInstance: () => {},
  hideTextInstance: () => {},
  unhideInstance: () => {},
  unhideTextInstance: () => {},

  // React 19 scheduler integration
  setCurrentUpdatePriority: (_priority: number) => {},
  getCurrentUpdatePriority: () => DefaultEventPriority,
  resolveUpdatePriority: () => DefaultEventPriority,
  shouldAttemptEagerTransition: () => false,
  trackSchedulerEvent: () => {},
  resolveEventType: () => null,
  resolveEventTimeStamp: () => -1,

  getInstanceFromNode: () => null,
  beforeActiveInstanceBlur: () => {},
  afterActiveInstanceBlur: () => {},
  prepareScopeUpdate: () => {},
  getInstanceFromScope: () => null,
  detachDeletedInstance: () => {},

  // React 19 form and transition support
  NotPendingTransition: null,
  // React.createContext() が返す Context<T> 型と react-reconciler の ReactContext<T> 型は
  // 内部的には互換性があるが、型定義上は異なるため型アサーションが必要
  HostTransitionContext: React.createContext<TransitionStatus>(
    null,
  ) as unknown as ReactContext<TransitionStatus>,
  resetFormInstance: () => {},
  requestPostPaintCallback: () => {},
  maySuspendCommit: () => false,
  preloadInstance: () => false,
  startSuspendingCommit: () => {},
  suspendInstance: () => {},
  waitForCommitToBeReady: () => null,
};
