# ⚡ Quick Start Guide

Comece a usar o **Gera AÍ: Playlists com IA** em menos de 5 minutos!

## 🚀 Para Usuários

### 1. Acesse a Aplicação
👉 **[https://criador-playlist.replit.app/](https://criador-playlist.replit.app/)**

### 2. Faça Login
- Clique em "Entrar" 
- Complete a autenticação com sua conta Replit

### 3. Conecte o Spotify
- Vá em "Configurações"
- Clique em "Conectar Spotify" 
- Autorize a aplicação

### 4. Crie sua Primeira Playlist
- Descreva sua playlist (ex: "música eletrônica para malhar")
- Configure tamanho e descoberta
- Clique em "Gerar Playlist"
- ✨ Pronto! Sua playlist está no Spotify

---

## 💻 Para Desenvolvedores

### Setup Local em 3 Passos

```bash
# 1. Clone e instale
git clone https://github.com/leonardobora/gera-ai-playlists.git
cd gera-ai-playlists
npm install

# 2. Configure ambiente
cp .env.example .env
# Edite .env com suas credenciais

# 3. Execute
npm run dev
```

### Credenciais Necessárias

#### 🎵 Spotify Developer App
1. Acesse [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Crie um app com redirect URI: `http://localhost:5000/api/spotify/callback`
3. Copie Client ID e Client Secret para o `.env`

#### 🤖 Perplexity API
1. Registre-se em [perplexity.ai](https://www.perplexity.ai/settings/api)
2. Gere uma API key
3. Adicione ao `.env` como `PERPLEXITY_API_KEY`

#### 🗄️ Database (PostgreSQL)
```bash
# Opção 1: Local
createdb gera_ai_playlists

# Opção 2: Neon (Recomendado)
# Crie conta em neon.tech e copie connection string
```

### Estrutura do Projeto
```
├── client/               # Frontend React
│   ├── src/components/   # Componentes UI
│   ├── src/pages/       # Páginas da aplicação
│   └── src/hooks/       # Hooks customizados
├── server/              # Backend Express
│   ├── services/        # Lógica de negócio
│   └── routes.ts        # Endpoints API
├── shared/              # Tipos e schema
└── docs/                # Documentação
```

---

## 🎯 Exemplos de Prompts

### Para Treino
- "música eletrônica para malhar pesado"
- "hip hop motivacional para corrida"
- "rock nacional energético para academia"

### Para Trabalho
- "música instrumental para foco e concentração"
- "jazz suave para trabalhar sem distração"
- "lo-fi beats para programar"

### Para Relaxar
- "bossa nova brasileira para domingo"
- "música clássica relaxante para dormir"
- "indie folk para ler um livro"

### Para Festa
- "funk brasileiro para balada"
- "sertanejo universitário para churrasco"
- "pop internacional para festa"

---

## 🛠️ Comandos Úteis

```bash
# Desenvolvimento
npm run dev              # Inicia dev server
npm run build           # Build para produção
npm run db:push         # Aplica mudanças no schema

# Database
npm run db:studio       # Interface visual do DB
npm run db:migrate      # Roda migrações
npm run db:seed         # Popula dados iniciais

# Testes
npm test                # Executa testes
npm run test:watch      # Testa em modo watch
npm run test:coverage   # Cobertura de testes

# Deploy
npm run deploy          # Deploy para produção
npm run lint            # Linting do código
npm run type-check      # Verificação de tipos
```

---

## 🔧 Configurações Avançadas

### Environment Variables
```env
# Essenciais
DATABASE_URL=postgresql://...
SPOTIFY_CLIENT_ID=your_id
SPOTIFY_CLIENT_SECRET=your_secret
PERPLEXITY_API_KEY=your_key
SESSION_SECRET=your_secret

# Opcionais
OPENAI_API_KEY=backup_ai
GEMINI_API_KEY=backup_ai
RATE_LIMIT_PER_HOUR=10
NODE_ENV=development
```

### Customização do Rate Limiting
```typescript
// server/services/UniversalAIService.ts
private readonly RATE_LIMIT_PER_HOUR = 20; // Aumente conforme necessário
```

### Configuração de CORS
```typescript
// server/routes.ts
app.use(cors({
  origin: ['http://localhost:3000', 'your-domain.com'],
  credentials: true
}));
```

---

## 🐛 Troubleshooting

### Erro: "Spotify não conectado"
- Verifique se Client ID/Secret estão corretos
- Confirme redirect URI no Spotify Dashboard
- Teste autenticação manualmente

### Erro: "IA não responde"
- Verifique se PERPLEXITY_API_KEY está válida
- Confirme saldo da conta Perplexity
- Teste com outros providers (OpenAI/Gemini)

### Erro: "Database connection"
- Confirme CONNECTION_STRING está correta
- Teste conexão: `npm run db:studio`
- Execute migrações: `npm run db:push`

### Performance Lenta
- Otimize queries no banco
- Configure cache do TanStack Query
- Implemente debounce em formulários

---

## 📚 Recursos Adicionais

### Documentação Completa
- [API Documentation](./API.md)
- [Contributing Guide](../CONTRIBUTING.md)
- [Architecture Overview](../README.md#arquitetura-do-sistema)

### Comunidade e Suporte
- **Issues**: [GitHub Issues](https://github.com/leonardobora/gera-ai-playlists/issues)
- **Discussions**: [GitHub Discussions](https://github.com/leonardobora/gera-ai-playlists/discussions)
- **Contact**: [LinkedIn Leonardo Bora](https://linkedin.com/in/leonardobora)

### Roadmap
- [ ] Analytics avançadas
- [ ] Suporte Apple Music
- [ ] App mobile nativo
- [ ] API pública para developers

---

## 🎉 Próximos Passos

### Como Usuário
1. ✅ Crie 5 playlists diferentes
2. ✅ Teste configurações avançadas
3. ✅ Compartilhe com amigos
4. ✅ Dê feedback no GitHub

### Como Desenvolvedor
1. ✅ Fork o repositório
2. ✅ Implemente uma feature nova
3. ✅ Abra um Pull Request
4. ✅ Contribua para a documentação

### Como Empresa
1. ✅ Teste a API privadamente
2. ✅ Avalie para caso de uso específico
3. ✅ Entre em contato para parcerias
4. ✅ Considere contribuições open source

---

**🚀 Pronto para começar? Acesse agora: [criador-playlist.replit.app](https://criador-playlist.replit.app/)**

*Qualquer dúvida, estamos aqui para ajudar! 🎵*