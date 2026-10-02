# FIN assistente — Documentação técnica

Aplicação web responsiva de planejamento e controle financeiro pessoal com um assistente de IA
(o **Fin**) que registra transações a partir de linguagem natural. Estética **Matte Obsidian**:
dark monocromático, plano e fosco.

## Executar

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + build de produção em dist/
```

Requer Node 20+. Não há login: na primeira visita o app já abre com ~6 meses de histórico de
exemplo. Os dados ficam no `localStorage` do navegador.

## Stack

- **React 19 + TypeScript + Vite**, sem bibliotecas de UI ou de gráficos.
- Gráficos em **SVG próprio** (evolução e donut) para controle total da estética fosca e das transições.
- Roteamento por hash (`#/visao-geral`, …): funciona em qualquer hospedagem estática.

## Estrutura

```
src/
├── types.ts                  Tipos de domínio
├── data/
│   ├── categories.ts         Matriz cromática das 15 categorias
│   └── seed.ts               Gerador de histórico de exemplo (PRNG com semente)
├── lib/
│   ├── storage.ts            Persistência local tolerante a falhas
│   ├── finance.ts            Agregações: totais, série mensal, gastos por categoria
│   ├── installments.ts       Parcelamento: divisão em parcelas mensais
│   ├── format.ts             Moeda/datas pt-BR, datas locais sem fuso, horário opcional
│   ├── nlp.ts                Interpretador de linguagem natural (pt-BR)
│   ├── assistant.ts          Ponto de integração do assistente (troca por LLM)
│   └── export.ts             Exportação CSV (Excel pt-BR) e PDF (impressão)
├── context/                  Data (CRUD) e Toast
├── hooks/                    Rotas, medição de largura, ações de transação
├── components/               Sidebar/navegação, Logo, Modal, CategoryPicker, TransactionCard/Form, charts/
├── pages/                    Overview, Transactions, CalendarPage, Categories, Chat
└── styles/                   tokens → base → layout → components → pages
```

## Funcionalidades

| Área | Onde |
| ---- | ---- |
| Navegação: sidebar fixa no desktop, barra inferior com ícones no mobile | `components/Sidebar.tsx`, `styles/layout.css` |
| Visão geral: KPIs do mês, gráfico de evolução (6/12 meses, destaque por legenda, tooltip), atividades | `pages/Overview.tsx`, `components/charts/EvolutionChart.tsx` |
| Transações: filtros simultâneos, busca, exportação CSV/PDF, edição/exclusão | `pages/Transactions.tsx`, `lib/export.ts` |
| Calendário: saldo e densidade por dia, dias dos meses vizinhos, gaveta do dia | `pages/CalendarPage.tsx` |
| Categorias: donut com centro dinâmico + barras proporcionais | `pages/Categories.tsx`, `components/charts/DonutChart.tsx` |
| Chat com o Fin: prévia do lançamento com confirmação, histórico carregado ao rolar | `pages/Chat.tsx`, `lib/assistant.ts`, `lib/nlp.ts` |
| Parcelamento: 1500 em 5x → 5 lançamentos de 300 com tag `1/5`, `2/5`… | `lib/installments.ts` |
| Responsivo de 320px a 1440px+, contraste WCAG AA (menor par de texto: 5.07:1) | `styles/*.css` |

## Limitações conhecidas / próximos passos

- **Persistência:** os dados ficam apenas no navegador. Em outro navegador (ou com o armazenamento
  limpo) o app recomeça com os dados de exemplo. Um backend com banco de dados resolveria isso.
- **IA:** o assistente usa um interpretador baseado em regras (`lib/nlp.ts`). Para usar um LLM,
  altere apenas `interpret()` em `lib/assistant.ts` para chamar um backend (nunca exponha a chave da
  API no front-end). O formato de resposta e a interface do chat permanecem. Os comentários do Fin
  (`COMMENTS` em `lib/assistant.ts`) são provisórios e devem vir do prompt da IA.
- **Parcelamento:** centavos de arredondamento ficam na 1ª parcela. Editar uma parcela edita a compra
  inteira; excluir pergunta se remove só a parcela ou todas.
