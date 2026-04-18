import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/cli.ts"],
  clean: true,
  dts: false,
  format: ["esm"],
  outDir: "dist",
  outExtension: () => ({ js: ".js" }),
  platform: "node",
  shims: false,
  splitting: false,
  target: "node20"
});
