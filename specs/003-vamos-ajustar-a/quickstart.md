# Quickstart: Validação Manual da Identidade Visual

**Feature**: 003-vamos-ajustar-a
**Date**: 2025-10-18
**Language**: Brazilian Portuguese (pt-BR)

## Overview

Este guia fornece cenários de teste manual para validar a implementação da nova identidade visual "Igreja Monte Carmelo". Execute estes cenários **após** implementação completa, antes de merge.

---

## Pré-requisitos

### Ambiente
- ✅ Aplicação web rodando localmente (`cd web && npm run dev`)
- ✅ Banco de dados Supabase rodando (local ou staging)
- ✅ Browser moderno (Chrome, Firefox, Safari - últimas 2 versões)

### Dados de Teste
- ✅ Usuário de teste autenticado válido (email/senha conhecidos)
- ✅ Pelo menos 1 GC cadastrado no banco (para testar navegação)

### Ferramentas
- ✅ DevTools do browser (F12)
- ✅ Extensão de inspeção de contraste (opcional: WebAIM Contrast Checker)
- ✅ Device simulators para testes mobile (DevTools → Toggle device toolbar)

---

## Cenário 1: Logo e Cores na Página de Login

**Objetivo**: Verificar que logo, cores teal/cinza e identidade visual estão corretas na tela de login.

### Passos

1. **Acessar login**
   - Abrir browser em `http://localhost:3000/login`
   - Se já autenticado, fazer logout primeiro

2. **Verificar logo**
   - [ ] Logo circular teal com texto "IGREJA MONTE CARMELO" (cinza) está centralizado no topo
   - [ ] Logo tem alt text "Igreja Monte Carmelo - Grupos de Crescimento" (inspecionar elemento `<img>`)
   - [ ] Logo não está distorcido (proporção correta)

3. **Verificar cores**
   - [ ] Heading "Bem-vindo" em cinza escuro (#5a5a5a ou próximo)
   - [ ] Botão "Entrar" cor teal (#17a2b8 ou próximo)
   - [ ] Hover no botão "Entrar" escurece levemente

4. **Verificar tipografia**
   - [ ] Font família Inter (ou system fallback consistente)
   - [ ] Texto legível, sem overflow ou truncamento

### Critérios de Aceitação

✅ **PASS** se:
- Logo visível, centralizado, alt text correto
- Cores teal (botão) e cinza (texto) aplicadas
- Hover states funcionais

❌ **FAIL** se:
- Logo ausente ou com texto fallback (sem erro intencional)
- Cores incorretas (ainda azul padrão, sem teal)
- Layout quebrado

---

## Cenário 2: Dashboard com Cards de Navegação

**Objetivo**: Validar novo dashboard home com cards GC/Eventos/Lições/Membros e header global.

### Passos

1. **Login bem-sucedido**
   - Preencher email/senha válidos
   - Clicar "Entrar"
   - [ ] Aguardar redirect

2. **Verificar URL**
   - [ ] URL é `http://localhost:3000/dashboard` (nova home)
   - [ ] Não redireciona para `/gc` ou outra rota

3. **Verificar header global**
   - [ ] Header sticky no topo com logo + texto
   - [ ] Texto "Igreja Monte Carmelo" visível
   - [ ] Subtítulo "Grupos de Crescimento" visível
   - [ ] Header permanece ao scrollar (se página tiver scroll)

4. **Verificar mensagem de boas-vindas**
   - [ ] Heading "Bem-vindo" visível (pode incluir nome do usuário se implementado)

5. **Verificar cards de navegação**
   - [ ] 4 cards visíveis:
     - **GC** com ícone de pessoas (`Users` Lucide icon)
     - **Eventos** com ícone de calendário (`Calendar` Lucide icon)
     - **Lições** com ícone de livro (`BookOpen` Lucide icon)
     - **Membros** com ícone de pessoa com check (`UserCheck` Lucide icon)
   - [ ] Todos ícones cor teal (#17a2b8)
   - [ ] Títulos em negrito, cor cinza escuro
   - [ ] Cards têm sombra sutil e aumentam sombra no hover

6. **Testar navegação**
   - Clicar no card **"GC"**
   - [ ] Redireciona para `/gc` (página de listagem de GCs, antiga home dashboard)
   - Voltar para `/dashboard`
   - Clicar nos outros cards (**Eventos**, **Lições**, **Membros**)
   - [ ] Cada card redireciona para sua respectiva rota

### Critérios de Aceitação

✅ **PASS** se:
- Dashboard home em `/dashboard` com header + 4 cards
- Cards navegam para rotas corretas
- Header global presente com branding correto

❌ **FAIL** se:
- Ainda mostra listagem de GCs em `/dashboard` (rota não reorganizada)
- Cards ausentes ou com ícones incorretos
- Header ausente ou sem logo/texto

---

## Cenário 3: Responsividade Mobile

**Objetivo**: Validar que layout se adapta corretamente em dispositivos móveis (320px - 768px).

### Passos

1. **Abrir DevTools**
   - F12 → Toggle device toolbar (Ctrl+Shift+M / Cmd+Shift+M)

2. **Testar viewport 375px (iPhone padrão)**
   - Selecionar "iPhone SE" ou custom 375x667px
   - Navegar para `/dashboard`
   - [ ] Cards empilhados verticalmente (não grid 2x2)
   - [ ] Textos legíveis, sem overflow horizontal
   - [ ] Header compacto mas funcional
   - [ ] Logo visível (pode ser menor)
   - [ ] Espaçamento adequado entre cards (gap visível)

3. **Testar viewport 320px (mínimo suportado)**
   - Custom viewport: 320x568px
   - [ ] Interface ainda utilizável
   - [ ] Cards não quebrados
   - [ ] Textos podem ser menores mas legíveis
   - [ ] Scrolling vertical funcional
   - [ ] Sem overflow horizontal (`<html>` sem scrollbar lateral)

4. **Testar viewport 768px (tablet, grid ativa)**
   - Custom viewport: 768x1024px
   - [ ] Cards mudam para grid 2x2
   - [ ] Espaçamento maior entre cards (gap-6)
   - [ ] Header expande com logo maior
   - [ ] Layout balanceado (não muito espaçado nem apertado)

5. **Testar interações touch (simular)**
   - Hover no card → verificar shadow aumenta
   - Clicar card → navegação funciona

### Critérios de Aceitação

✅ **PASS** se:
- 320px: Interface utilizável, sem overflow
- 375px: Layout otimizado, espaçamentos normais
- 768px: Grid 2x2 ativa, visual melhorado

❌ **FAIL** se:
- 320px: Texto truncado, layout quebrado
- Grid 2x2 não ativa em 768px+
- Overflow horizontal em qualquer viewport

---

## Cenário 4: Consistência de Branding entre Páginas

**Objetivo**: Verificar que header global e identidade visual permanecem consistentes ao navegar.

### Passos

1. **Navegar entre páginas autenticadas**
   - Iniciar em `/dashboard`
   - Clicar card "GC" → `/gc`
   - [ ] Header permanece idêntico (logo + texto)
   - [ ] Logo não muda ou recarrega (deve ser mesmo componente)

2. **Navegar para outras seções**
   - De `/gc` clicar em navegação para `/eventos` (se houver nav ou voltar para dashboard e clicar card)
   - [ ] Header consistente
   - De `/eventos` para `/licoes`
   - [ ] Header consistente
   - De `/licoes` para `/membros`
   - [ ] Header consistente

3. **Verificar cores globais**
   - Em cada página (/gc, /eventos, /licoes, /membros):
   - [ ] Botões primários (se houver) cor teal
   - [ ] Headings cor cinza escuro
   - [ ] Background branco ou cinza claro (não azul ou outras cores)

4. **Verificar sticky header**
   - Scrollar para baixo em qualquer página com conteúdo longo (ex: `/gc` se houver muitos GCs)
   - [ ] Header permanece no topo (sticky)
   - [ ] Não sobrepõe conteúdo importante

### Critérios de Aceitação

✅ **PASS** se:
- Header idêntico em todas páginas autenticadas
- Logo não muda, texto consistente
- Cores teal/cinza aplicadas globalmente

❌ **FAIL** se:
- Header diferente entre páginas (logo falta em alguma)
- Cores inconsistentes (teal em uma página, azul em outra)
- Header não sticky ou sobrepõe conteúdo

---

## Cenário Edge Case: Fallback do Logo

**Objetivo**: Validar que texto fallback "Igreja Monte Carmelo" aparece quando imagem do logo falha.

### Passos

1. **Bloquear carregamento da imagem do logo**
   - Abrir DevTools → Network tab
   - Botão direito em lista de requests → "Block request URL"
   - Adicionar pattern: `*igreja-monte-carmelo.png` ou `/logo/*`
   - Ou usar extensão "Block Site Images"

2. **Recarregar página de login**
   - Hard refresh (Ctrl+Shift+R / Cmd+Shift+R)
   - [ ] Imagem do logo NÃO carrega (ícone quebrado ou espaço vazio temporário)
   - [ ] Texto "Igreja Monte Carmelo" aparece no lugar da imagem
   - [ ] Texto tem estilo adequado (semibold, cor text-dark)

3. **Verificar em dashboard também**
   - Navegar para `/dashboard` (com bloqueio ainda ativo)
   - [ ] Header mostra texto fallback em vez de logo
   - [ ] Layout não quebra (texto ocupa espaço do logo gracefully)

4. **Desbloquear e verificar restauração**
   - Remover bloqueio de URL
   - Recarregar página
   - [ ] Logo volta a carregar normalmente
   - [ ] Texto fallback não aparece mais

### Critérios de Aceitação

✅ **PASS** se:
- Fallback texto aparece quando imagem falha
- Texto legível e estilizado
- Layout não quebra

❌ **FAIL** se:
- Nada aparece (espaço vazio)
- Erro console não tratado (React error boundary)
- Layout quebrado sem logo

---

## Checklist Final de Validação

Antes de aprovar feature, confirmar todos cenários:

- [ ] **Cenário 1**: Logo e cores na login ✅
- [ ] **Cenário 2**: Dashboard com cards de navegação ✅
- [ ] **Cenário 3**: Responsividade mobile (320px, 375px, 768px) ✅
- [ ] **Cenário 4**: Consistência entre páginas ✅
- [ ] **Edge Case**: Fallback do logo funcional ✅

### Testes Adicionais (Opcional)

- [ ] Testar em múltiplos browsers (Chrome, Firefox, Safari)
- [ ] Testar em device real (smartphone físico)
- [ ] Verificar performance (Lighthouse score > 90)
- [ ] Verificar sem JavaScript (progressive enhancement - se aplicável)

---

## Relatório de Bugs (Exemplo)

Se encontrar problemas, documentar assim:

**Bug ID**: VID-001
**Cenário**: Cenário 2 - Dashboard cards
**Descrição**: Card "Lições" redireciona para `/licoes` mas página não existe (404)
**Severidade**: Alta
**Steps to Reproduce**:
1. Login → dashboard
2. Clicar card "Lições"
3. Observar erro 404

**Expected**: Página `/licoes` renderiza corretamente
**Actual**: 404 Not Found

---

## Aprovação

**Testado por**: [Nome do testador]
**Data**: [Data do teste]
**Resultado**:
- [ ] ✅ APROVADO - Todos cenários PASS
- [ ] ⚠️ APROVADO COM RESSALVAS - Bugs menores documentados
- [ ] ❌ REPROVADO - Bugs críticos impedem uso

**Comentários**:
[Observações adicionais sobre testes]

---

**Próximos Passos Após Validação**:
1. Se APROVADO → Criar PR para merge
2. Se REPROVADO → Corrigir bugs e re-executar quickstart
3. Executar testes E2E automatizados (`npm run test:e2e`)
4. Verificar build production (`npm run build`)
