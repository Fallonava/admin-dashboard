-- AlterTable
ALTER TABLE "AiSettings" ADD COLUMN     "ollamaUrl" TEXT NOT NULL DEFAULT 'http://localhost:11434',
ALTER COLUMN "provider" SET DEFAULT 'ollama',
ALTER COLUMN "aiModel" SET DEFAULT 'qwen2.5:1.5b';
