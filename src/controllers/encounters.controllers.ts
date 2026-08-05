import { Response } from "express";
import Groq from "groq-sdk";
import multer from "multer";
import { toFile } from "groq-sdk/uploads";
import { prisma } from "../db/prisma";
import { AuthRequest } from "../types/auth";

const groq = new Groq({apiKey: process.env.GROQ_API_KEY})

function euclideanDistance(a: number[], b: number[]) {
  return Math.sqrt(a.reduce((sum, v, i) => sum + (v - b[i]) ** 2, 0));
}
const MATCH_THRESHOLD = 0.5;

// POST /api/encounters
export const createEncounter = async (req:AuthRequest, res:Response)=>{
    try {
    const audioBuffer = (req.file as Express.Multer.File | undefined)?.buffer;
    const embeddingRaw = req.body.embedding as string;

    if (!embeddingRaw) {
      return res.status(400).json({ error: "embedding required" });
    }

    let embedding: number[];
    try {
      embedding = JSON.parse(embeddingRaw);
    } catch {
      return res.status(400).json({ error: "embedding is not valid JSON" });
    }
    if (!req.user) {
    return res.status(401).json({
        message: "Unauthorized",
    });
    }

    const userId = req.user.userId;

    if (!audioBuffer) {
      return res.status(400).json({ error: "No audio file uploaded" });
    }

    // ── 1. Transcribe with Groq Whisper ──────────────────────────────────────
    console.log("[encounters] Transcribing audio...");

    const transcription = await groq.audio.transcriptions.create({
      file: await toFile(audioBuffer, "recording.webm", { type: "audio/webm" }),
      model: "whisper-large-v3",
      response_format: "text",
    });

    const transcript = transcription as unknown as string;
    console.log("[encounters] Transcript:", transcript);

    if (!transcript || transcript.trim().length === 0) {
      return res.status(400).json({ error: "Transcript was empty — was anything recorded?" });
    }

    // ── 2. Extract structured facts with Llama via Groq ──────────────────────
    console.log("[encounters] Extracting facts...");

    const extraction = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0.1, // low temp = more predictable JSON
      messages: [
        {
          role: "system",
          content: "You are a JSON extractor. Return ONLY a valid JSON object. No markdown, no backticks, no explanation — just raw JSON.",
        },
        {
          role: "user",
          content: `Extract information from this conversation transcript.
 
          Return exactly this shape:
          {
            "name": string or null,
            "occupation": string or null,
            "topics": string[],
            "summary": string
          }
          
          Rules:
          - "name": the other person's name if mentioned, else null
          - "occupation": what the other person does if mentioned, else null  
          - "topics": array of short strings — things discussed (e.g. ["startup ideas", "moved to Bangalore", "looking for a job"])
          - "summary": 1-2 sentences you'd want to remember about this person and conversation
          
          Transcript:
          ${transcript}`,
        },
      ],
    });

    const raw = extraction.choices[0].message.content ?? "{}";
    console.log("[encounters] Raw extraction:", raw);    

    let facts: {
      name: string | null;
      occupation: string | null;
      topics: string[];
      summary: string;
    };
    
    try {
      facts = JSON.parse(raw);
    } catch {
      // LLM occasionally adds prose despite instructions — degrade gracefully
      console.warn("[encounters] JSON parse failed, using fallback");
      facts = {
        name: null,
        occupation: null,
        topics: [],
        summary: transcript.slice(0, 200),
      };
    }   

    // ── 3. Match or create Person ─────────────────────────────────────────────
    // Compare the incoming embedding against all people this user has saved.
    // If we find a match → this is someone they've met before → just add a new Encounter.
    // If no match → genuinely new person → create Person first, then Encounter.   
    
    const existingPeople = await prisma.person.findMany({
      where: { userId },
    });
    
    let best: (typeof existingPeople)[0] | null = null;
    let bestDistance = Infinity;

    for (const p of existingPeople) {
      const stored = p.faceEmbedding as number[];
      const dist = euclideanDistance(embedding, stored);
      if (dist < bestDistance) {
        bestDistance = dist;
        best = p;
      }
    }
 
    let person;    

    if (best && bestDistance < MATCH_THRESHOLD) {
      // Person already in DB — update with any new info from this conversation
      // but only fill in fields that are currently empty (don't overwrite)
      person = await prisma.person.update({
        where: { id: best.id },
        data: {
          ...(facts.name && !best.name && { name: facts.name }),
          ...(facts.occupation && !best.occupation && { occupation: facts.occupation }),
        },
      });
      console.log("[encounters] Matched existing person:", person.id, person.name);
    } else {
      // New person — create with face embedding
      person = await prisma.person.create({
        data: {
          userId,
          name: facts.name,
          occupation: facts.occupation,
          faceEmbedding: embedding,
        },
      });
      console.log("[encounters] Created new person:", person.id, person.name);        
    }    

        // ── 4. Always create a new Encounter ─────────────────────────────────────
    // One person can have many encounters — this is always a new one
    const encounter = await prisma.encounter.create({
      data: {
        personId: person.id,
        transcript,
        summary: facts.summary,
        topics: facts.topics,
      },
    });
 
    console.log("[encounters] Encounter saved:", encounter.id);
 
    return res.json({ person, encounter });

    } catch (error) {
        console.error("[createEncounter]", error);
        return res.status(500).json({ error: "Failed to process encounter" });
    }
}

// // GET /api/encounters/:personId
// export const getEncountersByPerson = async (req: AuthRequest, res: Response) => {
//   try {
//     const { personId } = req.params;
//     const encounters = await prisma.encounter.findMany({
//       where: { personId },
//       orderBy: { date: "desc" },
//     });
//     return res.json(encounters);
//   } catch (error) {
//     console.error("[getEncountersByPerson]", error);
//     return res.status(500).json({ error: "fetch failed" });
//   }
// };

