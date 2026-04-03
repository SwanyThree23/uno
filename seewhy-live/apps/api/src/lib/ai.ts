import Anthropic from '@anthropic-ai/sdk';
import { logger } from './logger.js';

// Instantiate Anthropic Client (It will automatically pick up ANTHROPIC_API_KEY from env)
const anthropic = new Anthropic();

/**
 * Validates a chat message using Claude 3 Haiku for ultra-fast, low-cost moderation.
 * Returns true if safe, false if it contains hate speech, severe harassment, or explicit content.
 */
export async function moderateChatMessage(messageContent: string, username: string): Promise<{ isSafe: boolean; reason?: string }> {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 100,
      temperature: 0.1,
      system: `You are a strict automated content moderator for a live streaming platform.
Analyze the user's chat message and determine if it violates community guidelines (hate speech, severe harassment, doxxing, explicit adult content).
If it violates the rules, output "UNSAFE: " followed by a brief reason.
If it is safe, output "SAFE".
Reply ONLY with the verdict format.`,
      messages: [
        { role: 'user', content: `[${username}]: ${messageContent}` }
      ]
    });

    const reply = (response.content[0] as any).text.trim();

    if (reply.startsWith('UNSAFE:')) {
      const reason = reply.replace('UNSAFE:', '').trim();
      return { isSafe: false, reason };
    }
    
    return { isSafe: true };
  } catch (error) {
    logger.error({ error }, 'Failed to moderate chat message with Claude');
    return { isSafe: true }; // Fail-open to avoid blocking chat during API outages
  }
}

/**
 * Analyzes stream metadata/transcript to suggest highlights or clips.
 */
export async function detectClipHighlights(transcriptText: string): Promise<string[]> {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 300,
      temperature: 0.3,
      system: `You are an AI video editor assistant. Read the provided partial transcript from a live stream.
Identify 1-3 exciting moments, jokes, or key takeaways that would make good short clips.
Output them as a bulleted list of short descriptions.`,
      messages: [
        { role: 'user', content: transcriptText }
      ]
    });

    const reply = (response.content[0] as any).text.trim();
    // parse out bullet points
    return reply.split('\n')
      .map((line: string) => line.replace(/^-\s*/, '').trim())
      .filter((line: string) => line.length > 0);
  } catch (error) {
    logger.error({ error }, 'Failed to detect highlights with Claude');
    return [];
  }
}
