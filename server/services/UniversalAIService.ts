interface AIProvider {
  generateRecommendations(prompt: string, options: GenerationOptions): Promise<string[]>;
}

interface GenerationOptions {
  tamanho: "curta" | "media" | "longa";
  nivelDescoberta: "seguro" | "aventureiro";
  conteudoExplicito: boolean;
}

class PerplexityProvider implements AIProvider {
  constructor(private apiKey: string) {}

  async generateRecommendations(prompt: string, options: GenerationOptions): Promise<string[]> {
    const numberOfTracks = this.getNumberOfTracks(options.tamanho);
    const discoveryPrompt = this.getDiscoveryPrompt(options.nivelDescoberta);
    const explicitContent = options.conteudoExplicito ? "" : "Evite músicas com conteúdo explícito.";

    const systemPrompt = `Você é um especialista em música brasileira e internacional. 
Gere recomendações de músicas específicas com nome da música e artista.
${discoveryPrompt}
${explicitContent}
Responda apenas com uma lista numerada de ${numberOfTracks} músicas no formato: "Nome da Música - Artista"`;

    const userPrompt = `Crie uma playlist com ${numberOfTracks} músicas baseada em: ${prompt}`;

    try {
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-small-128k-online',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          max_tokens: 1000,
          temperature: 0.7,
          top_p: 0.9,
          stream: false,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Erro na API Perplexity: ${response.status} - ${errorText}`);
        throw new Error(`Erro na API Perplexity: ${response.status}`);
      }

      const data = await response.json();
      console.log("Resposta da API Perplexity:", JSON.stringify(data, null, 2));
      
      const content = data.choices[0]?.message?.content || "";
      console.log("Conteúdo extraído:", content);
      
      const recommendations = this.parseRecommendations(content);
      console.log("Recomendações parseadas:", recommendations);
      
      return recommendations;
    } catch (error) {
      console.error("Erro detalhado ao gerar recomendações:", error);
      
      if (error instanceof Error) {
        if (error.message.includes('rate limit')) {
          throw new Error("Limite de requisições excedido. Tente novamente em alguns minutos.");
        }
        if (error.message.includes('401')) {
          throw new Error("Chave de API inválida. Verifique a configuração do Perplexity.");
        }
        if (error.message.includes('429')) {
          throw new Error("Serviço de IA temporariamente indisponível. Tente novamente.");
        }
        if (error.message.includes('network')) {
          throw new Error("Erro de conexão. Verifique sua internet e tente novamente.");
        }
      }
      
      throw new Error("Erro ao gerar recomendações com IA. Tente novamente.");
    }
  }

  private getNumberOfTracks(tamanho: string): number {
    switch (tamanho) {
      case "curta": return 10;
      case "media": return 20;
      case "longa": return 30;
      default: return 15;
    }
  }

  private getDiscoveryPrompt(nivelDescoberta: string): string {
    switch (nivelDescoberta) {
      case "seguro":
        return "Foque em músicas populares e conhecidas que a maioria das pessoas reconheceria.";
      case "aventureiro":
        return "Inclua algumas músicas menos conhecidas, artistas independentes ou faixas mais experimentais para descoberta musical.";
      default:
        return "Balance entre músicas conhecidas e algumas descobertas interessantes.";
    }
  }

  private parseRecommendations(content: string): string[] {
    const lines = content.split('\n').filter(line => line.trim());
    const recommendations: string[] = [];

    for (const line of lines) {
      const match = line.match(/^\d+\.?\s*(.+)/);
      if (match) {
        const song = match[1].trim();
        if (song.includes(' - ') || song.includes(' by ')) {
          recommendations.push(song);
        }
      }
    }

    return recommendations.slice(0, 30);
  }
}

class OpenAIProvider implements AIProvider {
  constructor(private apiKey: string) {}

  async generateRecommendations(prompt: string, options: GenerationOptions): Promise<string[]> {
    const numberOfTracks = this.getNumberOfTracks(options.tamanho);
    const discoveryPrompt = this.getDiscoveryPrompt(options.nivelDescoberta);
    const explicitContent = options.conteudoExplicito ? "" : "Avoid explicit content songs.";

    const systemPrompt = `You are a music expert. Generate specific song recommendations with artist names.
${discoveryPrompt}
${explicitContent}
Respond only with a numbered list of ${numberOfTracks} songs in format: "Song Name - Artist"`;

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Create a playlist with ${numberOfTracks} songs based on: ${prompt}` },
          ],
          max_tokens: 1000,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`Erro na API OpenAI: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content || "";
      return this.parseRecommendations(content);
    } catch (error) {
      throw new Error("Erro ao gerar recomendações com OpenAI");
    }
  }

  private getNumberOfTracks(tamanho: string): number {
    switch (tamanho) {
      case "curta": return 10;
      case "media": return 20;
      case "longa": return 30;
      default: return 15;
    }
  }

  private getDiscoveryPrompt(nivelDescoberta: string): string {
    switch (nivelDescoberta) {
      case "seguro":
        return "Focus on popular and well-known songs that most people would recognize.";
      case "aventureiro":
        return "Include some lesser-known songs, independent artists, or more experimental tracks for musical discovery.";
      default:
        return "Balance between known songs and some interesting discoveries.";
    }
  }

  private parseRecommendations(content: string): string[] {
    const lines = content.split('\n').filter(line => line.trim());
    const recommendations: string[] = [];

    for (const line of lines) {
      const match = line.match(/^\d+\.?\s*(.+)/);
      if (match) {
        const song = match[1].trim();
        if (song.includes(' - ') || song.includes(' by ')) {
          recommendations.push(song);
        }
      }
    }

    return recommendations.slice(0, 30);
  }
}

class GeminiProvider implements AIProvider {
  constructor(private apiKey: string) {}

  async generateRecommendations(prompt: string, options: GenerationOptions): Promise<string[]> {
    const numberOfTracks = this.getNumberOfTracks(options.tamanho);
    const discoveryPrompt = this.getDiscoveryPrompt(options.nivelDescoberta);
    const explicitContent = options.conteudoExplicito ? "" : "Evite músicas com conteúdo explícito.";

    const systemPrompt = `Você é um especialista em música. Gere recomendações específicas com nome da música e artista.
${discoveryPrompt}
${explicitContent}
Responda apenas com uma lista numerada de ${numberOfTracks} músicas no formato: "Nome da Música - Artista"`;

    try {
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': this.apiKey,
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `${systemPrompt}\n\nCrie uma playlist com ${numberOfTracks} músicas baseada em: ${prompt}`
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000,
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`Erro na API Gemini: ${response.status}`);
      }

      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      return this.parseRecommendations(content);
    } catch (error) {
      throw new Error("Erro ao gerar recomendações com Gemini");
    }
  }

  private getNumberOfTracks(tamanho: string): number {
    switch (tamanho) {
      case "curta": return 10;
      case "media": return 20;
      case "longa": return 30;
      default: return 15;
    }
  }

  private getDiscoveryPrompt(nivelDescoberta: string): string {
    switch (nivelDescoberta) {
      case "seguro":
        return "Foque em músicas populares e conhecidas que a maioria das pessoas reconheceria.";
      case "aventureiro":
        return "Inclua algumas músicas menos conhecidas, artistas independentes ou faixas mais experimentais para descoberta musical.";
      default:
        return "Balance entre músicas conhecidas e algumas descobertas interessantes.";
    }
  }

  private parseRecommendations(content: string): string[] {
    const lines = content.split('\n').filter(line => line.trim());
    const recommendations: string[] = [];

    for (const line of lines) {
      const match = line.match(/^\d+\.?\s*(.+)/);
      if (match) {
        const song = match[1].trim();
        if (song.includes(' - ') || song.includes(' by ')) {
          recommendations.push(song);
        }
      }
    }

    return recommendations.slice(0, 30);
  }
}

export class UniversalAIService {
  private rateLimitMap = new Map<string, { count: number; lastReset: number }>();
  private readonly RATE_LIMIT_PER_HOUR = 10; // Default rate limit

  async generateMusicRecommendations(
    userId: string,
    prompt: string,
    tamanho: "curta" | "media" | "longa",
    nivelDescoberta: "seguro" | "aventureiro",
    conteudoExplicito: boolean,
    userSettings?: { aiProvider?: string; perplexityApiKey?: string; openaiApiKey?: string; geminiApiKey?: string }
  ): Promise<string[]> {
    // Check rate limit
    if (!this.checkRateLimit(userId)) {
      throw new Error("Limite de requisições por hora excedido. Tente novamente mais tarde ou configure sua própria chave API.");
    }

    const options: GenerationOptions = { tamanho, nivelDescoberta, conteudoExplicito };
    const provider = this.getProvider(userSettings);

    try {
      const recommendations = await provider.generateRecommendations(prompt, options);
      
      if (recommendations.length === 0) {
        throw new Error("Nenhuma recomendação foi gerada pela IA");
      }

      // Update rate limit
      this.updateRateLimit(userId);
      
      return recommendations;
    } catch (error) {
      console.error("Erro ao gerar recomendações:", error);
      throw error;
    }
  }

  private getProvider(userSettings?: any): AIProvider {
    const provider = userSettings?.aiProvider || 'perplexity';
    
    switch (provider) {
      case 'openai':
        const openaiKey = userSettings?.openaiApiKey || process.env.OPENAI_API_KEY;
        if (!openaiKey) throw new Error("Chave da OpenAI não configurada");
        return new OpenAIProvider(openaiKey);
        
      case 'gemini':
        const geminiKey = userSettings?.geminiApiKey || process.env.GEMINI_API_KEY;
        if (!geminiKey) throw new Error("Chave do Gemini não configurada");
        return new GeminiProvider(geminiKey);
        
      case 'perplexity':
      default:
        const perplexityKey = userSettings?.perplexityApiKey || process.env.PERPLEXITY_API_KEY;
        if (!perplexityKey) throw new Error("Chave da Perplexity não configurada");
        return new PerplexityProvider(perplexityKey);
    }
  }

  private checkRateLimit(userId: string): boolean {
    const now = Date.now();
    const userLimit = this.rateLimitMap.get(userId);

    if (!userLimit) {
      return true; // First request
    }

    // Reset counter if an hour has passed
    if (now - userLimit.lastReset > 3600000) { // 1 hour in ms
      this.rateLimitMap.set(userId, { count: 0, lastReset: now });
      return true;
    }

    return userLimit.count < this.RATE_LIMIT_PER_HOUR;
  }

  private updateRateLimit(userId: string): void {
    const now = Date.now();
    const userLimit = this.rateLimitMap.get(userId);

    if (!userLimit || now - userLimit.lastReset > 3600000) {
      this.rateLimitMap.set(userId, { count: 1, lastReset: now });
    } else {
      this.rateLimitMap.set(userId, { 
        count: userLimit.count + 1, 
        lastReset: userLimit.lastReset 
      });
    }
  }

  getRemainingRequests(userId: string): number {
    const userLimit = this.rateLimitMap.get(userId);
    if (!userLimit) return this.RATE_LIMIT_PER_HOUR;
    
    const now = Date.now();
    if (now - userLimit.lastReset > 3600000) {
      return this.RATE_LIMIT_PER_HOUR;
    }
    
    return Math.max(0, this.RATE_LIMIT_PER_HOUR - userLimit.count);
  }
}