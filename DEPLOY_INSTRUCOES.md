# 🚀 Guia de Deploy - Vercel (Frontend) + Railway (Backend)

## PARTE 1: PREPARAR O REPOSITÓRIO (GitHub)

### 1.1 Inicializar Git (se ainda não tiver)
```bash
cd c:\Users\hiago\Documents\Hiago-projects\Ifood-clone
git init
git add .
git commit -m "Initial commit - iFood clone"
```

### 1.2 Criar repositório no GitHub
1. Acesse [github.com/new](https://github.com/new)
2. Crie um repositório chamado `ifood-clone`
3. Copie a URL do repositório (será algo como `https://github.com/seuusuario/ifood-clone.git`)

### 1.3 Fazer push para GitHub
```bash
git remote add origin https://github.com/SEUUSUARIO/ifood-clone.git
git branch -M main
git push -u origin main
```

---

## PARTE 2: DEPLOY DO BACKEND NO RAILWAY

### 2.1 Preparar o Backend
Verifique se o arquivo `.env` do backend tem as variáveis necessárias:

**backend/.env**
```
SUPABASE_URL=sua_url_do_supabase
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
PORT=3001
```

### 2.2 Criar conta no Railway
1. Acesse [railway.app](https://railway.app)
2. Clique em "Login" → "Login with GitHub"
3. Autorize o Railway a acessar seus repositórios

### 2.3 Deploy no Railway
1. No dashboard do Railway, clique em **"+ New Project"**
2. Selecione **"Deploy from GitHub"**
3. Conecte seu repositório `ifood-clone`
4. Selecione o branch `main`
5. Clique em **"Deploy"**

### 2.4 Configurar Variáveis de Ambiente no Railway
1. No projeto Railway, vá até **"Variables"**
2. Adicione as variáveis:
   - `SUPABASE_URL`: Sua URL do Supabase
   - `SUPABASE_SERVICE_ROLE_KEY`: Sua chave de serviço
   - `PORT`: `3001` (opcional, Railway atribui automaticamente)

### 2.5 Configurar Root Directory
1. Na aba **"Settings"**
2. Em **"Root Directory"**, insira: `backend`
3. Em **"Start Command"**, insira: `npm start`
4. Salve as alterações

### 2.6 Obter a URL do Backend
1. Vá até o **"Deployments"**
2. Copie a URL gerada (será algo como `https://seu-backend-railway.up.railway.app`)
3. **Salve essa URL** - você vai precisar dela para configurar o frontend

---

## PARTE 3: PREPARAR O FRONTEND

### 3.1 Atualizar variáveis de ambiente
Crie/atualize o arquivo **frontend/.env.production**:
```
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_anon_key
VITE_API_URL=https://seu-backend-railway.up.railway.app
```

### 3.2 Atualize o arquivo supabaseClient.js
Verifique se está usando as variáveis corretas:

**frontend/src/lib/supabaseClient.js**
```javascript
const backendApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
```

### 3.3 Verificar se está usando a URL do backend
No **App.jsx**, procure por:
```javascript
const { supabase, supabaseConfigValid, backendApiUrl } = './lib/supabaseClient'
```

---

## PARTE 4: DEPLOY DO FRONTEND NA VERCEL

### 4.1 Criar conta na Vercel
1. Acesse [vercel.com](https://vercel.com)
2. Clique em **"Sign Up"** → **"Continue with GitHub"**
3. Autorize a Vercel a acessar seus repositórios

### 4.2 Deploy na Vercel
1. Na dashboard da Vercel, clique em **"Add New..."** → **"Project"**
2. Busque e selecione o repositório `ifood-clone`
3. Configure o projeto:
   - **Framework**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### 4.3 Adicionar Variáveis de Ambiente
Antes de fazer deploy, vá até **"Environment Variables"** e adicione:
```
VITE_SUPABASE_URL = sua_url_do_supabase
VITE_SUPABASE_ANON_KEY = sua_anon_key
VITE_API_URL = https://seu-backend-railway.up.railway.app
```

### 4.4 Deploy
1. Clique em **"Deploy"**
2. Espere o build completar (2-3 minutos)
3. Acesse sua URL da Vercel (será algo como `https://ifood-clone.vercel.app`)

---

## PARTE 5: CONFIGURAÇÃO FINAL

### 5.1 Testar a Aplicação
1. Acesse `https://seu-front-vercel.app`
2. Teste as funcionalidades principais:
   - Login/Cadastro
   - Busca de restaurantes
   - Carrinho
   - Perfil e foto de perfil
   - Endereços

### 5.2 Ajustar CORS (se necessário)
Se receber erros de CORS, vá ao **backend/server.js** e ajuste:
```javascript
const corsOptions = {
  origin: ['https://seu-front-vercel.app', 'http://localhost:5173'],
  credentials: true
};
app.use(cors(corsOptions));
```

Depois faça push para GitHub:
```bash
git add .
git commit -m "Fix CORS for production"
git push
```

O Railway vai fazer redeploy automaticamente.

---

## PARTE 6: MONITORAMENTO

### Logs do Backend (Railway)
1. Dashboard Railway → Seu projeto
2. Clique em **"Logs"** para ver erros em tempo real

### Logs do Frontend (Vercel)
1. Dashboard Vercel → Seu projeto
2. Clique em **"Deployments"**
3. Selecione o deployment e veja os **"Logs"**

---

## 🔧 COMANDOS ÚTEIS

### Atualizar após fazer mudanças
```bash
# Fazer mudanças no código
git add .
git commit -m "Descrição das mudanças"
git push origin main

# Os deploys acontecem automaticamente no Railway e Vercel
```

### Rollback (voltar para versão anterior)
**Vercel**: Na aba "Deployments", selecione uma versão anterior e clique em "Redeploy"
**Railway**: Em "Deployments", selecione uma versão anterior

---

## 📝 CHECKLIST FINAL

- [ ] Repositório criado no GitHub
- [ ] Backend deployado no Railway
- [ ] Variáveis de ambiente do Backend configuradas
- [ ] URL do Backend obtida
- [ ] Frontend tem `.env.production` com VITE_API_URL
- [ ] Frontend deployado na Vercel
- [ ] Variáveis de ambiente do Frontend configuradas
- [ ] Testei login/cadastro
- [ ] Testei busca de restaurantes
- [ ] Testei upload de foto de perfil
- [ ] Testei carrinho de compras
- [ ] URLs de deploy funcionando

---

## 🆘 TROUBLESHOOTING

### "Cannot reach backend API"
→ Verifique se `VITE_API_URL` está correto e se Railway está rodando

### "CORS error"
→ Atualize CORS no backend (veja Parte 5.2)

### "Build failed"
→ Verifique os logs na Vercel. Geralmente é falta de variáveis de ambiente

### "Database connection failed"
→ Verifique se `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` estão corretos no Railway

---

## 📞 SUPORTE

- **Railway Docs**: https://docs.railway.app
- **Vercel Docs**: https://vercel.com/docs
- **Vite Deploy**: https://vitejs.dev/guide/static-deploy.html
