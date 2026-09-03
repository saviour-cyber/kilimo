import { useFarm } from "@/contexts/FarmContext";
import { trpc } from "@/lib/trpc";
import { AIChatBox, type Message } from "@/components/AIChatBox";
import { Sparkles, Brain, CloudRain, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";

export default function KiliAIPage() {
  const { currentFarm } = useFarm();
  const farmId = currentFarm?.farm.id ?? 0;

  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hi! I'm Kili, your AI farm assistant. How can I help you optimize your farm today?" }
  ]);

  const { data: insights } = trpc.intelligence.getRecommendations.useQuery(
    { farmId },
    { enabled: !!farmId }
  );

  const chatMutation = trpc.intelligence.chat.useMutation({
    onSuccess: (data) => {
      setMessages((prev) => [...prev, { role: "assistant", content: data.message }]);
    },
    onError: (error) => {
      setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, I encountered an error: " + error.message }]);
    }
  });

  if (!currentFarm) return null;

  const handleSendMessage = (content: string) => {
    const userMessage: Message = { role: "user", content };
    setMessages((prev) => [...prev, userMessage]);
    chatMutation.mutate({
      farmId,
      message: content,
      history: messages.map(m => ({ role: m.role, content: m.content })),
    });
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="max-w-[1600px] mx-auto w-full px-4 pt-4 sm:px-6 sm:pt-6">
        <PageHeader 
          title="Kili AI" 
          description="Your intelligent agricultural assistant"
          icon={Brain}
          iconColor="text-primary"
          iconBg="bg-primary/10"
        />
      </div>

      <div className="flex-1 overflow-hidden p-4 sm:p-6 max-w-[1600px] mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
          
          {/* Main Chat Interface */}
          <div className="lg:col-span-2 h-full">
            <AIChatBox
              messages={messages}
              onSendMessage={handleSendMessage}
              isLoading={chatMutation.isPending}
              className="h-full border-border"
              height="100%"
              suggestedPrompts={[
                "Analyze my recent crop harvests",
                "Are there any weather risks this week?",
                "Suggest a feeding schedule for my cattle",
              ]}
            />
          </div>

          {/* Active Insights Panel */}
          <div className="lg:col-span-1 h-full overflow-y-auto">
            <Card className="border shadow-sm bg-white h-full">
              <div className="p-4 border-b bg-muted/50 flex items-center gap-2">
                <Brain className="w-4 h-4 text-muted-foreground" />
                <h3 className="font-bold text-sm text-foreground">Active Insights</h3>
              </div>
              <CardContent className="p-4 space-y-4">
                <p className="text-sm text-muted-foreground mb-6">
                  {insights?.summary ?? "Kili AI is analyzing your farm data to generate insights."}
                </p>

                <div className="space-y-3">
                  {(insights?.recommendations ?? []).length === 0 ? (
                    <div className="text-center p-6 bg-muted rounded-lg border border-dashed text-sm text-muted-foreground">
                      No specific recommendations available right now. Ask Kili AI for general advice!
                    </div>
                  ) : (
                    insights?.recommendations.map((rec, i) => (
                      <div key={i} className="p-3 bg-muted/50 border rounded-lg hover:border-green-200 transition-colors cursor-pointer group">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 bg-white p-1.5 rounded-md border shrink-0">
                            {i % 2 === 0 ? <CloudRain className="w-3.5 h-3.5 text-blue-500" /> : <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />}
                          </div>
                          <p className="text-[13px] font-medium text-muted-foreground leading-snug group-hover:text-foreground">
                            {rec}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
