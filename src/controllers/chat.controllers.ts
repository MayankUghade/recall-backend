import { Request, Response } from "express";
import { answerChatQuery } from "../services/chatService";

export const chat = async (req: Request, res: Response) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: "message is required" });
    }

    // assuming your auth middleware attaches user to req, same as your other protected routes
    const userId = (req as any).user.id;

    const result = await answerChatQuery(userId, message);
    res.json(result);
  } catch (err) {
    console.error("Chat error:", err);
    res.status(500).json({ error: "Failed to process chat query" });
  }
};