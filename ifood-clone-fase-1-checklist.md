# Checklist — Fase 1: Fundação (Clone do iFood)

> Marque cada item conforme concluir. Só avance pra Fase 2 quando o critério final estiver batido.

## Planejamento
- [x] Listei os campos que um restaurante precisa guardar (nome, categoria, taxa, tempo, nota, imagem, descrição, created_at).
- [x] Listei os campos que um usuário precisa guardar (id, email, nome, senha protegida, metadata).
- [x] Entendi a modelagem das tabelas `users` e `restaurants`.
- [x] Respondi o QUIZ 1: não guardar senha em texto puro porque isso expõe a conta em caso de vazamento; o ideal é usar hash e autenticação segura.

## Setup do projeto
- [x] Criei a estrutura de pastas (`frontend` e `backend`).
- [x] Inicializei o frontend com Vite + React e vi a tela padrão rodando.
- [x] Inicializei o backend com Express.
- [x] Criei a rota de teste `GET /health` retornando `{ status: "ok" }`.
- [x] Acessei a rota `/health` com sucesso (navegador ou curl).
- [x] Entendi o que é CORS e por que ele apareceu.

## Supabase
- [x] Criei o projeto no Supabase e peguei a URL e a chave anon.
- [x] Entendi a diferença entre a chave `anon` e a `service_role`.
- [x] Confirmei que a `service_role` NÃO está no frontend nem no Git.
- [x] Criei a tabela `restaurants`.
- [x] Inseri 4 ou 5 restaurantes de exemplo.
- [x] Respondi o QUIZ 2: a `service_role` é muito poderosa; se cair no frontend, qualquer pessoa poderia ler ou alterar dados sensíveis do banco.

## Autenticação
- [x] Tela de cadastro funcionando (`signUp`).
- [x] Tela de login funcionando (`signInWithPassword`).
- [x] Sessão do usuário sendo guardada e lida no frontend (contexto de auth).
- [x] Rota/página protegida funcionando (só aparece se logado).
- [x] Testei recarregar a página estando logado e a sessão se manteve.
- [x] Respondi o QUIZ 3: o token identifica o usuário autenticado e permite acessar rotas protegidas no backend.

## Home com restaurantes
- [x] Endpoint `GET /restaurants` no backend buscando do Supabase.
- [x] Home consumindo o endpoint e renderizando os cards.
- [x] Card mostra nome, categoria, taxa de entrega, tempo estimado e nota.
- [x] Tratei o estado de **carregando**.
- [x] Tratei o estado de **erro**.
- [x] Tratei o estado de **lista vazia**.
- [x] Respondi o QUIZ 4: o backend é o ponto central para validar regras, esconder detalhes do banco e manter a API consistente.

## Fechamento
- [x] Expliquei com minhas palavras o fluxo completo de carregar a home: o frontend chama o backend, o backend consulta o banco e devolve os restaurantes, e a UI renderiza os cards.
- [x] Revisei os pontos de segurança: senha, chaves, token e acesso protegido.
- [x] Anotei o que foi mais difícil e o que foi mais legal: o mais difícil foi acertar as credenciais e a integração; o mais legal foi ver o app montar a tela a partir do backend.

## ✅ Critério pra avançar
- [x] Consigo me cadastrar, logar e ver a lista de restaurantes vinda do banco.
- [x] Consigo explicar o fluxo todo sem colar.
