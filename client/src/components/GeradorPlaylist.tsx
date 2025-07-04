import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { usePlaylist } from "@/hooks/usePlaylist";
import { useSpotify } from "@/hooks/useSpotify";

const formSchema = z.object({
  prompt: z.string().min(1, "Descreva sua playlist ideal"),
  tamanho: z.enum(["curta", "media", "longa"]),
  nivelDescoberta: z.enum(["seguro", "aventureiro"]),
  conteudoExplicito: z.boolean().default(false),
});

type FormData = z.infer<typeof formSchema>;

const exemplosPrompts = [
  "música eletrônica para treinar na academia",
  "samba e MPB para churrasco de domingo",
  "lofi e jazz para estudar e trabalhar",
  "rock nacional dos anos 80 e 90",
  "sertanejo universitário para festa",
  "bossa nova e jazz brasileiro",
];

export default function GeradorPlaylist() {
  const [showProgress, setShowProgress] = useState(false);
  const { generatePlaylist, isGenerating } = usePlaylist();
  const { isConnected } = useSpotify();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: "",
      tamanho: "media",
      nivelDescoberta: "seguro",
      conteudoExplicito: false,
    },
  });

  const onSubmit = async (data: FormData) => {
    if (!isConnected) {
      alert("Configure sua conta Spotify primeiro");
      return;
    }

    setShowProgress(true);
    try {
      await generatePlaylist(data);
    } finally {
      setShowProgress(false);
    }
  };

  const handleSurpriseMe = () => {
    const randomPrompt = exemplosPrompts[Math.floor(Math.random() * exemplosPrompts.length)];
    form.setValue("prompt", randomPrompt);
  };

  const handleExampleClick = (prompt: string) => {
    form.setValue("prompt", prompt);
  };

  return (
    <>
      <Card className="bg-spotify-card border-spotify-card shadow-2xl">
        <CardContent className="p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Prompt Input */}
              <FormField
                control={form.control}
                name="prompt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-spotify-text">
                      Descreva sua playlist ideal
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Ex: músicas eletrônicas para treinar na academia, samba e MPB para churrasco de domingo, indie rock nacional para trabalhar..."
                        className="bg-spotify-surface border-spotify-card text-white placeholder-spotify-text focus:border-spotify-green focus:ring-2 focus:ring-spotify-green/20 resize-none"
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Configuration Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="tamanho"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-spotify-text">
                        Tamanho da Playlist
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-spotify-surface border-spotify-card text-white focus:border-spotify-green focus:ring-2 focus:ring-spotify-green/20">
                            <SelectValue placeholder="Selecione o tamanho" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-spotify-surface border-spotify-card">
                          <SelectItem value="curta">Curta (15 faixas)</SelectItem>
                          <SelectItem value="media">Média (25 faixas)</SelectItem>
                          <SelectItem value="longa">Longa (40 faixas)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="nivelDescoberta"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-spotify-text">
                        Nível de Descoberta
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-spotify-surface border-spotify-card text-white focus:border-spotify-green focus:ring-2 focus:ring-spotify-green/20">
                            <SelectValue placeholder="Selecione o nível" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-spotify-surface border-spotify-card">
                          <SelectItem value="seguro">Seguro (hits conhecidos)</SelectItem>
                          <SelectItem value="aventureiro">Aventureiro (indie/alternativo)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Additional Options */}
              <FormField
                control={form.control}
                name="conteudoExplicito"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="data-[state=checked]:bg-spotify-green data-[state=checked]:border-spotify-green"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-spotify-text cursor-pointer">
                        Incluir conteúdo explícito
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  type="submit"
                  disabled={isGenerating || !isConnected}
                  className="flex-1 bg-spotify-green hover:bg-spotify-green-light text-spotify-dark font-semibold py-4 px-6 transition-all duration-200 transform hover:scale-105 focus:ring-4 focus:ring-spotify-green/30"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-spotify-dark border-t-transparent rounded-full mr-2"></div>
                      Gerando...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-magic mr-2"></i>
                      Gerar Playlist
                    </>
                  )}
                </Button>
                
                <Button
                  type="button"
                  onClick={handleSurpriseMe}
                  disabled={isGenerating}
                  className="flex-1 bg-spotify-surface hover:bg-spotify-card text-white font-semibold py-4 px-6 border border-spotify-card transition-all duration-200"
                >
                  <i className="fas fa-random mr-2"></i>
                  Me Surpreenda!
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Quick Examples */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4 text-center text-white">
          Exemplos Populares
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <button
            onClick={() => handleExampleClick("música eletrônica para treinar na academia")}
            className="bg-spotify-card hover:bg-spotify-surface border border-spotify-card rounded-xl p-4 text-left transition-all duration-200 hover:border-spotify-green"
          >
            <div className="flex items-center space-x-3">
              <i className="fas fa-dumbbell text-spotify-green text-xl"></i>
              <div>
                <p className="font-medium text-white">Treino na Academia</p>
                <p className="text-sm text-spotify-text">Eletrônica energética</p>
              </div>
            </div>
          </button>
          
          <button
            onClick={() => handleExampleClick("samba e MPB para churrasco de domingo")}
            className="bg-spotify-card hover:bg-spotify-surface border border-spotify-card rounded-xl p-4 text-left transition-all duration-200 hover:border-spotify-green"
          >
            <div className="flex items-center space-x-3">
              <i className="fas fa-fire text-spotify-green text-xl"></i>
              <div>
                <p className="font-medium text-white">Churrasco de Domingo</p>
                <p className="text-sm text-spotify-text">Samba e MPB</p>
              </div>
            </div>
          </button>
          
          <button
            onClick={() => handleExampleClick("lofi e jazz para estudar e trabalhar")}
            className="bg-spotify-card hover:bg-spotify-surface border border-spotify-card rounded-xl p-4 text-left transition-all duration-200 hover:border-spotify-green"
          >
            <div className="flex items-center space-x-3">
              <i className="fas fa-laptop-code text-spotify-green text-xl"></i>
              <div>
                <p className="font-medium text-white">Foco no Trabalho</p>
                <p className="text-sm text-spotify-text">Lofi e jazz</p>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Generation Progress */}
      {showProgress && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="bg-spotify-card border-spotify-card max-w-md mx-4">
            <CardContent className="p-8 text-center">
              <div className="animate-spin w-16 h-16 border-4 border-spotify-card border-t-spotify-green rounded-full mx-auto mb-6"></div>
              <h3 className="text-2xl font-bold mb-4 text-white">Criando sua playlist...</h3>
              <p className="text-spotify-text mb-6">
                Nossa IA está analisando seu pedido e selecionando as melhores músicas
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <i className="fas fa-check text-spotify-green"></i>
                  <span className="text-sm text-spotify-text">Processando descrição com IA</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="animate-spin w-4 h-4 border-2 border-spotify-card border-t-spotify-green rounded-full"></div>
                  <span className="text-sm text-spotify-text">Buscando músicas no Spotify</span>
                </div>
                <div className="flex items-center space-x-3 text-spotify-text">
                  <i className="fas fa-circle text-xs"></i>
                  <span className="text-sm">Criando playlist na sua conta</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
