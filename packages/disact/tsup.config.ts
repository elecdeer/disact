import { defineConfig } from "tsup";

export default defineConfig({
	entry: {
		index: "src/index.ts",
		"jsx-runtime": "src/jsx-runtime.ts",
		"jsx-dev-runtime": "src/jsx-dev-runtime.ts",
	},
	format: ["cjs", "esm"],
	sourcemap: true,
	clean: true,
	dts: true,
});
