import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useFarm } from "@/contexts/FarmContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Brain, MessageSquare, X, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

export function KiliAI() {
  const { currentFarm } = useFarm();
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const chatMutation = trpc.intelligence.chat.useMutation({
    onSuccess: (data) => {
      setMessages((prev) => [...prev, { role: "assistant", content: data.message }]);
    },
    onError: (error) => {
      setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, I encountered an error: " + error.message }]);
    }
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  if (!currentFarm || location === "/kili-ai") return null;

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = { role: "user", content: inputValue };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputValue("");

    chatMutation.mutate({
      farmId: currentFarm.farm.id,
      message: userMessage.content,
      history: messages.map(m => ({ role: m.role, content: m.content })),
    });
  };

  return (
    <>
      {/* Floating Action Button */}
      <Button
        className={cn(
          "fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 transition-transform hover:scale-105",
          isOpen && "scale-0 opacity-0 pointer-events-none"
        )}
        onClick={() => setIsOpen(true)}
      >
        <Brain className="w-6 h-6" />
      </Button>

      {/* Chat Window */}
      <div
        className={cn(
          "fixed bottom-6 right-6 w-[350px] sm:w-[400px] h-[500px] max-h-[80vh] bg-background border shadow-xl rounded-2xl flex flex-col z-50 transition-all duration-300 origin-bottom-right",
          isOpen ? "scale-100 opacity-100" : "scale-50 opacity-0 pointer-events-none"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-primary/5 rounded-t-2xl">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Kili AI</h3>
              <p className="text-xs text-muted-foreground">Farm Assistant</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsOpen(false)}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground mt-10">
              <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Hi! I'm Kili, your AI farm assistant.</p>
              <p className="text-xs mt-1">Ask me about weather, module recommendations, or farming advice.</p>
            </div>
          )}
          
          {messages.map((msg, idx) => (
            <div key={idx} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-tr-sm"
                    : "bg-muted text-foreground rounded-tl-sm"
                )}
              >
                {msg.content}
              </div>
            </div>
          ))}
          
          {chatMutation.isPending && (
            <div className="flex justify-start">
              <div className="bg-muted text-foreground rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm">
                <span className="animate-pulse">Thinking...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-3 border-t bg-background rounded-b-2xl">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask Kili..."
              className="rounded-full"
              disabled={chatMutation.isPending}
            />
            <Button
              type="submit"
              size="icon"
              className="rounded-full shrink-0"
              disabled={!inputValue.trim() || chatMutation.isPending}
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>
    </>
  );
}
