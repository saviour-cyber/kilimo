import { AIProvider, ChatResponse, DiseaseDiagnosis, Message, DashboardRecommendations } from "../types";

export class GeminiProvider implements AIProvider {
  private apiKey: string | undefined;
  
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
  }

  private isMockMode(): boolean {
    return !this.apiKey;
  }

  private async callGemini(contents: any[], requireJson: boolean = false): Promise<string> {
    const model = "gemini-2.5-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;
    
    const body: any = {
      contents,
    };
    
    if (requireJson) {
      body.generationConfig = { responseMimeType: "application/json" };
    }

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Gemini API error: ${response.statusText} - ${err}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  }

  public async chat(messages: Message[]): Promise<ChatResponse> {
    if (this.isMockMode()) {
      return this.mockChat(messages);
    }

    try {
      const geminiContents: any[] = [];
      let systemInstruction = "";

      for (const msg of messages) {
        if (msg.role === "system") {
          systemInstruction = msg.content;
        } else {
          geminiContents.push({
            role: msg.role === "assistant" ? "model" : "user",
            parts: [{ text: msg.content }]
          });
        }
      }

      if (systemInstruction && geminiContents.length > 0 && geminiContents[0].role === "user") {
        geminiContents[0].parts[0].text = `System Instructions: ${systemInstruction}\n\n${geminiContents[0].parts[0].text}`;
      } else if (systemInstruction && geminiContents.length === 0) {
        geminiContents.push({ role: "user", parts: [{ text: `System Instructions: ${systemInstruction}` }]});
      }

      const text = await this.callGemini(geminiContents, false);
      return { message: text };
    } catch (error) {
      console.error("Gemini chat error:", error);
      return this.mockChat(messages);
    }
  }

  public async analyzeDisease(symptoms: string, type: "crop" | "livestock"): Promise<DiseaseDiagnosis> {
    if (this.isMockMode()) {
      return this.mockAnalyzeDisease(symptoms, type);
    }

    const systemPrompt = `You are an expert agricultural AI. Analyze the following ${type} symptoms and return a JSON object exactly matching this schema:
{
  "likelyDisease": "string",
  "confidence": "low" | "medium" | "high",
  "recommendations": ["string", "string"],
  "isolationRequired": boolean
}`;

    try {
      const text = await this.callGemini([
        { role: "user", parts: [{ text: `${systemPrompt}\n\nSymptoms: ${symptoms}` }] }
      ], true);
      return JSON.parse(text) as DiseaseDiagnosis;
    } catch (error) {
      console.error("Gemini analyzeDisease error:", error);
      return this.mockAnalyzeDisease(symptoms, type);
    }
  }

  public async analyzeDiseaseImage(imageUrl: string, type: "crop" | "livestock"): Promise<DiseaseDiagnosis> {
    if (this.isMockMode()) {
      return this.mockAnalyzeDiseaseImage(imageUrl, type);
    }

    const systemPrompt = `You are an expert agricultural AI with computer vision capabilities. Analyze the provided ${type === "crop" ? "crop/plant" : "livestock/animal"} image and identify any visible diseases, infections, or health problems. Return a JSON object exactly matching this schema:
{
  "likelyDisease": "string",
  "confidence": "low" | "medium" | "high",
  "recommendations": ["string", "treatment step 1", "treatment step 2"],
  "isolationRequired": boolean
}`;

    try {
      const imageRes = await fetch(imageUrl);
      const arrayBuffer = await imageRes.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64Data = buffer.toString('base64');
      const mimeType = imageRes.headers.get('content-type') || 'image/jpeg';

      const text = await this.callGemini([
        { 
          role: "user", 
          parts: [
            { text: `${systemPrompt}\n\nPlease analyze this image:` },
            { inlineData: { mimeType, data: base64Data } }
          ] 
        }
      ], true);

      return JSON.parse(text) as DiseaseDiagnosis;
    } catch (error) {
      console.error("Gemini analyzeDiseaseImage error:", error);
      return this.mockAnalyzeDiseaseImage(imageUrl, type);
    }
  }

  public async getDashboardRecommendations(context: string): Promise<DashboardRecommendations> {
    if (this.isMockMode()) {
      return this.mockDashboard();
    }

    const systemPrompt = `You are the lead agricultural intelligence AI for SproutX. Based on the provided farm context, generate a dashboard summary and recommendations. Return a JSON object exactly matching this schema:
{
  "summary": "A 2-3 sentence overview of the farm's current state",
  "priority": "low" | "medium" | "high" | "critical",
  "recommendations": ["string", "string"],
  "suggestedActions": [{"label": "Short Action Name", "action": "/relative/path"}],
  "relatedModules": ["string"],
  "confidence": 0.9,
  "generatedAt": "ISO date string"
}
Ensure the actions point to relevant SproutX paths (e.g. /crops/incidents, /livestock/health, /inventory/items, /finance/report, /tasks).`;

    try {
      const text = await this.callGemini([
        { role: "user", parts: [{ text: `${systemPrompt}\n\nContext:\n${context}` }] }
      ], true);
      return JSON.parse(text) as DashboardRecommendations;
    } catch (error) {
      console.error("Gemini getDashboardRecommendations error:", error);
      return this.mockDashboard();
    }
  }

  // --- Mock Methods ---
  private mockChat(messages: Message[]): ChatResponse {
    return { message: "Mock Gemini Chat Response. Set GEMINI_API_KEY to use real AI." };
  }
  private mockAnalyzeDisease(symptoms: string, type: string): DiseaseDiagnosis {
    return { likelyDisease: "Mock Disease", confidence: "low", recommendations: ["Add GEMINI_API_KEY"], isolationRequired: false };
  }
  private mockAnalyzeDiseaseImage(imageUrl: string, type: string): DiseaseDiagnosis {
    return { likelyDisease: "Mock Image Disease", confidence: "low", recommendations: ["Add GEMINI_API_KEY"], isolationRequired: false };
  }
  private mockDashboard(): DashboardRecommendations {
    return { summary: "Mock summary", priority: "low", recommendations: ["Add GEMINI_API_KEY"], suggestedActions: [], relatedModules: [], confidence: 0, generatedAt: new Date().toISOString() };
  }
}
