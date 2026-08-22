import { AIProvider, ChatResponse, DiseaseDiagnosis, Message, DashboardRecommendations } from "../types";

export class OpenAIProvider implements AIProvider {
  private apiKey: string | undefined;
  
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
  }

  private isMockMode(): boolean {
    return !this.apiKey;
  }

  public async chat(messages: Message[]): Promise<ChatResponse> {
    if (this.isMockMode()) {
      return this.mockChat(messages);
    }

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini", // or preferred model
          messages: messages,
          temperature: 0.7,
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        message: data.choices[0].message.content,
      };
    } catch (error) {
      console.error("OpenAI chat error:", error);
      return this.mockChat(messages); // Fallback to mock on error
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
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Symptoms: ${symptoms}` }
          ],
          response_format: { type: "json_object" },
          temperature: 0.2,
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      const parsed = JSON.parse(data.choices[0].message.content);
      return parsed as DiseaseDiagnosis;
    } catch (error) {
      console.error("OpenAI analyzeDisease error:", error);
      return this.mockAnalyzeDisease(symptoms, type); // Fallback to mock
    }
  }

  public async analyzeDiseaseImage(imageUrl: string, type: "crop" | "livestock"): Promise<DiseaseDiagnosis> {
    if (this.isMockMode()) {
      return this.mockAnalyzeDiseaseImage(imageUrl, type);
    }

    // Phase 2: Real OpenAI Vision (GPT-4o) implementation
    const systemPrompt = `You are an expert agricultural AI with computer vision capabilities. Analyze the provided ${type === "crop" ? "crop/plant" : "livestock/animal"} image and identify any visible diseases, infections, or health problems. Return a JSON object exactly matching this schema:
{
  "likelyDisease": "string - the most likely disease or health issue",
  "confidence": "low" | "medium" | "high",
  "recommendations": ["string", "treatment step 1", "treatment step 2"],
  "isolationRequired": boolean
}`;

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: [
                { type: "text", text: `Please analyze this ${type} image for diseases:` },
                { type: "image_url", image_url: { url: imageUrl, detail: "high" } }
              ]
            }
          ],
          response_format: { type: "json_object" },
          temperature: 0.2,
          max_tokens: 1024,
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI Vision API error: ${response.statusText}`);
      }

      const data = await response.json();
      return JSON.parse(data.choices[0].message.content) as DiseaseDiagnosis;
    } catch (error) {
      console.error("OpenAI analyzeDiseaseImage error:", error);
      return this.mockAnalyzeDiseaseImage(imageUrl, type); // Fallback to mock
    }
  }

  // --- Mock Implementations for MVP when no API key is provided ---

  private mockChat(messages: Message[]): ChatResponse {
    const lastMessage = messages[messages.length - 1].content.toLowerCase();
    
    if (lastMessage.includes("weather")) {
      return { message: "Based on the current weather forecast, it looks like a good day for farm activities. Just be aware of any alerts provided in your dashboard." };
    }
    
    if (lastMessage.includes("module") || lastMessage.includes("enabled")) {
      return { message: "I can see the modules you have enabled for this farm. Use the navigation sidebar to access your active features." };
    }
    
    return {
      message: "Hello! I am Kili AI (running in simulated MVP mode because no OpenAI key was provided). I can help you with weather insights, farm recommendations, and disease analysis. How can I assist you today?"
    };
  }

  private mockAnalyzeDisease(symptoms: string, type: "crop" | "livestock"): DiseaseDiagnosis {
    const symLower = symptoms.toLowerCase();
    
    if (type === "crop") {
      if (symLower.includes("spot") || symLower.includes("yellow")) {
        return {
          likelyDisease: "Leaf Spot / Blight",
          confidence: "medium",
          recommendations: ["Apply appropriate fungicide", "Ensure good plant spacing for airflow", "Avoid overhead watering"],
          isolationRequired: false
        };
      }
      return {
        likelyDisease: "General Nutrient Deficiency or Pest",
        confidence: "low",
        recommendations: ["Conduct a soil test", "Check closely for insects under leaves", "Apply balanced NPK fertilizer"],
        isolationRequired: false
      };
    } else {
      if (symLower.includes("cough") || symLower.includes("breathe")) {
        return {
          likelyDisease: "Respiratory Infection (e.g. Pneumonia)",
          confidence: "high",
          recommendations: ["Isolate the animal immediately", "Consult a vet for antibiotics", "Ensure housing is well-ventilated"],
          isolationRequired: true
        };
      }
      return {
        likelyDisease: "General Ailment / Fatigue",
        confidence: "low",
        recommendations: ["Monitor temperature", "Ensure access to clean water and high-quality feed", "Consult a vet if symptoms persist for 24 hours"],
        isolationRequired: true
      };
    }
  }

  private mockAnalyzeDiseaseImage(imageUrl: string, type: "crop" | "livestock"): DiseaseDiagnosis {
    // Phase 1: Mock AI Provider — deterministic results based on type
    // In Phase 2, replace this with a real vision API call (OpenAI Vision, Gemini, etc.)
    const CROP_DISEASES = [
      { likelyDisease: "Late Blight (Phytophthora infestans)", confidence: "high" as const, recommendations: ["Apply copper-based fungicide immediately", "Remove and destroy infected plant parts", "Improve field drainage", "Avoid overhead irrigation"], isolationRequired: false },
      { likelyDisease: "Powdery Mildew", confidence: "medium" as const, recommendations: ["Apply sulfur-based fungicide", "Ensure adequate plant spacing for airflow", "Avoid over-fertilising with nitrogen"], isolationRequired: false },
      { likelyDisease: "Leaf Rust (Puccinia spp.)", confidence: "high" as const, recommendations: ["Apply triazole fungicide", "Plant rust-resistant varieties in next season", "Scout regularly for early detection"], isolationRequired: false },
      { likelyDisease: "Bacterial Leaf Blight", confidence: "medium" as const, recommendations: ["Remove infected plants", "Apply copper bactericide", "Use certified disease-free seeds next season"], isolationRequired: false },
      { likelyDisease: "Fusarium Wilt", confidence: "medium" as const, recommendations: ["Remove and destroy infected plants", "Solarise soil before replanting", "Practice crop rotation"], isolationRequired: false },
    ];

    const LIVESTOCK_DISEASES = [
      { likelyDisease: "Foot-and-Mouth Disease (FMD)", confidence: "high" as const, recommendations: ["Isolate all affected animals immediately", "Report to the nearest veterinary office", "Disinfect housing and equipment", "Vaccinate all unaffected animals"], isolationRequired: true },
      { likelyDisease: "East Coast Fever (ECF)", confidence: "high" as const, recommendations: ["Administer oxytetracycline as prescribed by vet", "Apply tick control acaricides to all animals", "Isolate sick animals"], isolationRequired: true },
      { likelyDisease: "Lumpy Skin Disease", confidence: "medium" as const, recommendations: ["Vaccinate unaffected animals immediately", "Isolate infected animals", "Control insects that spread the virus"], isolationRequired: true },
      { likelyDisease: "Newcastle Disease (Poultry)", confidence: "high" as const, recommendations: ["Cull severely affected birds", "Vaccinate remaining flock", "Disinfect all housing and equipment", "Report to veterinary authorities"], isolationRequired: true },
      { likelyDisease: "Mastitis (Cattle)", confidence: "medium" as const, recommendations: ["Consult a vet for appropriate antibiotic", "Use clean milking equipment", "Dry-cow therapy at end of lactation"], isolationRequired: false },
    ];

    const pool = type === "crop" ? CROP_DISEASES : LIVESTOCK_DISEASES;
    // Use URL hash to keep results consistent per image
    const index = Math.abs(imageUrl.split("").reduce((a, c) => a + c.charCodeAt(0), 0)) % pool.length;
    return pool[index];
  }



  public async getDashboardRecommendations(context: string): Promise<DashboardRecommendations> {
    if (this.isMockMode()) {
      return {
        summary: "Your farm operations are running smoothly, but there are a few pending tasks that need attention.",
        priority: "medium",
        recommendations: [
          "Check low stock inventory items",
          "Review upcoming harvest schedule",
          "Ensure all active crops have received adequate watering"
        ],
        suggestedActions: [
          { label: "View Tasks", action: "/tasks" },
          { label: "Check Inventory", action: "/inventory/items" }
        ],
        relatedModules: ["tasks", "inventory"],
        confidence: 0.85,
        generatedAt: new Date().toISOString()
      };
    }

    const systemPrompt = `You are the lead agricultural intelligence AI for KiliSense. Based on the provided farm context, generate a dashboard summary and recommendations. Return a JSON object exactly matching this schema:
{
  "summary": "A 2-3 sentence overview of the farm's current state",
  "priority": "low" | "medium" | "high" | "critical",
  "recommendations": ["string", "string"],
  "suggestedActions": [{"label": "Short Action Name", "action": "/relative/path"}],
  "relatedModules": ["string"],
  "confidence": 0.9,
  "generatedAt": "ISO date string"
}
Ensure the actions point to relevant KiliSense paths (e.g. /crops/incidents, /livestock/health, /inventory/items, /finance/report, /tasks).`;

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Context:\n${context}` }
          ],
          response_format: { type: "json_object" },
          temperature: 0.3,
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      return JSON.parse(data.choices[0].message.content) as DashboardRecommendations;
    } catch (error) {
      console.error("OpenAI getDashboardRecommendations error:", error);
      return {
        summary: "Unable to generate live insights at this moment.",
        priority: "low",
        recommendations: ["Please check back later or review your modules directly."],
        suggestedActions: [],
        relatedModules: [],
        confidence: 0,
        generatedAt: new Date().toISOString()
      };
    }
  }
}

