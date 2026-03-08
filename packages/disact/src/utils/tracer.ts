import { trace } from "@opentelemetry/api";

export const getDisactTracer = () => trace.getTracer("disact");
