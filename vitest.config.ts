import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "disact",
          root: "./packages/disact",
          typecheck: {
            enabled: true,
          },
        },
      },
      {
        test: {
          name: "disact-engine",
          root: "./packages/disact-engine",
          setupFiles: ["./src/__tests__/setup.ts"],
          typecheck: {
            enabled: true,
          },
        },
      },
    ],
  },
});
