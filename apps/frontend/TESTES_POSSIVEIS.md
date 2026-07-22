# 🧪 Testes Possíveis — Revisa Aula

## 1. Salvamento silencioso de folha
- Acesse uma folha e escreva texto no editor.
- Verifique que o texto é salvo em background sem reconstruir a tela inteira.
- Confirme que o indicador de status no canto muda para "Salvando..." e depois para "Salvo".

## 2. Salvar título da folha
- Edite o título da folha e espere o debounce.
- Confirme que a alteração persiste no backend e a lista lateral atualiza sem reiniciar a view.

## 3. Geração de resumo
- Clique em gerar resumo.
- Verifique que o painel atualiza apenas o resumo sem causar re-render intenso da tela inteira.

## 4. Revisão de flashcards
- Entre na rota de estudo de um notebook.
- Revele a resposta e selecione uma nota de dificuldade.
- Confirme que o progresso avança e o backend recebe o score.
- Verifique que a tela não reinicia nem volta para o primeiro card.

## 5. Recarregamento e persistência
- Recarregue a página após editar uma folha ou responder um card.
- Confirme que os dados ainda estão persistidos.

## 6. Cenário de erro de rede
- Simule falha na API ao salvar ou submeter score.
- Verifique que a interface exibe erro de forma discreta e não quebra a navegação.

## 7. Overflow horizontal de texto
- No Gerenciar Tags, crie uma tag com nome muito longo (ex: "Esta é uma tag com um nome extremamente longo para testar o overflow").
- Verifique que o nome é truncado com reticências e não estoura o card.
- Confirme que os botões de editar/excluir permanecem visíveis e funcionais.

## 8. Scroll lateral no EditorView
- Acesse o editor de uma folha.
- Verifique que NÃO há barra de scroll horizontal visível, mesmo com conteúdo vazio.
- Digite um parágrafo longo sem espaços (ex: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa").
- Confirme que o texto quebra dentro do container e não cria scroll lateral.
- Verifique que o painel de IA (AISidebar) também não tem scroll lateral.

## 9. Espaçamento do editor
- Acesse o editor de uma folha.
- Verifique que o container do editor + IA ocupa pelo menos 750px de altura (mobile) ou 90vh (desktop).
- Verifique que a última linha do texto tem um pequeno espaçamento (pb-1.5) antes da borda inferior.
- Confirme que nenhum texto é cortado na borda inferior do container.

## 10. Toast de erro
- Force um erro na API (ex: pare o backend).
- Realize uma ação que dispare erro no auto-save do editor.
- Verifique que um toast vermelho aparece no canto inferior direito com a mensagem de erro.
- Confirme que o toast desaparece após ~4 segundos.
- Clique no X do toast para fechar manualmente.

## 11. Toast em ações de gerenciamento
- No Gerenciar Tags, tente criar uma tag com nome vazio.
- Verifique que o toast de erro aparece.
- Na Lixeira, tente restaurar/excluir item (com backend offline).
- Verifique o toast de erro.
- No Dashboard, tente criar caderno com backend offline.
- Verifique o toast de erro.

## 12. Auto-save sem erro 400
- Abra uma folha existente.
- Espere o sync inicial completar.
- Verifique que NENHUM request 400 aparece no console.
- Edite o conteúdo e confirme que o auto-save funciona normalmente (status "Salvo").

## 13. CRUD de eventos da agenda
- Acesse Planejamento > Agenda.
- Crie um evento com título e data.
- Verifique que o evento aparece na lista.
- Clique no círculo ao lado do evento para marcar como concluído.
- Exclua o evento e confirme o diálogo.
- Verifique que o sumiu da lista.

## 14. Calendário mensal
- Acesse Planejamento > Calendário.
- Navegue entre meses usando as setas.
- Verifique que eventos são indicados por bolinhas no calendário.
- Clique em um dia e veja os eventos no painel lateral.
- Marque um evento como concluído pelo painel lateral.

## 15. Cronograma (timeline)
- Acesse Planejamento > Cronograma.
- Crie um marco com título, descrição e data.
- Verifique que aparece na timeline visual.
- Clique no botão de concluir e veja o item ir para a seção "Concluídos".

## 16. Metas com progresso
- Acesse Planejamento > Metas.
- Crie uma meta com título, descrição e data alvo.
- Use os botões rápidos (25%, 50%, 75%, 100%) para atualizar o progresso.
- Verifique que a barra de progresso e a cor do botão mudam.
- Complete a meta (100%) e veja ela ir para a seção "Concluídas".

## 17. Timer Pomodoro
- Acesse Planejamento > Pomodoro.
- Digite um nome de tarefa e clique "Iniciar Foco".
- Verifique que o timer começa a contar.
- Clique em "Pausar" e depois "Continuar".
- Clique em "Parar" e verifique que o timer reseta.

## 18. Mini timer flutuante do Pomodoro
- Inicie um pomodoro na página de Planejamento.
- Navegue para outra página (Dashboard, Tags, etc.).
- Verifique que o mini timer aparece no canto inferior direito com pause/stop.
- Pause o timer pelo floating e verifique que o botão muda para "Continuar".
- Pare o timer e verifique que ele desaparece.

## 19. Sub-menu Planejamento na sidebar
- Verifique que "Planejamento" aparece abaixo de "Tarefas" na sidebar.
- Clique em Planejamento para expandir os sub-itens.
- Clique em cada sub-item (Agenda, Calendário, Cronograma, Metas, Pomodoro, Configurações) e verifique que a rota muda.
- Colapse a sidebar e verifique que apenas o ícone do calendário aparece.

## 20. Notificações de eventos
- Crie um evento na agenda com a data de hoje.
- Aguarde até 1 minuto (ou recarregue a página).
- Verifique que o sino de notificações no header mostra um badge.
- Clique no sino e veja a notificação no painel.
- (Se a permissão do navegador foi concedida) Verifique que uma notificação nativa aparece.

## 21. Notificações de metas
- Crie uma meta com data alvo para hoje ou nos próximos 3 dias.
- Aguarde a verificação periódica.
- Verifique a notificação no painel do sino.

## 22. Configurações do Planejamento
- Acesse Planejamento > Configurações.
- Selecione uma cor de destaque diferente.
- Ajuste a duração do foco para 30min usando os botões +/−.
- Ajuste a duração da pausa para 10min.
- Desative a notificação de eventos e verifique que não aparecem mais.
- Clique em "Restaurar padrão" e verifique que a duração volta ao default.

## 23. Resumo semanal no Dashboard
- Acesse o Dashboard.
- Verifique que a seção "Resumo da Semana" aparece com 3 cards.
- Crie eventos/metas/pomodoros e veja os cards atualizarem.
- Clique em "Ver planejamento" e confirme que navega para /planning/agenda.

## 24. Persistência do timer entre páginas
- Inicie um pomodoro.
- Navegue para o Dashboard (ou outra página).
- Volte para a página de Pomodoro.
- Verifique que o timer continua rodando com o mesmo tempo restante.
