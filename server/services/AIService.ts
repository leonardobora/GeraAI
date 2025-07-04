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
    this.apiKey = process.env.PERPLEXITY_API_KEY || "";
    
    if (!this.apiKey) {
      throw new Error("PERPLEXITY_API_KEY é obrigatório");
    }
  }

  async generateMusicRecommendations(
    prompt: string,
    tamanho: string,
    nivelDescoberta: string
  ): Promise<string[]> {
    const numberOfTracks = this.getNumberOfTracks(tamanho);
    const discoveryLevel = this.getDiscoveryPrompt(nivelDescoberta);
    
    const systemPrompt = `Você é um especialista em música que cria recomendações de músicas baseadas em descrições em português brasileiro. 
    Responda APENAS com uma lista de músicas no formato "Artista - Nome da Música", uma por linha, sem numeração ou formatação extra.
    Use ${discoveryLevel}`;

    const userPrompt = `Crie uma lista de ${numberOfTracks} músicas para: ${prompt}`;

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'sonar',
          messages: [
            {
              role: 'system',
              content: systemPrompt,
            },
            {
              role: 'user',
              content: userPrompt,
            },
          ],
          max_tokens: 1000,
          temperature: 0.7,
          top_p: 0.9,
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`Erro na API Perplexity: ${response.status}`);
      }

      const data: PerplexityResponse = await response.json();
      const content = data.choices[0]?.message?.content || "";
      
      // Parse the response to extract song recommendations
      const recommendations = this.parseRecommendations(content);
      
      if (recommendations.length === 0) {
        throw new Error("Nenhuma recomendação foi gerada pela IA");
      }

      return recommendations;
    } catch (error) {
      console.error("Erro ao gerar recomendações:", error);
      throw new Error("Erro ao gerar recomendações de música");
    }
  }

  private getNumberOfTracks(tamanho: string): number {
    switch (tamanho) {
      case 'curta':
        return 15;
      case 'media':
        return 25;
      case 'longa':
        return 40;
      default:
        return 25;
    }
  }

  private getDiscoveryPrompt(nivelDescoberta: string): string {
    switch (nivelDescoberta) {
      case 'seguro':
        return 'Prefira músicas conhecidas e populares, hits mainstream.';
      case 'aventureiro':
        return 'Inclua músicas alternativas, independentes e menos conhecidas.';
      default:
        return 'Equilibre entre músicas conhecidas e descobertas.';
    }
  }

  private parseRecommendations(content: string): string[] {
    const lines = content.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .filter(line => !line.startsWith('#') && !line.startsWith('*'))
      .map(line => line.replace(/^\d+\.\s*/, '')) // Remove numeração
      .map(line => line.replace(/^[-*]\s*/, '')) // Remove bullet points
      .filter(line => line.includes('-') || line.includes('–') || line.includes('—'));

    return lines.slice(0, 50); // Limit to prevent too many results
  }
}
