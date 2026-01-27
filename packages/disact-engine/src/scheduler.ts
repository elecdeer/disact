import type { Thenable } from "./thenable";
import { getEngineLogger } from "./utils/logger";

const logger = getEngineLogger("scheduler");

/**
 * Scheduler options
 */
export type SchedulerOptions = {
  /** The task to execute for each queued item */
  task: () => void | Promise<void>;
  /** Idle timeout in milliseconds (default: 0 = no timeout) */
  idleTimeout?: number;
  /** Called when idle timeout is reached */
  onIdle?: () => void | Promise<void>;
  /** Called when all tasks are finished (after onIdle if applicable) */
  onFinish?: () => void | Promise<void>;
  /** Called when an error occurs. Return "continue" to continue, "stop" to stop */
  onError?: (error: unknown) => "continue" | "stop";
};

/**
 * Scheduler instance
 */
export type Scheduler = {
  /** Queue a task execution, optionally waiting for a promise to resolve first */
  queue: (waitFor?: Promise<unknown>) => void;
  /** Dispose the scheduler, clearing all pending tasks */
  dispose: () => void;
  /** Check if the scheduler is disposed */
  isDisposed: () => boolean;
  /** Get the number of pending tasks */
  pendingCount: () => number;
};

type State = "idle" | "running" | "disposed";

/**
 * Track the status of a promise by attaching a status property
 */
const trackPromiseStatus = <T>(promise: Promise<T>): void => {
  const thenable = promise as Thenable<T>;
  if (thenable.status !== undefined) return;

  thenable.status = "pending";
  promise.then(
    () => {
      thenable.status = "fulfilled";
    },
    () => {
      thenable.status = "rejected";
    },
  );
};

/**
 * Check if a promise is settled (fulfilled or rejected)
 */
const isPromiseSettled = (promise: Promise<unknown>): boolean => {
  const thenable = promise as Thenable<unknown>;
  return thenable.status === "fulfilled" || thenable.status === "rejected";
};

/**
 * Create a scheduler that executes tasks sequentially
 */
export const createScheduler = (options: SchedulerOptions): Scheduler => {
  const { task, idleTimeout = 0, onIdle, onFinish, onError } = options;

  let state: State = "idle";
  let taskQueue: Array<{ waitFor: Promise<unknown> | undefined }> = [];
  let isProcessing = false;
  let hasExecutedTask = false; // Track if at least one task has been executed

  // Symbol to identify idle timeout in Promise.race
  const IDLE_TIMEOUT = Symbol("idle-timeout");

  // AbortController to cancel idle timeout when new task is queued
  let idleTimeoutAbort: AbortController | null = null;

  logger.trace("Created", { idleTimeout });

  /**
   * Create a promise that resolves after the specified delay, or rejects if aborted
   */
  const sleep = (ms: number, signal?: AbortSignal): Promise<typeof IDLE_TIMEOUT> => {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => resolve(IDLE_TIMEOUT), ms);

      if (signal) {
        signal.addEventListener("abort", () => {
          clearTimeout(timeoutId);
          reject(new Error("Aborted"));
        });
      }
    });
  };

  /**
   * Process the task queue
   */
  const processQueue = async (): Promise<void> => {
    if (isProcessing || state === "disposed") {
      logger.trace("processQueue already started, skipping", { isProcessing, state });
      return;
    }

    logger.trace("processQueue started", {
      queueLength: taskQueue.length,
    });
    isProcessing = true;

    try {
      while (state === "idle" || state === "running") {
        // 1. Find a task that is ready (waitFor is settled or undefined)
        const readyIndex = taskQueue.findIndex(
          (item) => item.waitFor === undefined || isPromiseSettled(item.waitFor),
        );

        if (readyIndex !== -1) {
          // Remove the ready task from queue
          taskQueue.splice(readyIndex, 1);
          logger.trace("Task dequeued", {
            readyIndex,
            remainingTasks: taskQueue.length,
          });

          // Cancel any pending idle timeout
          if (idleTimeoutAbort) {
            idleTimeoutAbort.abort();
            idleTimeoutAbort = null;
          }

          try {
            // Execute the task
            logger.trace("Executing task");
            await task();
            hasExecutedTask = true; // Mark that at least one task has been executed
            logger.trace("Task completed");
          } catch (error) {
            logger.trace("Task error", { error });
            // Handle error
            if (onError) {
              const action = onError(error);
              logger.trace("Error handler returned", { action });
              if (action === "stop") {
                // Clear remaining tasks
                logger.trace("Stopping, clearing queue", {
                  clearedTasks: taskQueue.length,
                });
                taskQueue = [];
                break;
              }
              // Continue on "continue"
            } else {
              // No error handler, stop
              logger.trace("No error handler, stopping", {
                clearedTasks: taskQueue.length,
              });
              taskQueue = [];
              break;
            }
          }
          continue;
        }

        // 2. No ready task, check for pending promises
        const pendingPromises = taskQueue
          .map((item) => item.waitFor)
          .filter((p): p is Promise<unknown> => p !== undefined);

        if (pendingPromises.length > 0) {
          logger.trace("Waiting for promises to settle", {
            pendingCount: pendingPromises.length,
          });

          // Create race array with pending promises
          const racingPromises: Array<Promise<unknown>> = pendingPromises.map((p) =>
            p.catch(() => {
              // Ignore rejection, we just want to know when it settles
            }),
          );

          // Add idle timeout if configured and at least one task has been executed
          if (idleTimeout > 0 && hasExecutedTask) {
            idleTimeoutAbort = new AbortController();
            racingPromises.push(
              sleep(idleTimeout, idleTimeoutAbort.signal).catch(() => {
                // Timeout was aborted, ignore
              }),
            );
          }

          const result = await Promise.race(racingPromises);

          // Clear abort controller after race completes
          idleTimeoutAbort = null;

          if (result === IDLE_TIMEOUT) {
            // Idle timeout reached
            logger.trace("Idle timeout reached during promise wait", {
              queueLength: taskQueue.length,
            });

            // Call onIdle
            if (onIdle) {
              logger.trace("Calling onIdle");
              try {
                await onIdle();
                logger.trace("onIdle completed");
              } catch (error) {
                // Ignore errors in onIdle
                logger.trace("Error in onIdle", { error });
              }
            }
            // Note: Do NOT call onFinish here - queue is not empty
            // After onIdle, check if new tasks were added and continue loop
          } else {
            logger.trace("A promise settled, retrying");
          }
          continue;
        }

        // 3. Queue is empty - perform final idle/finish callbacks
        logger.trace("Queue is empty, performing final callbacks");

        // Wait for idle timeout if configured and at least one task has been executed
        if (hasExecutedTask && idleTimeout > 0) {
          logger.trace("Waiting for idle timeout before finishing", { idleTimeout });
          idleTimeoutAbort = new AbortController();
          try {
            await sleep(idleTimeout, idleTimeoutAbort.signal);
            idleTimeoutAbort = null;

            // Call onIdle
            if (onIdle) {
              logger.trace("Calling onIdle");
              try {
                await onIdle();
                logger.trace("onIdle completed");
              } catch (error) {
                // Ignore errors in onIdle
                logger.trace("Error in onIdle", { error });
              }
            }

            // Check if new tasks were queued during onIdle
            if (taskQueue.length > 0) {
              logger.trace("New tasks queued during onIdle, continuing loop");
              continue;
            }
          } catch {
            // Timeout was aborted - new task was queued
            logger.trace("Idle timeout aborted, new task queued");
            idleTimeoutAbort = null;
            continue;
          }
        }

        // Call onFinish
        if (onFinish) {
          logger.trace("Calling onFinish");
          try {
            await onFinish();
            logger.trace("onFinish completed");
          } catch (error) {
            // Ignore errors in onFinish
            logger.trace("Error in onFinish", { error });
          }
        }

        // Check if new tasks were queued during onFinish
        if (taskQueue.length > 0) {
          logger.trace("New tasks queued during onFinish, continuing loop");
          continue;
        }

        // Reset to idle state (allow reuse)
        if (state === "idle" || state === "running") {
          logger.trace("Resetting to idle state");
          state = "idle";
        }
        break;
      }
    } finally {
      isProcessing = false;
      logger.trace("processQueue finished", {
        queueLength: taskQueue.length,
      });
    }
  };

  /**
   * Queue a task
   */
  const queue = (waitFor?: Promise<unknown>): void => {
    if (state === "disposed") {
      logger.trace("Cannot queue - disposed");
      throw new Error("Cannot queue tasks on a disposed scheduler");
    }

    logger.trace("Task queued", {
      hasWaitFor: waitFor !== undefined,
      queueLength: taskQueue.length + 1,
      state,
    });

    // Track promise status if provided
    if (waitFor !== undefined) {
      trackPromiseStatus(waitFor);
    }

    // Add to queue
    taskQueue.push({ waitFor });

    // Change state to running if idle
    if (state === "idle") {
      logger.trace("State changed: idle -> running");
      state = "running";
    }

    // Cancel any pending idle timeout when new task is queued
    if (idleTimeoutAbort) {
      logger.trace("Cancelling idle timeout due to new task");
      idleTimeoutAbort.abort();
      idleTimeoutAbort = null;
    }

    // Start processing
    void processQueue();
  };

  /**
   * Dispose the scheduler
   */
  const dispose = (): void => {
    logger.trace("Disposing", {
      queueLength: taskQueue.length,
      state,
    });
    state = "disposed";
    taskQueue = [];
  };

  /**
   * Check if disposed
   */
  const isDisposed = (): boolean => {
    return state === "disposed";
  };

  /**
   * Get pending count
   */
  const pendingCount = (): number => {
    return taskQueue.length;
  };

  return {
    queue,
    dispose,
    isDisposed,
    pendingCount,
  };
};
