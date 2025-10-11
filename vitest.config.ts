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
          typecheck: {
            enabled: true,
          },
        },
      },
    ],
  },
});
