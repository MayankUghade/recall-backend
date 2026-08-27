import { prisma } from "../db/prisma";
import { parseDateRange } from "../utils/dateRange";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function answerChatQuery(userId: number, message: string) {
  const { start, end, label } = parseDateRange(message);

  const encounters = await prisma.encounter.findMany({
    where: {
      person: { userId },
      date: { gte: start, lte: end },
    },
    include: { person: true },
    orderBy: { date: "asc" },
  });

  if (encounters.length === 0) {
    return {
      reply: `You don't have any recorded encounters ${label}.`,
      encounters: [],
    };
  }

  const context = encounters
    .map((e) => {
      const topics = Array.isArray(e.topics)
        ? (e.topics as string[]).join(", ")
        : "";
      return `- ${e.person.name ?? "Unknown"} (${e.person.occupation ?? "unknown occupation"}), ${e.date.toISOString()}: ${e.summary ?? "no summary"}. Topics: ${topics}`;
    })
    .join("\n");

  const completion = await groq.chat.completions.create({
    model: "openai/gpt-oss-20b",
    messages: [
      {
        role: "system",
        content:
          "You are Recall's assistant. Answer the user's question using ONLY the encounter data given below. Be concise and specific — name people, mention key topics. Do not invent details not present in the data.",
      },
      {
        role: "user",
        content: `Encounters (${label}):\n${context}\n\nQuestion: ${message}`,
      },
    ],
  });

  return {
    reply: completion.choices[0].message.content,
    encounters, // send raw data back too, useful for UI (e.g. person cards)
  };
}
