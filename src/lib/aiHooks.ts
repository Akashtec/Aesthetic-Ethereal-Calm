import { generateStory } from './storyGenerator';

/**
 * AI-ready hooks for future integration.
 * Currently these return procedural fallbacks or placeholders.
 */

export async function generateTextPrompt(context: string): Promise<string> {
  console.log(`[AI Hook] Generating text for context: ${context}`);
  // In the future, call an LLM here.
  return new Promise((resolve) => {
    setTimeout(() => resolve(generateStory()), 500);
  });
}

export async function generateImagePrompt(description: string): Promise<string> {
  console.log(`[AI Hook] Generating image for description: ${description}`);
  // In the future, call an image generation API here.
  // Returning a placeholder image URL for now.
  const seed = Math.floor(Math.random() * 1000);
  return `https://picsum.photos/seed/${seed}/1920/1080`;
}

export async function generateMusicPrompt(mood: string): Promise<string> {
  console.log(`[AI Hook] Generating music for mood: ${mood}`);
  // In the future, call a music generation API here.
  return "music_placeholder.mp3";
}
