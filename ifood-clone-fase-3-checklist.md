# Checklist — Fase 3: Carrinho (Clone do iFood)

> Marque cada item conforme concluir. Só avance pra Fase 4 quando o critério final estiver batido.

## Aquecimento
- [x] Lembrei onde ficou o botão "Adicionar ao carrinho" da Fase 2.

## Estado global
- [x] Pensei em como partes diferentes da tela compartilham o mesmo carrinho.
- [x] Entendi o problema do prop drilling.
- [x] Entendi o que é estado global e por que a Context API resolve.
- [x] Respondi o QUIZ 1: prop drilling vira um problema quando muitos componentes precisam passar o mesmo dado, deixando o código verboso e frágil.

## Modelagem do carrinho
- [x] Defini o formato de uma linha do carrinho (item, quantidade, observação).
- [x] Decidi a regra sobre itens de restaurantes diferentes.
- [x] Implementei a validação dessa regra.
- [x] Respondi o QUIZ 2: quando o usuário adiciona o mesmo item de novo, a quantidade aumenta; quando é outro item, cria-se uma nova linha.

## CartContext
- [x] Criei o `CartContext` e o provedor envolvendo o app.
- [x] Ação de adicionar item funcionando.
- [x] Ação de remover item funcionando.
- [x] Ações de aumentar/diminuir quantidade funcionando.
- [x] Ação de limpar carrinho funcionando.
- [x] Entendi o conceito de imutabilidade (criar novo, não mutar).
- [x] Respondi o QUIZ 3: criar um novo array evita que o React perca a referência da mudança e não re-renderize corretamente.

## Botão adicionar
- [x] Botão "Adicionar ao carrinho" ligado à ação do contexto.
- [x] Controles de quantidade (+ e -) funcionando.
- [x] Ícone de carrinho no topo mostrando o total de itens em tempo real.

## Tela do carrinho
- [x] Lista cada linha (nome, quantidade, preço unitário, subtotal).
- [x] Dá pra ajustar quantidade dali.
- [x] Dá pra remover item dali.
- [x] Mostra subtotal + taxa de entrega = total.
- [x] Tratei o carrinho vazio com mensagem amigável.
- [x] Botão "Finalizar pedido" existe só como esqueleto.
- [x] Respondi o QUIZ 4: o total deve ser calculado a partir dos itens e não guardado como valor fixo, para evitar divergências.

## Persistência
- [x] Carrinho salva no localStorage ao mudar.
- [x] Carrinho carrega do localStorage ao abrir o app.
- [x] Testei recarregar a página e o carrinho se manteve.
- [x] Entendi a limitação do localStorage (preso ao dispositivo).
- [x] Respondi o QUIZ 5: o localStorage não acompanha o usuário entre dispositivos; salvar no banco resolveria isso.

## Fechamento
- [x] Expliquei o caminho do clique em "Adicionar" até o ícone atualizar: o botão chama a ação do contexto, o reducer atualiza o estado global e a UI refaz o render com a nova quantidade.
- [x] Revisei os conceitos: estado global, imutabilidade e estado derivado.
- [x] Anotei o que travou e o que fluiu: o maior ponto de atenção foi fazer o carrinho respeitar o restaurante atual e manter o estado consistente.

## ✅ Critério pra avançar
- [x] Adiciono itens e ajusto quantidades.
- [x] O total é calculado corretamente.
- [x] O carrinho persiste ao recarregar.
- [x] Consigo explicar por que usamos estado global.
