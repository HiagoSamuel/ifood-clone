# Deploy do Backend no Heroku

Este projeto tem frontend e backend na mesma raiz. Para o Heroku, suba apenas a pasta `backend`.

## 1. Conferir arquivos do backend

O backend ja tem:

```txt
backend/package.json
backend/package-lock.json
backend/Procfile
backend/server.js
```

O `Procfile` deve conter:

```txt
web: node server.js
```

## 2. Criar o app no Heroku

Na raiz do projeto:

```bash
heroku login
heroku create nome-do-seu-backend
```

Se voce ja criou o app no painel do Heroku, conecte o remote:

```bash
heroku git:remote -a nome-do-seu-backend
```

## 3. Configurar variaveis de ambiente

Use os mesmos valores do `backend/.env`, mas configure no Heroku:

```bash
heroku config:set SUPABASE_URL="https://seu-projeto.supabase.co"
heroku config:set SUPABASE_SERVICE_ROLE_KEY="sua-service-role-key"
```

Nao coloque `SUPABASE_SERVICE_ROLE_KEY` na Vercel. Essa chave fica somente no backend.

## 4. Fazer deploy somente da pasta backend

Na raiz do projeto:

```bash
git add backend/Procfile backend/package.json backend/package-lock.json backend/server.js
git commit -m "Prepare backend for Heroku"
git subtree push --prefix backend heroku main
```

Se o push reclamar que nao existe branch `main`, rode:

```bash
git branch -M main
git subtree push --prefix backend heroku main
```

## 5. Testar

Depois do deploy:

```bash
heroku open /health
heroku logs --tail
```

Tambem da para abrir direto:

```txt
https://nome-do-seu-backend.herokuapp.com/health
```

## 6. Ligar a Vercel ao backend

No painel da Vercel, no projeto do frontend, adicione/atualize:

```txt
VITE_API_URL=https://nome-do-seu-backend.herokuapp.com
```

Depois faca um redeploy do frontend na Vercel.

## Checklist rapido

- [ ] Heroku app criado.
- [ ] `SUPABASE_URL` configurado no Heroku.
- [ ] `SUPABASE_SERVICE_ROLE_KEY` configurado no Heroku.
- [ ] Deploy feito com `git subtree push --prefix backend heroku main`.
- [ ] `/health` retorna `{ "status": "ok" }`.
- [ ] Vercel recebeu `VITE_API_URL` com a URL do Heroku.
- [ ] Frontend foi redeployado na Vercel.
