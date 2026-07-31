export interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface DiseaseDiagnosis {
  likelyDisease: string;
  confidence: "low" | "medium" | "high";
  recommendations: string[];
  isolationRequired: boolean;
}

export interface ChatResponse {
  message: string;
  suggestedActions?: { label: string; action: string }[];
}

export interface DashboardRecommendations {
  summary: string;
  priority: "low" | "medium" | "high" | "critical";
  recommendations: string[];
  suggestedActions: { label: string; action: string }[];
  relatedModules: string[];
  confidence: number;
  generatedAt: string;
}

export interface AIProvider {
  /**
   * Generates a conversational response based on the message history and context.
   */
  chat(messages: Message[]): Promise<ChatResponse>;

  /**
   * Analyzes provided symptoms and returns a structured disease diagnosis.
   */
  analyzeDisease(symptoms: string, type: "crop" | "livestock"): Promise<DiseaseDiagnosis>;

  /**
   * Analyzes an image for diseases and returns a structured diagnosis.
   */
  analyzeDiseaseImage(imageUrl: string, type: "crop" | "livestock"): Promise<DiseaseDiagnosis>;

  /**
   * Generates structured recommendations for the dashboard based on farm context.
   */
  getDashboardRecommendations(context: string): Promise<DashboardRecommendations>;
}
