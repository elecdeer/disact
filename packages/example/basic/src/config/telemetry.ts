import { NodeTracerProvider } from "@opentelemetry/sdk-trace-node";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { Resource } from "@opentelemetry/resources";
import { ATTR_SERVICE_NAME } from "@opentelemetry/semantic-conventions";

let provider: NodeTracerProvider | undefined;

/**
 * OpenTelemetryのトレーシングを初期化
 * configureLogging() より前に呼び出すこと
 */
export const configureTelemetry = (): void => {
  const resource = new Resource({
    [ATTR_SERVICE_NAME]: "disact-example",
  });

  const exporter = new OTLPTraceExporter();

  provider = new NodeTracerProvider({
    resource,
    spanProcessors: [new BatchSpanProcessor(exporter)],
  });

  provider.register();
};

/**
 * OpenTelemetryプロバイダーをシャットダウン
 */
export const shutdownTelemetry = async (): Promise<void> => {
  if (provider) {
    await provider.shutdown();
  }
};
