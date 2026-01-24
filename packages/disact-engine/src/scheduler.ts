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
  let idleTimerId: ReturnType<typeof setTimeout> | null = null;
  let hasExecutedTask = false; // Track if at least one task has been executed

  logger.trace("Created", { idleTimeout });

  /**
   * Start the idle timer
   */
  const startIdleTimer = (): void => {
    if (idleTimeout <= 0) return;
    // Only start timer if at least one task has been executed
    if (!hasExecutedTask) return;

    if (idleTimerId !== null) {
      clearTimeout(idleTimerId);
      logger.trace("Idle timer reset", { idleTimeout });
    } else {
      logger.trace("Idle timer started", { idleTimeout });
    }

    idleTimerId = setTimeout(() => {
      void handleIdle();
    }, idleTimeout);
  };

  /**
   * Clear the idle timer
   */
  const clearIdleTimer = (): void => {
    if (idleTimerId !== null) {
      clearTimeout(idleTimerId);
      idleTimerId = null;
      logger.trace("Idle timer cleared");
    }
  };

  /**
   * Handle idle timeout
   */
  const handleIdle = async (): Promise<void> => {
    logger.trace("Idle timeout reached", {
      queueLength: taskQueue.length,
      isProcessing,
      state,
    });

    // Call onIdle
    if (onIdle && state !== "disposed") {
      logger.trace("Calling onIdle");
      try {
        await onIdle();
        logger.trace("onIdle completed");
      } catch (error) {
        // Ignore errors in onIdle
        logger.trace("Error in onIdle", { error });
      }
    }

    // If queue is empty and not processing, call onFinish and reset to idle
    if (taskQueue.length === 0 && !isProcessing && state !== "disposed") {
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

      // Reset to idle state (allow reuse)
      // Check both idle and running states since state might have changed during await
      if (state === "idle" || state === "running") {
        logger.trace("Resetting to idle state");
        state = "idle";
      }
    }
  };

  /**
   * Process the task queue
   */
  const processQueue = async (): Promise<void> => {
    if (isProcessing || state === "disposed") {
      logger.trace("processQueue skipped", { isProcessing, state });
      return;
    }

    logger.trace("processQueue started", {
      queueLength: taskQueue.length,
    });
    isProcessing = true;

    try {
      while (taskQueue.length > 0 && (state === "idle" || state === "running")) {
        // Find a task that is ready (waitFor is settled or undefined)
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

          // Reset idle timer before executing task
          clearIdleTimer();

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

          // Start idle timer after task completion
          startIdleTimer();
        } else {
          // No ready task, wait for any waitFor promise to settle
          const pendingPromises = taskQueue
            .map((item) => item.waitFor)
            .filter((p): p is Promise<unknown> => p !== undefined);

          if (pendingPromises.length > 0) {
            logger.trace("Waiting for promises to settle", {
              pendingCount: pendingPromises.length,
            });
            // Start idle timer while waiting for promises
            startIdleTimer();
            await Promise.race(
              pendingPromises.map((p) =>
                p.catch(() => {
                  // Ignore rejection, we just want to know when it settles
                }),
              ),
            );
            logger.trace("A promise settled, retrying");
            // Clear idle timer after promise settled
            clearIdleTimer();
          } else {
            // No pending promises, break
            logger.trace("No pending promises, breaking");
            break;
          }
        }
      }
    } finally {
      isProcessing = false;
      logger.trace("processQueue finished", {
        queueLength: taskQueue.length,
      });

      // Ensure idle timer is running (regardless of queue state)
      if (state === "idle" || state === "running") {
        startIdleTimer();
      }
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

    // Clear idle timer when new task is queued
    clearIdleTimer();

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
    clearIdleTimer();
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
