import { randomUUID } from "crypto";
import { Response } from "express";
import { AuthedRequest } from "../middleware/auth.middleware";
import { generateChatReply } from "../services/ai.service";
import { getOllamaUserMessage } from "../services/ollama.service";
import { loadUserAiContext } from "../services/user-context.service";

type ChatRole = "user" | "assistant";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  created_at: string;
};

const chatStore = new Map<string, ChatMessage[]>();

function createMessage(role: ChatRole, content: string): ChatMessage {
  return {
    id: randomUUID(),
    role,
    content,
    created_at: new Date().toISOString(),
  };
}

function initialAssistantMessage(): ChatMessage {
  return createMessage(
    "assistant",
    "Hello! I'm your LifeFit AI coach powered by your local Ollama model. Ask me about training, recovery, nutrition, or habit consistency.",
  );
}

function getMessagesForUser(userId: string): ChatMessage[] {
  const existing = chatStore.get(userId);
  if (existing && existing.length > 0) {
    return existing;
  }

  const seeded = [initialAssistantMessage()];
  chatStore.set(userId, seeded);
  return seeded;
}

export const listChatMessages = async (
  req: AuthedRequest,
  res: Response,
): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const messages = getMessagesForUser(userId);
  res.status(200).json(messages);
};

export const sendChatMessage = async (
  req: AuthedRequest,
  res: Response,
): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const { content } = req.body as { content?: string };
  const normalizedContent = content?.trim() ?? "";

  if (!normalizedContent) {
    res.status(400).json({ message: "Message content is required" });
    return;
  }

  const messages = getMessagesForUser(userId);
  const userMessage = createMessage("user", normalizedContent);
  messages.push(userMessage);

  let assistantMessage: ChatMessage;
  try {
    const context = await loadUserAiContext(userId);
    const reply = await generateChatReply(
      context,
      messages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
    );
    assistantMessage = createMessage("assistant", reply);
  } catch (error) {
    console.error("Ollama chat unavailable:", error);
    assistantMessage = createMessage(
      "assistant",
      `${getOllamaUserMessage(error)} I saved your message locally, but I cannot generate a coaching reply until Ollama is available.`,
    );
  }

  messages.push(assistantMessage);
  chatStore.set(userId, messages);

  res.status(201).json({
    userMessage,
    assistantMessage,
    messages,
  });
};

export const clearChatMessages = async (
  req: AuthedRequest,
  res: Response,
): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const seeded = [initialAssistantMessage()];
  chatStore.set(userId, seeded);
  res.status(200).json({ message: "Chat reset", messages: seeded });
};
