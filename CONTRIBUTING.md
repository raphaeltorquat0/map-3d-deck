# Contributing to @meuorg/map-3d-deck

Obrigado por considerar contribuir para este projeto! Este documento descreve as
diretrizes para contribuição.

## Código de Conduta

Este projeto adota um código de conduta que esperamos que todos os participantes
sigam. Por favor, leia
[CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) antes de contribuir.

## Como Contribuir

### Reportando Bugs

1. Verifique se o bug já não foi reportado nas
   [Issues](https://github.com/meuorg/map-3d-deck/issues)
2. Se não encontrar, crie uma nova issue usando o template de bug report
3. Inclua o máximo de detalhes possível:
   - Versão do pacote
   - Versão do Node.js
   - Sistema operacional
   - Passos para reproduzir
   - Comportamento esperado vs. atual
   - Screenshots/logs se aplicável

### Sugerindo Funcionalidades

1. Verifique se a funcionalidade já não foi sugerida nas Issues
2. Crie uma nova issue usando o template de feature request
3. Descreva claramente:
   - O problema que a funcionalidade resolve
   - Como você imagina a solução
   - Alternativas consideradas

### Pull Requests

1. Fork o repositório
2. Crie uma branch a partir de `main`:
   ```bash
   git checkout -b feat/minha-feature
   ```
3. Faça suas alterações seguindo os padrões do projeto
4. Escreva/atualize testes para suas alterações
5. Certifique-se de que todos os testes passam:
   ```bash
   npm run validate
   ```
6. Commit suas alterações usando
   [Conventional Commits](https://www.conventionalcommits.org/):
   ```bash
   git commit -m "feat: adiciona suporte a nova camada"
   ```
7. Push para sua branch:
   ```bash
   git push origin feat/minha-feature
   ```
8. Abra um Pull Request

## Padrões de Código

### TypeScript

- Use tipos explícitos sempre que possível
- Evite `any` - use `unknown` se necessário
- Prefira `interface` para objetos, `type` para unions/intersections
- Use `readonly` para propriedades imutáveis

### Commits

Seguimos o padrão
[Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - Nova funcionalidade
- `fix:` - Correção de bug
- `docs:` - Documentação
- `style:` - Formatação (não afeta código)
- `refactor:` - Refatoração
- `perf:` - Melhoria de performance
- `test:` - Adição/correção de testes
- `build:` - Alterações no build
- `ci:` - Alterações no CI
- `chore:` - Tarefas gerais

Exemplos:

```
feat: adiciona camada de risco geotécnico
fix: corrige cálculo de elevação negativa
docs: atualiza exemplos de uso do ElevationController
refactor: simplifica lógica de filtro por elevação
```

### Testes

- Escreva testes para toda nova funcionalidade
- Mantenha cobertura mínima de 80%
- Use nomes descritivos para os testes
- Agrupe testes relacionados com `describe`

```typescript
describe('ElevationController', () => {
  describe('setRange', () => {
    it('should clamp values to valid bounds', () => {
      // ...
    })
  })
})
```

### Documentação

- Adicione JSDoc para todas as funções/classes públicas
- Atualize o README se necessário
- Inclua exemplos de uso

```typescript
/**
 * Cria uma camada de zoneamento 3D
 *
 * @param options - Opções de configuração da camada
 * @returns Layer configurada para uso com Deck.gl
 *
 * @example
 * ```typescript
 * const layer = createZoningLayer({
 *   data: zoningGeoJSON,
 *   extruded: true,
 * })
 * ```
 */
export function createZoningLayer(options: ZoningLayerOptions): GeoJsonLayer {
  // ...
}
```

## Setup de Desenvolvimento

```bash
# Clone o repositório
git clone https://github.com/meuorg/map-3d-deck.git
cd map-3d-deck

# Instale as dependências
npm install

# Rode os testes
npm test

# Build
npm run build

# Watch mode
npm run dev
```

## Comandos Úteis

| Comando              | Descrição                       |
| -------------------- | ------------------------------- |
| `npm run dev`        | Build em watch mode             |
| `npm run build`      | Build de produção               |
| `npm run test`       | Roda testes                     |
| `npm run test:watch` | Testes em watch mode            |
| `npm run test:coverage` | Testes com cobertura         |
| `npm run lint`       | Verifica código com ESLint      |
| `npm run lint:fix`   | Corrige problemas de lint       |
| `npm run format`     | Formata código com Prettier     |
| `npm run typecheck`  | Verifica tipos TypeScript       |
| `npm run docs`       | Gera documentação               |
| `npm run validate`   | Roda todos os checks            |

## Processo de Review

1. Todo PR precisa de pelo menos 1 aprovação
2. CI deve passar (lint, types, tests, build)
3. Cobertura de testes não pode diminuir
4. Código deve seguir os padrões estabelecidos

## Releases

Releases são automatizadas via semantic-release:

- Commits em `main` geram releases estáveis
- Commits em `beta` geram pre-releases beta
- Commits em `alpha` geram pre-releases alpha

A versão é determinada automaticamente pelos commits:

- `feat:` → minor version (0.x.0)
- `fix:` → patch version (0.0.x)
- `BREAKING CHANGE:` → major version (x.0.0)

## Dúvidas?

Abra uma [Discussion](https://github.com/meuorg/map-3d-deck/discussions) ou
entre em contato com a equipe de engenharia.
