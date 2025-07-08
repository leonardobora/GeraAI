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
    // Generate intelligent name based on prompt content
    const lowerPrompt = prompt.toLowerCase();
    
    // Specific themes for better matching
    const themes = [
      { keywords: ['rave', 'festa', 'mdma', 'pós-festa', 'manhã', 'sol', 'óculos'], name: 'Pós-Rave Sunrise ☀️' },
      { keywords: ['café', 'matinal', 'manhã', 'acordar', 'pós'], name: 'Café da Manhã 🌅' },
      { keywords: ['dirigir', 'estrada', 'carro', 'viagem', 'amigos', 'casa'], name: 'Road Trip 🚗' },
      { keywords: ['treino', 'academia', 'exercício', 'malhar'], name: 'Treino Pesado 💪' },
      { keywords: ['trabalho', 'trabalhar', 'foco', 'concentração'], name: 'Foco Total 🎯' },
      { keywords: ['estudo', 'estudar', 'ler', 'concentrar'], name: 'Estudo Intenso 📚' },
      { keywords: ['relaxar', 'descanso', 'tranquilo', 'calma'], name: 'Momento Zen 🧘' },
      { keywords: ['rock', 'metal', 'heavy'], name: 'Rock Pesado 🤘' },
      { keywords: ['eletrônica', 'eletro', 'house', 'techno'], name: 'Batida Eletrônica ⚡' },
      { keywords: ['samba', 'mpb', 'brasileiro', 'brasil'], name: 'Raízes Brasileiras 🇧🇷' },
      { keywords: ['jazz', 'blues', 'clássico'], name: 'Jazz & Blues 🎷' },
      { keywords: ['lofi', 'chill', 'ambient'], name: 'Lo-Fi Vibes 🌙' },
    ];

    // Check for specific themes first
    for (const theme of themes) {
      if (theme.keywords.some(keyword => lowerPrompt.includes(keyword))) {
        return theme.name;
      }
    }

    // Generate creative name from key words
    const words = prompt.split(' ')
      .filter(word => word.length > 3) // Filter short words
      .slice(0, 3) // Take first 3 meaningful words
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
    
    if (words.length >= 2) {
      return words.join(' ') + ' 🎵';
    }
    
    return 'Playlist Personalizada 🎵';
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
