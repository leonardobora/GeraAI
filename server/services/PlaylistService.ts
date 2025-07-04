import { storage } from "../storage";
import { InsertPlaylist } from "@shared/schema";

export class PlaylistService {
  async generatePlaylist(
    prompt: string,
    tamanho: string,
    nivelDescoberta: string,
    conteudoExplicito: boolean,
    userId: string
  ): Promise<any> {
    // Generate playlist name and description based on prompt
    const { nome, descricao } = this.generatePlaylistMetadata(prompt);

    const playlistData: InsertPlaylist = {
      userId,
      nome,
      descricao,
      promptOriginal: prompt,
      tamanho,
      nivelDescoberta,
      conteudoExplicito,
      totalFaixas: 0,
      duracaoTotal: "0:00",
    };

    return await storage.createPlaylist(playlistData);
  }

  private generatePlaylistMetadata(prompt: string): { nome: string; descricao: string } {
    // Simple logic to generate playlist name and description
    const nome = this.generatePlaylistName(prompt);
    const descricao = `Playlist criada com IA baseada em: ${prompt}`;

    return { nome, descricao };
  }

  private generatePlaylistName(prompt: string): string {
    // Extract key themes from prompt and create a name
    const lowerPrompt = prompt.toLowerCase();
    
    // Common themes and their corresponding names
    const themes = [
      { keywords: ['treino', 'academia', 'exercício', 'malhar'], name: 'Treino Pesado 💪' },
      { keywords: ['trabalho', 'trabalhar', 'foco', 'concentração'], name: 'Foco no Trabalho 🎯' },
      { keywords: ['churrasco', 'domingo', 'família', 'amigos'], name: 'Churrasco de Domingo 🔥' },
      { keywords: ['estudo', 'estudar', 'ler', 'concentrar'], name: 'Estudo Concentrado 📚' },
      { keywords: ['festa', 'dança', 'balada', 'diversão'], name: 'Festa Animada 🎉' },
      { keywords: ['relaxar', 'descanso', 'tranquilo', 'calma'], name: 'Momento Zen 🧘' },
      { keywords: ['viagem', 'estrada', 'road trip', 'dirigir'], name: 'Estrada Afora 🚗' },
      { keywords: ['samba', 'mpb', 'brasileiro', 'brasil'], name: 'Raízes Brasileiras 🇧🇷' },
      { keywords: ['rock', 'metal', 'heavy'], name: 'Rock Pesado 🤘' },
      { keywords: ['eletrônica', 'eletro', 'house', 'techno'], name: 'Batida Eletrônica ⚡' },
    ];

    for (const theme of themes) {
      if (theme.keywords.some(keyword => lowerPrompt.includes(keyword))) {
        return theme.name;
      }
    }

    // If no theme matches, create a generic name
    const words = prompt.split(' ').slice(0, 3);
    const capitalizedWords = words.map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    );
    
    return capitalizedWords.join(' ') + ' 🎵';
  }

  formatDuration(totalSeconds: number): string {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    } else {
      return `${minutes}min`;
    }
  }

  async updatePlaylistDuration(playlistId: number, tracks: any[]): Promise<void> {
    const { storage } = await import('../storage');
    const totalSeconds = tracks.reduce((sum, track) => sum + (track.duracao || 0), 0);
    const duracaoTotal = this.formatDuration(totalSeconds);
    const totalFaixas = tracks.length;

    // Update playlist with calculated values
    await storage.updatePlaylistMetadata(playlistId, totalFaixas, duracaoTotal);
  }
}
