import { useCallback, useEffect, useMemo, useState } from 'react'
import { Routes, Route, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { supabase, supabaseConfigValid, backendApiUrl } from './lib/supabaseClient'
import RestaurantPage from './pages/RestaurantPage'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import OrderConfirmedPage from './pages/OrderConfirmedPage'
import OrdersPage from './pages/OrdersPage'
import OrderDetailPage from './pages/OrderDetailPage'
import PaymentPage from './pages/PaymentPage'
import SellerChatPage from './pages/SellerChatPage'
import AddressesPage from './pages/AddressesPage'
import { useCart } from './context/CartContext'
import './App.css'

const profilePhotoStorageKey = 'ifood-profile-photo'
const userStorageKey = 'ifood-demo-user'
const addressStorageKey = 'ifood-delivery-address'
const favoritesStorageKey = 'ifood-favorite-restaurants'
const couponStorageKey = 'ifood-selected-coupon'
const cardsStorageKey = 'ifood-payment-cards'

const defaultAddress = 'R. Carlos Inacio Alves, 115'
const defaultAddressOptions = [
  { label: defaultAddress, detail: 'Casa, Londrina - PR' },
  { label: 'R. Wilson Goncalves Brandao, 178', detail: 'Casa, Londrina - PR' },
  { label: 'R. Euclides Saladine, 323', detail: 'Casa, Londrina - PR' },
]

const navItems = ['Restaurantes', 'Mercados', 'Bebidas', 'Farmacias', 'Pets', 'Shopping']

const categoryShortcuts = [
  { label: 'Entrega Rapida', icon: '15 min' },
  { label: 'Golaco de Ofertas', icon: '%' },
  { label: 'Presentes', icon: 'Gift' },
  { label: 'Pizza', icon: 'Pizza', category: 'Pizza' },
  { label: 'Lanches', icon: 'Burger', category: 'Lanches' },
  { label: 'Japonesa', icon: 'Sushi', category: 'Japonesa' },
  { label: 'Mexicana', icon: 'Taco', category: 'Mexicana' },
  { label: 'Doces', icon: 'Cake' },
]

const restaurantCategories = ['Pizza', 'Lanches', 'Japonesa', 'Mexicana']

const sortOptions = [
  { value: 'newest', label: 'Mais recentes' },
  { value: 'rating_desc', label: 'Melhor nota' },
  { value: 'delivery_fee_asc', label: 'Menor taxa' },
  { value: 'time_asc', label: 'Entrega mais rapida' },
]

const coupons = [
  {
    id: 'cupom-10',
    title: 'R$10 para restaurantes selecionados',
    description: 'Valido para pedidos acima de R$ 50, sem considerar taxa de entrega.',
    validUntil: 'Valido ate 31/07',
  },
  {
    id: 'cupom-15',
    title: 'R$15 para bebidas',
    description: 'Valido para pedidos acima de R$ 80 em lojas selecionadas.',
    validUntil: 'Valido ate 31/07',
  },
  {
    id: 'cupom-20',
    title: 'R$20 em mercados',
    description: 'Valido para novos usuarios em compras acima de R$ 120.',
    validUntil: 'Valido ate 31/07',
  },
]

const helpCategories = [
  { title: 'Pagamentos', description: 'Reembolso, Pix falso, cartao e cobrancas.' },
  { title: 'Pedidos', description: 'Status, entrega, cancelamento e acompanhamento.' },
  { title: 'Conta', description: 'Cadastro, login, dados pessoais e seguranca.' },
]

function readStorage(key, fallback) {
  if (typeof window === 'undefined') {
    return fallback
  }

  try {
    const value = window.localStorage.getItem(key)
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

function useLocalStorageState(key, fallback) {
  const [value, setValue] = useState(() => readStorage(key, fallback))

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(key, JSON.stringify(value))
    }
  }, [key, value])

  return [value, setValue]
}

function formatCurrency(value) {
  return Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

function App() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const { itemCount, items, subtotal, deliveryFee, total, updateQuantity, removeItem } = useCart()
  const [authMode, setAuthMode] = useState('login')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(
    !supabaseConfigValid
      ? 'Supabase no frontend nao esta configurado corretamente. Verifique frontend/.env.'
      : ''
  )
  const [restaurants, setRestaurants] = useState([])
  const [restaurantsState, setRestaurantsState] = useState('loading')
  const [profileData, setProfileData] = useState(null)
  const [profileState, setProfileState] = useState('idle')
  const [profilePhoto, setProfilePhoto] = useState(() => {
    if (typeof window === 'undefined') {
      return ''
    }

    return window.localStorage.getItem(profilePhotoStorageKey) || ''
  })
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [user, setUser] = useState(() => readStorage(userStorageKey, null))
  const [profileNameDraft, setProfileNameDraft] = useState('')
  const [profileSaveState, setProfileSaveState] = useState('idle')
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get('busca') || '')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(() => searchParams.get('busca') || '')
  const [categoryFilter, setCategoryFilter] = useState(() => searchParams.get('category') || '')
  const [freeDeliveryFilter, setFreeDeliveryFilter] = useState(() => searchParams.get('freeDelivery') === 'true')
  const [minRatingFilter, setMinRatingFilter] = useState(() => searchParams.get('minRating') || '')
  const [sortOption, setSortOption] = useState(() => searchParams.get('sort') || 'newest')
  const [address, setAddress] = useLocalStorageState(addressStorageKey, defaultAddress)
  const [addressDraft, setAddressDraft] = useState(address)
  const [addressCepDraft, setAddressCepDraft] = useState('')
  const [addressLookupState, setAddressLookupState] = useState('idle')
  const [addressLookupMessage, setAddressLookupMessage] = useState('')
  const [addressOptions, setAddressOptions] = useState(defaultAddressOptions)
  const [favorites, setFavorites] = useLocalStorageState(favoritesStorageKey, [])
  const [selectedCoupon, setSelectedCoupon] = useLocalStorageState(couponStorageKey, null)
  const [paymentCards, setPaymentCards] = useLocalStorageState(cardsStorageKey, [])
  const [profileOpen, setProfileOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [addressOpen, setAddressOpen] = useState(false)
  const [newCardName, setNewCardName] = useState('')
  const [securityForm, setSecurityForm] = useState({ password: '', confirmPassword: '' })
  const [securityState, setSecurityState] = useState('idle')
  const [securityMessage, setSecurityMessage] = useState('')
  const [securityMessageType, setSecurityMessageType] = useState('info')

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.trim())
    }, 400)

    return () => window.clearTimeout(timeoutId)
  }, [searchTerm])

  useEffect(() => {
    if (location.pathname !== '/') {
      return
    }

    const nextParams = new URLSearchParams()

    if (debouncedSearchTerm) {
      nextParams.set('busca', debouncedSearchTerm)
    }

    if (categoryFilter) {
      nextParams.set('category', categoryFilter)
    }

    if (freeDeliveryFilter) {
      nextParams.set('freeDelivery', 'true')
    }

    if (minRatingFilter) {
      nextParams.set('minRating', minRatingFilter)
    }

    if (sortOption !== 'newest') {
      nextParams.set('sort', sortOption)
    }

    setSearchParams(nextParams, { replace: true })
  }, [categoryFilter, debouncedSearchTerm, freeDeliveryFilter, location.pathname, minRatingFilter, setSearchParams, sortOption])

  useEffect(() => {
    const fetchRestaurants = async () => {
      setRestaurantsState('loading')

      try {
        const params = new URLSearchParams()

        if (debouncedSearchTerm) {
          params.set('busca', debouncedSearchTerm)
        }

        if (categoryFilter) {
          params.set('category', categoryFilter)
        }

        if (freeDeliveryFilter) {
          params.set('freeDelivery', 'true')
        }

        if (minRatingFilter) {
          params.set('minRating', minRatingFilter)
        }

        if (sortOption) {
          params.set('sort', sortOption)
        }

        const response = await fetch(`${backendApiUrl}/restaurants?${params.toString()}`)
        if (!response.ok) {
          throw new Error('Nao foi possivel buscar os restaurantes agora.')
        }

        const data = await response.json()
        setRestaurants(Array.isArray(data) ? data : [])
        setRestaurantsState(data.length === 0 ? 'empty' : 'ready')
      } catch (error) {
        setRestaurantsState('error')
        setMessage(error.message)
      }
    }

    fetchRestaurants()
  }, [categoryFilter, debouncedSearchTerm, freeDeliveryFilter, minRatingFilter, sortOption])

  useEffect(() => {
    if (!supabase || !supabaseConfigValid) {
      return
    }

    const setupSession = async () => {
      const { data, error } = await supabase.auth.getSession()
      if (!error && data?.session?.user) {
        const currentUser = data.session.user
        setUser({
          id: currentUser.id,
          email: currentUser.email,
          name: currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0],
        })
      }
    }

    setupSession()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const currentUser = session.user
        setUser({
          id: currentUser.id,
          email: currentUser.email,
          name: currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0],
        })
      } else {
        setUser(null)
      }
    })

    return () => {
      listener?.subscription?.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    if (user) {
      window.localStorage.setItem(userStorageKey, JSON.stringify(user))
    } else {
      window.localStorage.removeItem(userStorageKey)
    }
  }, [user])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(profilePhotoStorageKey, profilePhoto)
    }
  }, [profilePhoto])

  useEffect(() => {
    setProfileNameDraft(user?.name || '')
  }, [user])

  const favoriteIds = useMemo(() => new Set(favorites.map((restaurant) => restaurant.id)), [favorites])

  const handleAuth = async (event) => {
    event.preventDefault()
    setLoading(true)
    setMessage('')

    if (supabase) {
      try {
        if (authMode === 'signup') {
          const { error } = await supabase.auth.signUp({
            email: form.email,
            password: form.password,
            options: { data: { full_name: form.name } },
          })

          if (error) {
            throw error
          }

          setMessage('Cadastro criado com sucesso. Verifique o e-mail para confirmar a conta.')
        } else {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: form.email,
            password: form.password,
          })

          if (error) {
            throw error
          }

          setUser({
            id: data.user.id,
            email: data.user.email,
            name: data.user.user_metadata?.full_name || data.user.email.split('@')[0],
          })
          navigate('/profile')
          setMessage('Login realizado com sucesso.')
        }
      } catch (error) {
        setMessage(error.message || 'Nao foi possivel concluir a autenticacao.')
      } finally {
        setLoading(false)
      }
      return
    }

    if (!form.email || !form.password) {
      setMessage('Informe e-mail e senha para entrar.')
      setLoading(false)
      return
    }

    setUser({
      id: `demo-${Date.now()}`,
      name: form.name || form.email.split('@')[0],
      email: form.email,
    })
    navigate('/profile')
    setMessage(
      authMode === 'signup'
        ? 'Cadastro simulado com sucesso. Configure o Supabase para autenticacao real.'
        : 'Login simulado com sucesso. Configure o Supabase para autenticacao real.'
    )
    setLoading(false)
  }

  const fetchProtectedProfile = useCallback(async () => {
    if (!supabase) {
      throw new Error('Supabase nao configurado no frontend.')
    }

    const { data, error } = await supabase.auth.getSession()
    if (error) {
      throw new Error('Erro ao verificar a sessao do usuario.')
    }

    if (!data?.session?.access_token) {
      throw new Error('Sessao nao encontrada. Faca login novamente.')
    }

    const token = data.session.access_token
    const response = await fetch(`${backendApiUrl}/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}))
      throw new Error(errorBody.error || 'Falha ao buscar perfil protegido.')
    }

    return response.json()
  }, [])

  useEffect(() => {
    if (location.pathname !== '/profile' || !user) {
      return
    }

    if (!supabase) {
      setProfileState('error')
      setMessage('Supabase nao esta configurado corretamente no frontend.')
      return
    }

    const loadProfile = async () => {
      setProfileState('loading')
      setProfileData(null)
      try {
        const data = await fetchProtectedProfile()
        setProfileData(data)
        setProfileState('ready')
      } catch (error) {
        setProfileState('error')
        setMessage(error.message || 'Falha ao buscar perfil protegido.')
      }
    }

    loadProfile()
  }, [fetchProtectedProfile, location.pathname, user])

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut()
    }
    setUser(null)
    setProfileData(null)
    setProfileState('idle')
    setProfileOpen(false)
    navigate('/')
    setMessage('Voce saiu da conta.')
  }

  const updatePassword = async (event) => {
    event.preventDefault()
    setSecurityMessage('')
    setSecurityMessageType('info')

    if (!supabase) {
      setSecurityMessageType('error')
      setSecurityMessage('Supabase nao esta configurado no frontend.')
      return
    }

    if (securityForm.password.length < 6) {
      setSecurityMessageType('error')
      setSecurityMessage('A nova senha precisa ter pelo menos 6 caracteres.')
      return
    }

    if (securityForm.password !== securityForm.confirmPassword) {
      setSecurityMessageType('error')
      setSecurityMessage('As senhas nao conferem.')
      return
    }

    setSecurityState('loading')

    try {
      const { error } = await supabase.auth.updateUser({ password: securityForm.password })
      if (error) {
        throw error
      }

      setSecurityForm({ password: '', confirmPassword: '' })
      setSecurityMessageType('info')
      setSecurityMessage('Senha atualizada com sucesso.')
    } catch (error) {
      setSecurityMessageType('error')
      setSecurityMessage(error.message || 'Nao foi possivel atualizar a senha.')
    } finally {
      setSecurityState('idle')
    }
  }

  const resendConfirmationEmail = async () => {
    setSecurityMessage('')
    setSecurityMessageType('info')

    if (!supabase) {
      setSecurityMessageType('error')
      setSecurityMessage('Supabase nao esta configurado no frontend.')
      return
    }

    if (!user?.email) {
      setSecurityMessageType('error')
      setSecurityMessage('E-mail do usuario nao encontrado.')
      return
    }

    setSecurityState('loading')

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
      })

      if (error) {
        throw error
      }

      setSecurityMessageType('info')
      setSecurityMessage('E-mail de confirmacao reenviado.')
    } catch (error) {
      setSecurityMessageType('error')
      setSecurityMessage(error.message || 'Nao foi possivel reenviar a confirmacao.')
    } finally {
      setSecurityState('idle')
    }
  }

  const saveProfileName = async (event) => {
    event.preventDefault()
    setProfileSaveState('loading')
    setMessage('')

    try {
      const name = profileNameDraft.trim()

      if (name.length < 2) {
        throw new Error('Informe um nome com pelo menos 2 caracteres.')
      }

      if (!supabase) {
        setUser((current) => ({ ...current, name }))
        setMessage('Nome atualizado localmente. Configure o Supabase para salvar no backend.')
        return
      }

      const { data, error } = await supabase.auth.getSession()
      if (error || !data?.session?.access_token) {
        throw new Error('Sessao nao encontrada. Faca login novamente.')
      }

      const response = await fetch(`${backendApiUrl}/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${data.session.access_token}`,
        },
        body: JSON.stringify({ name }),
      })
      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(payload.error || 'Nao foi possivel atualizar o perfil.')
      }

      setUser((current) => ({ ...current, name }))
      setProfileData(payload)
      setMessage('Perfil atualizado.')
    } catch (error) {
      setMessage(error.message || 'Nao foi possivel atualizar o perfil.')
    } finally {
      setProfileSaveState('idle')
    }
  }

  const handleProfilePhotoUpload = (event) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    // Validar tipo de arquivo
    const validImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!validImageTypes.includes(file.type)) {
      setMessage('Por favor, selecione uma imagem (PNG, JPEG, WebP ou GIF).')
      return
    }

    // Validar tamanho (máximo 5MB)
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

  const toggleFavorite = (restaurant) => {
    setFavorites((current) => {
      if (current.some((item) => item.id === restaurant.id)) {
        return current.filter((item) => item.id !== restaurant.id)
      }

      return [
        ...current,
        {
          id: restaurant.id,
          name: restaurant.name,
          description: restaurant.description,
          category: restaurant.category,
          image_url: restaurant.image_url,
          rating: restaurant.rating,
          delivery_fee: restaurant.delivery_fee,
          estimated_time_min: restaurant.estimated_time_min,
        },
      ]
    })
  }

  const saveAddress = (event) => {
    event.preventDefault()
    if (addressDraft.trim()) {
      setAddress(addressDraft.trim())
    }
    setAddressLookupMessage('')
    setMessage('')
    setAddressOpen(false)
  }

  const lookupAddressDraftCep = async () => {
    const cep = addressCepDraft.replace(/\D/g, '')

    if (cep.length !== 8) {
      setAddressLookupMessage('Digite um CEP com 8 digitos para buscar o endereco.')
      return
    }

    setAddressLookupState('loading')
    setAddressLookupMessage('')

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
      if (!response.ok) {
        throw new Error('Nao foi possivel consultar o CEP agora.')
      }

      const data = await response.json()
      if (data.erro) {
        throw new Error('CEP nao encontrado.')
      }

      const label = [data.logradouro, data.bairro, data.localidade, data.uf]
        .filter(Boolean)
        .join(', ')
      const detail = `CEP ${data.cep}${data.complemento ? `, ${data.complemento}` : ''}`
      const viaCepOption = { label, detail }

      setAddressDraft(label)
      setAddressCepDraft(data.cep || cep)
      setAddressOptions((current) => [
        viaCepOption,
        ...current.filter((option) => option.label !== label),
      ])
      setAddressLookupMessage('Endereco encontrado pelo ViaCEP. Complete o numero se precisar antes de usar.')
    } catch (error) {
      setAddressLookupMessage(error.message || 'Nao foi possivel consultar o CEP.')
    } finally {
      setAddressLookupState('idle')
    }
  }

  const addPaymentCard = (event) => {
    event.preventDefault()

    if (!newCardName.trim()) {
      return
    }

    setPaymentCards((current) => [
      ...current,
      {
        id: `card-${Date.now()}`,
        name: newCardName.trim(),
        label: `Cartao final ${String(Date.now()).slice(-4)}`,
      },
    ])
    setNewCardName('')
  }

  const hasRestaurantFilters = Boolean(
    searchTerm || categoryFilter || freeDeliveryFilter || minRatingFilter || sortOption !== 'newest'
  )

  const clearRestaurantFilters = () => {
    setSearchTerm('')
    setDebouncedSearchTerm('')
    setCategoryFilter('')
    setFreeDeliveryFilter(false)
    setMinRatingFilter('')
    setSortOption('newest')
  }

  const authForm = (
    <form className="auth-form" onSubmit={handleAuth}>
      {authMode === 'signup' ? (
        <input
          type="text"
          placeholder="Seu nome"
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
        />
      ) : null}
      <input
        type="email"
        placeholder="Seu e-mail"
        required
        value={form.email}
        onChange={(event) => setForm({ ...form, email: event.target.value })}
      />
      <input
        type="password"
        placeholder="Sua senha"
        required
        value={form.password}
        onChange={(event) => setForm({ ...form, password: event.target.value })}
      />
      <button type="submit" className="primary-button" disabled={loading}>
        {loading ? 'Aguarde...' : authMode === 'signup' ? 'Criar conta' : 'Entrar'}
      </button>
      <button
        type="button"
        className="text-button"
        onClick={() => setAuthMode(authMode === 'signup' ? 'login' : 'signup')}
      >
        {authMode === 'signup' ? 'Ja tenho conta' : 'Quero me cadastrar'}
      </button>
    </form>
  )

  const renderRestaurantCard = (restaurant) => (
    <article
      className="restaurant-card"
      key={restaurant.id}
      onClick={() => navigate(`/restaurante/${restaurant.id}`)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          navigate(`/restaurante/${restaurant.id}`)
        }
      }}
      tabIndex={0}
      role="button"
    >
      <div className="restaurant-image" style={{ backgroundImage: `url(${restaurant.image_url})` }} />
      <div className="restaurant-info">
        <div className="restaurant-title-row">
          <h3>{restaurant.name}</h3>
          <button
            type="button"
            className={`icon-button ${favoriteIds.has(restaurant.id) ? 'icon-button-active' : ''}`}
            aria-label="Favoritar restaurante"
            onClick={(event) => {
              event.stopPropagation()
              toggleFavorite(restaurant)
            }}
          >
            {favoriteIds.has(restaurant.id) ? '♥' : '♡'}
          </button>
        </div>
        <p>{restaurant.description}</p>
        <div className="restaurant-meta">
          <span>
            {restaurant.review_count
              ? `${Number(restaurant.average_rating || restaurant.rating).toFixed(1)} · ${restaurant.review_count} avaliacoes`
              : 'Novo'}
          </span>
          <span>{restaurant.category}</span>
          <span>{restaurant.estimated_time_min} min</span>
          <span>{formatCurrency(restaurant.delivery_fee)}</span>
        </div>
      </div>
    </article>
  )

  const homePage = (
    <main className="page-container">
      <section className="section-block">
        <h1>Pedir seu delivery no iFood e rapido e pratico! Conheca as categorias</h1>
        <div className="shortcut-grid">
          {categoryShortcuts.map((category) => (
            <button
              type="button"
              className="shortcut-card"
              key={category.label}
              onClick={() => {
                if (category.category) {
                  setSearchTerm('')
                  setCategoryFilter(category.category)
                  return
                }

                setCategoryFilter('')
                setSearchTerm(category.label)
              }}
            >
              <span>{category.icon}</span>
              {category.label}
            </button>
          ))}
        </div>
      </section>

      <section className="promo-banner">
        <div>
          <span>Pede iFood ja!</span>
          <strong>Acerte no presente sem sair de casa</strong>
          <small>Cupons, restaurantes e entrega rapida em um so lugar.</small>
        </div>
      </section>

      <section className="section-block">
        <div className="section-title-row">
          <h2>Restaurantes</h2>
          {hasRestaurantFilters ? (
            <button type="button" className="text-button" onClick={clearRestaurantFilters}>
              Limpar filtros
            </button>
          ) : null}
        </div>

        <div className="filter-bar">
          <div className="filter-chip-group" aria-label="Categorias">
            <button
              type="button"
              className={`filter-chip ${categoryFilter === '' ? 'filter-chip-active' : ''}`}
              onClick={() => setCategoryFilter('')}
            >
              Todos
            </button>
            {restaurantCategories.map((category) => (
              <button
                type="button"
                className={`filter-chip ${categoryFilter === category ? 'filter-chip-active' : ''}`}
                key={category}
                onClick={() => setCategoryFilter(category)}
              >
                {category}
              </button>
            ))}
          </div>

          <label className="filter-toggle">
            <input
              type="checkbox"
              checked={freeDeliveryFilter}
              onChange={(event) => setFreeDeliveryFilter(event.target.checked)}
            />
            Taxa gratis
          </label>

          <label className="filter-select">
            Nota minima
            <select value={minRatingFilter} onChange={(event) => setMinRatingFilter(event.target.value)}>
              <option value="">Qualquer nota</option>
              <option value="4.5">4.5+</option>
              <option value="4.7">4.7+</option>
              <option value="4.8">4.8+</option>
            </select>
          </label>

          <label className="filter-select">
            Ordenar por
            <select value={sortOption} onChange={(event) => setSortOption(event.target.value)}>
              {sortOptions.map((option) => (
                <option value={option.value} key={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
        </div>

        {restaurantsState === 'loading' ? <p className="state-card">Carregando restaurantes...</p> : null}
        {restaurantsState === 'error' ? (
          <p className="state-card state-error">Nao foi possivel carregar a lista agora.</p>
        ) : null}
        {restaurantsState === 'empty' ? <p className="state-card">Ainda nao ha restaurantes cadastrados.</p> : null}
        {restaurantsState === 'ready' && restaurants.length === 0 ? (
          <EmptyState
            title={debouncedSearchTerm ? `Nada encontrado para "${debouncedSearchTerm}"` : 'Nenhum resultado encontrado'}
            actionLabel="Limpar filtros"
            onAction={clearRestaurantFilters}
          />
        ) : null}

        {restaurantsState === 'ready' && restaurants.length > 0 ? (
          <div className="restaurant-list">{restaurants.map(renderRestaurantCard)}</div>
        ) : null}
      </section>
    </main>
  )

  const authPage = (
    <section className="page-container narrow-page">
      <div className="simple-card">
        <h1>{authMode === 'signup' ? 'Criar conta' : 'Entrar'}</h1>
        <p className="muted-text">Entre para acompanhar pedidos, pagamentos, cupons e favoritos.</p>
        {authForm}
      </div>
    </section>
  )

  const profilePage = (
    <section className="page-container narrow-page">
      <div className="simple-card">
        <h1>Meus dados</h1>
        <div className="profile-avatar-row">
          <div className="profile-avatar">
            {profilePhoto ? <img src={profilePhoto} alt="Foto de perfil" /> : <span>{user?.name?.[0] || 'U'}</span>}
          </div>
          <label className="checkout-field">
            <span>Foto de perfil</span>
            <label htmlFor="profile-photo-input" className="file-input-label">
              Escolher Foto
            </label>
            <input
              id="profile-photo-input"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={handleProfilePhotoUpload}
            />
          </label>
        </div>
        <form className="profile-form" onSubmit={saveProfileName}>
          <label className="checkout-field">
            <span>Nome</span>
            <input value={profileNameDraft} onChange={(event) => setProfileNameDraft(event.target.value)} />
          </label>
          <button type="submit" className="primary-button" disabled={profileSaveState === 'loading'}>
            {profileSaveState === 'loading' ? 'Salvando...' : 'Salvar nome'}
          </button>
        </form>
        <p>E-mail: {user?.email}</p>

        {profileState === 'loading' ? <p className="state-card">Validando sessao...</p> : null}
        {profileState === 'error' ? (
          <p className="state-card state-error">Nao foi possivel validar sua sessao agora.</p>
        ) : null}
        {profileState === 'ready' && profileData ? (
          <p className="state-card">Conta conectada e validada pelo backend.</p>
        ) : null}

        <button type="button" className="secondary-button" onClick={handleLogout}>
          Sair
        </button>
        <button type="button" className="secondary-button" onClick={() => navigate('/enderecos')}>
          Meus enderecos
        </button>
      </div>
    </section>
  )

  const couponsPage = (
    <section className="page-container">
      <div className="coupon-hero">Aproveite todos os seus cupons de desconto disponiveis!</div>
      <div className="section-title-row">
        <div>
          <h1>Carteira de cupons</h1>
          <p className="muted-text">Ativos ({coupons.length})</p>
        </div>
      </div>
      <div className="coupon-grid">
        {coupons.map((coupon) => (
          <article className="coupon-card" key={coupon.id}>
            <span className="coupon-icon">%</span>
            <h3>{coupon.title}</h3>
            <p>{coupon.description}</p>
            <button type="button" className="outline-button" onClick={() => setSelectedCoupon(coupon)}>
              {selectedCoupon?.id === coupon.id ? 'Cupom selecionado' : 'Usar cupom'}
            </button>
            <div className="coupon-footer">
              <button type="button" className="text-button">Ver regras</button>
              <span>{coupon.validUntil}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  )

  const favoritesPage = (
    <section className="page-container">
      <h1>Favoritos</h1>
      {favorites.length === 0 ? (
        <EmptyState title="Nenhum resultado encontrado" actionLabel="Voltar" onAction={() => navigate('/')} />
      ) : (
        <div className="restaurant-list">{favorites.map(renderRestaurantCard)}</div>
      )}
    </section>
  )

  const paymentMethodsPage = (
    <section className="page-container narrow-page">
      <h1>Formas de pagamento</h1>
      <div className="payment-empty-card">
        <div className="payment-illustration">CARD</div>
        <div>
          <h2>Adicione um cartao no iFood</h2>
          <p className="muted-text">E pratico, seguro e voce nao perde tempo quando seu pedido chegar.</p>
          <form className="inline-form" onSubmit={addPaymentCard}>
            <input
              value={newCardName}
              placeholder="Nome do cartao"
              onChange={(event) => setNewCardName(event.target.value)}
            />
            <button type="submit" className="primary-button">Adicionar novo cartao</button>
          </form>
        </div>
      </div>
      {paymentCards.length ? (
        <div className="simple-card">
          <h2>Cartoes salvos</h2>
          {paymentCards.map((card) => (
            <div className="saved-card" key={card.id}>
              <span>{card.name}</span>
              <strong>{card.label}</strong>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  )

  const loyaltyPage = (
    <section className="page-container centered-empty-page">
      <div className="loyalty-box">Star</div>
      <h1>Voce nao esta participando de fidelidades no momento</h1>
      <p className="muted-text">Faca pedidos em lojas com fidelidade para comecar a receber beneficios.</p>
    </section>
  )

  const helpPage = (
    <section className="page-container help-page">
      <p className="muted-text">Ajuda</p>
      <h1>Como podemos ajudar?</h1>
      <div className="help-latest">
        <h2>Ultimos pedidos</h2>
        <button type="button" className="order-help-card" onClick={() => navigate('/pedidos')}>
          <span className="restaurant-avatar">IF</span>
          <span>
            <strong>Ver meus pedidos</strong>
            <small>Acompanhe status, reembolso e conversa com vendedor.</small>
          </span>
          <strong>›</strong>
        </button>
      </div>
      <h2>Categorias</h2>
      <div className="help-grid">
        {helpCategories.map((category) => (
          <article className="help-card" key={category.title}>
            <h3>{category.title}</h3>
            <p>{category.description}</p>
          </article>
        ))}
      </div>
    </section>
  )

  const securityPage = (
    <section className="page-container narrow-page">
      <div className="simple-card">
        <h1>Seguranca</h1>
        <p className="muted-text">Gerencie senha, sessao e verificacao da sua conta.</p>

        {securityMessage ? (
          <p className={`state-card ${securityMessageType === 'error' ? 'state-error' : ''}`}>
            {securityMessage}
          </p>
        ) : null}

        <div className="security-grid">
          <section className="security-card">
            <h2>Status da conta</h2>
            <div className="summary-row">
              <span>E-mail</span>
              <strong>{user?.email || 'Nao conectado'}</strong>
            </div>
            <div className="summary-row">
              <span>Autenticacao</span>
              <strong>{supabaseConfigValid ? 'Supabase Auth' : 'Modo demo'}</strong>
            </div>
            <button
              type="button"
              className="secondary-button"
              disabled={securityState === 'loading' || !user?.email}
              onClick={resendConfirmationEmail}
            >
              Reenviar confirmacao de e-mail
            </button>
          </section>

          <form className="security-card" onSubmit={updatePassword}>
            <h2>Trocar senha</h2>
            <label className="checkout-field">
              <span>Nova senha</span>
              <input
                type="password"
                value={securityForm.password}
                minLength={6}
                onChange={(event) => setSecurityForm({ ...securityForm, password: event.target.value })}
              />
            </label>
            <label className="checkout-field">
              <span>Confirmar nova senha</span>
              <input
                type="password"
                value={securityForm.confirmPassword}
                minLength={6}
                onChange={(event) => setSecurityForm({ ...securityForm, confirmPassword: event.target.value })}
              />
            </label>
            <button type="submit" className="primary-button" disabled={securityState === 'loading'}>
              {securityState === 'loading' ? 'Salvando...' : 'Atualizar senha'}
            </button>
          </form>

          <section className="security-card">
            <h2>Sessao</h2>
            <p className="muted-text">Encerre a sessao neste navegador.</p>
            <button type="button" className="secondary-button" onClick={handleLogout}>
              Sair da conta
            </button>
          </section>
        </div>
      </div>
    </section>
  )

  const categoryPage = (
    <section className="page-container">
      <EmptyState title="Nenhum resultado encontrado" actionLabel="Voltar para a Home" onAction={() => navigate('/')} />
    </section>
  )

  return (
    <div className="app-shell">
      <header className="app-header">
        <button type="button" className="brand-logo" onClick={() => navigate('/')}>
          ifood
        </button>

        <nav className="main-nav">
          <button type="button" onClick={() => navigate('/')}>Inicio</button>
          {navItems.map((item) => (
            <button type="button" key={item} onClick={() => navigate(item === 'Restaurantes' ? '/' : `/categoria/${item.toLowerCase()}`)}>
              {item}
            </button>
          ))}
        </nav>

        <label className="search-box">
          <span>⌕</span>
          <input
            placeholder="Busque por item ou loja"
            value={searchTerm}
            onChange={(event) => {
              setSearchTerm(event.target.value)
              if (location.pathname !== '/') {
                navigate('/')
              }
            }}
          />
        </label>

        <button type="button" className="address-button" onClick={() => {
          setAddressDraft(address)
          setAddressCepDraft('')
          setAddressLookupMessage('')
          setAddressOpen(true)
        }}>
          {address} <span>⌄</span>
        </button>

        <button type="button" className="header-icon" onClick={() => setProfileOpen(true)} aria-label="Abrir perfil">
          {profilePhoto ? <img src={profilePhoto} alt="Perfil" /> : <span>{user?.name?.[0] || 'U'}</span>}
        </button>

        <button type="button" className="bag-button" onClick={() => setCartOpen(true)} aria-label="Abrir sacola">
          <span>▢</span>
          <small>{formatCurrency(total)}<br />{itemCount} itens</small>
        </button>
      </header>

      {message ? <p className="status-banner">{message}</p> : null}

      <Routes>
        <Route path="/" element={homePage} />
        <Route path="/auth" element={authPage} />
        <Route path="/profile" element={user ? profilePage : authPage} />
        <Route path="/cupons" element={couponsPage} />
        <Route path="/favoritos" element={favoritesPage} />
        <Route path="/enderecos" element={<AddressesPage />} />
        <Route path="/pagamento" element={paymentMethodsPage} />
        <Route path="/fidelidade" element={loyaltyPage} />
        <Route path="/ajuda" element={helpPage} />
        <Route path="/seguranca" element={securityPage} />
        <Route path="/categoria/:categoryName" element={categoryPage} />
        <Route path="/restaurante/:restaurantId" element={<RestaurantPage />} />
        <Route path="/carrinho" element={<CartPage selectedCoupon={selectedCoupon} />} />
        <Route path="/checkout" element={<CheckoutPage selectedCoupon={selectedCoupon} />} />
        <Route path="/pedido-confirmado/:orderId" element={<OrderConfirmedPage />} />
        <Route path="/pedidos" element={<OrdersPage />} />
        <Route path="/pedidos/:orderId" element={<OrderDetailPage />} />
        <Route path="/pedidos/:orderId/pagamento" element={<PaymentPage />} />
        <Route path="/pedidos/:orderId/chat" element={<SellerChatPage />} />
        <Route path="*" element={homePage} />
      </Routes>

      {profileOpen ? (
        <ProfileDrawer
          user={user}
          profilePhoto={profilePhoto}
          onClose={() => setProfileOpen(false)}
          onNavigate={(path) => {
            setProfileOpen(false)
            navigate(path)
          }}
          onLogout={handleLogout}
        />
      ) : null}

      {cartOpen ? (
        <CartDrawer
          items={items}
          itemCount={itemCount}
          subtotal={subtotal}
          deliveryFee={deliveryFee}
          total={total}
          selectedCoupon={selectedCoupon}
          onClose={() => setCartOpen(false)}
          onNavigate={(path) => {
            setCartOpen(false)
            navigate(path)
          }}
          updateQuantity={updateQuantity}
          removeItem={removeItem}
        />
      ) : null}

      {addressOpen ? (
        <div className="modal-backdrop" onClick={() => setAddressOpen(false)}>
          <form className="address-modal" onSubmit={saveAddress} onClick={(event) => event.stopPropagation()}>
            <button type="button" className="modal-close" onClick={() => setAddressOpen(false)}>×</button>
            <div className="location-illustration">PIN</div>
            <h2>Onde voce quer receber seu pedido?</h2>
            <label className="checkout-field modal-address-field">
              <span>CEP</span>
              <input
                value={addressCepDraft}
                placeholder="00000-000"
                inputMode="numeric"
                onChange={(event) => setAddressCepDraft(event.target.value)}
              />
            </label>
            <label className="search-box address-search">
              <span>⌕</span>
              <input
                value={addressDraft}
                placeholder="Endereco selecionado ou manual"
                onChange={(event) => setAddressDraft(event.target.value)}
              />
            </label>
            <button
              type="button"
              className="secondary-button"
              disabled={addressLookupState === 'loading'}
              onClick={lookupAddressDraftCep}
            >
              {addressLookupState === 'loading' ? 'Buscando CEP...' : 'Buscar CEP'}
            </button>
            {addressLookupMessage ? <p className="state-card address-lookup-message">{addressLookupMessage}</p> : null}
            {addressOptions.map((item) => (
              <button
                type="button"
                className={`address-option ${addressDraft === item.label ? 'address-option-active' : ''}`}
                key={`${item.label}-${item.detail}`}
                onClick={() => setAddressDraft(item.label)}
              >
                <span>⌂</span>
                <span>{item.label}<small>{item.detail}</small></span>
              </button>
            ))}
            <button type="submit" className="primary-button">Usar este endereco</button>
          </form>
        </div>
      ) : null}
    </div>
  )
}

function ProfileDrawer({ user, profilePhoto, onClose, onNavigate, onLogout }) {
  const menuItems = [
    { label: 'Pedidos', path: '/pedidos' },
    { label: 'Meus Cupons', path: '/cupons' },
    { label: 'Favoritos', path: '/favoritos' },
    { label: 'Meus enderecos', path: '/enderecos' },
    { label: 'Pagamento', path: '/pagamento' },
    { label: 'Fidelidade', path: '/fidelidade' },
    { label: 'Ajuda', path: '/ajuda' },
    { label: 'Meus dados', path: '/profile' },
    { label: 'Seguranca', path: '/seguranca' },
  ]

  return (
    <aside className="side-panel profile-panel">
      <button type="button" className="modal-close" onClick={onClose}>×</button>
      <div className="profile-panel-header">
        <div className="profile-avatar">
          {profilePhoto ? <img src={profilePhoto} alt="Perfil" /> : <span>{user?.name?.[0] || 'U'}</span>}
        </div>
        <h2>Ola, {user?.name || 'visitante'}</h2>
      </div>
      <div className="notification-card">
        <strong>Ative as notificacoes</strong>
        <p>Acompanhe de perto o andamento dos seus pedidos, promocoes e novidades.</p>
        <button type="button" className="text-button">Ativar</button>
      </div>
      <nav className="drawer-menu">
        {menuItems.map((item) => (
          <button type="button" key={item.path} onClick={() => onNavigate(item.path)}>
            <span>{item.label}</span>
            <strong>›</strong>
          </button>
        ))}
        {user ? (
          <button type="button" onClick={onLogout}>
            <span>Sair</span>
            <strong>›</strong>
          </button>
        ) : (
          <button type="button" onClick={() => onNavigate('/auth')}>
            <span>Entrar</span>
            <strong>›</strong>
          </button>
        )}
      </nav>
    </aside>
  )
}

function CartDrawer({ items, itemCount, subtotal, deliveryFee, total, selectedCoupon, onClose, onNavigate, updateQuantity, removeItem }) {
  return (
    <aside className="side-panel cart-drawer">
      <button type="button" className="modal-close" onClick={onClose}>×</button>
      <h2>Sacola</h2>
      {items.length === 0 ? (
        <EmptyState title="Sua sacola esta vazia" subtitle="Adicione itens" />
      ) : (
        <>
          <p className="muted-text">{itemCount} {itemCount === 1 ? 'item' : 'itens'} no pedido</p>
          <div className="drawer-cart-list">
            {items.map((item) => (
              <article className="drawer-cart-item" key={item.id}>
                <div>
                  <strong>{item.name}</strong>
                  <p>{formatCurrency(item.price * item.quantity)}</p>
                </div>
                <div className="quantity-controls">
                  <button type="button" onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</button>
                  <span>{item.quantity}</span>
                  <button type="button" onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                </div>
                <button type="button" className="text-button" onClick={() => removeItem(item.id)}>Remover</button>
              </article>
            ))}
          </div>
          {selectedCoupon ? <p className="state-card">Cupom selecionado: {selectedCoupon.title}</p> : null}
          <div className="cart-summary">
            <div className="summary-row">
              <span>Subtotal</span>
              <strong>{formatCurrency(subtotal)}</strong>
            </div>
            <div className="summary-row">
              <span>Taxa de entrega</span>
              <strong>{formatCurrency(deliveryFee)}</strong>
            </div>
            <div className="summary-row summary-total">
              <span>Total</span>
              <strong>{formatCurrency(total)}</strong>
            </div>
            <button type="button" className="primary-button" onClick={() => onNavigate('/checkout')}>
              Finalizar pedido
            </button>
          </div>
        </>
      )}
    </aside>
  )
}

function EmptyState({ title, subtitle, actionLabel, onAction }) {
  return (
    <div className="empty-state">
      <div className="empty-illustration">iF</div>
      <strong>{title}</strong>
      {subtitle ? <p>{subtitle}</p> : null}
      {actionLabel ? (
        <button type="button" className="text-button" onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  )
}

export default App
