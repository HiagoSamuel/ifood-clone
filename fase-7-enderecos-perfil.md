# Checklist - Fase 7: Enderecos e Perfil (Clone do iFood)

> Marque cada item conforme concluir. So avance pra Fase 8 quando o criterio final estiver batido.

## Aquecimento
- [x] Resumi em uma frase o que fiz na Fase 6: busca e filtros no backend com debounce.
- [x] Lembrei que na Fase 4 o endereco do pedido era so um campo de texto solto. Agora ele vira um recurso salvo do usuario.
- [x] Pensei por que uma pessoa costuma ter varios enderecos: casa, trabalho, casa de familiar, etc.

## Modelagem de enderecos
- [x] Entendi por que endereco merece a sua propria tabela `addresses`.
- [x] Entendi a relacao um-para-muitos entre `users` e `addresses`.
- [x] Listei os campos de `addresses`: id, user_id, apelido, rua, numero, bairro, complemento, ponto de referencia, is_default, created_at.
- [x] Entendi o conceito de endereco padrao (`is_default`) e por que so um pode ser o padrao por vez.
- [x] Criei a tabela `addresses` no SQL do Supabase.
- [x] Respondi o QUIZ 1: a FK `user_id` fica em `addresses` porque cada endereco pertence a um usuario; um usuario pode ter varios enderecos.

## CRUD de enderecos (backend)
- [x] Entendi a sigla CRUD: Create, Read, Update, Delete.
- [x] Criei `POST /addresses` para criar endereco exigindo usuario logado.
- [x] Criei `GET /addresses` para listar so os enderecos do usuario logado.
- [x] Criei `PATCH /addresses/:id` para editar.
- [x] Criei `DELETE /addresses/:id` para remover.
- [x] Garanti que ninguem edita/apaga endereco de outra pessoa usando `user_id` vindo do token.
- [x] Ao marcar um endereco como padrao, os outros deixam de ser padrao.
- [x] Respondi o QUIZ 2: o backend impede edicao de outro usuario filtrando sempre por `id` do endereco e `user_id` autenticado.

## CRUD de enderecos (tela)
- [x] Criei a pagina "Meus enderecos".
- [x] Listo os enderecos do usuario com o padrao destacado.
- [x] Formulario pra adicionar um endereco novo.
- [x] Consigo editar um endereco existente.
- [x] Consigo remover um endereco com confirmacao antes.
- [x] Consigo marcar qual e o padrao.
- [x] Tratei carregando, erro e lista vazia.

## Amarrando no checkout
- [x] Troquei o campo de texto solto por escolha entre enderecos salvos.
- [x] O endereco padrao ja vem selecionado.
- [x] Consigo escolher outro endereco na hora de finalizar.
- [x] O pedido guarda uma copia textual do endereco usado.
- [x] Respondi o QUIZ 3: o pedido deve congelar o endereco porque, se o usuario editar/apagar o endereco depois, o historico do pedido antigo continua correto.

## Perfil do usuario
- [x] Criei uma pagina de perfil.
- [x] Mostro os dados do usuario.
- [x] Consigo editar o nome pelo backend.
- [x] Foto de perfil segue como URL local por enquanto; Storage do Supabase pode ficar para uma fase futura.
- [x] Botao de sair funcionando.

## Seguranca (RLS)
- [x] Ativei RLS na tabela `addresses`.
- [x] Respondi o QUIZ 4: backend + RLS sao duas camadas de protecao; se uma falhar, a outra ainda limita acesso aos proprios dados.

## Fechamento
- [x] Expliquei o ciclo CRUD completo de um endereco: criar, listar, editar, marcar padrao e remover.
- [x] Expliquei por que o pedido guarda uma copia do endereco em vez de so apontar pra tabela.
- [x] Revisei os conceitos: um-para-muitos, endereco padrao, CRUD, dono do recurso, RLS.
- [x] Anotei o que travou e o que fluiu: a parte mais importante foi manter a regra de apenas um padrao e ligar checkout aos enderecos salvos.

## Criterio pra avancar
- [x] Consigo criar, listar, editar e apagar meus enderecos.
- [x] So um endereco fica como padrao por vez.
- [x] Escolho o endereco direto no checkout.
- [x] Consigo explicar por que so mexo nos MEUS enderecos.
