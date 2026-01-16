# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| 0.x.x   | :white_check_mark: |

## Reporting a Vulnerability

Se você descobrir uma vulnerabilidade de segurança, por favor **NÃO** abra uma
issue pública.

### Como Reportar

1. Envie um email para **security@suaorg.com** com:
   - Descrição da vulnerabilidade
   - Passos para reproduzir
   - Impacto potencial
   - Sugestão de correção (se tiver)

2. Você receberá uma confirmação em até 48 horas

3. Trabalharemos com você para:
   - Confirmar a vulnerabilidade
   - Desenvolver uma correção
   - Coordenar a divulgação

### O Que Esperar

- **Confirmação inicial**: 48 horas
- **Avaliação completa**: 7 dias
- **Correção**: Depende da severidade
  - Crítico: 24-48 horas
  - Alto: 7 dias
  - Médio: 30 dias
  - Baixo: Próximo release

### Reconhecimento

Agradecemos a todos que reportam vulnerabilidades de forma responsável.
Contribuidores de segurança serão reconhecidos (se desejarem) no CHANGELOG e
release notes.

## Práticas de Segurança

Este projeto segue as melhores práticas de segurança:

- Dependências são atualizadas regularmente via Dependabot
- Auditorias de segurança automáticas no CI
- Code review obrigatório para todas as alterações
- Testes automatizados para todas as funcionalidades
- Sem secrets ou credenciais no código

## Escopo

Esta política cobre apenas o pacote `@meuorg/map-3d-deck`. Vulnerabilidades em
dependências devem ser reportadas aos respectivos mantenedores.
