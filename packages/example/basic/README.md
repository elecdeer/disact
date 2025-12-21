# Discord Interaction Webhook Example

disactを使用してDiscord Interaction webhookを実装するPoC（概念実証）プロジェクトです。

## 機能

- ✅ Discord署名検証（Ed25519）
- ✅ PING応答
- ✅ APPLICATION_COMMAND応答
- ✅ disactを使用したJSXベースのメッセージ生成

## セットアップ

### 1. 依存関係のインストール

プロジェクトルートで以下を実行：

```bash
pnpm install
```

### 2. Discord アプリケーションの設定

1. [Discord Developer Portal](https://discord.com/developers/applications)にアクセス
2. 新しいアプリケーションを作成（または既存のものを使用）
3. **General Information**ページから**PUBLIC KEY**をコピー
4. 環境変数として設定：

```bash
export DISCORD_PUBLIC_KEY="your_public_key_here"
```

### 3. ローカル開発サーバーの起動

```bash
cd packages/example/basic
pnpm run dev
```

サーバーは`http://localhost:3000`で起動します。

### 4. ngrokでトンネリング

Discordからローカルサーバーにアクセスできるようにするため、ngrokを使用します：

```bash
ngrok http 3000
```

ngrokが提供するHTTPS URLをコピーします（例：`https://xxxx-xx-xx-xxx-xxx.ngrok.io`）。

### 5. Discord アプリケーションにWebhook URLを設定

1. Discord Developer Portalに戻る
2. **General Information** > **INTERACTIONS ENDPOINT URL**に以下を設定：
   ```
   https://your-ngrok-url.ngrok.io/interactions
   ```
3. **Save Changes**をクリック

Discordが自動的にPINGを送信し、検証します。

### 6. スラッシュコマンドの作成

Discord Developer Portalで：

1. **Bot**タブに移動
2. **Add Bot**（まだ作成していない場合）
3. **OAuth2** > **URL Generator**でスコープ`applications.commands`を選択
4. 生成されたURLでbotをサーバーに追加

その後、以下のAPIを使用してスラッシュコマンドを登録：

```bash
curl -X POST \
  "https://discord.com/api/v10/applications/YOUR_APPLICATION_ID/commands" \
  -H "Authorization: Bot YOUR_BOT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "hello",
    "description": "Test command for disact",
    "type": 1
  }'
```

## テスト

Discordサーバーで`/hello`コマンドを実行すると、disactを使用して生成されたメッセージが表示されます。

## プロジェクト構成

```
src/
├── index.tsx                 # サーバーエントリーポイント
├── middleware/
│   └── verify.ts            # Discord署名検証ミドルウェア
└── handlers/
    └── interactions.tsx     # Interaction処理ハンドラー
```

## 環境変数

| 変数名               | 必須 | 説明                                     |
| -------------------- | ---- | ---------------------------------------- |
| `DISCORD_PUBLIC_KEY` | Yes  | Discord ApplicationのPublic Key          |
| `PORT`               | No   | サーバーのポート番号（デフォルト: 3000） |

## 参考資料

- [Discord Interactions API](https://discord.com/developers/docs/interactions/receiving-and-responding)
- [discord-interactions-js](https://github.com/discord/discord-interactions-js)
- [Hono Documentation](https://hono.dev/)
