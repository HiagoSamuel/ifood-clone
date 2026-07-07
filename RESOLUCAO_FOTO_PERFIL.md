# Resolução: Upload de Foto de Perfil por Arquivo Local

## Problema Original
A aba "Meus dados" do aplicativo iFood-clone apenas permitia definir a foto de perfil através de URL. Era necessário permitir que o usuário pudesse fazer upload de imagens locais (PNG, JPEG, etc.) do seu próprio PC.

## Solução Implementada

### 1. Nova Função: `handleProfilePhotoUpload`
Adicionada uma função no [App.jsx](frontend/src/App.jsx#L565-L600) que:
- Valida o tipo de arquivo (apenas PNG, JPEG, WebP e GIF)
- Valida o tamanho máximo (5MB)
- Converte a imagem para Base64 usando FileReader API
- Armazena a imagem em localStorage
- Exibe mensagens de feedback ao usuário (sucesso ou erro)

```javascript
const handleProfilePhotoUpload = (event) => {
  const file = event.target.files?.[0]
  if (!file) return
  
  // Validação de tipo
  const validImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!validImageTypes.includes(file.type)) {
    setMessage('Por favor, selecione uma imagem (PNG, JPEG, WebP ou GIF).')
    return
  }
  
  // Validação de tamanho (máximo 5MB)
  const maxSizeInBytes = 5 * 1024 * 1024
  if (file.size > maxSizeInBytes) {
    setMessage('A imagem deve ter no máximo 5MB.')
    return
  }
  
  // Converter arquivo para base64
  const reader = new FileReader()
  reader.onload = (e) => {
    const base64String = e.target?.result
    if (typeof base64String === 'string') {
      setProfilePhoto(base64String)
      setMessage('Foto de perfil atualizada com sucesso!')
    }
  }
  reader.onerror = () => {
    setMessage('Erro ao ler o arquivo. Tente novamente.')
  }
  reader.readAsDataURL(file)
}
```

### 2. Modificação do Campo de Entrada

#### Antes:
```jsx
<label className="checkout-field">
  <span>Foto de perfil (URL)</span>
  <input
    type="url"
    placeholder="https://..."
    value={profilePhoto}
    onChange={(event) => setProfilePhoto(event.target.value)}
  />
</label>
```

#### Depois:
```jsx
<label className="checkout-field">
  <span>Foto de perfil</span>
  <input
    type="file"
    accept="image/png,image/jpeg,image/webp,image/gif"
    onChange={handleProfilePhotoUpload}
  />
</label>
```

## Recursos Implementados

✅ **Upload de arquivo local** - Usuário pode selecionar PNG, JPEG, WebP ou GIF do seu PC  
✅ **Validação de tipo** - Apenas imagens são aceitas  
✅ **Validação de tamanho** - Máximo 5MB por imagem  
✅ **Conversão Base64** - Imagem convertida e armazenada em localStorage  
✅ **Preview em tempo real** - Foto aparece imediatamente no avatar  
✅ **Feedback ao usuário** - Mensagens de sucesso/erro via status banner  

## Armazenamento
- A imagem é convertida para Base64 Data URL
- É armazenada em localStorage com a chave `'ifood-profile-photo'`
- Persiste entre sessões do navegador
- Exibida tanto na página de perfil quanto na drawer de menu

## Testes
Um arquivo de teste foi criado em [frontend/test-profile-upload.html](frontend/test-profile-upload.html) que demonstra:
- A funcionalidade de upload de imagem
- As validações de tipo e tamanho
- O armazenamento em localStorage
- O preview em tempo real

## Compatibilidade
- ✅ Chrome/Chromium
- ✅ Firefox
- ✅ Safari
- ✅ Edge
- ✅ Todos os navegadores que suportam FileReader API

## Arquivos Modificados
- [frontend/src/App.jsx](frontend/src/App.jsx) - Adição de função e modificação do input

## Próximas Melhorias (Opcional)
1. Integração com Supabase Storage para armazenar imagens no cloud
2. Compressão de imagem antes de armazenar
3. Suporte a corte/edição de imagem antes do upload
4. Persistência da foto de perfil no backend
