/** @type {import('@commitlint/types').UserConfig} */
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',     // Nova funcionalidade
        'fix',      // Correção de bug
        'docs',     // Documentação
        'style',    // Formatação (não afeta código)
        'refactor', // Refatoração
        'perf',     // Performance
        'test',     // Testes
        'build',    // Build/dependencies
        'ci',       // CI/CD
        'chore',    // Tarefas gerais
        'revert',   // Reverter commit
      ],
    ],
    'type-case': [2, 'always', 'lower-case'],
    'subject-case': [2, 'always', 'lower-case'],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'header-max-length': [2, 'always', 100],
    // Disabled: semantic-release generates changelog with long commit links
    'body-max-line-length': [0, 'always', 100],
  },
}
