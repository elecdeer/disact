import { defineConfig } from "orval";

export default defineConfig({
  "discord-api": {
    input: {
      // 2025-10-04
      target:
        "https://raw.githubusercontent.com/discord/discord-api-spec/47b4923237266c7dbcb30edef561655b47770e51/specs/openapi.json",
    },
    output: {
      mode: "split",
      target: "./src/api/discord-api.ts",
      schemas: "./src/api/models",
      client: "fetch",
      mock: false,
      clean: true,
    },
  },
});
