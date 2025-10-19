# Quickstart: Área Administrativa - Teste Manual

**Feature**: 004-area-administrativa
**Date**: 2025-10-18
**Purpose**: Cenários de teste manual passo a passo para validar funcionalidades críticas da área admin

---

## Pré-requisitos

### Setup Inicial
1. **Banco de dados**: Ter migration `gc_multiplication_events` aplicada
2. **Usuário admin**: Ter pelo menos 1 usuário com `is_admin = true`
3. **Dados de teste**: Ter no mínimo:
   - 3 GCs ativos com membros
   - 5 usuários (pessoas) cadastradas
   - 1 série de lições com 3 lições
4. **Aplicação rodando**: `npm run dev` na pasta `web/`

### Acesso Admin
```
Email: admin@exemplo.com (ou seu usuário admin)
Password: [sua senha]
```

### Como verificar se é admin
```sql
SELECT u.id, p.name, u.is_admin
FROM users u
JOIN people p ON u.person_id = p.id
WHERE u.id = auth.uid();
```

---

## Cenário 1: Dashboard Administrativo

**Objetivo**: Verificar que dashboard exibe métricas e atividades recentes

### Passos

1. **Login**
   - Acesse http://localhost:3000/login
   - Entre com credenciais de admin
   - ✅ Deve redirecionar para `/dashboard`

2. **Acessar Área Admin**
   - Clique em algum link que leve para `/admin` (ou acesse diretamente)
   - URL: http://localhost:3000/admin
   - ✅ Deve carregar página sem redirecionar (você é admin)

3. **Verificar Métricas**
   - Observe 4 cards de métricas no topo:
     - Total de Usuários
     - Total de GCs Ativos
     - Total de Membros
     - Total de Visitantes
   - ✅ Cada card deve exibir um número (não "Carregando..." eternamente)
   - ✅ Números devem corresponder à realidade do banco

4. **Verificar Atividades Recentes**
   - Role para baixo até seção "Atividades Recentes"
   - ✅ Deve listar até 10 atividades (criação de usuários, GCs, reuniões)
   - ✅ Cada item deve ter: tipo, nome/descrição, data/hora

5. **Testar Ações Rápidas**
   - Clique no botão "Criar GC" (ou similar)
   - ✅ Deve redirecionar para `/admin/growth-groups/new`
   - Volte para dashboard (navegador ou botão Voltar)
   - Clique em "Criar Usuário"
   - ✅ Deve redirecionar para `/admin/users/new`

**Resultado Esperado**: Dashboard funcional com métricas corretas e navegação funcionando

---

## Cenário 2: Criar Grupo de Crescimento

**Objetivo**: Criar novo GC com líder e supervisor via interface admin

### Passos

1. **Navegar para Criação**
   - A partir do dashboard, clique em "GCs" na sidebar
   - URL deve ser `/admin/growth-groups`
   - Clique em botão "Criar GC" (ou "+ Novo GC")
   - ✅ Deve abrir formulário em `/admin/growth-groups/new`

2. **Preencher Informações Básicas**
   - Nome: "GC Teste Manual"
   - Modo: Selecione "Presencial"
   - Endereço: "Rua Teste, 123 - Bairro Teste"
   - Dia da semana: Selecione "Quarta-feira" (3)
   - Horário: "19:30"

3. **Selecionar Líder**
   - Campo "Líder Principal": Selecione um usuário existente (dropdown ou autocomplete)
   - ✅ Campo deve estar habilitado e com opções de usuários

4. **Selecionar Supervisor**
   - Campo "Supervisor(es)": Selecione pelo menos 1 usuário (diferente do líder)
   - ✅ Deve permitir selecionar múltiplos supervisores

5. **Adicionar Membros Iniciais** (opcional)
   - Se houver campo "Membros Iniciais": Selecione 2-3 usuários
   - ✅ Membros selecionados devem aparecer em lista

6. **Submeter Formulário**
   - Clique em "Criar GC" (ou "Salvar")
   - ✅ Deve exibir mensagem de sucesso (toast ou alert)
   - ✅ Deve redirecionar para `/admin/growth-groups` ou `/admin/growth-groups/[id]`

7. **Verificar GC Criado**
   - Na listagem de GCs, procure "GC Teste Manual"
   - ✅ Deve aparecer com status "Ativo"
   - ✅ Coluna de líder deve mostrar o usuário selecionado
   - ✅ Coluna de supervisores deve mostrar supervisor(es) selecionado(s)

8. **Verificar no Banco**
   ```sql
   SELECT * FROM growth_groups WHERE name = 'GC Teste Manual';
   -- Deve retornar 1 registro com status = 'active'

   SELECT ggp.*, p.name
   FROM growth_group_participants ggp
   JOIN people p ON ggp.person_id = p.id
   WHERE ggp.gc_id = '[ID_DO_GC_CRIADO]';
   -- Deve retornar participantes com roles: leader, supervisor, member
   ```

**Resultado Esperado**: GC criado com sucesso e visível na listagem, participantes com papéis corretos no banco

---

## Cenário 3: Editar Grupo de Crescimento

**Objetivo**: Modificar informações de um GC e adicionar membro

### Passos

1. **Navegar para Edição**
   - Em `/admin/growth-groups`, clique no GC "GC Teste Manual" (ou qualquer GC)
   - ✅ Deve abrir página `/admin/growth-groups/[id]` com detalhes do GC

2. **Verificar Seções**
   - ✅ Deve exibir seção "Informações Básicas" (nome, modo, endereço, etc.)
   - ✅ Deve exibir seção "Líderes e Supervisores"
   - ✅ Deve exibir seção "Membros"
   - ✅ Deve exibir seção "Histórico de Reuniões" (pode estar vazia)
   - ✅ Deve exibir seção "Visitantes" (pode estar vazia)

3. **Editar Informações Básicas**
   - Clique em "Editar" na seção de informações (se houver botão)
   - Ou campos já devem estar editáveis
   - Altere endereço para: "Rua Teste, 456 - Bairro Novo"
   - Altere horário para: "20:00"
   - Clique em "Salvar" (ou ícone de salvar)
   - ✅ Deve exibir mensagem de sucesso
   - ✅ Mudanças devem persistir (recarregue a página para confirmar)

4. **Adicionar Novo Membro**
   - Na seção "Membros", clique em "Adicionar Membro" (ou "+")
   - Selecione um usuário que ainda não é membro deste GC
   - Defina papel como "Membro"
   - Clique em "Adicionar"
   - ✅ Novo membro deve aparecer na lista de membros
   - ✅ Total de membros deve aumentar em 1

5. **Verificar no Banco**
   ```sql
   SELECT * FROM growth_groups WHERE id = '[ID_DO_GC]';
   -- Deve ter address = 'Rua Teste, 456 - Bairro Novo' e time = '20:00'

   SELECT COUNT(*) FROM growth_group_participants
   WHERE gc_id = '[ID_DO_GC]' AND status = 'active';
   -- Deve ter aumentado em 1
   ```

**Resultado Esperado**: GC atualizado com novas informações e membro adicionado corretamente

---

## Cenário 4: Multiplicar Grupo de Crescimento

**Objetivo**: Multiplicar GC em 2 novos GCs, transferindo membros

**Pré-requisito**: GC com pelo menos 10 membros ativos

### Passos

1. **Navegar para Multiplicação**
   - Em `/admin/growth-groups`, selecione um GC com 10+ membros
   - Clique em "Multiplicar" (botão/ação)
   - ✅ Deve abrir wizard em `/admin/growth-groups/[id]/multiply`

2. **Step 1: Informações dos Novos GCs**
   - Defina quantidade de novos GCs: **2**
   - Para **Novo GC 1**:
     - Nome: "GC Multiplicado A"
     - Modo: Presencial
     - Endereço: "Rua A, 100"
     - Líder: Selecione um membro do GC original
     - Supervisor: Selecione outro membro
   - Para **Novo GC 2**:
     - Nome: "GC Multiplicado B"
     - Modo: Online
     - Líder: Selecione outro membro do GC original
     - Supervisor: Selecione outro membro
   - ✅ Formulário deve validar que líderes existem e são do GC original
   - Clique em "Próximo"

3. **Step 2: Divisão de Membros**
   - ✅ Deve exibir lista de TODOS os membros do GC original
   - Para cada membro, alocar entre:
     - Permanecer no GC original
     - Ir para Novo GC A
     - Ir para Novo GC B
   - Exemplo de alocação:
     - 3 membros → permanecem no original
     - 4 membros → vão para GC A
     - 3 membros → vão para GC B
   - ✅ Interface deve permitir selecionar destino (dropdowns, drag-and-drop, ou radios)
   - ✅ Deve validar que TODOS os membros foram alocados
   - Clique em "Próximo"

4. **Step 3: Configuração do GC Original**
   - Pergunta: "O que fazer com o GC original?"
   - Opção 1: Manter ativo (com membros restantes)
   - Opção 2: Inativar (todos foram realocados)
   - Selecione: **Manter ativo**
   - ✅ Se houver membros alocados no original, opção "manter ativo" deve estar disponível
   - Clique em "Próximo"

5. **Step 4: Revisão e Confirmação**
   - ✅ Deve exibir resumo:
     - GC Original: nome, quantos membros permanecem, status final
     - Novo GC A: nome, líder, supervisor, quantos membros
     - Novo GC B: nome, líder, supervisor, quantos membros
   - Campo opcional "Observações": Digite "Multiplicação para expansão na região norte"
   - Clique em "Confirmar Multiplicação"

6. **Processar Transação**
   - ✅ Deve exibir loading/spinner durante processamento
   - ✅ Após ~2-5 segundos, deve exibir mensagem de sucesso
   - ✅ Deve redirecionar para `/admin/growth-groups` ou listar novos GCs

7. **Verificar Resultado**
   - Na listagem de GCs:
     - ✅ "GC Multiplicado A" deve aparecer com status "Ativo"
     - ✅ "GC Multiplicado B" deve aparecer com status "Ativo"
     - ✅ GC original deve ter status "Ativo" (conforme escolhido)

8. **Verificar no Banco**
   ```sql
   -- Novos GCs criados
   SELECT * FROM growth_groups
   WHERE name IN ('GC Multiplicado A', 'GC Multiplicado B');
   -- Deve retornar 2 registros

   -- Membros transferidos
   SELECT COUNT(*) FROM growth_group_participants
   WHERE status = 'transferred' AND gc_id = '[ID_GC_ORIGINAL]';
   -- Deve ser >= 7 (membros que foram para novos GCs)

   -- Membros nos novos GCs
   SELECT gc_id, COUNT(*) as total_members
   FROM growth_group_participants
   WHERE gc_id IN ('[ID_GC_A]', '[ID_GC_B]')
   AND status = 'active'
   GROUP BY gc_id;
   -- Deve retornar contagens conforme alocação (4 e 3, por exemplo)

   -- Evento de multiplicação registrado
   SELECT * FROM gc_multiplication_events
   WHERE original_gc_id = '[ID_GC_ORIGINAL]'
   ORDER BY multiplied_at DESC LIMIT 1;
   -- Deve retornar 1 evento com new_gc_ids = [ID_GC_A, ID_GC_B]
   -- Campo notes deve ter "Multiplicação para expansão na região norte"
   ```

**Resultado Esperado**: 2 novos GCs criados, membros transferidos corretamente, GC original mantido ativo, evento registrado em `gc_multiplication_events`

---

## Cenário 5: Gestão de Lições

**Objetivo**: Criar série de lições e reordenar lições

### Passos

1. **Navegar para Lições**
   - Clique em "Lições" na sidebar admin
   - ✅ Deve abrir `/admin/lessons` com lista de séries

2. **Criar Nova Série**
   - Clique em "Criar Série" (ou "+ Nova Série")
   - ✅ Deve abrir `/admin/lessons/series/new`
   - Nome: "Fundamentos da Fé"
   - Descrição: "Série introdutória sobre princípios cristãos"
   - Opção: **Adicionar lições agora**
   - Lição 1:
     - Título: "Quem é Deus?"
     - Descrição: "Introdução aos atributos de Deus"
     - Link: "https://exemplo.com/licao1"
   - Lição 2:
     - Título: "Quem é Jesus?"
     - Descrição: "A pessoa e obra de Cristo"
   - Lição 3:
     - Título: "Quem é o Espírito Santo?"
     - Descrição: "O papel do Espírito na vida do crente"
   - Clique em "Criar Série"
   - ✅ Deve exibir mensagem de sucesso
   - ✅ Deve redirecionar para `/admin/lessons` ou `/admin/lessons/series/[id]`

3. **Verificar Série Criada**
   - Na listagem de séries, procure "Fundamentos da Fé"
   - ✅ Deve exibir badge "3 lições"
   - ✅ Deve ter opções: Editar, Excluir, Ver Lições

4. **Acessar Edição de Série**
   - Clique em "Editar" na série "Fundamentos da Fé"
   - ✅ Deve abrir `/admin/lessons/series/[id]` com:
     - Nome e descrição editáveis
     - Lista de 3 lições (ordenadas 1, 2, 3)

5. **Reordenar Lições**
   - ✅ Interface deve permitir drag-and-drop (ou botões ↑↓)
   - Arraste "Quem é o Espírito Santo?" para cima, ficando ordem:
     1. Quem é Deus?
     2. Quem é o Espírito Santo?
     3. Quem é Jesus?
   - Clique em "Salvar Ordem" (ou mudança deve ser automática)
   - ✅ Deve exibir feedback de sucesso

6. **Verificar no Banco**
   ```sql
   SELECT id, title, order_in_series
   FROM lessons
   WHERE series_id = '[ID_DA_SERIE]'
   ORDER BY order_in_series;

   -- Deve retornar:
   -- | title                    | order_in_series |
   -- |--------------------------|-----------------|
   -- | Quem é Deus?             | 1               |
   -- | Quem é o Espírito Santo? | 2               |
   -- | Quem é Jesus?            | 3               |
   ```

**Resultado Esperado**: Série criada com 3 lições, reordenação funciona e persiste no banco

---

## Cenário 6: Relatórios de Crescimento

**Objetivo**: Visualizar gráficos e métricas de relatórios

### Passos

1. **Navegar para Relatórios**
   - Clique em "Relatórios" na sidebar admin
   - ✅ Deve abrir `/admin/reports` com dashboard de relatórios

2. **Verificar Cards de Métricas**
   - ✅ Deve exibir cards com:
     - Total de GCs por status (Ativo, Inativo, Multiplicando)
     - Taxa de conversão de visitantes (%)
     - Frequência média de reuniões
     - Outras métricas relevantes

3. **Verificar Gráficos**
   - ✅ Gráfico de Crescimento (linha): Membros ao longo do tempo
     - Eixo X: Meses
     - Eixo Y: Total de membros
     - Deve exibir tendência (crescente, estável, decrescente)
   - ✅ Gráfico de Distribuição (pizza ou donut): GCs por modo
     - Segmentos: Presencial, Online, Híbrido
     - Percentuais corretos
   - ✅ Gráfico Top 10 GCs (barra horizontal): GCs com mais membros
     - 10 barras com nomes de GCs e totais

4. **Aplicar Filtro de Período**
   - Selecione filtro: "Últimos 90 dias"
   - ✅ Todos os gráficos devem recarregar
   - ✅ Dados devem refletir apenas últimos 90 dias

5. **Acessar Relatório Específico**
   - Clique em "Relatório de Conversões" (ou link similar)
   - ✅ Deve abrir `/admin/reports/conversions`
   - ✅ Deve exibir:
     - Total de visitantes convertidos no período
     - Taxa de conversão por GC (tabela ou lista)
     - Tempo médio até conversão (dias)

**Resultado Esperado**: Relatórios exibem gráficos corretos, filtros funcionam, navegação entre relatórios fluida

---

## Cenário 7: Segurança - Bloqueio de Não-Admin

**Objetivo**: Garantir que usuários não-admin não acessem área admin

### Passos

1. **Logout do Admin**
   - Clique em botão de logout no header
   - ✅ Deve redirecionar para `/login`

2. **Login como Não-Admin**
   - Entre com credenciais de usuário comum (não admin)
   - Email: `user@exemplo.com`
   - Password: [senha do usuário]
   - ✅ Deve redirecionar para `/dashboard` (área normal)

3. **Tentar Acessar Área Admin**
   - Manualmente digite na URL: `http://localhost:3000/admin`
   - Pressione Enter
   - ✅ Deve redirecionar imediatamente para `/dashboard`
   - ✅ NÃO deve exibir conteúdo admin nem por 1 segundo

4. **Verificar Outras Rotas Admin**
   - Tente acessar: `http://localhost:3000/admin/growth-groups`
   - ✅ Deve redirecionar para `/dashboard`
   - Tente acessar: `http://localhost:3000/admin/lessons`
   - ✅ Deve redirecionar para `/dashboard`

5. **Verificar Ausência de Links Admin**
   - No dashboard normal do usuário:
   - ✅ NÃO deve ter link "Admin" na navegação
   - ✅ NÃO deve ter sidebar com seções admin

**Resultado Esperado**: Usuários não-admin completamente bloqueados de acessar qualquer rota `/admin/*`

---

## Checklist de Aceite Final

Após executar todos os cenários acima, marque:

- [ ] Dashboard admin exibe métricas corretas (Cenário 1)
- [ ] Criação de GC com líder + supervisor funciona (Cenário 2)
- [ ] Edição de GC permite modificar dados e adicionar membros (Cenário 3)
- [ ] Multiplicação de GC cria novos GCs, transfere membros, registra evento (Cenário 4)
- [ ] Gestão de séries/lições permite CRUD e reordenação (Cenário 5)
- [ ] Relatórios exibem gráficos e métricas corretas (Cenário 6)
- [ ] Usuários não-admin são bloqueados de acessar `/admin` (Cenário 7)

**Se todos os itens estiverem marcados**: ✅ **Feature 004 está pronta para produção**

---

## Troubleshooting

### Problema: Métricas não carregam (ficam em "Carregando...")
**Solução**:
1. Abra DevTools (F12) > Console
2. Verifique se há erros de query Supabase
3. Confirme que migration foi aplicada: `supabase db reset` ou `supabase migration up`
4. Verifique RLS policies: Admin deve ter acesso total

### Problema: Transação de multiplicação falha
**Solução**:
1. Veja console do navegador para mensagem de erro específica
2. Verifique se todos os membros foram alocados
3. Confirme que líderes e supervisores selecionados existem
4. Verifique no banco se GCs "órfãos" foram criados (fazer limpeza manual se necessário)

### Problema: Reordenação de lições não persiste
**Solução**:
1. Verifique se request foi enviado (Network tab no DevTools)
2. Confirme que `order_in_series` está sendo atualizado no banco
3. Recarregue a página (pode ser cache do estado local)

### Problema: Usuário não-admin consegue acessar `/admin`
**Solução**:
1. Verifique `is_admin` flag no banco: `SELECT is_admin FROM users WHERE id = '[USER_ID]'`
2. Confirme que `AdminLayout` está verificando permissão corretamente
3. Recarregue aplicação (pode ser cache de sessão)

---

**Version**: 1.0
**Last Updated**: 2025-10-18
**Test Coverage**: 7 cenários críticos
