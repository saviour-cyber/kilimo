import { AIProvider } from "./types";
import { OpenAIProvider } from "./providers/openAI";

// Factory for getting the configured AI provider
export function getAIProvider(): AIProvider {
  // We can switch this based on environment variables if multiple providers are supported
  return new OpenAIProvider();
}

export * from "./types";
