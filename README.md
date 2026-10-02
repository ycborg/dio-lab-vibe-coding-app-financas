# 💸 App de Finanças Pessoais do Ycaro com Vibe Coding

Este projeto foi desenvolvido como um Desafio de Projeto da DIO de Vibe Coding utilizando o Claude Code e Gemini. A proposta é criar um aplicativo de organização financeira pessoal, o **FIN assistente**, com um assistente de IA (o **Fin**) que registra transações a partir de conversas em linguagem natural.

---

## 📝 PRD Refinado no Gemini

```markdown
# DOCUMENTO DE REQUISITOS DE SOFTWARE (DRS)

- **Sistema:** FIN – o Assistente Financeiro
- **Tipo de Documento:** Especificação Técnica de Requisitos e Identidade de Interface
- **Versão:** 1.0
- **Data:** Outubro de 2026

## 1. Visão Geral do Sistema

### 1.1 Objetivo Geral

Desenvolver uma aplicação web responsiva para planejamento e controle financeiro pessoal, integrando múltiplos módulos de análise gráfica, navegação ergonômica e registro de transações por meio de um assistente de Inteligência Artificial em linguagem natural. O sistema prioriza baixa sobrecarga cognitiva, alta densidade de dados e estética minimalista em modo escuro fosco.

### 1.2 Objetivos Específicos

- Prover controle de acesso seguro via telas dedicadas de Login, Cadastro e ação explícita de encerramento de sessão (Logout).
- Implementar o ciclo CRUD completo (criação, leitura, atualização e exclusão) de transações financeiras com suporte a receitas, despesas e identificação condicional de parcelamento.
- Disponibilizar visualizações analíticas integradas: gráfico de evolução de saldo com hover detalhado, distribuição de gastos por categoria em gráfico donut e calendário financeiro mensal interativo.
- Integrar interface conversacional com assistente de IA capaz de processar comandos de texto não estruturados e convertê-los em registros validados.
- Permitir a gestão de preferências e dados cadastrais na seção de Perfil do Usuário.
- Garantir conformidade com diretrizes de responsividade completa e ergonomia visual em telas pequenas, médias e amplas.

## 2. Identidade Visual e Design System

### 2.1 Diretriz Estética: Matte Obsidian

O sistema adota um padrão visual dark monocromático, plano (flat) e fosco. Ficam vetados reflexos, texturas visuais, gradientes de alto contraste, efeitos neon ou bordas pesadas. A profundidade da interface é construída unicamente por escalonamento sutil de tons de chumbo/cinza e bordas ultrafinas translúcidas.

### 2.2 Paleta de Cores do Sistema

| Token                                                  | Valor                                      |
| ------------------------------------------------------ | ------------------------------------------ |
| Fundo da Aplicação (`--bg-base`)                       | `#0D1117`                                  |
| Superfície de Cards, Modais e Sidebar (`--bg-surface`) | `#161B22`                                  |
| Superfície Ativa / Linha Hover (`--bg-surface-hover`)  | `#1F242C`                                  |
| Linhas Divisórias e Bordas (`--border-subtle`)         | `rgba(255, 255, 255, 0.08)` ou `#30363D`   |
| Tipografia Primária (`--text-primary`)                 | `#E6EDF3` (Gelo fosco)                     |
| Tipografia Secundária / Labels (`--text-secondary`)    | `#8B949E` (Cinza neutro)                   |
| Tipografia Discreta / Placeholders (`--text-muted`)    | `#484F58`                                  |
| Semântica Positiva (Entradas)                          | `#3FB950` (Verde sálvia atenuado)          |
| Semântica Negativa (Saídas)                            | `#F85149` (Vermelho terracota atenuado)    |
| Linha de Saldo Analítico (Gráfico)                     | `#E6EDF3` (Traço contínuo 2px fosco)       |
| Tipografia Padrão                                      | Inter ou Geist Sans (pesos 400, 500 e 600) |

### 2.3 Logotipo Institucional: Fin-Chart em Barras

- **Conceito:** Fusão entre um gráfico de colunas contábeis e a silhueta de uma barbatana dorsal (fin).
- **Estrutura:** Três barras verticais modulares com topos angulados repousadas sobre uma linha horizontal base (`#30363D`). As barras formam uma curvatura ascendente que culmina no vértice direito.
- **Wordmark:** Inscrição tipográfica FIN em caixa alta semi-bold (`#E6EDF3`), complementada pela chancela assistente em caixa baixa regular (`#8B949E`).

### 2.4 Matriz Cromática Semântica das Categorias

Cada categoria cadastrada no sistema possui uma cor exclusiva, calibrada em tom fosco para preservar a legibilidade e a harmonia do modo escuro:

| Categoria     | Natureza Padrão     | Código Hexadecimal | Aplicação Semântica        |
| ------------- | ------------------- | ------------------ | -------------------------- |
| Alimentação   | Despesa             | `#E57373`          | Coral quente fosco         |
| Compras       | Despesa             | `#BA68C8`          | Roxo ametista              |
| Transporte    | Despesa             | `#64B5F6`          | Azul urbano                |
| Contas        | Despesa             | `#FFB74D`          | Âmbar de aviso/recorrência |
| Lazer         | Despesa             | `#F06292`          | Rosa magenta suave         |
| Saúde         | Despesa             | `#4DB6AC`          | Verde-água hospitalar      |
| Educação      | Despesa             | `#7986CB`          | Azul índigo suave          |
| Serviços      | Despesa             | `#90A4AE`          | Cinza ardósia              |
| Investimentos | Despesa / Aporte    | `#4DD0E1`          | Ciano analítico            |
| VR/VA         | Entrada / Benefício | `#81C784`          | Verde folha                |
| VT            | Entrada / Benefício | `#4FC3F7`          | Azul celeste               |
| Salário       | Entrada             | `#3FB950`          | Verde financeiro fixo      |
| Reembolso     | Entrada             | `#A5D6A7`          | Verde menta claro          |
| Extra         | Entrada             | `#FFD54F`          | Dourado fosco              |
| Outros        | Neutro              | `#78909C`          | Cinza neutro               |

## 3. Requisitos Funcionais (RF)

### RF01 – Menu de Navegação Lateral (Sidebar)

O menu lateral deve ocupar a coluna esquerda de forma fixa em dispositivos desktop.
Em telas de largura reduzida (tablets e smartphones), a barra deve recolher-se e tornar-se acessível por meio de um menu colapsável (hambúrguer/drawer).

Itens obrigatórios de navegação:

- Logotipo FIN assistente (Fin-Chart em barras);
- Link para a aba Visão Geral;
- Link para a aba Transações;
- Link para a aba Calendário;
- Link para a aba Categorias;
- Link para a aba Chat IA;
- Link/Aba para Perfil do Usuário (com miniatura/avatar e nome da conta);
- Ação contextual de Logout, posicionada no rodapé do menu, com capacidade de limpar tokens de sessão e redirecionar para a tela de autenticação.

### RF02 – Dashboard de Visão Geral

- **Card de Indicadores:** Apresentar em container consolidado:
  - Saldo Líquido do mês atual;
  - Somatório consolidado das Entradas do mês;
  - Somatório consolidado das Saídas do mês.
- **Gráfico de Evolução Financeira:** Fundo integrado (`#161B22`), contendo:
  - Eixo cartesiano de referência horizontal estabelecido no valor R$ 0;
  - Barras verticais para Entradas posicionadas acima do eixo zero (`#3FB950`);
  - Barras verticais para Saídas projetadas abaixo do eixo zero (`#F85149`);
  - Linha contínua cinza clara (`#E6EDF3`) traçando o histórico do Saldo Líquido mês a mês;
  - **Interatividade via Hover:** Ao passar o mouse sobre cada mês ou nó do gráfico, exibir um card flutuante (tooltip) detalhando os valores numéricos exatos de Entradas, Saídas e Saldo Líquido apurado.
- **Painel de Atividades Recentes:** Listagem sequencial ordenada com os cards das transações mais recentes.

### RF03 – Gestão de Transações

- **Mecanismos de Filtragem:** Permitir refinamento simultâneo por:
  - Tipo de movimentação (Todas, Entradas ou Saídas);
  - Categoria (dentre as 15 categorias oficiais com indicador de sua respectiva cor);
  - Intervalo temporal (Dia, Mês ou Ano).
- **Busca Dinâmica:** Campo de entrada de texto com pesquisa em tempo real aplicada à descrição do registro.
- **Exportação:** Botão funcional para exportar a listagem filtrada para arquivo de dados (CSV ou PDF).
- **Manutenção:** Botões individuais para edição e exclusão de qualquer transação listada.

### RF04 – Visualização em Calendário Financeiro

- Renderizar grade mensal com distribuição dos dias do mês corrente.
- Indicar em cada dia o saldo consolidado e a densidade de movimentações registradas naquela data.
- Disparar, ao clique em um dia específico, um modal ou gaveta lateral (drawer) exibindo detalhadamente todas as transações que ocorreram na data selecionada.

### RF05 – Análise de Gastos por Categoria

- **Gráfico Donut:** Exibir a proporção percentual de despesas por categoria com espessura fina, respeitando a paleta semântica oficial.
- **Centro Informativo Estático:** O miolo do donut deve apresentar de forma permanente o somatório do gasto total do período selecionado.
- **Interatividade via Hover:** Ao passar o cursor sobre qualquer fatia, o centro do donut deve alternar dinamicamente para exibir o nome da categoria selecionada, o montante nominal consumido e a sua porcentagem relativa sobre o total.
- **Listagem Analítica:** Lista lateral ou inferior exibindo o montante monetário de cada categoria acompanhado de barras proporcionais preenchidas na respectiva cor.

### RF06 – Chat com Inteligência Artificial para Registros

- Painel conversacional dedicado contendo histórico de mensagens e caixa de entrada para prompts de texto.
- Interpretação de instruções financeiras expressas em linguagem natural informal (ex.: "Paguei 35 reais de combustível no débito hoje").
- Antes da gravação definitiva, a interface deve retornar uma prévia interativa do card de transação com os campos identificados (valor, categoria sugerida, tipo e data) exigindo confirmação explícita do usuário.

### RF07 – Padrão Visual dos Cards de Transação

Cada registro de movimentação financeira deve adotar a estrutura de card padrão:

- Tag ou pílula contendo o nome da Categoria preenchida com sua cor semântica exclusiva;
- Descrição/Nome da transação;
- Data e horário de lançamento formatados;
- Valor monetário (em verde `#3FB950` para entradas e vermelho `#F85149` para saídas);
- **Tag de Parcelamento:** Identificador em formato textual (ex.: 2x, 10x) exibido estritamente quando a transação possuir 2 ou mais parcelas. Movimentações à vista ou pagamentos integrais não devem renderizar este elemento.

### RF08 – Autenticação e Sessão

- **Tela de Login:** Autenticação via e-mail e senha, com opção de persistência de sessão e link direto para cadastro de nova conta.
- **Tela de Cadastro:** Formulário de registro com validações de interface (Nome, E-mail, Senha e Confirmação de Senha).
- **Logout:** Encerramento seguro de sessão com descarte do estado de autenticação e redirecionamento obrigatório para a tela de Login.

### RF09 – Aba de Perfil do Usuário

- Visualização e edição de dados de identificação (Nome, E-mail, Avatar do usuário).
- Painel de preferências gerais do sistema e gerenciamento de conta.

## 4. Requisitos Não-Funcionais (RNF)

- **RNF01 – Responsividade Completa:** A interface deve adaptar-se de maneira nativa a telas de smartphones (largura mínima de 320px), tablets (768px a 1023px), notebooks (1024px a 1439px) e monitores amplos de desktop (1440px ou superior), sem quebras de layout ou truncamento de dados financeiros.
- **RNF02 – Liberdade Tecnológica de Implementação:** Fica liberada a escolha de bibliotecas, frameworks e pré-processadores modernos para a construção do front-end (ex.: React, Next.js, Vue, Svelte, Tailwind CSS, SASS, Chart.js, Recharts ou ApexCharts), priorizando modularidade e manutenibilidade.
- **RNF03 – Organização Arquitetural e Boas Práticas:** O código-fonte deve observar separação estrita de responsabilidades por módulos/componentes, identação uniforme, comentários descritivos em funções críticas e nomenclatura semântica consistente.
- **RNF04 – Ergonomia Visual e Acessibilidade:** Conformidade com as diretrizes de contraste WCAG AA sobre o fundo escuro fosco, garantindo ausência de ofuscamento visual e proporcionando leitura confortável durante períodos prolongados de uso.
```

---

## 💬 Interações com o Claude Code

> Crie o sistema com base no seguinte PRD (Documento de Requisitos de Software): {PRD}

> Gostaria que todos os hovers do app tivessem uma transição mais tranquila, tanto nos gráficos quanto nos cards. Mudar a lógica de parcelamento: sempre que registrar uma transação parcelada você deverá dividir o valor ao longo dos meses, por exemplo: ao registrar uma compra de um celular no valor de 1500 em 5x o app deverá registrar cada parcela de 300 reais nos próximos 5 meses, e na tag do parcelamento, ao invés de mostrar um "5x", deverá mostrar 1/5, 2/5, 3/5... a depender da parcela em questão. O gráfico de categorias deve ser um pouco mais grosso. O chat de IA deve ocupar "toda" a tela ao invés de ser apenas um card, e o assistente se chama Fin.

> Adicionar um hover nas legendas do gráfico de evolução financeira (entradas, saídas e saldo líquido): ao fazer o hover, o gráfico específico deve ficar em destaque enquanto os outros ficam mais ofuscados (não se esqueça da transição). Adicionar horário nas transações deve ser opcional. Adicione uma checkbox de "parcelamento" no menu de adicionar ou editar transações; o campo de quantidade de parcelas só deve aparecer caso essa checkbox esteja marcada. As mensagens de resposta do chat IA estão muito grandes: mantenha apenas o card com os botões e um texto mais amigável, como um comentário sobre a despesa. No calendário devem aparecer os últimos dias do mês anterior e os primeiros dias do próximo mês de forma ofuscada.

> O destaque por série no gráfico de evolução ficou bom, mas não quero que o mesmo valha direto no gráfico, apenas na legenda. O chat IA está com duas scrollbars: deixe apenas a do chat e remova a da página. Além disso, quero que as mensagens do chat IA passem por trás da barra de digitação ao invés de sumir atrás da div. Ao invés do botão de sair no menu lateral, adicione 3 pontinhos e, ao clicar neles, mostre as opções de editar perfil e de sair.

> Ao invés do menu lateral colapsar em um menu de hambúrguer nas telas mobile, eu gostaria que ele virasse uma nav bar na parte inferior da tela com os ícones de cada aba do app. Remova o botão "limpar conversa" do chat IA: é melhor que as conversas antigas carreguem ao rolar para cima, assim a scrollbar não fica cada vez menor com o tempo.

> Estou fazendo esse app pois é o desafio de um curso, e o objetivo é criar "o conceito do seu próprio App de Organização de Finanças Pessoais com IA". Nesse caso, acredito que o app não vai necessitar de uma tela de login, cadastro e perfil.

---

## 🎯 Resultado Final

Acesse o app publicado no GitHub Pages:  
**[ycborg.github.io/dio-lab-vibe-coding-app-financas](https://ycborg.github.io/dio-lab-vibe-coding-app-financas/)**

### 🖥️ Desktop

Tour pela Visão Geral, filtros de transações e registro de uma despesa pelo chat com o Fin.

https://github.com/user-attachments/assets/0d4c2e1e-2c7b-4eea-927f-e36c6fcfba55

### 📱 Mobile

Navegação pela barra inferior, novo lançamento com seletor de categorias, donut de gastos e chat com o Fin.

https://github.com/user-attachments/assets/6729e1e6-42cd-432e-a7d3-b6f9974e9e3e

---

## 🔍 Funcionalidades do App de Organização Financeira

### 1. Dashboard Financeiro (Visão Geral)

- Card consolidado com os indicadores do mês atual:
  - **Saldo líquido**: diferença entre entradas e saídas, com o número de movimentações do mês
  - **Entradas**: somatório dos ganhos do mês
  - **Saídas**: somatório dos gastos do mês e quanto representam das entradas
- Lista de **atividades recentes** com as últimas transações (parcelas futuras não aparecem como recentes)
- Botão para registrar uma nova transação

### 2. Gráfico de Evolução Financeira

- Barras de **entradas acima** e de **saídas abaixo** do eixo R$ 0, com uma **linha de saldo líquido** mês a mês
- Período de **6 ou 12 meses**, selecionável no próprio card (a escolha fica salva)
- **Tooltip** ao passar o mouse sobre um mês, com entradas, saídas e saldo exatos
- **Destaque por série na legenda**: ao passar o mouse em "Entradas", "Saídas" ou "Saldo líquido", a série fica em destaque e as demais são ofuscadas
- Transições suaves, navegação por teclado (setas) e tabela equivalente para leitores de tela

### 3. Gestão de Transações

- **Filtros simultâneos** por tipo (todas, entradas ou saídas), categoria (com a cor de cada uma) e período (dia, mês, ano ou todo o período)
- **Busca em tempo real** pela descrição
- Lista **agrupada por dia**, com o total de entradas, saídas e saldo do filtro aplicado
- **Exportação** da listagem filtrada em **CSV** (compatível com o Excel em português) ou **PDF**
- **Edição e exclusão** de qualquer transação, com confirmação antes de excluir
- Formulário com tipo, descrição, valor, categoria, data, **horário opcional** e forma de pagamento

### 4. Parcelamento

- Checkbox **"Compra parcelada"** no formulário: o campo de quantidade de parcelas só aparece quando marcada
- O valor é **dividido ao longo dos meses**: uma compra de R$ 1.500 em 5x gera 5 lançamentos de R$ 300, um por mês a partir do mês da compra
- Prévia do valor de cada parcela enquanto você digita (ex.: "5x de R$ 300,00, uma por mês")
- Tag de parcela no formato **1/5, 2/5, 3/5…**
- Editar uma parcela edita a compra inteira; ao excluir, você escolhe remover **só a parcela** ou **todas**

### 5. Calendário Financeiro

- Grade mensal com o **saldo do dia** e a **densidade de movimentações** em cada data
- **Dias do mês anterior e do próximo** aparecem ofuscados para completar as semanas
- Resumo de entradas, saídas e saldo do mês exibido
- Ao clicar em um dia, uma **gaveta lateral** mostra todas as transações da data, com opção de adicionar uma nova nela

### 6. Análise de Gastos por Categoria

- **Gráfico donut** com a proporção das despesas, respeitando a cor oficial de cada uma das 15 categorias
- Centro com o **gasto total** do período; ao passar o mouse sobre uma fatia, mostra o nome da categoria, o valor e a porcentagem
- **Lista analítica** com o valor de cada categoria, o número de lançamentos e uma barra proporcional na cor da categoria
- Análise por **mês** ou por **ano**

### 7. Chat com o Fin (Assistente de IA)

- Chat em **tela cheia** para registrar transações em **linguagem natural**, por exemplo "Paguei 35 reais de combustível no débito hoje"
- O Fin identifica **valor, tipo, categoria, data, horário (quando citado), forma de pagamento e parcelas**
- Antes de gravar, mostra uma **prévia do card** com um comentário curto e amigável, e os botões **Descartar**, **Ajustar** e **Confirmar**
- Responde a perguntas de resumo, como "Quanto gastei este mês?"
- Sugestões de frases prontas para começar
- As mensagens passam **por trás da barra de digitação**, e as **conversas antigas carregam ao rolar para cima**

### 8. Navegação e Responsividade

- **Desktop:** menu lateral fixo com o logotipo e as 5 abas
- **Mobile:** barra de navegação **inferior** com os ícones de cada aba
- Layout adaptado de **320px a 1440px+**, sem rolagem horizontal ou dados cortados

### 9. Identidade Visual e Acessibilidade

- Estética **Matte Obsidian**: modo escuro, plano e fosco, com logotipo "Fin-Chart em barras"
- **Contraste WCAG AA** em todos os textos
- Navegação completa por teclado, foco visível e rótulos para leitores de tela
- Transições suaves e respeito à preferência de **movimento reduzido** do sistema

### 10. Dados

- Não precisa de cadastro: o app já abre com cerca de **6 meses de dados de exemplo**
- Os dados ficam salvos **no próprio navegador** (localStorage)

---

## 🧠 Reflexão

### O que funcionou bem?

Usar um prompt inicial bem grande e detalhado, especificando os objetivos gerais e específicos, os requisitos funcionais e não funcionais e também passando toda a identidade visual do app, faz total diferença.

### O que não funcionou como o esperado?

Acredito que é difícil para um app genérico como esse ter uma identidade visual única. Vibe codar sem ter muita experiência em branding pode deixar seu app/site com bastante cara de site feito por IA.

### O que aprendi sobre conversar com IAs?

Aprendi que é importante ter em mente exatamente o que quer desenvolver antes de escrever o seu prompt, pois quanto mais detalhes, melhores são os resultados. Fazer alguns brainstorms com a IA previamente pode ajudar bastante.
