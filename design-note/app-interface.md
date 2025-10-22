# Disact アプリケーションインターフェース設計

## 概要

DisactアプリケーションのエントリーポイントとなるAPIの設計です。
ReactのcreateRootに相当する部分で、以下の役割を担います：

- セッション管理
- コンポーネントのレンダリングと接続
- Interactionの処理とルーティング
- ハンドラーの収集と実行

**重要**: `connect()`メソッド1つで、Application Command（新規メッセージ作成）とComponent Interaction（既存メッセージ更新）の両方に対応します。セッションの`messageId`の有無により自動的に動作を切り替えます。

## 基本コンセプト

### 前提条件

- **短命ランタイム対応**: Cloudflare Workersなど、リクエストごとに新しいインスタンスが起動する環境で動作
- **ステートレス**: 各リクエストは独立しており、メモリ上の状態は保持されない
- **Hydration**: Interaction時にコンポーネントを再構築し、Discord側のメッセージと整合性を検証

### アーキテクチャ

```
1. Application Command
   ↓
   disact.connect(session, element) → レンダリング → Discord API (メッセージ作成)
   ※ session.messageId = undefined

2. Component Interaction (ボタンクリック)
   ↓
   disact.connect(session, element) → 状態復元 → ハンドラー実行 → 再レンダリング → Discord API (メッセージ更新)
   ※ session.messageId = 既存メッセージID
```

**ポイント**: 同じ`connect()`メソッドで、セッションの`messageId`の有無により新規作成/更新を自動判断

## API設計

### DisactApp

#### createDisactApp

```typescript
interface DisactAppOptions {
  // Discord APIクライアント（オプション）
  // 指定しない場合、connectでセッションごとに設定
  apiClient?: DiscordApiClient;
}

function createDisactApp(options?: DisactAppOptions): DisactApp;
```

**Note**: 外部ストレージ（案B）は各`externalStore`が独立して管理するため、DisactAppOptionsでの指定は不要です。

#### DisactApp interface

```typescript
interface DisactApp {
  /**
   * コンポーネントをセッションに接続
   *
   * - session.messageIdがない場合: 新規メッセージ作成
   * - session.messageIdがある場合: 既存メッセージ更新
   *
   * Application CommandとComponent Interactionの両方で使用
   */
  connect(
    session: DisactSession,
    element: DisactElement,
  ): Promise<ConnectResult>;

  /**
   * セッションのクリーンアップ（オプション）
   * 外部ストレージを使用している場合に明示的にクリーンアップ
   */
  disconnect?(sessionId: string): Promise<void>;
}
```

### セッション管理

#### DisactSession

```typescript
interface DisactSession {
  // セッションを一意に識別するID
  id: string;

  // Discord API情報
  applicationId: string;
  token: string; // interaction token or bot token

  // メッセージ情報
  channelId?: string;
  messageId?: string; // あれば更新、なければ作成

  // 応答オプション（Application Commandで指定）
  ephemeral?: boolean; // ephemeralフラグ
  responseType?: "message" | "deferred"; // 応答タイプ
}
```

#### セッション作成ヘルパー

```typescript
/**
 * Application Commandからセッション作成
 * 新規メッセージを作成する場合に使用
 */
function sessionFromInteraction(
  interaction: ApplicationCommandInteraction,
  options?: {
    ephemeral?: boolean;
    responseType?: "message" | "deferred";
  },
): DisactSession;

/**
 * Component Interactionからセッション作成
 * 既存メッセージを更新する場合に使用
 */
function sessionFromInteraction(
  interaction: ComponentInteraction,
): DisactSession;

// 実装例
function sessionFromInteraction(
  interaction: ApplicationCommandInteraction | ComponentInteraction,
  options?: {
    ephemeral?: boolean;
    responseType?: "message" | "deferred";
  },
): DisactSession {
  const isComponentInteraction = "message" in interaction;

  return {
    id: `${interaction.application_id}:${interaction.id}`,
    applicationId: interaction.application_id,
    token: interaction.token,
    channelId: interaction.channel_id,
    messageId: isComponentInteraction ? interaction.message.id : undefined,
    ephemeral: options?.ephemeral,
    responseType: options?.responseType ?? "message",
  };
}
```

### connect()

コンポーネントをレンダリングしてDiscordに送信します。
`session.messageId`の有無により、新規作成と更新を自動判断します。

#### ConnectResult

```typescript
interface ConnectResult {
  // Interaction responseのペイロード
  // このままDiscordに返せる
  response: InteractionCallbackData;

  // 生成されたセッションID
  sessionId: string;
}
```

#### 実装フロー

```typescript
async function connect(
  session: DisactSession,
  element: DisactElement,
): Promise<ConnectResult> {
  const isUpdate = !!session.messageId;

  if (isUpdate) {
    // === 既存メッセージの更新（Component Interaction） ===

    // 1. Discord側の現在のメッセージを取得
    const currentMessage = await fetchCurrentMessage(session);

    // 2. メッセージからcustomIdを全て抽出し、状態を復元
    const customIds = extractCustomIds(currentMessage.components);
    const stateMap = new Map<string, any>();

    for (const customId of customIds) {
      const parsed = parseCustomId(customId);
      if (parsed) {
        stateMap.set(`${parsed.id}:${parsed.name}`, parsed.current);
      }
    }

    // 3. コンテキスト作成
    // 注: externalStoreの値は各storeが個別に管理
    const context = createRenderContext({
      reducerState: stateMap,
      externalStoreValues: new Map(), // useExternalStoreで使用
      session,
    });

    // 4. 再レンダリング（ハンドラーも同時に収集）
    const handlers = new Map<string, InteractionHandler>();
    const renderResult = runInContext(context, () => {
      context.registerHandler = (customId: string, handler: InteractionHandler) => {
        handlers.set(customId, handler);
      };
      return render(element);
    });

    // 5. Hydration検証
    const hydrationResult = validateHydration(currentMessage, renderResult);
    if (!hydrationResult.success) {
      console.warn("Hydration warnings:", hydrationResult.warnings);
    }

    // 7. クリックされたcustomIdのハンドラーを取得・実行
    const clickedCustomId = getClickedCustomId(); // interactionから取得
    const handler = handlers.get(clickedCustomId);

    if (handler) {
      // バッチング用のコンテキスト
      const pendingStores = new Set<ExternalStore<any>>();
      let needsRerender = false;

      const interactionCtx: InteractionContext = {
        interaction: getInteraction(),
        update: async () => {
          needsRerender = true;
          await performRerender();
        },
        reply: async (content, ephemeral) => {
          await createFollowupMessage(session, content, ephemeral);
        },
        defer: async (options) => {
          await deferInteraction(session, options);
        },
        followUp: async (content, ephemeral) => {
          await createFollowupMessage(session, content, ephemeral);
        },
        _markForUpdate: (store: ExternalStore<any>) => {
          pendingStores.add(store);
          needsRerender = true;
        },
      };

      // ハンドラーを実行
      await handler(interactionCtx);

      // ハンドラー終了後、更新があれば再レンダリング
      if (needsRerender) {
        await performRerender();
      }

      async function performRerender() {
        // 変更されたstoreをストレージに永続化
        for (const store of pendingStores) {
          const value = context.externalStoreValues.get(store);
          await store.set(value);
        }
        pendingStores.clear();

        // 再レンダリング
        const updatedResult = runInContext(context, () => render(element));

        // Discord APIで更新
        const messagePayload = convertToDiscordMessage(updatedResult);
        await updateMessage(session, messagePayload);

        needsRerender = false;
      }
    } else {
      // ハンドラーがない場合は、customIdによる状態更新のみ（案A）
      const messagePayload = convertToDiscordMessage(renderResult);
      await updateMessage(session, messagePayload);
    }

    return {
      response: { type: 7 }, // UPDATE_MESSAGE
      sessionId: session.id,
    };

  } else {
    // === 新規メッセージの作成（Application Command） ===

    // 1. コンテキスト作成
    const context = createRenderContext({});

    // 2. 初回レンダリング
    const renderResult = runInContext(context, () => render(element));

    // 3. ハンドラー収集
    const handlers = extractHandlers(renderResult);

    // 4. ハンドラーを保存（メモリ内のみ、このリクエスト内で有効）
    // 注: 外部ストレージには保存しない（次回のconnect時に再構築するため）
    storeHandlersInMemory(session.id, handlers);

    // 5. Discord APIペイロードに変換
    const messagePayload = convertToDiscordMessage(renderResult);

    // 6. Interaction responseを構築
    const response = {
      type: session.responseType === "deferred" ? 5 : 4,
      data: {
        ...messagePayload,
        flags: session.ephemeral ? 64 : undefined,
      },
    };

    return {
      response,
      sessionId: session.id,
    };
  }
}
```

### InteractionContext

onClickハンドラーで使用できるコンテキストです。

```typescript
interface InteractionContext {
  // 現在のInteraction
  interaction: ComponentInteraction;

  // 明示的に再レンダリング（状態変更がない場合に使用）
  update(): Promise<void>;

  // 新しいメッセージで返信
  reply(content: string, ephemeral?: boolean): Promise<void>;

  // 応答を遅延（長時間処理の場合）
  defer(options?: { ephemeral?: boolean }): Promise<void>;

  // Follow-up message送信
  followUp(content: string, ephemeral?: boolean): Promise<void>;
}
```

## 使用例

### Honoでの基本的な使用

```typescript
import { Hono } from "hono";
import { createDisactApp, sessionFromInteraction } from "disact";

const app = new Hono();

// Disactアプリケーション作成
const disact = createDisactApp();

app.post("/interactions", async (c) => {
  const interaction = await c.req.json();

  // PING応答
  if (interaction.type === 1) {
    return c.json({ type: 1 });
  }

  // Application Command（新規メッセージ作成）
  if (interaction.type === 2) {
    const session = sessionFromInteraction(interaction, {
      ephemeral: false,
    });

    const { response } = await disact.connect(
      session,
      <GreetCommand userId={interaction.user.id} />
    );

    return c.json(response);
  }

  // Component Interaction（既存メッセージ更新）
  if (interaction.type === 3) {
    const session = sessionFromInteraction(interaction);

    // 非同期で処理（Cloudflare Workers用）
    c.executionCtx.waitUntil(
      disact.connect(
        session,
        <GreetCommand userId={interaction.user.id} />
      )
    );

    // すぐに202を返す
    return c.body("", 202);
  }
});
```

### コンポーネント例

```typescript
function GreetCommand({ userId }: { userId: string }) {
  const [count, dispatch] = useReducer("count", 0, {
    increment: (curr: number) => curr + 1,
  });

  return (
    <>
      <p>Hello <@{userId}>!</p>
      <p>You clicked {count} times</p>

      <actionRow>
        {/* パターン1: customIdのみ（自動更新） */}
        <button customId={dispatch.increment()}>
          Click me
        </button>

        {/* パターン2: onClickハンドラー */}
        <button
          customId="reply"
          onClick={async (ctx) => {
            await ctx.reply("Thanks for clicking! 🎉", true);
          }}
        >
          Say Thanks
        </button>
      </actionRow>
    </>
  );
}
```

## コンポーネントルーティング

複数のコンポーネントを管理する場合のパターンです。

### パターン1: ユーザー側で管理（推奨）

```typescript
app.post("/interactions", async (c) => {
  const interaction = await c.req.json();

  if (interaction.type === 2) {
    // Application Commandごとにコンポーネントを選択
    const component = getComponentForCommand(interaction.data.name);

    const session = sessionFromInteraction(interaction);
    const { response } = await disact.connect(session, component);

    return c.json(response);
  }

  if (interaction.type === 3) {
    // customIdのプレフィックスでコンポーネントを選択
    const component = getComponentForCustomId(interaction.data.custom_id);

    const session = sessionFromInteraction(interaction);
    await disact.connect(session, component);

    return c.body("", 202);
  }
});

// ヘルパー関数
function getComponentForCommand(commandName: string) {
  const map = {
    greet: (props: any) => <GreetCommand {...props} />,
    help: (props: any) => <HelpCommand {...props} />,
  };
  return map[commandName] ?? <ErrorCommand />;
}

function getComponentForCustomId(customId: string) {
  // customIdから判断
  if (customId.startsWith("greet:")) {
    return <GreetCommand userId={/* ... */} />;
  }
  if (customId.startsWith("help:")) {
    return <HelpCommand />;
  }
  return <ErrorCommand />;
}
```

### パターン2: メッセージから判断

```typescript
app.post("/interactions", async (c) => {
  const interaction = await c.req.json();

  if (interaction.type === 3) {
    // interaction.message.interaction_metadataから元のコマンドを取得
    const commandName = interaction.message.interaction_metadata?.name;
    const component = getComponentForCommand(commandName);

    const session = sessionFromInteraction(interaction);
    await disact.connect(session, component);

    return c.body("", 202);
  }
});
```

### パターン3: 外部ストレージに保存

```typescript
// connect時にコンポーネントIDを保存
if (interaction.type === 2) {
  const session = sessionFromInteraction(interaction);

  // コンポーネントIDと必要なpropsを保存
  await storage.set(`session:${session.id}`, {
    componentId: "greet",
    props: { userId: interaction.user.id },
  });

  const { response } = await disact.connect(
    session,
    <GreetCommand userId={interaction.user.id} />,
  );

  return c.json(response);
}

// Component Interaction時に復元
if (interaction.type === 3) {
  const session = sessionFromInteraction(interaction);

  const saved = await storage.get(`session:${session.id}`);
  const component = componentMap[saved.componentId](saved.props);

  await disact.connect(session, component);

  return c.body("", 202);
}
```

## Hydration検証

### 検証内容

```typescript
interface HydrationResult {
  success: boolean;
  warnings: HydrationWarning[];
}

interface HydrationWarning {
  type: "missing-component" | "extra-component" | "state-mismatch";
  customId: string;
  expected?: any;
  actual?: any;
}

function validateHydration(
  discordMessage: Message,
  renderResult: RenderResult,
): HydrationResult {
  const discordCustomIds = extractCustomIds(discordMessage.components);
  const renderedCustomIds = extractCustomIds(renderResult);

  const warnings: HydrationWarning[] = [];

  // Discord側にあるがレンダリング結果にない
  for (const customId of discordCustomIds) {
    if (!renderedCustomIds.has(customId)) {
      warnings.push({
        type: "missing-component",
        customId,
      });
    }
  }

  // レンダリング結果にあるがDiscord側にない
  for (const customId of renderedCustomIds) {
    if (!discordCustomIds.has(customId)) {
      warnings.push({
        type: "extra-component",
        customId,
      });
    }
  }

  // 状態の不一致チェック（案Aの場合）
  for (const customId of discordCustomIds) {
    if (renderedCustomIds.has(customId)) {
      const discordState = parseCustomId(customId)?.current;
      const renderedState = parseCustomId(customId)?.current;

      if (discordState !== renderedState) {
        warnings.push({
          type: "state-mismatch",
          customId,
          expected: discordState,
          actual: renderedState,
        });
      }
    }
  }

  return {
    success: warnings.length === 0,
    warnings,
  };
}
```

### エラーハンドリング

```typescript
// 厳格モード: hydration errorで失敗
const result = validateHydration(currentMessage, renderResult);
if (!result.success) {
  throw new HydrationError(result.warnings);
}

// 寛容モード: 警告のみ（推奨）
const result = validateHydration(currentMessage, renderResult);
if (!result.success) {
  console.warn("Hydration warnings:", result.warnings);
  // 処理は続行
}
```

## ExternalStore

案Bの状態管理では、各`externalStore`が独立してストレージにアクセスします。

```typescript
interface ExternalStore<T> {
  get(): Promise<T>;
  set(value: T): Promise<void>;
  defaultValue: T;
}

// 使用例
const userNameStore = createExternalStore({
  get: async () => await kv.get("user:name"),
  set: async (value: string) => await kv.put("user:name", value),
  defaultValue: "Guest",
});
```

詳細な実装例は`state-management.md`を参照してください。

## まとめ

### connect()の役割

`session.messageId`の有無により、自動的に動作を切り替えます：

#### messageIdがない場合（新規メッセージ作成）
- コンポーネントのレンダリング
- Interaction responseの生成
- ハンドラーの収集（メモリ内のみ）

#### messageIdがある場合（既存メッセージ更新）
- 状態の復元（customId + 外部ストレージ）
- コンポーネントの再構築
- Hydration検証
- ハンドラーの実行
- バッチング＆再レンダリング
- Discord APIでメッセージ更新

### 設計の特徴
- **統一されたAPI**: Application CommandとComponent Interactionで同じメソッドを使用
- **ステートレス**: リクエストごとに完全に再構築
- **Hydration**: React SSRと同様の仕組み
- **柔軟なルーティング**: ユーザー側で自由に実装
- **型安全**: TypeScriptで完全に型付け
- **engine側との分離**: `connect()`という名前でengineの`render()`と区別
