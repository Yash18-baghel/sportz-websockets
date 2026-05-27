import { Router } from "express";
import { matchIdParamSchema } from "../validation/matches.js";
import { createCommentarySchema, listCommentaryQuerySchema } from "../validation/commentary.js";
import { db } from "../db/db.js";
import { commentary } from "../db/schema.js";
import { desc, eq } from "drizzle-orm";

export const commentaryRouter = Router({ mergeParams: true });

const MAX_LIMIT = 100;

commentaryRouter.post('/', async (req, res, next) => {

    const paramsResult = matchIdParamSchema.safeParse(req.params);

    if (!paramsResult.success) {
        return res.status(400).json({ error: 'Invalide match ID.', details: paramsResult.error.issues });
    }

    const bodyResult = createCommentarySchema.safeParse(req.body);

    if (!bodyResult.success) {
        return res.status(400).json({ error: 'Invalide Commantry Payloac.', details: bodyResult.error.issues });
    }

    try {
        const commantryData = bodyResult.data;


        const [result] = await db.insert(commentary)
            .values({
                matchId: paramsResult.data.id,
                ...commantryData
            }).returning();


        if (res.app.locals.broadcastCommentary) {
            res.app.locals.broadcastCommentary(result.matchId, result)
        }

        res.status(201).json(({ data: result }))
    } catch (error) {
        console.error('Failed to create commantry: ', error);
        res.status(500).json({ error: 'Failed to create commantry: ' })
    }
})

commentaryRouter.get('/', async (req, res) => {

    const paramsResult = matchIdParamSchema.safeParse(req.params);
    if (!paramsResult.success) {
        return res.status(400).json({ error: 'Invalide match ID.', details: paramsResult.error.issues });
    }

    const queryResult = listCommentaryQuerySchema.safeParse(req.query);

    if (!queryResult.success) {
        return res.status(400).json({ error: 'Invalide query Parameters', details: paramsResult.error.issues });
    }

    try {
        const { id: matchId } = paramsResult.data;
        const { limit = 10 } = queryResult.data;

        const safeLimit = Math.min(limit, MAX_LIMIT)

        const result = await db
            .select()
            .from(commentary)
            .where(eq(commentary.matchId, matchId))
            .orderBy(desc(commentary.createdAt))
            .limit(safeLimit);

        res.status(200).json({
            data: result
        })
    } catch (error) {
        console.error('Failed to Fetch Commantary', error);
        res.status(500).json({ error: 'Failed to Fetch Commantary.' })
    }
})