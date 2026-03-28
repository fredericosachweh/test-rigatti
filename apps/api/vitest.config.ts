import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./src/__tests__/setup.ts"],
    env: {
      NODE_ENV: "test",
      MONGODB_URI: "mongodb://127.0.0.1:27017/test-placeholder",
      JWT_SECRET: "test-secret-minimum-32-characters-ok!!",
      CLIENT_URL: "http://localhost:5173",
      UPLOADS_DIR: "/tmp/rigatti-test-uploads",
      AI_PROVIDER: "openai",
      OPENAI_MODEL: "gpt-4o-mini",
      ANTHROPIC_MODEL: "claude-haiku-4-5-20251001"
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**/*.ts"],
      exclude: ["src/__tests__/**", "src/seed.ts", "src/download-images.ts", "src/server.ts"]
    }
  }
});
