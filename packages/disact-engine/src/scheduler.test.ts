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

  it("should not execute task, onIdle, and onFinish concurrently", async () => {
    let activeCount = 0;
    let maxActiveCount = 0;
    const activeFunctions: string[] = [];

    /**
     * 関数の実行開始と終了を追跡するヘルパー
     */
    const trackExecution = async (name: string, delay: number): Promise<void> => {
      activeCount++;
      activeFunctions.push(name);
      maxActiveCount = Math.max(maxActiveCount, activeCount);

      // 並行実行されていないことを確認（activeCountが1より大きい場合は失敗）
      if (activeCount > 1) {
        throw new Error(
          `Concurrent execution detected: ${name} started while another function is active (activeCount: ${activeCount}, active: ${activeFunctions.join(", ")})`,
        );
      }

      await new Promise((resolve) => setTimeout(resolve, delay));

      activeCount--;
      activeFunctions.splice(activeFunctions.indexOf(name), 1);
    };

    const task = vi.fn(async () => {
      await trackExecution("task", 10);
    });

    const onIdle = vi.fn(async () => {
      await trackExecution("onIdle", 10);
    });

    const onFinish = vi.fn(async () => {
      await trackExecution("onFinish", 10);
    });

    const scheduler = createScheduler({
      task,
      idleTimeout: 30,
      onIdle,
      onFinish,
    });

    // 複数のタスクをキューに追加
    scheduler.queue();
    scheduler.queue();
    scheduler.queue();

    // すべてのタスクとコールバックが完了するまで待機
    await vi.advanceTimersByTimeAsync(200);

    // すべての関数が呼び出されたことを確認
    expect(task).toHaveBeenCalledTimes(3);
    expect(onIdle).toHaveBeenCalledTimes(1);
    expect(onFinish).toHaveBeenCalledTimes(1);

    // 並行実行されていないことを確認（maxActiveCountが1であること）
    expect(maxActiveCount).toBe(1);
    expect(activeFunctions).toEqual([]);
  });

  it("should not execute onIdle while task is running", async () => {
    const executionLog: string[] = [];
    let taskResolver: (() => void) | null = null;

    const task = vi.fn(async () => {
      executionLog.push("task-start");
      // タスクの実行を制御するためのプロミス
      await new Promise<void>((resolve) => {
        taskResolver = resolve;
      });
      executionLog.push("task-end");
    });

    const onIdle = vi.fn(() => {
      executionLog.push("onIdle");
    });

    const scheduler = createScheduler({
      task,
      idleTimeout: 50,
      onIdle,
    });

    scheduler.queue();

    // タスクが開始するまで待機
    await vi.waitFor(() => {
      expect(taskResolver).not.toBeNull();
    });

    // タスク実行中にアイドルタイムアウトを経過させる
    await vi.advanceTimersByTimeAsync(60);

    // タスクが実行中の間はonIdleが呼ばれていないことを確認
    expect(executionLog).toEqual(["task-start"]);
    expect(onIdle).not.toHaveBeenCalled();

    // タスクを完了させる
    taskResolver!();
    await vi.advanceTimersByTimeAsync(60);

    // タスク完了後にonIdleが呼ばれることを確認
    expect(executionLog).toEqual(["task-start", "task-end", "onIdle"]);
    expect(onIdle).toHaveBeenCalledTimes(1);
  });

  it("should not execute task while onIdle is running", async () => {
    const executionLog: string[] = [];
    let onIdleResolver: (() => void) | null = null;

    const task = vi.fn(() => {
      executionLog.push("task");
    });

    const onIdle = vi.fn(async () => {
      executionLog.push("onIdle-start");
      // onIdleの実行を制御するためのプロミス
      await new Promise<void>((resolve) => {
        onIdleResolver = resolve;
      });
      executionLog.push("onIdle-end");
    });

    const scheduler = createScheduler({
      task,
      idleTimeout: 50,
      onIdle,
    });

    // 最初のタスクを実行
    scheduler.queue();
    await vi.advanceTimersByTimeAsync(10);

    expect(executionLog).toEqual(["task"]);

    // アイドルタイムアウトを経過させてonIdleをトリガー
    await vi.advanceTimersByTimeAsync(60);

    // onIdleが開始するまで待機
    await vi.waitFor(() => {
      expect(onIdleResolver).not.toBeNull();
    });

    expect(executionLog).toEqual(["task", "onIdle-start"]);

    // onIdle実行中に新しいタスクをキュー
    scheduler.queue();

    // タイマーを進めてもonIdle実行中はタスクが実行されないことを確認
    await vi.advanceTimersByTimeAsync(10);
    expect(executionLog).toEqual(["task", "onIdle-start"]);

    // onIdleを完了させる
    onIdleResolver!();
    await vi.advanceTimersByTimeAsync(10);

    // onIdle完了後にタスクが実行されることを確認
    expect(executionLog).toEqual(["task", "onIdle-start", "onIdle-end", "task"]);
    expect(task).toHaveBeenCalledTimes(2);
  });

  it("should not execute task while onFinish is running", async () => {
    const executionLog: string[] = [];
    let onFinishResolver: (() => void) | null = null;

    const task = vi.fn(() => {
      executionLog.push("task");
    });

    const onFinish = vi.fn(async () => {
      executionLog.push("onFinish-start");
      // onFinishの実行を制御するためのプロミス
      await new Promise<void>((resolve) => {
        onFinishResolver = resolve;
      });
      executionLog.push("onFinish-end");
    });

    const scheduler = createScheduler({
      task,
      idleTimeout: 50,
      onFinish,
    });

    // タスクを実行
    scheduler.queue();
    await vi.advanceTimersByTimeAsync(10);

    expect(executionLog).toEqual(["task"]);

    // アイドルタイムアウトを経過させてonFinishをトリガー
    await vi.advanceTimersByTimeAsync(60);

    // onFinishが開始するまで待機
    await vi.waitFor(() => {
      expect(onFinishResolver).not.toBeNull();
    });

    expect(executionLog).toEqual(["task", "onFinish-start"]);

    // onFinish実行中に新しいタスクをキュー
    scheduler.queue();

    // タイマーを進めてもonFinish実行中はタスクが実行されないことを確認
    await vi.advanceTimersByTimeAsync(10);
    expect(executionLog).toEqual(["task", "onFinish-start"]);

    // onFinishを完了させる
    onFinishResolver!();
    await vi.advanceTimersByTimeAsync(10);

    // onFinish完了後にタスクが実行されることを確認
    expect(executionLog).toEqual(["task", "onFinish-start", "onFinish-end", "task"]);
    expect(task).toHaveBeenCalledTimes(2);
  });
});
