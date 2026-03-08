# Observability

## Aspire Dashboard でトレース・ログを確認する

[.NET Aspire Dashboard](https://learn.microsoft.com/ja-jp/dotnet/aspire/fundamentals/dashboard/overview) を使うと、OpenTelemetry のトレースと構造化ログを一画面で確認できます。

### 起動

```bash
docker run -d --name aspire-dashboard \
  -p 18888:18888 \
  -p 18889:18889 \
  -p 18890:18890 \
  -e DASHBOARD__OTLP__AUTHMODE=Unsecured \
  mcr.microsoft.com/dotnet/aspire-dashboard:latest
```

| ポート | 用途                     |
| ------ | ------------------------ |
| 18888  | ダッシュボード UI        |
| 18889  | OTLP/gRPC エンドポイント |
| 18890  | OTLP/HTTP エンドポイント |

### アプリ側の設定

`.env.local` に以下を追加：

```
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:18890
OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf
```

**重要**: Aspire Dashboard の OTLP/HTTP エンドポイントは `application/x-protobuf` のみ受け付けます。
トレースエクスポーターには `@opentelemetry/exporter-trace-otlp-proto` を使用してください（`exporter-trace-otlp-http` は JSON 形式を送信するため非対応）。

ログは `@logtape/otel` の `getOpenTelemetrySink()` 経由で送信されますが、`OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf` を設定しないとログが届きません。

### UI へのアクセス

起動ログに表示されるログイン URL をブラウザで開きます：

```
http://localhost:18888/login?t=<token>
```

トークンは `docker logs aspire-dashboard` で確認できます。

### 注意事項

#### OTel ログ属性のオブジェクト制限

OTel の属性値にはプリミティブ型（`string` / `number` / `boolean`）しか使えません。
オブジェクトや配列をそのまま渡すと OTel SDK が**静かに DROP** します。

`logging.ts` の `withStringifiedProperties` ラッパーがオブジェクト・配列を自動で JSON 文字列に変換します。
ログ呼び出し側で `JSON.stringify` する必要はありません。

```ts
otel: withStringifiedProperties(getOpenTelemetrySink()),
```
