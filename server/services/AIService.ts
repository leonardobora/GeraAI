interface PerplexityResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export class AIService {
  private apiKey: string;
  private baseUrl = 'https://api.perplexity.ai/chat/completions';

  constructor() {
    this.apiKey = process.env.PERPLEXITY_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('PERPLEXITY_API_KEY não encontrada');
    }
  }

  async generateMusicRecommendations(
    prompt: string,
    tamanho: "curta" | "media" | "longa",
    nivelDescoberta: "seguro" | "aventureiro",
    conteudoExplicito: boolean
  ): Promise<string[]> {
    const numberOfTracks = this.getNumberOfTracks(tamanho);
    const discoveryPrompt = this.getDiscoveryPrompt(nivelDescoberta);
    
    const systemPrompt = `Você é um especialista em música que cria playlists personalizadas. 
    Responda APENAS com uma lista numerada de ${numberOfTracks} músicas no formato:
    1. Nome da Música - Nome do Artista
    2. Nome da Música - Nome do Artista
    
    ${discoveryPrompt}
    ${conteudoExplicito ? 'Pode incluir músicas com conteúdo explícito.' : 'Evite músicas com conteúdo explícito.'}
    
    IMPORTANTE: Responda apenas com a lista numerada de músicas, sem texto adicional.`;

    const userPrompt = `Crie uma playlist com ${numberOfTracks} músicas baseada em: ${prompt}`;

    try {
      const response = await fetch(this.baseUrl, {
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

      const data: PerplexityResponse = await response.json();
      console.log("Resposta da API Perplexity:", JSON.stringify(data, null, 2));
      
      const content = data.choices[0]?.message?.content || "";
      console.log("Conteúdo extraído:", content);
      
      if (!content.trim()) {
        throw new Error("Resposta vazia da API Perplexity");
      }

      const recommendations = this.parseRecommendations(content);
      console.log("Recomendações parseadas:", recommendations);
      
      if (recommendations.length === 0) {
        throw new Error("Nenhuma recomendação válida foi encontrada na resposta da IA");
      }

      return recommendations;
    } catch (error) {
      console.error("Erro ao gerar recomendações:", error);
      throw error;
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

    console.log("Linhas para processar:", lines);

    for (const line of lines) {
      // Try different patterns for numbered lists
      const patterns = [
        /^\d+\.?\s*(.+)/,        // "1. Song - Artist"
        /^[\*\-\•]\s*(.+)/,      // "* Song - Artist" or "- Song - Artist"
        /^(.+)\s*-\s*(.+)/,      // "Song - Artist" (any line with dash)
      ];

      for (let i = 0; i < patterns.length; i++) {
        const pattern = patterns[i];
        const match = line.match(pattern);
        if (match) {
          let song = match[1].trim();
          
          // Accept lines that have dashes or "by" or just song names
          if (song.length > 3 && (song.includes(' - ') || song.includes(' by ') || song.includes(':'))) {
            recommendations.push(song);
            console.log("Recomendação adicionada:", song);
            break;
          }
        }
      }
    }

    // If no recommendations found, try a more lenient approach
    if (recommendations.length === 0) {
      console.log("Nenhuma recomendação encontrada com padrões específicos, tentando abordagem mais flexível");
      
      for (const line of lines) {
        const trimmed = line.trim();
        
        // Remove numbering if present
        const cleanLine = trimmed.replace(/^\d+\.?\s*/, '');
        
        if (cleanLine.length > 5 && 
            (cleanLine.includes('-') || cleanLine.includes('by') || cleanLine.includes(':'))) {
          recommendations.push(cleanLine);
          console.log("Recomendação flexível adicionada:", cleanLine);
        }
      }
    }

    console.log(`Total de ${recommendations.length} recomendações parseadas`);
    return recommendations.slice(0, 30);
  }
}