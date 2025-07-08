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
    const lowerPrompt = prompt.toLowerCase();
    const originalWords = prompt.split(' ');
    
    // Stop words to exclude
    const stopWords = ['de', 'da', 'do', 'das', 'dos', 'para', 'com', 'em', 'na', 'no', 'e', 'o', 'a', 'um', 'uma', 'que', 'é', 'foi', 'ser', 'ter', 'há', 'mais', 'muito', 'bem', 'já', 'quando', 'onde', 'como', 'por', 'seu', 'sua', 'seus', 'suas', 'era', 'época', 'tempo', 'uma', 'viva', 'lenda'];
    
    // Extract proper nouns (capitalized words that might be names)
    const properNouns = originalWords.filter(word => 
      /^[A-Z][a-zA-Z]+/.test(word) && word.length > 2 && !stopWords.includes(word.toLowerCase())
    );
    
    // Extract meaningful words
    const meaningfulWords = lowerPrompt.split(' ').filter(word => 
      word.length > 2 && !stopWords.includes(word)
    );
    
    // Music genres
    const genres = meaningfulWords.filter(word => 
      ['rock', 'pop', 'jazz', 'blues', 'funk', 'samba', 'mpb', 'punk', 'metal', 'rap', 'hip-hop', 'eletrônica', 'reggae', 'forró', 'sertanejo', 'bossa', 'clássica', 'instrumental', 'hardcore', 'alternative', 'indie'].includes(word)
    );
    
    // Nationality/location words
    const locations = meaningfulWords.filter(word => 
      ['brasileiro', 'nacional', 'br', 'brazil', 'brasil'].includes(word)
    );
    
    // Build intelligent name
    let playlistName = '';
    
    // Strategy 1: Person + Genre + Location
    if (properNouns.length > 0) {
      playlistName = properNouns.slice(0, 2).join(' ');
      
      if (genres.length > 0) {
        const genre = genres[0].charAt(0).toUpperCase() + genres[0].slice(1);
        playlistName += ` & ${genre}`;
      }
      
      if (locations.length > 0) {
        playlistName += ' BR';
      }
    } 
    // Strategy 2: Genre + Location
    else if (genres.length > 0) {
      const genre = genres[0].charAt(0).toUpperCase() + genres[0].slice(1);
      playlistName = genre;
      
      if (locations.length > 0) {
        playlistName += ' Brasileiro';
      }
      
      // Add second genre if available
      if (genres.length > 1) {
        const secondGenre = genres[1].charAt(0).toUpperCase() + genres[1].slice(1);
        playlistName += ` & ${secondGenre}`;
      }
    }
    // Strategy 3: Key meaningful words
    else {
      const keyWords = meaningfulWords.slice(0, 3)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1));
      playlistName = keyWords.join(' ');
    }
    
    // Fallback
    if (!playlistName || playlistName.length < 3) {
      playlistName = 'Playlist Personalizada';
    }
    
    // Add emoji based on genre
    const emoji = this.getGenreEmoji(lowerPrompt);
    return `${playlistName} ${emoji}`;
  }
  
  private getGenreEmoji(prompt: string): string {
    if (prompt.includes('rock') || prompt.includes('metal') || prompt.includes('punk')) return '🤘';
    if (prompt.includes('eletrônica') || prompt.includes('house') || prompt.includes('techno')) return '⚡';
    if (prompt.includes('samba') || prompt.includes('mpb') || prompt.includes('brasileiro')) return '🇧🇷';
    if (prompt.includes('jazz') || prompt.includes('blues')) return '🎷';
    if (prompt.includes('treino') || prompt.includes('academia')) return '💪';
    if (prompt.includes('relaxar') || prompt.includes('chill')) return '🧘';
    if (prompt.includes('festa') || prompt.includes('rave')) return '🎉';
    return '🎵';
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
