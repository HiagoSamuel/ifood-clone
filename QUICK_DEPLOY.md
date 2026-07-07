# 🚀 QUICK START - DEPLOY

## ⚡ Resumo Rápido

| Plataforma | Serviço | Comando |
|-----------|---------|---------|
| **GitHub** | Repositório | `git push origin main` |
| **Railway** | Backend (Node.js) | Connect repo + Push |
| **Vercel** | Frontend (React/Vite) | Connect repo + Push |

---

## 📋 PRÉ-REQUISITOS

- [ ] Conta GitHub (crie em [github.com](https://github.com))
- [ ] Conta Railway (crie em [railway.app](https://railway.app))
- [ ] Conta Vercel (crie em [vercel.com](https://vercel.com))
- [ ] Credenciais Supabase (URL e Keys)

---

## 1️⃣ GITHUB - Push do Repositório

```bash
cd c:\Users\hiago\Documents\Hiago-projects\Ifood-clone

# Iniciar git (se não tiver)
git init
git add .
git commit -m "Initial commit - iFood clone"

# Adicionar remote (substitua SEU_USUARIO)
git remote add origin https://github.com/SEU_USUARIO/ifood-clone.git
git branch -M main
git push -u origin main
```

---

## 2️⃣ RAILWAY - Backend Deploy

### Passo 1: Abrir Railway
→ Acesse [railway.app/dashboard](https://railway.app/dashboard)

### Passo 2: New Project
1. Clique **"+ New Project"**
2. Selecione **"Deploy from GitHub"**
3. Busque `ifood-clone` e selecione

### Passo 3: Configurar
1. Em **Variables**, adicione:
   ```
   SUPABASE_URL = [sua_url_supabase]
   SUPABASE_SERVICE_ROLE_KEY = [sua_key_supabase]
   ```
2. Em **Settings**, defina:
   - **Root Directory**: `backend`
   - **Start Command**: `npm start`

### Passo 4: Deploy
→ Clique **"Deploy"**

### Passo 5: Copiar URL
→ Copie a URL gerada (ex: `https://seu-backend-railway.up.railway.app`)

---

## 3️⃣ VERCEL - Frontend Deploy

### Passo 1: Abrir Vercel
→ Acesse [vercel.com/dashboard](https://vercel.com/dashboard)

### Passo 2: New Project
1. Clique **"Add New"** → **"Project"**
2. Busque `ifood-clone` e selecione

### Passo 3: Configurar Build
1. **Framework**: Vite
2. **Root Directory**: `frontend`
3. **Build Command**: `npm run build`
4. **Output Directory**: `dist`

### Passo 4: Environment Variables
Adicione antes de fazer deploy:
```
VITE_SUPABASE_URL = [sua_url_supabase]
VITE_SUPABASE_ANON_KEY = [sua_anon_key]
VITE_API_URL = https://seu-backend-railway.up.railway.app
```

### Passo 5: Deploy
→ Clique **"Deploy"**

---

## ✅ TESTAR

1. Acesse `https://seu-frontend.vercel.app`
2. Teste:
   - [ ] Login/Cadastro
   - [ ] Buscar restaurantes
   - [ ] Ver menu
   - [ ] Adicionar ao carrinho
   - [ ] Upload de foto de perfil
   - [ ] Endereços

---

## 📝 UPDATES

Depois que estiver deployado, para atualizar:

```bash
git add .
git commit -m "Sua mensagem"
git push origin main
```

O Railway e Vercel fazem redeploy **automaticamente**! ✨

---

## 🆘 PROBLEMAS COMUNS

| Erro | Solução |
|------|---------|
| "Cannot reach API" | Verifique `VITE_API_URL` na Vercel |
| "CORS error" | Atualize CORS no backend |
| "Build failed" | Verifique variables na Vercel |
| "Database error" | Verifique Supabase keys no Railway |

---

## 📚 DOCUMENTAÇÃO COMPLETA

Ver [DEPLOY_INSTRUCOES.md](./DEPLOY_INSTRUCOES.md) para guia detalhado.
