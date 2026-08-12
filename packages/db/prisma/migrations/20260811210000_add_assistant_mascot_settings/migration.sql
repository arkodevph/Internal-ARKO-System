ALTER TABLE "AssistantConfiguration"
ADD COLUMN "iconStyle" TEXT NOT NULL DEFAULT 'BOT',
ADD COLUMN "accentColor" TEXT NOT NULL DEFAULT '#22C55E',
ADD COLUMN "greeting" TEXT NOT NULL DEFAULT 'I’m NEX. Ask about your ARKO workspace or create workspace data. I always ask before writing anything.';
