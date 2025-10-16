# Quickstart: Testando a Gestão de GCs

Este guia descreve os cenários de teste manuais para a nova interface de gestão de Grupos de Crescimento (GCs).

## Pré-requisitos
- Um usuário com o papel de "líder de GC" deve existir no sistema.
- O líder deve estar associado a pelo menos um GC.

## Cenário 1: Agendar uma Nova Reunião

1.  **Login**: Faça login na aplicação web com as credenciais de um líder de GC.
2.  **Navegação**: Navegue até a página de gerenciamento do seu GC.
3.  **Ação**: Clique no botão "Agendar Reunião".
4.  **Preenchimento**: Preencha o formulário com o título da lição, data e hora.
5.  **Salvar**: Clique em "Salvar".
6.  **Verificação**: A nova reunião deve aparecer na lista de reuniões do GC.

## Cenário 2: Registrar Presença em uma Reunião

1.  **Login**: Faça login como líder de GC.
2.  **Navegação**: Vá para a página de detalhes de uma reunião existente.
3.  **Visualização**: Você deve ver uma lista de todos os membros e visitantes do GC.
4.  **Ação**: Marque a caixa de seleção ao lado de cada pessoa que esteve presente.
5.  **Verificação**: A presença deve ser salva automaticamente (a UI deve indicar o salvamento) e a contagem de presentes na reunião deve ser atualizada.

## Cenário 3: Adicionar um Novo Visitante

1.  **Login**: Faça login como líder de GC.
2.  **Navegação**: Vá para a página de gerenciamento de membros e visitantes do seu GC.
3.  **Ação**: Clique no botão "Adicionar Visitante".
4.  **Preenchimento**: Preencha o formulário com o nome, e-mail e telefone do visitante.
5.  **Salvar**: Clique em "Salvar".
6.  **Verificação**: O novo visitante deve aparecer na lista de visitantes do GC.
