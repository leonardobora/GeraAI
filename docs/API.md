# 📚 Documentação da API

Esta documentação descreve todos os endpoints disponíveis na API do **Gera AÍ: Playlists com IA**.

## 🔐 Autenticação

A API usa autenticação baseada em sessão com Passport.js. Todos os endpoints protegidos retornam `401 Unauthorized` se o usuário não estiver autenticado.

### Endpoints de Autenticação

#### Login
```http
GET /api/login
```
Redireciona para o fluxo de autenticação OpenID Connect.

#### Logout
```http
GET /api/logout
```
Encerra a sessão do usuário e redireciona para a página inicial.

#### Callback
```http
GET /api/callback
```
Endpoint de callback para processar retorno da autenticação.

#### Status do Usuário
```http
GET /api/auth/user
```
Retorna informações do usuário autenticado.

**Response:**
```json
{
  "id": "user_id",
  "email": "user@example.com",
  "firstName": "Nome",
  "lastName": "Sobrenome",
  "profileImageUrl": "https://...",
  "createdAt": "2025-01-01T00:00:00.000Z"
}
```

---

## 🎵 Endpoints de Playlists

### Gerar Nova Playlist
```http
POST /api/playlists/generate
```

Gera uma nova playlist baseada no prompt do usuário.

**Request Body:**
```json
{
  "prompt": "música eletrônica para malhar",
  "tamanho": "media",
  "nivelDescoberta": "aventureiro", 
  "conteudoExplicito": false
}
```

**Parameters:**
- `prompt` (string, required): Descrição da playlist desejada
- `tamanho` (string, required): "curta" | "media" | "longa"
- `nivelDescoberta` (string, required): "seguro" | "aventureiro"
- `conteudoExplicito` (boolean, required): Permitir conteúdo explícito

**Response:**
```json
{
  "playlist": {
    "id": 123,
    "nome": "Eletrônica Workout 💪",
    "descricao": "Música eletrônica energética para treinos intensos",
    "promptOriginal": "música eletrônica para malhar",
    "spotifyPlaylistId": "spotify_playlist_id",
    "totalFaixas": 25,
    "duracaoTotal": "1h 23min",
    "tracks": [
      {
        "id": 1,
        "nome": "Track Name",
        "artista": "Artist Name",
        "album": "Album Name",
        "duracao": 180,
        "previewUrl": "https://...",
        "imageUrl": "https://...",
        "posicao": 1,
        "adicionadaComSucesso": true
      }
    ]
  },
  "spotifyUrl": "https://open.spotify.com/playlist/...",
  "message": "Playlist criada com sucesso!"
}
```

### Listar Playlists do Usuário
```http
GET /api/playlists
```

Retorna todas as playlists criadas pelo usuário autenticado.

**Response:**
```json
[
  {
    "id": 123,
    "nome": "Eletrônica Workout 💪",
    "descricao": "Música eletrônica energética...",
    "promptOriginal": "música eletrônica para malhar",
    "spotifyPlaylistId": "spotify_playlist_id",
    "totalFaixas": 25,
    "duracaoTotal": "1h 23min",
    "tamanho": "media",
    "nivelDescoberta": "aventureiro",
    "conteudoExplicito": false,
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
]
```

### Obter Playlist Específica
```http
GET /api/playlists/:id
```

Retorna detalhes completos de uma playlist, incluindo todas as faixas.

**Response:**
```json
{
  "id": 123,
  "nome": "Eletrônica Workout 💪",
  "descricao": "Música eletrônica energética...",
  "tracks": [
    {
      "id": 1,
      "nome": "Track Name",
      "artista": "Artist Name",
      "album": "Album Name",
      "duracao": 180,
      "previewUrl": "https://...",
      "imageUrl": "https://...",
      "posicao": 1,
      "adicionadaComSucesso": true
    }
  ]
}
```

### Deletar Playlist
```http
DELETE /api/playlists/:id
```

Remove uma playlist do usuário (não remove do Spotify).

**Response:**
```json
{
  "message": "Playlist deletada com sucesso"
}
```

---

## 🎧 Endpoints do Spotify

### Status da Conexão
```http
GET /api/spotify/status
```

Verifica se o usuário tem uma conta Spotify conectada.

**Response:**
```json
{
  "connected": true,
  "userId": "spotify_user_id",
  "email": "user@spotify.com"
}
```

### Conectar Spotify
```http
GET /api/spotify/auth
```

Inicia o fluxo de autenticação OAuth do Spotify.

### Callback do Spotify
```http
GET /api/spotify/callback
```

Processa o retorno da autenticação OAuth do Spotify.

### Desconectar Spotify
```http
POST /api/spotify/disconnect
```

Remove a conexão com a conta Spotify do usuário.

**Response:**
```json
{
  "message": "Spotify desconectado com sucesso"
}
```

---

## 🔗 Endpoints de Compartilhamento

### Criar Link de Compartilhamento
```http
POST /api/playlists/:id/share
```

Cria um link público para compartilhar uma playlist.

**Response:**
```json
{
  "shareToken": "unique_token_here",
  "shareUrl": "https://app.com/shared/unique_token_here",
  "expiresAt": "2025-02-01T00:00:00.000Z"
}
```

### Visualizar Playlist Compartilhada
```http
GET /api/shared/:token
```

Permite visualizar uma playlist através de link de compartilhamento.

**Response:**
```json
{
  "playlist": {
    "nome": "Eletrônica Workout 💪",
    "descricao": "Música eletrônica energética...",
    "tracks": [...]
  },
  "sharedBy": "Nome do Usuário",
  "sharedAt": "2025-01-01T00:00:00.000Z"
}
```

### Revogar Compartilhamento
```http
DELETE /api/playlists/:id/share
```

Remove o link de compartilhamento de uma playlist.

---

## ⚙️ Endpoints de Configuração

### Configurações de IA
```http
GET /api/settings/ai
```

Retorna configurações atuais de IA do usuário.

```http
PUT /api/settings/ai
```

Atualiza configurações de IA (provider preferido, API keys).

**Request Body:**
```json
{
  "aiProvider": "perplexity",
  "apiKeys": {
    "perplexity": "api_key_here"
  }
}
```

### Limite de Rate
```http
GET /api/settings/rate-limit
```

Retorna informações sobre limite de uso atual.

**Response:**
```json
{
  "remaining": 8,
  "limit": 10,
  "resetTime": "2025-01-01T01:00:00.000Z"
}
```

---

## 🚨 Códigos de Erro

### 400 Bad Request
Dados de entrada inválidos ou malformados.

```json
{
  "error": "Validation Error",
  "message": "Prompt é obrigatório",
  "details": {
    "field": "prompt",
    "code": "required"
  }
}
```

### 401 Unauthorized
Usuário não autenticado.

```json
{
  "error": "Unauthorized",
  "message": "Login necessário para acessar este recurso"
}
```

### 403 Forbidden
Usuário não tem permissão para acessar o recurso.

```json
{
  "error": "Forbidden", 
  "message": "Você não tem permissão para acessar esta playlist"
}
```

### 404 Not Found
Recurso não encontrado.

```json
{
  "error": "Not Found",
  "message": "Playlist não encontrada"
}
```

### 429 Too Many Requests
Limite de rate excedido.

```json
{
  "error": "Rate Limit Exceeded",
  "message": "Limite de 10 playlists por hora atingido",
  "retryAfter": 3600
}
```

### 500 Internal Server Error
Erro interno do servidor.

```json
{
  "error": "Internal Server Error",
  "message": "Erro inesperado. Tente novamente em alguns minutos.",
  "requestId": "req_123456"
}
```

### 502 Bad Gateway
Erro de integração com serviços externos.

```json
{
  "error": "Service Unavailable",
  "message": "Spotify API temporariamente indisponível",
  "service": "spotify"
}
```

---

## 🔧 Headers Úteis

### Rate Limiting
Todos os endpoints incluem headers de rate limiting:

```http
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 9
X-RateLimit-Reset: 1640995200
```

### Request ID
Para suporte e debugging:

```http
X-Request-ID: req_123456789
```

---

## 🧪 Exemplos de Uso

### Fluxo Completo de Criação de Playlist

```javascript
// 1. Verificar autenticação
const user = await fetch('/api/auth/user');

// 2. Verificar conexão Spotify
const spotifyStatus = await fetch('/api/spotify/status');

// 3. Se não conectado, conectar Spotify
if (!spotifyStatus.connected) {
  window.location.href = '/api/spotify/auth';
}

// 4. Gerar playlist
const playlist = await fetch('/api/playlists/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: "música calma para estudar",
    tamanho: "longa",
    nivelDescoberta: "seguro",
    conteudoExplicito: false
  })
});

// 5. Listar playlists do usuário
const playlists = await fetch('/api/playlists');
```

---

## 📊 Webhook Events (Futuro)

*Planejado para versões futuras:*

### playlist.created
Disparado quando uma playlist é criada com sucesso.

### playlist.failed
Disparado quando a criação de playlist falha.

### spotify.connected
Disparado quando usuário conecta conta Spotify.

---

*Documentação atualizada em: Janeiro 2025*