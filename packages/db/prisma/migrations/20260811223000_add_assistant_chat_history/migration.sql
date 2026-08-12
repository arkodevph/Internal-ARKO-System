CREATE TABLE "AssistantConversation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssistantConversation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AssistantChatMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssistantChatMessage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AssistantConversation_userId_updatedAt_idx"
ON "AssistantConversation"("userId", "updatedAt");

CREATE INDEX "AssistantChatMessage_conversationId_createdAt_idx"
ON "AssistantChatMessage"("conversationId", "createdAt");

ALTER TABLE "AssistantConversation"
ADD CONSTRAINT "AssistantConversation_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AssistantChatMessage"
ADD CONSTRAINT "AssistantChatMessage_conversationId_fkey"
FOREIGN KEY ("conversationId") REFERENCES "AssistantConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
