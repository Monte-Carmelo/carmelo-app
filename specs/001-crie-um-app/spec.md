# Especificação de Funcionalidade: App de Gestão de Grupos de Crescimento

**Feature Branch**: `001-crie-um-app`
**Criado**: 2025-10-04
**Status**: Rascunho
**Input**: Descrição do usuário: "crie um app para gestão da minha igreja, especialmente dos grupos de crescimento (células). Pelo app devemos poder fazer a inclusão e gestão das reuniões, gestão dos membros, líderes, supervisores, convidados. Também deve ter um cadastro padrão de lições para todos os grupos. Os líderes e mais alguns perfis específicos vão poder acessar o app para administrar seu próprio GC. Supervisores poderão fazer a gestão da rede."
**Language**: Brazilian Portuguese (pt-BR) - per Constitution Principle VI

## Execution Flow (main)
```
1. Parse user description from Input
   → If empty: ERROR "No feature description provided"
2. Extract key concepts from description
   → Identify: actors, actions, data, constraints
3. For each unclear aspect:
   → Mark with [NEEDS CLARIFICATION: specific question]
4. Fill User Scenarios & Testing section
   → If no clear user flow: ERROR "Cannot determine user scenarios"
5. Generate Functional Requirements
   → Each requirement must be testable
   → Mark ambiguous requirements
6. Identify Key Entities (if data involved)
7. Run Review Checklist
   → If any [NEEDS CLARIFICATION]: WARN "Spec has uncertainties"
   → If implementation details found: ERROR "Remove tech details"
8. Return: SUCCESS (spec ready for planning)
```

---

## ⚡ Diretrizes Rápidas
- ✅ Foco no QUE os usuários precisam e POR QUÊ
- ❌ Evitar COMO implementar (sem stack tecnológico, APIs, estrutura de código)
- 👥 Escrito para stakeholders de negócio, não desenvolvedores

### Requisitos das Seções
- **Seções obrigatórias**: Devem ser completadas para toda funcionalidade
- **Seções opcionais**: Incluir apenas quando relevante para a funcionalidade
- Quando uma seção não se aplicar, remova-a completamente (não deixe como "N/A")

### Para Geração por IA
Ao criar esta especificação a partir de um prompt do usuário:
1. **Marque todas as ambiguidades**: Use [PRECISA ESCLARECIMENTO: pergunta específica] para qualquer suposição que precise fazer
2. **Não adivinhe**: Se o prompt não especificar algo, marque-o
3. **Pense como um testador**: Todo requisito vago deve falhar no item do checklist "testável e não ambíguo"
4. **Áreas comumente subespecificadas**:
   - Tipos de usuário e permissões
   - Políticas de retenção/exclusão de dados
   - Metas de performance e escala
   - Comportamentos de tratamento de erros
   - Requisitos de integração
   - Necessidades de segurança/compliance

---

## Esclarecimentos

### Sessão 2025-10-04
- Q: Qual a estrutura hierárquica de liderança acima dos supervisores? → A: Hierarquia expansível com número indeterminado de níveis (líder → supervisor → coordenador → coordenador N níveis), sem limite de pastor geral
- Q: Como visitantes devem ser convertidos em membros? → A: Automático após 3 visitas (parametrizável) + conversão manual pelo líder
- Q: Quem pode criar e editar lições no catálogo padrão? → A: Perfil administrativo separado (pode ser atribuído a qualquer usuário independente do nível hierárquico)
- Q: Qual método de autenticação deve ser usado? → A: Email e senha
- Q: Quais relatórios/dashboards são prioritários para o sistema? → A: Frequência, crescimento e conversão de visitantes

---

## Cenários de Usuário & Testes *(obrigatório)*

### História de Usuário Principal
Um líder de Grupo de Crescimento (GC) precisa registrar as reuniões semanais de sua célula, incluindo quem participou, convidados que foram trazidos, e a lição que foi estudada. Supervisores precisam ter visão consolidada de todos os GCs sob sua supervisão para acompanhar a saúde da rede.

### Cenários de Aceitação
1. **Dado** que sou um líder autenticado no app, **Quando** registro uma nova reunião do meu GC com lista de presença e lição, **Então** o sistema deve salvar o registro e disponibilizar para visualização do supervisor
2. **Dado** que sou um supervisor autenticado, **Quando** acesso a visão da minha rede, **Então** devo ver lista de todos os GCs com informações de última reunião e membros ativos
3. **Dado** que sou um líder, **Quando** adiciono um novo membro ao meu GC, **Então** o sistema deve registrar a pessoa e permitir marcá-la como presente em reuniões futuras
4. **Dado** que existe um cadastro de lições padrão, **Quando** um líder registra uma reunião, **Então** ele deve poder selecionar a lição do catálogo ou informar uma lição customizada
5. **Dado** que sou um supervisor, **Quando** visualizo a rede, **Então** devo poder filtrar e ordenar GCs por diferentes critérios (frequência, crescimento, líder)

### Casos Extremos
- Como garantir que supervisores vejam apenas GCs de sua rede e não de outras?
- O que acontece quando um líder é promovido a supervisor?
- O que acontece quando um visitante é promovido a membro?
- O que acontece quando um membro é promovido a líder?
- Como fazer a multiplicação dos GCs?
- O que acontece quando um visitante visita mais de um GC?

## Requisitos *(obrigatório)*

### Requisitos Funcionais
- **FR-001**: Sistema DEVE permitir cadastro e autenticação de usuários com perfil hierárquico (membro, líder, supervisor, coordenador em N níveis expansíveis) e perfil administrativo independente (pode ser atribuído a qualquer usuário para funções administrativas)
- **FR-002**: Sistema DEVE manter cadastro de Grupos de Crescimento (células) com informações de líder responsável, modalidade, endereço  e membros
- **FR-003**: Líderes DEVEM poder registrar reuniões de seus GCs incluindo data e hora, membros presentes, visitante e lição estudada
- **FR-004**: Sistema DEVE disponibilizar catálogo padrão de lições que pode ser selecionado ao registrar reuniões
- **FR-005**: Líderes DEVEM poder adicionar, editar e remover membros de seus GCs
- **FR-006**: Sistema DEVE permitir registro de visitantes durante reuniões e converter automaticamente para membros após número parametrizável de visitas (padrão: 3), além de permitir conversão manual pelo líder a qualquer momento
- **FR-007**: Supervisores DEVEM poder visualizar todos os GCs de sua rede com informações consolidadas
- **FR-008**: Coordenadores de rede DEVEM poder gerenciar (adicionar, editar, remover) GCs de sua rede
- **FR-009**: Sistema DEVE permitir que supervisores visualizem histórico de reuniões dos GCs sob sua supervisão
- **FR-010**: Sistema DEVE controlar permissões de acesso garantindo que cada perfil veja apenas dados autorizados
- **FR-011**: Sistema DEVE permitir que usuários com perfil administrativo criem e editem lições padrão (séries de lições), independente de sua posição hierárquica
- **FR-012**: Sistema DEVE manter registro histórico de reuniões realizadas
- **FR-013**: Sistema DEVE suportar hierarquia organizacional expansível com número indeterminado de níveis de coordenação acima de supervisores, permitindo crescimento ilimitado da rede
- **FR-014**: Sistema DEVE permitir autenticação de usuários via email e senha com validação de formato de email e requisitos mínimos de segurança para senha
- **FR-015**: Sistema DEVE fornecer relatórios e dashboards com três métricas prioritárias: frequência média de participação em reuniões, crescimento de membros por GC/rede, e taxa de conversão de visitantes para membros
- **FR-016**: Sistema DEVE [PRECISA ESCLARECIMENTO: notificações? lembrar líderes de registrar reunião, avisar supervisores de anomalias?]
- **FR-017**: Sistema DEVE [PRECISA ESCLARECIMENTO: exportação de dados? formato? periodicidade?]

### Entidades Principais *(inclui se a funcionalidade envolve dados)*
- **Usuário**: Pessoa que acessa o sistema, possui nome, credenciais de autenticação, nível hierárquico (membro, líder, supervisor, coordenador), flag administrativa (booleana, independente da hierarquia), relacionamento com GCs e posição na hierarquia organizacional
- **Grupo de Crescimento (GC/Célula)**: Unidade básica de organização, possui nome, modalidade (presencial ou online), líderes responsáveis, lista de membros, supervisor responsável, status (ativo/inativo), endereço (caso presencial), dia de encontro (dia da semana) e horário de realização
- **Membro**: Pessoa participante de um GC, possui dados pessoais básicos (nome, contato), histórico de participação, relacionamento com GC
- **Reunião**: Evento realizado por um GC, possui data/hora, lição estudada, lista de presença (membros + visitantes), registro de quem cadastrou
- **Visitante**: Pessoa não-membro que participou de uma reunião, possui dados básicos para contato futuro, contador de visitas, conversão automática para membro após número parametrizável de visitas (padrão: 3) ou conversão manual pelo líder
- **Lição**: Conteúdo de estudo, possui título, descrição/resumo, referências bíblicas, série (uma lição pode ser parte de um grupo de lições) e link
- **Série de Lições**: Agrupamento de lições relacionadas, gerenciado por usuários com perfil administrativo
- **Supervisor**: Líder de líderes, responsável por uma rede de GCs, possui visão consolidada e capacidade de gestão sobre múltiplos GCs
- **Coordenador**: Líder em nível acima de supervisor, pode supervisionar supervisores ou outros coordenadores, suporta hierarquia expansível com N níveis
- **Hierarquia Organizacional**: Estrutura em árvore expansível começando de GCs (nível base) → Líderes → Supervisores → Coordenadores (N níveis), sem limite superior pré-definido

---

## Checklist de Revisão & Aceitação
*GATE: Verificações automáticas executadas durante execução de main()*

### Qualidade do Conteúdo
- [x] Sem detalhes de implementação (linguagens, frameworks, APIs)
- [x] Focado em valor de usuário e necessidades de negócio
- [x] Escrito para stakeholders não-técnicos
- [x] Todas as seções obrigatórias completadas

### Completude dos Requisitos
- [ ] Sem marcadores [PRECISA ESCLARECIMENTO] remanescentes (2 itens diferidos: notificações, exportação)
- [x] Requisitos são testáveis e não ambíguos onde especificados
- [x] Critérios de sucesso são mensuráveis
- [x] Escopo está claramente delimitado
- [x] Dependências e premissas identificadas

---

## Status de Execução
*Atualizado por main() durante processamento*

- [x] Descrição do usuário analisada
- [x] Conceitos-chave extraídos
- [x] Ambiguidades marcadas
- [x] Cenários de usuário definidos
- [x] Requisitos gerados
- [x] Entidades identificadas
- [x] Esclarecimentos completados (5/5 perguntas respondidas)
- [x] Checklist de revisão passou (pronta para planejamento)

---
