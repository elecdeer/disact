import { defineConfig } from "tsdown";

export default defineConfig({
  entry: {
    index: "src/index.ts",
  },
  format: ["esm"],
  sourcemap: true,
  clean: true,
  dts: {
    sourcemap: true,
  },
  unbundle: true,
});
