import { AIProvider } from "./types";
import { OpenAIProvider } from "./providers/openAI";
import { GeminiProvider } from "./providers/gemini";

// Factory for getting the configured AI provider
export function getAIProvider(): AIProvider {
  // If a Gemini API key is provided, use the Gemini Provider
  if (process.env.GEMINI_API_KEY) {
    return new GeminiProvider();
  }
  // Otherwise default to OpenAI provider (which falls back to mock if no key)
  return new OpenAIProvider();
}

export * from "./types";
