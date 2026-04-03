// src/routes/highlights.ts
// Automatic highlight detection and clip generation leveraging LLMLingua and Claude
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { detectClipHighlights, compressWithLLMLingua } from '../lib/ai.js';
import { logger } from '../lib/logger.js';
const router = Router();
const GenerateSchema = z.object({
    streamId: z.string().min(1),
    transcriptContext: z.array(z.string()).min(1),
});
// POST /api/highlights/generate
// Utilizes LLMLingua to compress contexts, then requests Claude to extract clip highlights
router.post('/generate', authenticate, validate(GenerateSchema), async (req, res) => {
    const { streamId, transcriptContext } = req.body;
    const stream = await prisma.stream.findUnique({ where: { id: streamId } });
    if (!stream) {
        res.status(404).json({ error: 'Stream not found' });
        return;
    }
    if (stream.creatorId !== req.user.id && req.user.role !== 'ADMIN') {
        res.status(403).json({ error: 'Forbidden' });
        return;
    }
    // 1. Compress prompt using LLMLingua to save Anthropic token costs
    const { compressedPrompt, savedTokens } = await compressWithLLMLingua("Please generate highlights for the following stream segment: ", transcriptContext);
    // 2. Feed compressed context to Claude
    const highlights = await detectClipHighlights(compressedPrompt);
    logger.info({ streamId, creatorId: req.user.id, savedTokens, highlightsCount: highlights.length }, 'Generated highlights with LLMLingua/Claude');
    res.json({
        streamId,
        highlights,
        tokenSavings: savedTokens
    });
});
export default router;
