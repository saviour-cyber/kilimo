import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useFarm } from "@/contexts/FarmContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Brain, AlertTriangle, CheckCircle, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function DiseaseDetector({ type }: { type: "crop" | "livestock" }) {
  const { currentFarm } = useFarm();
  const [symptoms, setSymptoms] = useState("");
  const [diagnosis, setDiagnosis] = useState<any>(null);

  const analyzeMutation = trpc.intelligence.analyzeDisease.useMutation({
    onSuccess: (data) => {
      setDiagnosis(data);
    },
  });

  const handleAnalyze = () => {
    if (!symptoms.trim() || !currentFarm) return;
    setDiagnosis(null);
    analyzeMutation.mutate({
      farmId: currentFarm.farm.id,
      symptoms,
      type,
    });
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-background to-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          Kili AI Disease Detection
        </CardTitle>
        <CardDescription>
          Describe the symptoms you are observing in your {type === "crop" ? "plants" : "animals"}.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder="e.g. Yellowing leaves with brown spots..."
          value={symptoms}
          onChange={(e) => setSymptoms(e.target.value)}
          rows={3}
          disabled={analyzeMutation.isPending}
        />
        <Button 
          onClick={handleAnalyze} 
          disabled={!symptoms.trim() || analyzeMutation.isPending}
          className="w-full"
        >
          {analyzeMutation.isPending ? "Analyzing..." : "Analyze Symptoms"}
        </Button>

        {diagnosis && (
          <div className="mt-4 p-4 bg-background rounded-lg border space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-lg">{diagnosis.likelyDisease}</h4>
                <Badge variant={
                  diagnosis.confidence === "high" ? "default" :
                  diagnosis.confidence === "medium" ? "secondary" : "outline"
                }>
                  {diagnosis.confidence} confidence
                </Badge>
              </div>
              
              {diagnosis.isolationRequired && (
                <div className="flex items-start gap-2 p-2 bg-destructive/10 text-destructive rounded-md text-sm mb-3">
                  <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>Immediate isolation or quarantine is recommended to prevent spreading.</span>
                </div>
              )}
            </div>

            <div>
              <h5 className="text-sm font-medium text-muted-foreground mb-2">Recommended Actions:</h5>
              <ul className="space-y-2">
                {diagnosis.recommendations.map((rec: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
