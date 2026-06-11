# Monte Carmelo Design System

Sistema de design para os apps da **Igreja Monte Carmelo** — uma igreja interdenominacional cuja vida em comunidade gira em torno dos **GCs (Grupos de Crescimento)**, pequenos grupos que se reúnem semanalmente em casas para comunhão, estudo bíblico e cuidado pastoral mútuo.

> _"Cuidando de cada GC, multiplicando comunidades."_
> Sistema de design enxuto e acessível para apps de igreja em pequenos grupos e discipulado.

---

## Produtos cobertos

Dois apps mobile de **administração de GCs**, mesma base visual. Membros comuns não têm acesso — o acesso é concedido pela liderança a usuários específicos:

1. **App de Líderes de GC** — usado por líderes e líderes em treinamento para administrar o grupo: encontros, chamada de presença, visitantes, membros e séries de lições.
2. **App do Pastor / Coordenador** — visão de gestão: dashboard de saúde dos GCs, lista de grupos, relatórios de presença, acompanhamento de pessoas e **multiplicação de GCs** (ação exclusiva do pastor).

Ambos compartilham componentes e tokens. O segundo adiciona views de gestão (KPIs, listas, relatórios).

---

## Origem e fontes

| Item | Caminho |
|---|---|
| Manual de Identidade Visual oficial (PDF, 19 páginas, agência Salt) | `assets/manual-identidade.pdf` |
| Logo principal (PNG, transparência) | `assets/logo-monte-carmelo.png` |
| Notas extraídas do manual | `brand-extract.md` |
| Tokens (cores, tipografia, espaçamento, etc.) | `colors_and_type.css` (entrada canônica: `styles.css`) |
| Componentes compilados (12: Avatar, Chip, Button, ListItem, KpiCard, PhoneShell, Sheet, ScreenHeader, SectionRow, EmptyState, SearchField…) | `components/*.jsx` + `components/*.d.ts` — disponíveis em `window.MonteCarmeloDesignSystem` via `_ds_bundle.js` |

> ⚠️ **Não havia codebase nem Figma anexados** — apenas o manual de identidade da marca-mãe (Igreja Monte Carmelo) e o logo. As decisões de UI mobile (paleta de apoio, escala de espaçamento, sombras, padrões de componentes) foram derivadas a partir do manual + a direção visual escolhida pelo usuário (_"Natural / orgânico — verdes, terrosos, papel"_) e estão claramente sinalizadas como extensões.

---

## Index do projeto

```
.
├── README.md                  ← você está aqui
├── SKILL.md                   ← cross-compatible com Agent Skills
├── styles.css                 ← entrada canônica (importa colors_and_type.css)
├── colors_and_type.css        ← tokens (cores, tipo, spacing, sombras, motion)
├── brand-extract.md           ← fatos extraídos do manual oficial
├── assets/
│   ├── logo-monte-carmelo.png
│   ├── manual-identidade.pdf
│   └── pattern-monte.svg      ← pattern derivado do símbolo
├── fonts/
│   └── README.md              ← Open Sans (atualmente via Google Fonts CDN)
├── preview/                   ← cards individuais que populam a aba Design System
│   ├── logo.html, colors-brand.html, type-scale.html, ...
├── ui_kits/
│   ├── app-lideres/           ← UI kit do app de líderes (líderes + em treinamento)
│   │   ├── README.md
│   │   ├── index.html         ← protótipo click-thru
│   │   └── components/*.jsx
│   └── app-pastores/          ← UI kit do app de pastores/coordenadores
├── components/                ← componentes compilados + tipados (bundle)
│   ├── Avatar / Chip / Button / ListItem / KpiCard
│   ├── PhoneShell             ← moldura completa (status bar, viewport, toast, tab bar)
│   ├── Sheet / ScreenHeader / SectionRow
│   └── EmptyState / SearchField
├── templates/                 ← pontos de partida (Design Components)
│   ├── tela-app-mobile/       ← tela padrão dos apps (moldura + header + cards + tab bar)
│   ├── tela-app-pastores/     ← tela de gestão (KPIs + alertas + status)
│   ├── sheet-formulario/      ← bottom sheet de criação/edição
│   └── tela-login/            ← primeiro acesso (acesso concedido)
│       ├── README.md
│       ├── index.html
│       └── components/*.jsx
└── uploads/                   ← materiais originais enviados pelo usuário
```

---

## Conceito da marca

O símbolo M de **Monte Carmelo** condensa cinco símbolos cristãos em uma forma só (extraído do manual oficial):

| Elemento | Significado |
|---|---|
| **Inicial M / Monte** | As pontas triangulares formam um monte — referência ao Monte Carmelo (1 Reis 18) e aos lugares bíblicos onde se encontrava com Deus. |
| **Triângulo + seta para cima** | Trindade (Pai, Filho e Espírito Santo); também alusão a "avançar, crescer, prosseguir". |
| **Gota central** | O sangue de Jesus. |
| **Peixe** (forma negativa entre o M e a gota) | Símbolo histórico do cristianismo (Ichthys). |
| **Círculo externo** | Proteção, cuidado de Deus; aliança / fidelidade; globo terrestre — o mundo onde a igreja se manifesta. |

Esses cinco símbolos viram pista de leitura do design: **proteção (círculo), crescimento (seta), cuidado (gota), discipulado (peixe), encontro (monte)** são as ideias que a UI do app deve evocar.

---

## Content Fundamentals

### Tom de voz
- **Acolhedor, pastoral, próximo.** O app fala com o usuário como um irmão fala com outro — não como uma plataforma corporativa.
- **Tratamento "você"**, sempre. Nunca "v., usuário, sr./sra."
- **Casing natural** (sem all-caps em texto corrente; reservado para o tipograma da marca e _eyebrows_).
- **Pessoa do plural inclusivo ("a gente", "nosso GC", "vamos")** para sensações de pertencimento.
- **Imperativos suaves** ("vamos lá", "dá uma olhada", "já bora?") em CTAs casuais; imperativos diretos ("Confirmar presença", "Salvar") em ações estruturais.

### Vocabulário-chave
- **GC** = Grupo de Crescimento (sempre como sigla na UI; "Grupo de Crescimento" só na primeira menção em onboarding/help).
- **Anfitrião(ã)** = quem hospeda o encontro na semana.
- **Líder / Líder em treinamento** = papéis formais do GC com acesso ao app de líderes. O líder em treinamento percorre uma **trilha de treinamento** e é o candidato natural a liderar o novo GC numa multiplicação.
- **Encontro** > "reunião" (mais quente).
- **Presença** > "check-in" no texto exibido — mas o botão pode usar "Fazer check-in" porque já é vocabulário estabelecido.
- **Pedido de oração** (não "request") — na v1 é registrado como nota do encontro, não compartilhado no app.
- **Multiplicar** = quando um GC se divide em dois novos. Verbo emocionalmente positivo. Ação exclusiva do pastor, no app de pastores.

### Emoji
- ❌ **Não.** O manual não usa, e a estética "papel/orgânica" pede iconografia consistente em vez de emoji misturado. Use ícones Phosphor.

### Microcopy — exemplos
| Em vez de | Use |
|---|---|
| "Erro: campo obrigatório" | "Falta preencher esse campo." |
| "Operação realizada com sucesso." | "Pronto, presença confirmada 🌱" — _sem_ o emoji: "Pronto, presença confirmada." |
| "Você não tem grupos cadastrados" | "Seu GC ainda não tem encontros registrados. Marque o primeiro." |
| "Logout" | "Sair" |
| "Submit" / "Confirm" | "Confirmar" |
| "Loading..." | "Carregando…" |
| Empty state genérico | "Aqui ficam seus pedidos de oração. Quando alguém compartilhar um, aparece aqui pra você orar junto." |

### Casing
- Títulos de tela: **Sentence case** ("Meus pedidos de oração").
- Botões: **Sentence case** ("Confirmar presença").
- _Eyebrows_ / etiquetas de seção: **ALL CAPS com tracking 0.18em** (ecoa o tipograma "IGREJA MONTE CARMELO" do logo).
- Datas: "qua, 12 de mar" — abreviadas em PT-BR, dia/mês escrito.

### Conteúdo bíblico
- Citações bíblicas em **itálico**, com referência abaixo em `caption`. Use a classe `.scripture`.
- Referência sempre como `Salmo 23.1` (com ponto, padrão brasileiro), não `Psalm 23:1`.

---

## Visual Foundations

### Paleta
**Cores oficiais do manual** (obrigatórias):

| Token | HEX | Uso |
|---|---|---|
| `--carmelo-teal` | `#00A499` | Cor primária — ações, destaques, marca |
| `--carmelo-gray` | `#63666A` | Cor secundária — texto, ícones, base |

**Extensão para UI mobile** (não está no manual, criada para tela):

- **Escala teal** (50→900) para estados, _soft fills_, hover/press.
- **Escala gray** (50→900) para texto e bordas.
- **Apoio quente:** `paper #FAF6EF` (fundo dominante), `paper-deep #F2EBDD` (sunken), `sand #E8DCC4` (chips), `clay #C8896B` (uso pontual), `forest #1F4A45` (ênfase profunda), `sage #9CB7A4` (chips frios-mornos).

A regra de uso: **paper como fundo principal**, branco apenas em superfícies elevadas (cards, modais), teal só em ações primárias e elementos de marca, terra/sand para chips e dividers de seção.

### Tipografia
- **Open Sans** — única família (mandato do manual). Hierarquia construída com peso e tamanho.
- Light (300) para tipograma e citações.
- Regular (400) para corpo.
- Bold (700) para títulos.
- Letterspacing `0.18em` reservado para texto que ecoa o tipograma da marca (eyebrows, label de versão).

### Espaçamento
- **Escala 4px** (`--space-1` a `--space-16`).
- **Padding interno mínimo de cards: 16px**, generoso (20-24px) em superfícies pastorais.
- **Listas em mobile:** itens com 64-72px de altura (toque confortável; nunca abaixo de 44px).

### Backgrounds
- **Papel quente** como tela base — não branco puro. Cria sensação de calma/livro/jornal de igreja.
- **Sem gradientes coloridos** (anti-AI-slop).
- **Pattern sutil opcional:** triângulos/montes em opacidade 4-8% no topo de telas-marco (boas-vindas, devocional). Disponível em `assets/pattern-monte.svg`.
- **Sem imagens fotográficas full-bleed por padrão** — quando usadas (devocional, eventos), foto com filtro warm/desaturate sutil.

### Motion
- **Durações curtas:** 120-220ms. Nada acima de 360ms.
- **Easing:** `cubic-bezier(.2, .7, .25, 1)` (out) é o padrão. _Spring_ apenas em confirmação positiva (presença confirmada).
- **Fades + slides discretos** ao trocar tela (12-16px de translação).
- **Nunca bounces fortes ou wobble.** Tom contemplativo.

### Hover / Press
- **Hover (web):** ações primárias escurecem 1 step (`--brand` → `--brand-hover`); links e ícones subem opacidade `0.7→1` com `0.1s ease-out`.
- **Press (mobile):** scale `0.97`, opacidade `0.9`, sem cor diferente. Use `transform-origin: center`.
- **Estado focus** (acessibilidade): `outline: 2px solid var(--brand)` com `outline-offset: 2px`.

### Bordas, sombras, radii
- **Radii padrão:** 10px (cards, inputs), 14px (cards-hero), 20px+ (modais, sheets), pill (chips, botões secundários).
- **Bordas:** `rgba(99,102,106, 0.18)` — derivada da cor secundária do manual; nunca preto.
- **Sombras:** quatro níveis (`--shadow-1` a `--shadow-4`), todas em `rgba(21,22,26,0.04-0.12)` — sempre suaves, baseadas em cinza-grafite (não preto), evocando papel.
- **Sombra de marca** (`--shadow-brand`) só em elementos teal flutuantes, nunca em superfície neutra.

### Transparência e blur
- **Sheets/modals:** overlay `rgba(21,22,26, 0.45)` (sem blur dramático; um leve `backdrop-filter: blur(2px)` ok em iOS).
- **Tab bars iOS:** translúcida com `backdrop-filter: blur(20px) saturate(180%)` sobre `rgba(250, 246, 239, 0.78)`.
- **Não usar gradientes** em superfícies; permitido apenas em "splash" do logo se necessário.

### Cards
- Fundo branco (`--bg-elevated`) sobre paper.
- `border-radius: 14px`, `padding: 20px`.
- `box-shadow: var(--shadow-2)`. **Sem borda visível** (a sombra basta).
- Cards de destaque (próximo encontro, devocional do dia): `border-radius: 20px`, `padding: 24px`, com tipograma _eyebrow_ no topo em teal/forest.

### Imagens
- **Vibe:** quente, levemente dessaturada, granulada. Nunca azul-frio ou hyper-saturada.
- **Filtro CSS sugerido em fotos:** `saturate(0.92) contrast(1.02)`.
- **Pessoas em fotos:** preferir grupos pequenos / estudos bíblicos / casas / mãos / cafés — não imagens corporativas.

### Layout
- **Largura mobile padrão:** 390px (iPhone 14).
- **Padding lateral de tela:** 20px.
- **Tab bar inferior:** 64-72px de altura, ícones Phosphor regular, label opcional 11px.
- **Header:** título grande em h1 (sentence case), subtítulo opcional em body-sm muted.
- **Fixed elements:** header pode colar no topo; tab bar sempre fixa; safe-area iOS respeitada.

---

## Iconography

- **Sistema escolhido:** [Phosphor Icons](https://phosphoricons.com/) — peso `regular` (1.5px stroke).
  - Por que: humanista, calmo, sem o recorte excessivamente moderno do Lucide; bem alinhado à estética "natural/orgânico".
  - **Substituição sinalizada:** o manual não define iconografia. Phosphor é uma escolha do design system; pode ser trocada por Lucide ou Heroicons sem retrabalho dos componentes.
- **Carga via CDN** (Phosphor web): `<link href="https://cdn.jsdelivr.net/npm/@phosphor-icons/web@2.1.1/src/regular/style.css" rel="stylesheet" />`. Use `<i class="ph ph-house"></i>`.
- **Tamanhos:** 16, 20, 24px em UI; 32-48px em estados vazios e hero.
- **Cor padrão:** `currentColor`. Nunca aplique cores fora dos tokens.
- **Ícones-chave do app** (mapeados):
  - GCs / pessoas → `ph-users-three`
  - Encontro / reunião → `ph-calendar-blank`
  - Presença → `ph-check-square`
  - Pedido de oração → `ph-hands-praying`
  - Devocional → `ph-book-open-text`
  - Pastor / liderança → `ph-crown-simple`
  - Casa / anfitrião → `ph-house-line`
- **Emoji:** não usado.
- **Ícones em PNG/sprite próprio:** o projeto não tem. Tudo via Phosphor.

---

## Logo: regras essenciais

(Ver manual completo em `assets/manual-identidade.pdf` para diagrama de construção, campo de proteção e usos incorretos.)

- **Versões:** positivo (símbolo teal + tipograma cinza), negativo (sobre fundo teal/forest, tudo branco), monocromática.
- **Redução máxima:** 90px em tela / 30mm impresso.
- **Campo de proteção:** uma faixa de largura X (altura do "M") ao redor do logo, livre de qualquer outro elemento.
- **Não:** distorcer, mudar cor do símbolo, alterar fonte, inclinar, aplicar contorno, usar transparência, aplicar sobre fundo de baixo contraste.

---

## Como ler este sistema

1. Revise os **cards do Design System** (aba lateral) para inspecionar tokens e componentes-chave.
2. Abra os UI kits (`ui_kits/app-lideres/index.html` e `ui_kits/app-pastores/index.html`) para ver protótipos click-thru.
3. Para criar novas telas: importe `styles.css` (que carrega os tokens) e use os componentes compilados (`window.MonteCarmeloDesignSystem.Avatar/Chip/Button/ListItem/KpiCard`, via `_ds_bundle.js`) ou os componentes JSX dos UI kits como base. Não invente cores — use os tokens.
4. Quando criar artefatos de prototipagem, copie `assets/logo-monte-carmelo.png` em vez de referenciá-lo cross-project.
