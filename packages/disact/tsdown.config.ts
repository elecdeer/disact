import { defineConfig } from "tsdown";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "jsx-runtime": "src/jsx-runtime.ts",
    "jsx-dev-runtime": "src/jsx-dev-runtime.ts",
    testing: "src/testing/index.ts",
  },
  format: ["esm"],
  sourcemap: true,
  clean: true,
  dts: {
    sourcemap: true,
  },
  unbundle: true,
});
