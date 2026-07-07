import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { backendApiUrl, supabase } from '../lib/supabaseClient'

async function getAccessToken() {
  if (!supabase) {
    throw new Error('Supabase nao configurado no frontend.')
  }

  const { data, error } = await supabase.auth.getSession()
  if (error || !data?.session?.access_token) {
    throw new Error('Faca login para ver seus pedidos.')
  }

  return data.session.access_token
}

function OrdersPage() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [state, setState] = useState('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const loadOrders = async () => {
      setState('loading')
      setMessage('')

      try {
        const token = await getAccessToken()
        const response = await fetch(`${backendApiUrl}/orders`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const payload = await response.json().catch(() => [])

        if (!response.ok) {
          throw new Error(payload.error || 'Nao foi possivel carregar seus pedidos.')
        }

        setOrders(Array.isArray(payload) ? payload : [])
        setState(payload.length ? 'ready' : 'empty')
      } catch (error) {
        setState('error')
        setMessage(error.message || 'Nao foi possivel carregar seus pedidos.')
      }
    }

    loadOrders()
  }, [])

  return (
    <section className="panel cart-page">
      <div className="cart-page-header">
        <div>
          <p className="eyebrow">Historico</p>
          <h2>Meus pedidos</h2>
        </div>
        <button type="button" className="secondary-button" onClick={() => navigate('/')}>
          Home
        </button>
      </div>

      {state === 'loading' ? <p className="state-card">Carregando pedidos...</p> : null}
      {state === 'error' ? <p className="state-card state-error">{message}</p> : null}
      {state === 'empty' ? <p className="state-card">Voce ainda nao fez nenhum pedido.</p> : null}

      {state === 'ready' ? (
        <div className="cart-items-list">
          {orders.map((order) => (
            <article className="cart-item-card" key={order.id}>
              <div className="cart-item-info">
                <h3>{order.restaurant?.name || 'Restaurante'}</h3>
                <p>{new Date(order.created_at).toLocaleString('pt-BR')}</p>
                <p>Status: {order.status}</p>
              </div>
              <div className="cart-item-actions">
                <strong>R$ {Number(order.total).toFixed(2)}</strong>
                <button type="button" className="primary-button" onClick={() => navigate(`/pedidos/${order.id}`)}>
                  Ver detalhe
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  )
}

export default OrdersPage
