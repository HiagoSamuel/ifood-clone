# Checklist — Fase 2: Cardápio (Clone do iFood)

> Marque cada item conforme concluir. Só avance pra Fase 3 quando o critério final estiver batido.

## Aquecimento
- [x] Resumi em uma frase o que construí na Fase 1: uma home com restaurantes vindo do backend e autenticação básica.

## Modelagem do cardápio
- [x] Pensei em como organizar categorias e itens antes de ver a resposta.
- [x] Entendi a modelagem das tabelas `menu_categories` e `menu_items`.
- [x] Entendi o conceito de chave estrangeira (FK).
- [x] Entendi a relação um-para-muitos (um restaurante, muitos itens).
- [x] Criei as tabelas no Supabase.
- [x] Inseri itens de exemplo para 2 ou 3 restaurantes.
- [x] Respondi o QUIZ 1: a FK fica no item porque ele precisa apontar para o restaurante dono daquele cardápio.
- [x] Respondi o QUIZ 2: guardar `restaurant_id` no item é simples e eficiente, mas pode repetir dados; a alternativa é normalizar em tabelas separadas quando a estrutura crescer.

## Navegação
- [x] Entendi o conceito de rota dinâmica (`/restaurante/:id`).
- [x] Configurei o React Router (ou equivalente).
- [x] Cada card da home virou link para a página do restaurante.
- [x] O `id` está sendo passado corretamente pela URL.
- [x] Respondi o QUIZ 3: o `id` vem de `useParams()` e é usado para pedir os dados corretos do restaurante.

## Endpoints do cardápio
- [x] Criei `GET /restaurants/:id` (dados do restaurante).
- [x] Criei `GET /restaurants/:id/menu` (categorias e itens).
- [x] Decidi a estrutura da resposta (achatada x agrupada) e sei justificar.
- [x] Defini a regra pra itens indisponíveis (`disponivel = false`).

## Página do restaurante
- [x] Cabeçalho com nome, imagem, categoria, nota, taxa e tempo.
- [x] Cardápio renderizado agrupado por categoria.
- [x] Cada item mostra nome, descrição, preço e imagem.
- [x] Tratei o estado de **carregando**.
- [x] Tratei o estado de **erro**.
- [x] Tratei o estado de **cardápio vazio**.
- [x] Respondi o QUIZ 4: agrupar por categoria deixa a leitura mais natural e reflete a experiência do app.

## Detalhe do produto
- [x] Clicar no item abre modal ou página de detalhe.
- [x] Detalhe mostra descrição completa, imagem maior e preço.
- [x] Botão "Adicionar ao carrinho" existe só visualmente (sem lógica ainda).
- [x] Entendi por que a lógica do botão fica pra Fase 3.
- [x] Respondi o QUIZ 5: o modal é bom para uma pré-visualização rápida, enquanto uma página dedicada é melhor para detalhes mais completos.

## Fechamento
- [x] Expliquei o caminho de clicar num restaurante até o cardápio aparecer: a home navega para a rota do restaurante, o componente busca o detalhe e a API devolve categorias e itens.
- [x] Revisei os conceitos de FK e rota dinâmica.
- [x] Anotei o que travou e o que fluiu: o ponto mais delicado foi conectar a rota ao id certo e organizar os dados do menu.

## ✅ Critério pra avançar
- [x] Clico num restaurante e vejo o cardápio agrupado por categoria.
- [x] Abro o detalhe de um item.
- [x] Consigo explicar como o `id` da URL puxa os dados certos.
