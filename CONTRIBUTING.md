# 🤝 Guia de Contribuição

Obrigado pelo interesse em contribuir com o **Gera AÍ: Playlists com IA**! Este documento fornece diretrizes para contribuições efetivas ao projeto.

## 📋 Antes de Começar

### Pré-requisitos
- Node.js 18+
- Git configurado
- Conhecimento básico em React, TypeScript e Express.js
- Familiaridade com APIs REST

### Setup do Ambiente de Desenvolvimento
1. Fork o repositório
2. Clone seu fork localmente
3. Instale as dependências: `npm install`
4. Configure as variáveis de ambiente (veja `.env.example`)
5. Execute o projeto: `npm run dev`

## 🎯 Tipos de Contribuições

### 🐛 Correção de Bugs
- Reporte bugs através de issues detalhadas
- Inclua passos para reproduzir o problema
- Adicione screenshots quando relevante
- Mencione seu ambiente (SO, versão do Node, etc.)

### ✨ Novas Funcionalidades
- Discuta a funcionalidade em uma issue antes de implementar
- Certifique-se de que alinha com a visão do projeto
- Mantenha a compatibilidade com funcionalidades existentes

### 📚 Documentação
- Melhore READMEs, comentários no código
- Adicione exemplos de uso
- Traduza documentação (inglês/português)

### 🎨 Melhorias de UI/UX
- Mantenha consistência com o design atual (tema Spotify)
- Certifique-se de que é responsivo
- Teste em diferentes dispositivos

## 🔧 Padrões de Desenvolvimento

### Estrutura de Commits
Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: adiciona busca por artista específico
fix: corrige erro na autenticação Spotify
docs: atualiza README com novos endpoints
style: melhora layout responsivo do header
refactor: otimiza performance da busca
test: adiciona testes para geração de playlist
```

### Padrões de Código

#### TypeScript
- Use tipos explícitos sempre que possível
- Prefira interfaces para objetos complexos
- Use `const assertions` quando apropriado

```typescript
// ✅ Bom
interface PlaylistData {
  nome: string;
  duracao: number;
  tracks: Track[];
}

// ❌ Evite
const data: any = {};
```

#### React Components
- Use componentes funcionais com hooks
- Prefira composição sobre herança
- Mantenha componentes pequenos e focados

```typescript
// ✅ Bom
const PlaylistCard = ({ playlist }: PlaylistCardProps) => {
  const { nome, duracao } = playlist;
  return <div>{nome} - {duracao}</div>;
};

// ❌ Evite
const BigComponent = () => {
  // 200+ linhas de código...
};
```

#### Styling
- Use TailwindCSS para estilização
- Mantenha classes organizadas
- Use variáveis CSS customizadas para cores do tema

```typescript
// ✅ Bom
<div className="bg-spotify-surface hover:bg-spotify-card transition-colors">

// ❌ Evite
<div style={{ backgroundColor: '#191414' }}>
```

### Estrutura de Arquivos
```
client/src/
├── components/       # Componentes reutilizáveis
├── pages/           # Páginas da aplicação
├── hooks/           # Hooks customizados
├── lib/             # Utilitários e configurações
└── types/           # Definições de tipos

server/
├── routes.ts        # Definições de rotas
├── services/        # Lógica de negócio
├── storage.ts       # Interface de persistência
└── index.ts         # Configuração do servidor
```

## 🧪 Testes

### Executando Testes
```bash
npm run test          # Executa todos os testes
npm run test:watch    # Executa em modo watch
npm run test:coverage # Gera relatório de cobertura
```

### Escrevendo Testes
- Adicione testes para novas funcionalidades
- Mantenha cobertura acima de 80%
- Use nomes descritivos para casos de teste

```typescript
describe('PlaylistService', () => {
  it('deve gerar nome de playlist baseado em keywords', () => {
    const prompt = "música eletrônica para malhar";
    const nome = generatePlaylistName(prompt);
    expect(nome).toContain("Eletrônica");
  });
});
```

## 📝 Processo de Pull Request

### Checklist Antes do PR
- [ ] Código segue os padrões estabelecidos
- [ ] Testes adicionados/atualizados
- [ ] Documentação atualizada se necessário
- [ ] Sem conflitos de merge
- [ ] Build passa sem erros
- [ ] Funcionalidade testada manualmente

### Template de PR
```markdown
## 📋 Descrição
Breve descrição das mudanças implementadas.

## 🔧 Tipo de Mudança
- [ ] Bug fix
- [ ] Nova funcionalidade
- [ ] Breaking change
- [ ] Documentação

## 🧪 Como Testar
1. Passos para testar a funcionalidade
2. Casos específicos para validar
3. Edge cases considerados

## 📸 Screenshots (se aplicável)
Adicione screenshots das mudanças visuais.

## ✅ Checklist
- [ ] Código testado localmente
- [ ] Testes unitários passando
- [ ] Documentação atualizada
- [ ] Sem console.logs desnecessários
```

## 🚀 Deployment

### Branch Strategy
- `main`: Código de produção estável
- `develop`: Desenvolvimento ativo
- `feature/*`: Novas funcionalidades
- `fix/*`: Correções de bugs

### Processo de Release
1. Mudanças são merged na `develop`
2. Testadas extensivamente
3. Merged na `main` para produção
4. Tag de versão criada

## 🌟 Reconhecimento

Contribuidores são reconhecidos:
- Lista de contribuidores no README
- Menção em releases notes
- Créditos em comentários do código (para contribuições significativas)

## 📞 Suporte

### Onde Buscar Ajuda
- **Issues**: Para bugs e dúvidas sobre funcionalidades
- **Discussions**: Para ideias e discussões gerais
- **Discord**: [Link do servidor] (se aplicável)

### Mentoria
Desenvolvedores iniciantes são bem-vindos! Se precisar de orientação:
- Marque issues como `good first issue`
- Solicite review detalhado em PRs
- Participe das discussões da comunidade

## 🎖️ Código de Conduta

### Nossos Valores
- **Respeito**: Trate todos com cortesia e profissionalismo
- **Inclusão**: Valorizamos diversidade de perspectivas
- **Colaboração**: Trabalhe junto para soluções melhores
- **Qualidade**: Priorize código limpo e bem documentado

### Comportamentos Esperados
- Use linguagem acolhedora e inclusiva
- Respeite diferentes pontos de vista
- Forneça feedback construtivo
- Foque no que é melhor para a comunidade

### Comportamentos Inaceitáveis
- Linguagem ou imagens inadequadas
- Ataques pessoais ou políticos
- Assédio público ou privado
- Publicar informações privadas sem permissão

## 📄 Licença

Ao contribuir, você concorda que suas contribuições serão licenciadas sob a [Licença MIT](LICENSE).

---

**Obrigado por contribuir! 🎵**

*Juntos, vamos tornar a descoberta musical mais inteligente e acessível.*