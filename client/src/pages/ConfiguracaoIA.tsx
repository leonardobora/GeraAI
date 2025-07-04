import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Header from "@/components/Header";

interface RateLimitInfo {
  remainingRequests: number;
  maxRequests: number;
  resetTime: string;
}

export default function ConfiguracaoIA() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [aiProvider, setAiProvider] = useState("perplexity");
  const [apiKeys, setApiKeys] = useState({
    perplexityApiKey: "",
    openaiApiKey: "",
    geminiApiKey: "",
  });
  const [rateLimitInfo, setRateLimitInfo] = useState<RateLimitInfo | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setAiProvider((user as any).aiProvider || "perplexity");
      setApiKeys({
        perplexityApiKey: (user as any).perplexityApiKey || "",
        openaiApiKey: (user as any).openaiApiKey || "",
        geminiApiKey: (user as any).geminiApiKey || "",
      });
    }
    
    fetchRateLimitInfo();
  }, [user]);

  const fetchRateLimitInfo = async () => {
    try {
      const response = await fetch("/api/user/rate-limit");
      const data = await response.json();
      setRateLimitInfo(data);
    } catch (error) {
      console.error("Erro ao buscar informações de rate limit:", error);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/user/ai-settings", {
        method: "PUT",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          aiProvider,
          apiKeys: {
            perplexityApiKey: apiKeys.perplexityApiKey || undefined,
            openaiApiKey: apiKeys.openaiApiKey || undefined,
            geminiApiKey: apiKeys.geminiApiKey || undefined,
          },
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Erro ao salvar configurações');
      }

      toast({
        title: "Configurações salvas",
        description: "Suas configurações de IA foram atualizadas com sucesso!",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível salvar as configurações. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const providerInfo = {
    perplexity: {
      name: "Perplexity AI",
      description: "Recomendações baseadas em busca em tempo real",
      keyLabel: "Chave API Perplexity",
      keyPlaceholder: "pplx-...",
    },
    openai: {
      name: "OpenAI GPT-4",
      description: "Recomendações criativas e precisas",
      keyLabel: "Chave API OpenAI",
      keyPlaceholder: "sk-...",
    },
    gemini: {
      name: "Google Gemini",
      description: "IA multimodal do Google",
      keyLabel: "Chave API Gemini",
      keyPlaceholder: "AIza...",
    },
  };

  return (
    <div className="min-h-screen bg-spotify-dark">
      <Header />
      
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Configuração de IA
          </h1>
          <p className="text-spotify-text">
            Configure seu provedor de IA preferido e gerencie suas chaves API
          </p>
        </div>

        <div className="grid gap-6">
          {/* Rate Limit Info */}
          <Card className="bg-spotify-surface border-spotify-card">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <i className="fas fa-tachometer-alt text-spotify-green"></i>
                Limite de Requisições
              </CardTitle>
              <CardDescription className="text-spotify-text">
                Informações sobre seu uso atual da API
              </CardDescription>
            </CardHeader>
            <CardContent>
              {rateLimitInfo && (
                <div className="flex items-center gap-4">
                  <Badge variant={rateLimitInfo.remainingRequests > 5 ? "default" : "destructive"}>
                    {rateLimitInfo.remainingRequests} de {rateLimitInfo.maxRequests} restantes
                  </Badge>
                  <span className="text-sm text-spotify-text">
                    Resetado a cada hora
                  </span>
                </div>
              )}
              <p className="text-sm text-spotify-text mt-2">
                Configure sua própria chave API para contornar os limites da aplicação
              </p>
            </CardContent>
          </Card>

          {/* Provider Selection */}
          <Card className="bg-spotify-surface border-spotify-card">
            <CardHeader>
              <CardTitle className="text-white">Provedor de IA</CardTitle>
              <CardDescription className="text-spotify-text">
                Escolha qual IA usar para gerar suas playlists
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={aiProvider}
                onValueChange={setAiProvider}
                className="grid gap-4"
              >
                {Object.entries(providerInfo).map(([key, info]) => (
                  <div key={key} className="flex items-center space-x-3 p-4 border border-spotify-card rounded-lg">
                    <RadioGroupItem value={key} id={key} />
                    <div className="flex-1">
                      <Label htmlFor={key} className="text-white font-medium cursor-pointer">
                        {info.name}
                      </Label>
                      <p className="text-sm text-spotify-text">{info.description}</p>
                    </div>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>

          {/* API Keys Configuration */}
          <Card className="bg-spotify-surface border-spotify-card">
            <CardHeader>
              <CardTitle className="text-white">Chaves API (Opcional)</CardTitle>
              <CardDescription className="text-spotify-text">
                Configure suas próprias chaves API para maior limite de uso
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(providerInfo).map(([key, info]) => (
                <div key={key} className="space-y-2">
                  <Label htmlFor={`${key}Key`} className="text-white">
                    {info.keyLabel}
                  </Label>
                  <Input
                    id={`${key}Key`}
                    type="password"
                    placeholder={info.keyPlaceholder}
                    value={apiKeys[`${key}ApiKey` as keyof typeof apiKeys]}
                    onChange={(e) =>
                      setApiKeys(prev => ({
                        ...prev,
                        [`${key}ApiKey`]: e.target.value,
                      }))
                    }
                    className="bg-spotify-card border-spotify-card text-white"
                  />
                  <p className="text-xs text-spotify-text">
                    {key === "perplexity" && "Obtenha em: https://www.perplexity.ai/settings/api"}
                    {key === "openai" && "Obtenha em: https://platform.openai.com/api-keys"}
                    {key === "gemini" && "Obtenha em: https://aistudio.google.com/app/apikey"}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-spotify-green hover:bg-spotify-green-light text-spotify-dark font-semibold w-full py-3"
          >
            {isSaving ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                Salvando...
              </>
            ) : (
              <>
                <i className="fas fa-save mr-2"></i>
                Salvar Configurações
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}