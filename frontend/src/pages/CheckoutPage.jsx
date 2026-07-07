import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { backendApiUrl, supabase } from '../lib/supabaseClient'
import { useCart } from '../context/CartContext'

function buildDeliveryAddress(address) {
  const cep = address.cep ? `CEP ${address.cep}` : ''
  const required = `${address.street}, ${address.number} - ${address.neighborhood}`
  const optional = [
    address.complement ? `Complemento: ${address.complement}` : '',
    address.reference_point ? `Referencia: ${address.reference_point}` : '',
  ].filter(Boolean)

  return [address.nickname, cep, required, ...optional].filter(Boolean).join(' | ')
}

async function getAccessToken() {
  if (!supabase) {
    throw new Error('Supabase nao configurado no frontend.')
  }

  const { data, error } = await supabase.auth.getSession()
  if (error || !data?.session?.access_token) {
    throw new Error('Faca login antes de finalizar o pedido.')
  }

  return data.session.access_token
}

function CheckoutPage({ selectedCoupon = null }) {
  const navigate = useNavigate()
  const { items, restaurantId, subtotal, deliveryFee, total, clearCart } = useCart()
  const [addresses, setAddresses] = useState([])
  const [selectedAddressId, setSelectedAddressId] = useState('')
  const [addressState, setAddressState] = useState('loading')
  const [paymentMethod, setPaymentMethod] = useState('pix_entrega')
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const loadAddresses = async () => {
      setAddressState('loading')
      setMessage('')

      try {
        const token = await getAccessToken()
        const response = await fetch(`${backendApiUrl}/addresses`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const payload = await response.json().catch(() => [])

        if (!response.ok) {
          throw new Error(payload.error || 'Nao foi possivel carregar seus enderecos.')
        }

        const nextAddresses = Array.isArray(payload) ? payload : []
        setAddresses(nextAddresses)
        setSelectedAddressId(nextAddresses.find((address) => address.is_default)?.id || nextAddresses[0]?.id || '')
        setAddressState(nextAddresses.length ? 'ready' : 'empty')
      } catch (error) {
        setAddressState('error')
        setMessage(error.message || 'Nao foi possivel carregar seus enderecos.')
      }
    }

    loadAddresses()
  }, [])

  const selectedAddress = useMemo(
    () => addresses.find((address) => address.id === selectedAddressId) || null,
    [addresses, selectedAddressId]
  )

  const handleSubmit = async (event) => {
    event.preventDefault()
    setMessage('')

    if (!items.length) {
      setMessage('Seu carrinho esta vazio.')
      return
    }

    if (!selectedAddress) {
      setMessage('Escolha um endereco salvo para continuar.')
      return
    }

    setStatus('loading')

    try {
      const token = await getAccessToken()
      const response = await fetch(`${backendApiUrl}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          restaurantId,
          items: items.map((item) => ({
            id: item.id,
            quantity: item.quantity,
            observation: item.observation || '',
          })),
          deliveryAddress: buildDeliveryAddress(selectedAddress),
          paymentMethod,
        }),
      })

      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(payload.error || 'Nao foi possivel criar o pedido.')
      }

      clearCart()
      navigate(`/pedido-confirmado/${payload.order.id}`)
    } catch (error) {
      setStatus('error')
      setMessage(error.message || 'Nao foi possivel finalizar o pedido.')
      return
    }

    setStatus('idle')
  }

  return (
    <section className="panel checkout-page">
      <button type="button" className="secondary-button" onClick={() => navigate('/carrinho')}>
        Voltar ao carrinho
      </button>

      <div className="checkout-header">
        <div>
          <p className="eyebrow">Checkout</p>
          <h2>Checkout</h2>
        </div>
        <p className="checkout-note">O backend recalcula os valores e o pedido guarda uma copia do endereco usado.</p>
      </div>

      {message ? (
        <p className={`state-card ${status === 'error' || addressState === 'error' ? 'state-error' : ''}`}>{message}</p>
      ) : null}

      <div className="checkout-card">
        <h3>Resumo</h3>
        {items.length === 0 ? (
          <p className="state-card">Seu carrinho esta vazio.</p>
        ) : (
          <ul className="checkout-item-list">
            {items.map((item) => (
              <li key={item.id}>
                <span>{item.quantity}x {item.name}</span>
                <strong>R$ {(item.price * item.quantity).toFixed(2)}</strong>
              </li>
            ))}
          </ul>
        )}
        <div className="summary-row">
          <span>Subtotal</span>
          <strong>R$ {subtotal.toFixed(2)}</strong>
        </div>
        <div className="summary-row">
          <span>Taxa de entrega</span>
          <strong>R$ {deliveryFee.toFixed(2)}</strong>
        </div>
        {selectedCoupon ? (
          <div className="summary-row">
            <span>Cupom selecionado</span>
            <strong>{selectedCoupon.title}</strong>
          </div>
        ) : null}
        <div className="summary-row summary-total">
          <span>Total estimado</span>
          <strong>R$ {total.toFixed(2)}</strong>
        </div>
      </div>

      <form className="checkout-card" onSubmit={handleSubmit}>
        <div className="section-title-row">
          <h3>Endereco de entrega</h3>
          <button type="button" className="text-button" onClick={() => navigate('/enderecos')}>
            Gerenciar enderecos
          </button>
        </div>

        {addressState === 'loading' ? <p className="state-card">Carregando enderecos...</p> : null}
        {addressState === 'empty' ? (
          <p className="state-card">Voce ainda nao tem enderecos salvos. Cadastre um antes de finalizar.</p>
        ) : null}

        {addresses.length ? (
          <div className="checkout-address-list">
            {addresses.map((address) => (
              <label
                className={`checkout-address-option ${selectedAddressId === address.id ? 'checkout-address-option-active' : ''}`}
                key={address.id}
              >
                <input
                  type="radio"
                  name="delivery-address"
                  checked={selectedAddressId === address.id}
                  onChange={() => setSelectedAddressId(address.id)}
                />
                <span>
                  <strong>{address.nickname}</strong>
                  {address.is_default ? <small>Padrao</small> : null}
                  <p>{buildDeliveryAddress(address)}</p>
                </span>
              </label>
            ))}
          </div>
        ) : null}

        <label className="checkout-field">
          <span>Pagamento</span>
          <select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)}>
            <option value="pix_entrega">Pix na entrega</option>
            <option value="cartao_entrega">Cartao na entrega</option>
          </select>
        </label>
        <button type="submit" className="primary-button" disabled={status === 'loading' || items.length === 0 || !selectedAddress}>
          {status === 'loading' ? 'Enviando...' : 'Confirmar pedido'}
        </button>
      </form>
    </section>
  )
}

export default CheckoutPage
