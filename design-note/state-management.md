# Disact 状態管理設計

## 概要

Disactは短命のランタイム（Cloudflare Workersなど）での動作を前提とした、Discord Bot向けのJSXベースのフレームワークです。
状態管理において、以下の2つのアプローチを提供します：

- **案A: customIdベースの状態管理** - 軽量な状態をcustomIdに埋め込む
- **案B: 外部ストレージベースの状態管理** - 永続化が必要な状態を外部ストレージで管理

## 案A: customIdベースの状態管理

### 基本コンセプト

Message Componentの`customId`（最大100文字）に状態を埋め込むことで、短命ランタイムでも状態を保持します。
Reactのhydrationと同様の仕組みで、Interaction時に状態を復元します。

### useReducer

#### インターフェース

```typescript
function useReducer<T, R extends Reducers<T>>(
  name: string,
  initialValue: T,
  reducers: R,
): [T, Actions<T, R>];

type Reducers<T> = Record<string, (curr: T, ...args: any[]) => T>;

type Actions<T, R extends Reducers<T>> = {
  [K in keyof R]: R[K] extends (curr: T) => T
    ? () => string // 引数なしのreducer
    : R[K] extends (curr: T, ...args: infer Args) => T
      ? (...args: Args) => string // 引数ありのreducer
      : never;
};
```

#### 使用例

```typescript
function Counter() {
  const [count, dispatch] = useReducer("counter", 0, {
    increase: (curr: number) => curr + 1,
    decrease: (curr: number) => curr - 1,
    add: (curr: number, amount: number) => curr + amount,
    reset: () => 0,
  });

  return (
    <>
      <p>Count: {count}</p>
      <actionRow>
        <button customId={dispatch.increase()}>+1</button>
        <button customId={dispatch.decrease()}>-1</button>
        <button customId={dispatch.add(5)}>+5</button>
        <button customId={dispatch.reset()}>Reset</button>
      </actionRow>
    </>
  );
}

// Note: customIdのみを指定する場合、onClickハンドラーは不要
// Interaction時に自動的に状態が更新され、コンポーネントが再レンダリングされる
```

### customIdフォーマット

```
dsct|{name}|{currentValue}|{nextValue}
```

#### 例

```typescript
dispatch.increase(); // "dsct|0|counter|5|6"
//                     ^^^^ ^ ^^^^^^^ ^ ^
//                     magic uniqueId name 現在値 次の値

dispatch.add(3); // "dsct|0|counter|5|8"
//                 magic: dsct
//                 name: counter
//                 current: 5
//                 next: 5 + 3 = 8
```

#### フォーマットの特徴

- **magic**: 固定文字列 `"dsct"`
  - DisactのcustomIdであることを識別
  - パース時の検証に使用

- **name**: useReducerの第1引数で指定された名前
  - 短命ランタイムで決定的に同じ値になる必要がある
  - 同じnameは同じ状態を参照する

- **currentValue**: ボタンがレンダリングされた時点の値
  - Hydration検証に使用
  - 型に応じたシリアライゼーション

- **nextValue**: reducerを実行した結果の値
  - Interaction時にこの値を採用
  - reducer関数は再実行しない（マイグレーションに強い）

### 一意性の確保

```typescript
function Component() {
  // 異なるnameを指定して区別する
  const [count1, dispatch1] = useReducer("counter1", 0, reducers);
  const [count2, dispatch2] = useReducer("counter2", 0, reducers);

  return (
    <>
      <button customId={dispatch1.increase()}>Button 1</button>
      {/* customId: "dsct|counter1|0|1" */}

      <button customId={dispatch2.increase()}>Button 2</button>
      {/* customId: "dsct|counter2|0|1" */}
    </>
  );
}
```

**注意**: 同じコンポーネント内で複数のuseReducerを使う場合は、異なる`name`を指定する必要があります。

### 値の復元メカニズム

Interaction発生時の処理フロー：

```typescript
async function handleInteraction(session, interaction, element) {
  // 1. Discord側の現在のメッセージを取得（interactionに含まれる）
  const currentMessage = interaction.message;

  // 2. メッセージから全てのcustomIdを抽出
  const customIds = extractCustomIds(currentMessage.components);
  // 例: ["dsct|counter|5|6", "dsct|page|2|3"]

  // 3. 全ての現在値をコンテキストにセット
  for (const customId of customIds) {
    const parsed = parseCustomId(customId);
    if (parsed) {
      context.setReducerValue(parsed.name, deserialize(parsed.current));
    }
  }
  // "counter" → 5
  // "page" → 2

  // 4. クリックされたcustomIdの値だけ更新
  const parsed = parseCustomId(interaction.data.custom_id);
  if (parsed) {
    context.setReducerValue(parsed.name, deserialize(parsed.next));
  }
  // 例: "counter" → 6

  // 5. 更新された状態でレンダリング（1回のみ）
  const renderResult = runInContext(context, () => render(element));
  // useReducerはコンテキストから値を取得
  // count = 6, page = 2 の状態でレンダリング

  // 6. Hydration検証
  const hydrationResult = validateHydration(currentMessage, renderResult);
  if (!hydrationResult.success) {
    console.warn("Hydration mismatch:", hydrationResult.warnings);
  }

  // 7. 更新されたメッセージをDiscordに送信
  await updateMessage(session, renderResult);
}
```

#### ポイント

- **initialValueは初期値のみ**: 2回目以降のレンダリングでは、コンテキストから値を取得
- **reducer関数は再実行しない**: nextValueを直接採用（マイグレーションに強い）
- **1回のレンダリングで完結**: Discord側のメッセージからすべての状態を復元

### useState

useReducerのシンタックスシュガーとして実装：

```typescript
function useState<T>(name: string, initialValue: T): [T, (next: T) => string] {
  const [value, dispatch] = useReducer(name, initialValue, {
    set: (_curr: T, next: T) => next,
  });

  return [value, (next: T) => dispatch.set(next)];
}
```

#### 使用例

```typescript
function Pagination() {
  const [page, setPage] = useState("page", 0);

  return (
    <>
      <p>Page: {page}</p>
      <actionRow>
        <button customId={setPage(page - 1)} disabled={page === 0}>
          Previous
        </button>
        <button customId={setPage(page + 1)}>
          Next
        </button>
      </actionRow>
    </>
  );
}

// Note: customIdによる状態更新は自動的に行われる
```

### シリアライゼーション

#### 基本型

```typescript
// 数値
customId: "dsct|counter|5|6";

// 文字列
customId: "dsct|name|John|Jane";

// 真偽値
customId: "dsct|enabled|true|false";
```

#### オブジェクト型

カスタムシリアライザーを提供：

```typescript
const [user, dispatch] = useReducer(
  "user",
  { name: "John", age: 25 },
  {
    setName: (curr, name: string) => ({ ...curr, name }),
    setAge: (curr, age: number) => ({ ...curr, age }),
  },
  {
    serialize: (user) => `${user.name}:${user.age}`,
    deserialize: (str) => {
      const [name, age] = str.split(":");
      return { name, age: Number(age) };
    },
  },
);
```

### 制約事項

1. **100文字制限**: customIdは100文字まで
   - 複雑な状態は案Bを使用
   - シリアライザーで圧縮を検討

2. **型の制限**: シリアライズ可能な型のみ
   - プリミティブ型推奨
   - オブジェクトはカスタムシリアライザーが必要

3. **セキュリティ**: 改ざん可能性
   - Discord APIの署名検証により、customIdの信憑性は保証される
   - ただし、重要な認証情報や権限情報はcustomIdに含めない
   - 権限チェックはサーバー側で必ず実施

## 案B: 外部ストレージベースの状態管理

### 基本コンセプト

永続化が必要な状態や、customIdに収まらない複雑な状態を外部ストレージ（Workers KV、DB、Node.jsのメモリなど）で管理します。

各`externalStore`は独立して値を管理し、`get`と`set`メソッドを実装します。一元的なストアを介さず、直接ストアにアクセスします。

### createExternalStore

#### インターフェース

```typescript
interface ExternalStore<T> {
  // 値を取得
  get(): Promise<T>;

  // 値を設定
  set(value: T): Promise<void>;

  // デフォルト値
  defaultValue: T;
}

interface ExternalStoreOptions<T> {
  // 値を取得する関数
  get: () => Promise<T | undefined>;

  // 値を設定する関数
  set: (value: T) => Promise<void>;

  // デフォルト値
  defaultValue: T;
}

function createExternalStore<T>(options: ExternalStoreOptions<T>): ExternalStore<T>;
```

#### 実装例

```typescript
function createExternalStore<T>(options: ExternalStoreOptions<T>): ExternalStore<T> {
  return {
    defaultValue: options.defaultValue,

    async get(): Promise<T> {
      const value = await options.get();
      return value ?? this.defaultValue;
    },

    async set(value: T): Promise<void> {
      await options.set(value);
    },
  };
}
```

### useExternalStore

#### インターフェース

```typescript
type SetExternalStore<T> = (value: T | ((prev: T) => T)) => Promise<void>;

function useExternalStore<T>(store: ExternalStore<T>): [T, SetExternalStore<T>];
```

### InteractionContext

onClickハンドラーで使用できるコンテキスト：

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

#### 使用例

```typescript
// ExternalStore定義（コンポーネント外部）
const userNameStore = createExternalStore({
  get: async () => {
    const value = await kv.get("userName");
    return value;
  },
  set: async (value: string) => {
    await kv.put("userName", value);
  },
  defaultValue: "Guest",
});

const isPremiumStore = createExternalStore({
  get: async () => {
    const value = await kv.get("isPremium");
    return value;
  },
  set: async (value: boolean) => {
    await kv.put("isPremium", value);
  },
  defaultValue: false,
});

function Profile() {
  const [userName, setUserName] = useExternalStore(userNameStore);
  const [isPremium, setIsPremium] = useExternalStore(isPremiumStore);

  return (
    <>
      <p>Name: {userName}</p>
      {isPremium && <p>⭐ Premium Member</p>}

      <button
        customId="update-name"
        onClick={async (ctx) => {
          await setUserName("Jane");
          // setterにより自動的に再レンダリングされる
        }}
      >
        Update Name
      </button>

      <button
        customId="upgrade"
        onClick={async (ctx) => {
          await setIsPremium(true);
          // setterにより自動的に再レンダリングされる
        }}
      >
        Upgrade to Premium
      </button>
    </>
  );
}
```

### 非同期読み込みとSuspense

#### 解決策A: 事前ロード（推奨）

```typescript
// connect時に必要なstoreを事前ロード
await Promise.all([userNameStore.get(), isPremiumStore.get()]);

// useExternalStoreはロード済みの値を同期的に取得
function useExternalStore<T>(store: ExternalStore<T>): [T, SetExternalStore<T>] {
  const context = getCurrentContext();

  // contextからロード済みの値を取得
  const value = context.externalStoreValues.get(store) ?? store.defaultValue;

  const setter = async (newValue: T | ((prev: T) => T)) => {
    const actualValue =
      typeof newValue === "function" ? (newValue as (prev: T) => T)(value) : newValue;

    // contextに保存
    context.externalStoreValues.set(store, actualValue);

    // 再レンダリングをマーク
    context._markForUpdate(store);
  };

  return [value, setter];
}
```

#### 解決策B: Suspense統合（将来の拡張）

```typescript
function useExternalStore<T>(store: ExternalStore<T>): [T, SetExternalStore<T>] {
  const context = getCurrentContext();

  // 値がまだロードされていない場合、Promiseをthrow
  if (!context.externalStoreValues.has(store)) {
    throw store.get().then(value => {
      context.externalStoreValues.set(store, value);
    });
  }

  const value = context.externalStoreValues.get(store);
  // ... setter実装
  return [value, setter];
}

// 使用例
<Suspense fallback={<p>Loading...</p>}>
  <Profile /> {/* useExternalStoreがSuspenseをトリガー */}
</Suspense>
```

### 状態の永続化と再レンダリング

#### 自動再レンダリング

setterを呼ぶと、自動的に再レンダリングがトリガーされます：

```typescript
onClick={async (ctx) => {
  await setUserName("Jane");
  // 自動的に再レンダリング & Discord APIで更新
}}
```

#### バッチング（複数の状態更新）

複数のsetterを呼ぶ場合、自動的にバッチングされます：

```typescript
onClick={async (ctx) => {
  await setUserName("Jane");
  await setAge(30);
  await setCity("Tokyo");
  // ハンドラー終了後に1回だけ再レンダリング & 1回のDiscord API呼び出し
}}
```

**実装案1: ハンドラー終了時にバッチング（推奨）**

- ハンドラー内のすべてのsetter呼び出しを収集
- ハンドラー終了後に一括で永続化 + 1回だけ再レンダリング
- シンプルで効率的

**実装案2: マイクロタスクでバッチング**

- Reactのような自動バッチング
- より複雑だが、柔軟

#### 明示的な再レンダリング（ctx.update）

状態変更なしに再レンダリングしたい場合：

```typescript
onClick={async (ctx) => {
  // 外部データを取得
  await refreshExternalData();

  // 明示的に再レンダリング
  await ctx.update();
}}
```

または、同期的な処理の途中で即座に反映したい場合：

```typescript
onClick={async (ctx) => {
  await setStatus("processing");
  // ↑ この時点でUIを更新

  await longRunningTask();

  await setStatus("done");
  // ↑ この時点でUIを更新
}}
```

**Note**: 通常はバッチングに任せ、`ctx.update()`は特別な場合のみ使用

#### バッチング実装の詳細

```typescript
// ハンドラー実行フロー
async function handleInteraction(session, interaction, element) {
  const pendingStores = new Set<ExternalStore<any>>(); // 更新があったstore
  let needsRerender = false;

  // setterがこのフラグをセット
  const markForUpdate = (store: ExternalStore<any>) => {
    pendingStores.add(store);
    needsRerender = true;
  };

  // InteractionContextを作成
  const ctx = {
    update: async () => {
      needsRerender = true;
      await performRerender();
    },
    _markForUpdate: markForUpdate,
    // ...
  };

  // onClickハンドラーを実行
  const handler = getHandler(interaction.data.custom_id);
  await handler(ctx);

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

    // 再レンダリング & Discord APIで更新
    const result = render(element);
    await updateMessage(session, result);

    needsRerender = false;
  }
}
```

### ストレージの実装例

各`externalStore`は独立してストレージにアクセスします。

#### Cloudflare KV

```typescript
// Cloudflare KV向けのexternalStore
const userNameStore = createExternalStore({
  get: async () => {
    const value = await env.KV.get("user:name", "json");
    return value;
  },
  set: async (value: string) => {
    await env.KV.put("user:name", JSON.stringify(value));
  },
  defaultValue: "Guest",
});

const isPremiumStore = createExternalStore({
  get: async () => {
    const value = await env.KV.get("user:premium", "json");
    return value;
  },
  set: async (value: boolean) => {
    await env.KV.put("user:premium", JSON.stringify(value));
  },
  defaultValue: false,
});
```

#### インメモリ（Node.js）

```typescript
// インメモリストレージ
const memoryStore = new Map<string, any>();

const userNameStore = createExternalStore({
  get: async () => {
    return memoryStore.get("user:name");
  },
  set: async (value: string) => {
    memoryStore.set("user:name", value);
  },
  defaultValue: "Guest",
});
```

#### データベース（例: Prisma）

```typescript
const userNameStore = createExternalStore({
  get: async () => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });
    return user?.name;
  },
  set: async (value: string) => {
    await prisma.user.update({
      where: { id: userId },
      data: { name: value },
    });
  },
  defaultValue: "Guest",
});
```

#### ヘルパー関数（オプション）

繰り返しを避けるためのヘルパー関数：

```typescript
// KV向けヘルパー
function createKVStore<T>(kv: KVNamespace, key: string, defaultValue: T) {
  return createExternalStore({
    get: async () => {
      const value = await kv.get(key, "json");
      return value as T | undefined;
    },
    set: async (value: T) => {
      await kv.put(key, JSON.stringify(value));
    },
    defaultValue,
  });
}

// 使用例
const userNameStore = createKVStore(env.KV, "user:name", "Guest");
const isPremiumStore = createKVStore(env.KV, "user:premium", false);
```

## セキュリティ

### Discord APIによる検証

Discord Interactionには署名検証が含まれています：

- リクエストヘッダー: `X-Signature-Ed25519`, `X-Signature-Timestamp`
- サーバー側で署名を検証（discord.jsやhonoミドルウェアなどで実装）
- 検証に成功 = Discordから送られた正当なinteraction
- **customIdの信憑性は保証される**（ユーザーによる改ざんは不可能）

### ベストプラクティス

1. **customIdには機密情報を含めない**
   - ユーザーID、ページ番号などは安全
   - パスワード、トークン、秘密鍵は絶対にNG

2. **権限チェックはサーバー側で実施**

   ```typescript
   onClick={async (ctx) => {
     // ❌ customIdの値を信頼してはいけない
     // const isPremium = /* customIdから取得 */;

     // ✅ サーバー側で再検証
     const user = await fetchUser(ctx.interaction.user.id);
     if (!user.isPremium) {
       await ctx.reply("You need Premium to use this feature.", true);
       return;
     }

     // 権限チェック後に処理
     await unlockPremiumFeature();
   }
   ```

## 使用例：ハイブリッドアプローチ

案Aと案Bを組み合わせて使用できます：

```typescript
// ExternalStore定義（コンポーネント外部）
const userNameStore = createExternalStore({
  get: async () => await kv.get("user:name"),
  set: async (value: string) => await kv.put("user:name", value),
  defaultValue: "Guest",
});

const isPremiumStore = createExternalStore({
  get: async () => await kv.get("user:premium"),
  set: async (value: boolean) => await kv.put("user:premium", value),
  defaultValue: false,
});

function Dashboard() {
  // 案B: 重要な状態を外部ストレージで管理
  const [userName] = useExternalStore(userNameStore);
  const [isPremium, setIsPremium] = useExternalStore(isPremiumStore);

  // 案A: 軽量な状態をcustomIdで管理
  const [page, setPage] = useState("page", 0);
  const [sortBy, setSortBy] = useState("sort", "name");

  return (
    <>
      <p>Hello {userName}!</p>
      {isPremium && <p>⭐ Premium Member</p>}

      <p>Page {page} | Sort by: {sortBy}</p>

      {/* 案A: ページネーション */}
      <actionRow>
        <button customId={setPage(page - 1)} disabled={page === 0}>
          Previous
        </button>
        <button customId={setPage(page + 1)}>
          Next
        </button>
      </actionRow>

      {/* 案A: ソート切り替え */}
      <actionRow>
        <button customId={setSortBy("name")}>Sort by Name</button>
        <button customId={setSortBy("date")}>Sort by Date</button>
      </actionRow>

      {/* 案B: 永続化が必要な操作 */}
      <button
        customId="upgrade"
        onClick={async (ctx) => {
          await setIsPremium(true);
          // setterにより自動的に再レンダリング
        }}
      >
        Upgrade to Premium
      </button>
    </>
  );
}
```

## ベストプラクティス

### どちらの方式を使うべきか

#### 案A（customId）を使う場合

- ✅ ページ番号、カウンター、UI状態
- ✅ 一時的な状態（セッション間で保持不要）
- ✅ シンプルな状態（プリミティブ型）
- ✅ 100文字以内に収まる
- ✅ メッセージごとに独立した状態

**例**: ページネーション、ソート順、展開/折りたたみ状態

#### 案B（外部ストレージ）を使う場合

- ✅ ユーザー情報、設定、権限
- ✅ 永続化が必要な状態
- ✅ 複雑なオブジェクト、配列
- ✅ customIdに収まらない大きな状態
- ✅ 複数のメッセージ間で共有する状態

**例**: ユーザープロフィール、設定、進行状況、カート内容

### 状態管理のパターン

#### パターン1: customIdのみ（最もシンプル）

```typescript
function SimplePagination() {
  const [page, setPage] = useState("page", 0);

  return (
    <>
      <p>Page {page}</p>
      <button customId={setPage(page + 1)}>Next</button>
    </>
  );
}
// Interaction時に自動的にpageが更新され、再レンダリング
// onClickハンドラー不要
```

#### パターン2: onClick + 外部ストレージ

```typescript
// ExternalStore定義
const nameStore = createExternalStore({
  get: async () => await kv.get("user:name"),
  set: async (value: string) => await kv.put("user:name", value),
  defaultValue: "Guest",
});

function ProfileEditor() {
  const [name, setName] = useExternalStore(nameStore);

  return (
    <>
      <p>Name: {name}</p>
      <button
        customId="edit-name"
        onClick={async (ctx) => {
          await setName("Jane");
          // 自動的に再レンダリング
        }}
      >
        Edit
      </button>
    </>
  );
}
```

#### パターン3: ハイブリッド（柔軟性が高い）

```typescript
// ExternalStore定義
const userDataStore = createExternalStore({
  get: async () => await kv.get("user:data"),
  set: async (value: UserData) => await kv.put("user:data", value),
  defaultValue: { saved: false },
});

function AdvancedUI() {
  // UI状態はcustomId
  const [tab, setTab] = useState("tab", 0);

  // ユーザーデータは外部ストレージ
  const [userData, setUserData] = useExternalStore(userDataStore);

  return (
    <>
      <actionRow>
        <button customId={setTab(0)}>Tab 1</button>
        <button customId={setTab(1)}>Tab 2</button>
      </actionRow>

      {tab === 0 && <TabContent1 />}
      {tab === 1 && <TabContent2 />}

      <button
        customId="save"
        onClick={async (ctx) => {
          await setUserData({ ...userData, saved: true });
        }}
      >
        Save
      </button>
    </>
  );
}
```

### パフォーマンス最適化

1. **事前ロード**: 必要なstoreをまとめてロード

   ```typescript
   await Promise.all([nameStore.get(), ageStore.get(), cityStore.get()]);
   ```

2. **バッチング**: 複数の更新を1回にまとめる

   ```typescript
   // 自動的にバッチングされる
   await setName("Jane");
   await setAge(30);
   // ハンドラー終了後に1回だけ再レンダリング
   ```

3. **部分更新**: 変更があったstoreのみ永続化

   ```typescript
   // 内部で自動的に最適化
   // 変更されたstoreのみストレージに書き込む
   ```

4. **customIdの最適化**: nameを短く保つ

   ```typescript
   // ❌ 長すぎる
   customId: "dsct|very-long-component-name-counter|12345|12346";

   // ✅ 短く
   customId: "dsct|cnt|12345|12346";
   ```

## 実装ロードマップ

### Phase 1: 基本的なuseReducerの実装

- [ ] customIdのパース/生成ロジック
- [ ] useReducer Hook本体
- [ ] レンダリングコンテキストでの値管理
- [ ] テスト

### Phase 2: handleInteractionの実装

- [ ] Interactionからの値復元
- [ ] 再レンダリング
- [ ] Hydration検証
- [ ] Discord APIとの連携

### Phase 3: useStateの実装

- [ ] useReducerベースの実装
- [ ] シンタックスシュガー

### Phase 4: atomWithStorageの実装

- [ ] Storageインターフェース
- [ ] useAtom Hook
- [ ] 非同期読み込み（事前ロード）
- [ ] Suspense統合（オプション）

### Phase 5: 最適化と拡張

- [ ] 一括永続化
- [ ] カスタムシリアライザー
- [ ] エラーハンドリング
- [ ] パフォーマンス測定
