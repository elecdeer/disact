import { trace } from "@opentelemetry/api";

export const getEngineTracer = () => trace.getTracer("disact-engine");
