---
description: Revisa HTML/JSX para melhorar acessibilidade e adequar regras de ARIA.
name: revisar-acessibilidade-html
argument-hint: caminho do arquivo ou trecho HTML/JSX a revisar
agent: agent
---

# Revisão de acessibilidade HTML e ARIA

Revise o código de `${input:arquivo:caminho do arquivo ou trecho HTML/JSX}` com foco em acessibilidade web e adequação de atributos ARIA.

## Objetivo

Identifique problemas de acessibilidade no markup e corrija o que for necessário sem quebrar a funcionalidade atual.

## Regras a seguir

- Verifique se todos os elementos interativos têm nome acessível via texto visível, `aria-label`, `aria-labelledby` ou `aria-describedby`.
- Prefira HTML nativo e semântico antes de usar `role` ou ARIA redundante.
- Use `aria-expanded`, `aria-controls`, `aria-pressed`, `aria-current` e outros atributos quando fizer sentido para estados de interface.
- Para elementos visuais decorativos, garanta que não sejam anunciados por leitores de tela usando `aria-hidden="true"` ou equivalente.
- Revise `tabindex`, foco, navegação por teclado e comportamento de elementos clicáveis.
- Verifique se formulários possuem rótulos claros e associação correta (`label`, `for`, `aria-label`, `aria-labelledby`).
- Avalie `aria-live` para regiões dinâmicas e mensagens de status quando houver atualização em tempo real.
- Evite `aria-*` desnecessários ou incorretos; o ARIA deve complementar a semântica e não substituir elementos nativos.
- Mantenha a legibilidade do código e a compatibilidade com React/Vite/HTML padrão do projeto.
- Não introduza regressões no comportamento visual ou funcional.

## Saída esperada

Apresente uma revisão em 3 partes:

1. Problemas encontrados
   - liste os elementos/trechos problemáticos;
   - explique o motivo da inadequação.

2. Correções sugeridas
   - mostre o HTML/JSX ajustado;
   - inclua atributos ARIA corretos quando necessário;
   - mantenha estrutura semântica e acessível.

3. Resumo de prioridade
   - classifique itens em: crítico, alto, médio ou baixo.

## Observações finais

- Garanta que a solução siga as boas práticas de WCAG e Web Accessibility.
- Priorize acessibilidade real para usuários de teclado, leitores de tela e navegação assistiva.
- Se o arquivo for React, mantenha o código compatível com JSX e com o padrão do projeto.
