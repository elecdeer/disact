import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createScheduler } from "./scheduler";

describe("createScheduler", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should execute tasks sequentially", async () => {
    const executionOrder: number[] = [];
    let taskControl: PromiseWithResolvers<void> | null = null;

    const task = vi.fn(async () => {
      const index = executionOrder.length;
      executionOrder.push(index);
      // Wait for external signal to continue
      taskControl = Promise.withResolvers<void>();
      await taskControl.promise;
    });

    const scheduler = createScheduler({ task });

    scheduler.queue();
    scheduler.queue();
    scheduler.queue();

    // Wait for first task to start
    await vi.waitFor(() => {
      expect(taskControl).not.toBeNull();
    });

    // First task is running, two are pending
    expect(scheduler.pendingCount()).toBe(2);
    expect(executionOrder).toEqual([0]);

    // Complete first task
    taskControl!.resolve();
    await vi.waitFor(() => {
      expect(executionOrder.length).toBe(2);
    });

    // Second task is running, one is pending
    expect(scheduler.pendingCount()).toBe(1);

    // Complete second task
    taskControl!.resolve();
    await vi.waitFor(() => {
      expect(executionOrder.length).toBe(3);
    });

    // Complete third task
    taskControl!.resolve();

    await vi.advanceTimersByTimeAsync(10);

    expect(task).toHaveBeenCalledTimes(3);
    expect(executionOrder).toEqual([0, 1, 2]);
    expect(scheduler.pendingCount()).toBe(0);
  });

  it("should wait for waitFor promise before executing task", async () => {
    const executionOrder: string[] = [];
    const task = vi.fn(() => {
      executionOrder.push("executed");
    });

    const scheduler = createScheduler({ task });

    // Create a promise that won't resolve immediately
    const { promise: waitForPromise, resolve } = Promise.withResolvers<void>();

    // Queue task with waitFor
    scheduler.queue(waitForPromise);

    // Task should not execute yet
    await vi.advanceTimersByTimeAsync(10);
    expect(executionOrder).toEqual([]);
    expect(task).not.toHaveBeenCalled();

    // Resolve the promise
    resolve();

    // Now task should execute
    await vi.advanceTimersByTimeAsync(10);
    expect(executionOrder).toEqual(["executed"]);
    expect(task).toHaveBeenCalledTimes(1);
  });

  it("should call onIdle after idle timeout", async () => {
    const task = vi.fn();
    const onIdle = vi.fn();

    const scheduler = createScheduler({
      task,
      idleTimeout: 100,
      onIdle,
    });

    scheduler.queue();

    await vi.advanceTimersByTimeAsync(50);
    expect(onIdle).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(100);
    expect(onIdle).toHaveBeenCalledTimes(1);
  });

  it("should not call onIdle when no task has been executed yet", async () => {
    const task = vi.fn();
    const onIdle = vi.fn();
    const onFinish = vi.fn();

    const scheduler = createScheduler({
      task,
      idleTimeout: 100,
      onIdle,
      onFinish,
    });

    // Create a promise that won't resolve
    const { promise: waitForPromise } = Promise.withResolvers<void>();

    scheduler.queue(waitForPromise);

    // Wait for idle timeout
    await vi.advanceTimersByTimeAsync(150);

    // onIdle should NOT be called because no task has been executed yet
    expect(onIdle).not.toHaveBeenCalled();
    // onFinish should NOT be called either
    expect(onFinish).not.toHaveBeenCalled();
    // Task should not have executed yet
    expect(task).not.toHaveBeenCalled();
    // Queue should still have the pending task
    expect(scheduler.pendingCount()).toBe(1);
  });

  it("should call onIdle but not onFinish when waiting for waitFor after task execution", async () => {
    const task = vi.fn();
    const onIdle = vi.fn();
    const onFinish = vi.fn();

    const scheduler = createScheduler({
      task,
      idleTimeout: 50,
      onIdle,
      onFinish,
    });

    // First, execute a task without waitFor
    scheduler.queue();
    await vi.advanceTimersByTimeAsync(10);
    expect(task).toHaveBeenCalledTimes(1);

    // Now queue a task with unresolved waitFor
    const { promise: waitForPromise } = Promise.withResolvers<void>();
    scheduler.queue(waitForPromise);

    // Wait for idle timeout
    await vi.advanceTimersByTimeAsync(60);

    // onIdle should be called because a task was executed and idle timeout occurred
    expect(onIdle).toHaveBeenCalledTimes(1);
    // onFinish should NOT be called because queue is not empty (task is waiting for promise)
    expect(onFinish).not.toHaveBeenCalled();
    // Second task should not have executed yet
    expect(task).toHaveBeenCalledTimes(1);
    // Queue should still have the pending task
    expect(scheduler.pendingCount()).toBe(1);
  });

  it("should call onFinish after onIdle when queue is empty", async () => {
    const callOrder: string[] = [];
    const task = vi.fn(() => {
      callOrder.push("task");
    });
    const onIdle = vi.fn(() => {
      callOrder.push("onIdle");
    });
    const onFinish = vi.fn(() => {
      callOrder.push("onFinish");
    });

    const scheduler = createScheduler({
      task,
      idleTimeout: 100,
      onIdle,
      onFinish,
    });

    scheduler.queue();

    await vi.advanceTimersByTimeAsync(150);

    expect(callOrder).toEqual(["task", "onIdle", "onFinish"]);
    expect(task).toHaveBeenCalledTimes(1);
    expect(onIdle).toHaveBeenCalledTimes(1);
    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it("should allow queueing tasks inside onIdle", async () => {
    const task = vi.fn();
    const onIdle = vi.fn();

    const scheduler = createScheduler({
      task,
      idleTimeout: 50,
      onIdle: () => {
        onIdle();
        if (onIdle.mock.calls.length === 1) {
          scheduler.queue();
        }
      },
    });

    scheduler.queue();

    await vi.advanceTimersByTimeAsync(150);

    expect(task).toHaveBeenCalledTimes(2);
    expect(onIdle).toHaveBeenCalledTimes(2);
  });

  it("should allow queueing tasks inside onFinish", async () => {
    const task = vi.fn();
    const onFinish = vi.fn();

    const scheduler = createScheduler({
      task,
      idleTimeout: 50,
      onFinish: () => {
        onFinish();
        if (onFinish.mock.calls.length === 1) {
          scheduler.queue();
        }
      },
    });

    scheduler.queue();

    await vi.advanceTimersByTimeAsync(150);

    expect(task).toHaveBeenCalledTimes(2);
    expect(onFinish).toHaveBeenCalledTimes(2);
  });

  it("should continue execution on error when onError returns 'continue'", async () => {
    let callCount = 0;
    const task = vi.fn(() => {
      callCount++;
      if (callCount === 2) {
        throw new Error("Task error");
      }
    });
    const onError = vi.fn(() => "continue" as const);

    const scheduler = createScheduler({ task, onError });

    scheduler.queue();
    scheduler.queue();
    scheduler.queue();

    await vi.advanceTimersByTimeAsync(100);

    expect(task).toHaveBeenCalledTimes(3);
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(expect.any(Error));
    expect(scheduler.pendingCount()).toBe(0);
  });

  it("should stop execution on error when onError returns 'stop'", async () => {
    let callCount = 0;
    const task = vi.fn(() => {
      callCount++;
      if (callCount === 2) {
        throw new Error("Task error");
      }
    });
    const onError = vi.fn(() => "stop" as const);

    const scheduler = createScheduler({ task, onError });

    scheduler.queue();
    scheduler.queue();
    scheduler.queue();

    await vi.advanceTimersByTimeAsync(100);

    expect(task).toHaveBeenCalledTimes(2);
    expect(onError).toHaveBeenCalledTimes(1);
    expect(scheduler.pendingCount()).toBe(0);
  });

  it("should throw error when queueing tasks after dispose", () => {
    const task = vi.fn();
    const scheduler = createScheduler({ task });

    scheduler.dispose();

    expect(() => scheduler.queue()).toThrow("Cannot queue tasks on a disposed scheduler");
    expect(scheduler.isDisposed()).toBe(true);
  });

  it("should clear pending tasks on dispose", async () => {
    const task = vi.fn(async () => {
      const { promise } = Promise.withResolvers<void>();
      await promise; // never resolves
    });
    const scheduler = createScheduler({ task });

    // Use a blocking promise to prevent immediate execution
    const { promise: blockPromise } = Promise.withResolvers<void>();

    scheduler.queue(blockPromise);
    scheduler.queue(blockPromise);
    scheduler.queue(blockPromise);

    expect(scheduler.pendingCount()).toBe(3);

    scheduler.dispose();

    expect(scheduler.pendingCount()).toBe(0);
    expect(scheduler.isDisposed()).toBe(true);
  });

  it("should not call onIdle or onFinish after dispose", async () => {
    const task = vi.fn();
    const onIdle = vi.fn();
    const onFinish = vi.fn();

    const scheduler = createScheduler({
      task,
      idleTimeout: 50,
      onIdle,
      onFinish,
    });

    scheduler.queue();
    scheduler.dispose();

    await vi.advanceTimersByTimeAsync(150);

    expect(onIdle).not.toHaveBeenCalled();
    expect(onFinish).not.toHaveBeenCalled();
  });

  it("should reset to idle state after finish and allow reuse", async () => {
    const task = vi.fn();
    const onFinish = vi.fn();

    const scheduler = createScheduler({
      task,
      idleTimeout: 50,
      onFinish,
    });

    // First batch
    scheduler.queue();
    await vi.advanceTimersByTimeAsync(100);

    expect(task).toHaveBeenCalledTimes(1);
    expect(onFinish).toHaveBeenCalledTimes(1);

    // Second batch (reuse)
    scheduler.queue();
    scheduler.queue();
    await vi.advanceTimersByTimeAsync(100);

    expect(task).toHaveBeenCalledTimes(3);
    expect(onFinish).toHaveBeenCalledTimes(2);
  });

  it("should reset idle timer when new task is queued", async () => {
    const task = vi.fn();
    const onIdle = vi.fn();

    const scheduler = createScheduler({
      task,
      idleTimeout: 100,
      onIdle,
    });

    scheduler.queue();

    await vi.advanceTimersByTimeAsync(60);
    expect(onIdle).not.toHaveBeenCalled();

    // Queue another task, should reset the timer
    scheduler.queue();

    await vi.advanceTimersByTimeAsync(60);
    expect(onIdle).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(50);
    expect(onIdle).toHaveBeenCalledTimes(1);
  });

  it("should handle async tasks", async () => {
    const executionOrder: number[] = [];
    const task = vi.fn(async () => {
      const index = executionOrder.length;
      executionOrder.push(index);
      await new Promise((resolve) => setTimeout(resolve, 20));
    });

    const scheduler = createScheduler({ task });

    scheduler.queue();
    scheduler.queue();

    await vi.advanceTimersByTimeAsync(100);

    expect(task).toHaveBeenCalledTimes(2);
    expect(executionOrder).toEqual([0, 1]);
  });

  it("should not execute tasks concurrently", async () => {
    let activeCount = 0;
    let maxActiveCount = 0;

    const task = vi.fn(async () => {
      activeCount++;
      maxActiveCount = Math.max(maxActiveCount, activeCount);
      await new Promise((resolve) => setTimeout(resolve, 10));
      activeCount--;
    });

    const scheduler = createScheduler({ task });

    scheduler.queue();
    scheduler.queue();
    scheduler.queue();

    await vi.advanceTimersByTimeAsync(100);

    expect(maxActiveCount).toBe(1);
    expect(task).toHaveBeenCalledTimes(3);
  });
});
