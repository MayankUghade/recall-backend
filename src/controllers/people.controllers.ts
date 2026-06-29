import { Request, Response } from "express";
import { prisma } from "../db/prisma";
import { AuthRequest } from "../types/auth";

function euclideanDistance(a: number[], b: number[]) {
  return Math.sqrt(a.reduce((sum, v, i) => sum + (v - b[i]) ** 2, 0));
}

const MATCH_THRESHOLD = 0.5;

// POST /api/people/match
export const matchFace = async(req:AuthRequest, res:Response)=>{
    try {
     const userId = req.user?.userId
     const { embedding } = req.body as { embedding: number[] };

     if (!embedding || !Array.isArray(embedding)) {
      return res.status(400).json({ error: "embedding must be a number[]" });
    }

    const people = await prisma.person.findMany({
      where: { userId }
    });
    
    let best: (typeof people)[0] | null = null
    let bestDistance = Infinity;

    for (const person of people ){
        const stored = person.faceEmbedding as number[];
        const dist = euclideanDistance(embedding, stored);
        if(dist < bestDistance) {
            bestDistance = dist
            best = person
        }
    }

    if (best && bestDistance < MATCH_THRESHOLD) {
      return res.json({ match: best, distance: bestDistance });
    }

    return res.json({ match: null });

    } catch (error) {
        console.error("[matchFace]", error);
        return res.status(500).json({ error: "match failed" });
    }

}

// GET /api/people/:id
export const getPersonById = async(req:Request, res:Response)=>{
    try {
        const { id } = req.params;
        if (typeof id !== "string") {
            return res.status(400).json({ error: "Invalid ID parameter" });
        }

        const person = await prisma.person.findUnique({
            where: { id },
            include:{
                encounters:{
                    orderBy:{date:"desc"}
                }
            }
        })
        if (!person) return res.status(404).json({ error: "Person not found" });
        return res.json(person);
    } catch (error) {
        console.error("[getPersonById]", error);
        return res.status(500).json({ error: "fetch failed" });
    }
}

// /api/getAllPeople
export const getAllPeople = async(req:AuthRequest, res:Response)=>{
    try {
        const userId = req.user?.userId
        const people = await prisma.person.findMany({where:{userId},
         orderBy: { createdAt: "desc" },
         include: { encounters: { take: 1, orderBy: { date: "desc" } } },
        })
        return res.json(people);
    } catch (error) {
       console.error("[getAllPeople]", error);
       return res.status(500).json({ error: "fetch failed" });

    }
}