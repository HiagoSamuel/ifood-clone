# Checklist - Fase 6: Busca e Filtros (Clone do iFood)

> Marque cada item conforme concluir. So avance pra Fase 7 quando o criterio final estiver batido.

## Aquecimento
- [x] Resumi em uma frase o que fiz na Fase 5: acompanhamento do pedido em tempo real.
- [x] Reparei que a busca/filtros do iFood combinam texto, categoria, ordenacao e filtros rapidos.
- [x] Pensei onde a busca deveria acontecer: no backend, porque a lista real pode crescer muito.

## Busca no backend
- [x] Entendi por que buscar no backend e melhor quando ha muitos restaurantes.
- [x] Entendi o que e query param numa URL (ex: `/restaurants?busca=pizza`).
- [x] Ajustei o endpoint `GET /restaurants` pra aceitar busca por nome.
- [x] Entendi o `ILIKE` do Postgres (busca por texto sem diferenciar maiuscula/minuscula).
- [x] Testei a busca por HTTP depois de reiniciar o backend.
- [x] Respondi o QUIZ 1: filtrar no backend evita baixar uma lista gigante no navegador; com 10 mil restaurantes, o banco filtra melhor e manda so o que interessa.

## Campo de busca na tela
- [x] Criei um campo de busca na home/header.
- [x] Liguei o campo ao endpoint (digitou -> debounce -> backend -> resultado).
- [x] Tratei o estado de carregando durante a busca.
- [x] Tratei o estado de nenhum resultado.
- [x] Entendi o problema de disparar uma busca a cada tecla digitada.
- [x] Entendi debounce: esperar a pessoa parar de digitar antes de buscar.
- [x] Implementei debounce de 400ms.
- [x] Respondi o QUIZ 2: debounce evita chamadas desnecessarias, entao "pizza" vira uma busca final em vez de varias buscas parciais.

## Filtros
- [x] Listei filtros que fazem sentido: categoria, taxa gratis e nota minima.
- [x] Ajustei o endpoint para aceitar filtros como query params.
- [x] Apliquei filtros no banco quando Supabase esta ativo e no fallback local quando esta em modo demo.
- [x] Criei os controles de filtro na tela.
- [x] Os filtros funcionam combinados com a busca por texto.
- [x] Respondi o QUIZ 3: filtros devem ir junto da busca porque o backend/banco consegue combinar tudo na consulta.

## Ordenacao
- [x] Adicionei ordenacao por mais recentes, melhor nota, menor taxa e entrega mais rapida.
- [x] Fiz a ordenacao acontecer no backend.
- [x] Testei trocar ordenacao e ver a lista mudar.

## (Opcional) Guardar a busca na URL
- [x] Entendi que colocar busca/filtros na URL ajuda a compartilhar e recarregar sem perder estado.
- [x] Fiz busca e filtros refletirem na URL da home.
- [x] Testei que a tela inicia lendo os parametros da URL.

## Fechamento
- [x] Expliquei o caminho: digitei -> debounce esperou -> frontend chamou o backend com query params -> banco filtrou/ordenou -> voltou a lista.
- [x] Revisei os conceitos: query param, ILIKE, debounce, filtrar/ordenar no banco.
- [x] Anotei o que travou e o que fluiu: o principal ajuste foi trocar filtro local por chamada ao backend sem quebrar o visual novo.

## Criterio pra avancar
- [x] Consigo buscar restaurantes por nome, e a busca acontece no backend.
- [x] Tenho filtros e ordenacao funcionando.
- [x] O debounce evita chamadas desnecessarias.
- [x] Consigo explicar por que buscar/filtrar no backend e melhor.
