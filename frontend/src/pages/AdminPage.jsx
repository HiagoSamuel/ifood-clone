import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { backendApiUrl, supabase } from '../lib/supabaseClient'

const statusFlow = ['recebido', 'confirmado', 'preparando', 'saiu_para_entrega', 'entregue']

const statusLabels = {
  todos: 'Todos',
  recebido: 'Recebidos',
  confirmado: 'Confirmados',
  preparando: 'Preparando',
  saiu_para_entrega: 'Saiu para entrega',
  entregue: 'Entregues',
  reembolsado: 'Reembolsados',
}

async function getAccessToken() {
  if (!supabase) {
    throw new Error('Supabase nao configurado no frontend.')
  }

  const { data, error } = await supabase.auth.getSession()
  if (error || !data?.session?.access_token) {
    throw new Error('Faca login como dono de restaurante para acessar o painel.')
  }

  return data.session.access_token
}

function getNextStatus(status) {
  const index = statusFlow.indexOf(status)
  return index >= 0 ? statusFlow[index + 1] || null : null
}

function AdminPage() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [state, setState] = useState('loading')
  const [message, setMessage] = useState('')
  const [statusFilter, setStatusFilter] = useState('todos')
  const [updatingOrderId, setUpdatingOrderId] = useState('')

  const loadOrders = useCallback(async ({ quiet = false } = {}) => {
    if (!quiet) {
      setState('loading')
    }
    setMessage('')

    try {
      const token = await getAccessToken()
      const response = await fetch(`${backendApiUrl}/admin/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const payload = await response.json().catch(() => [])

      if (!response.ok) {
        throw new Error(payload.error || 'Nao foi possivel carregar pedidos do restaurante.')
      }

      const nextOrders = Array.isArray(payload) ? payload : []
      setOrders(nextOrders)
      setState(nextOrders.length ? 'ready' : 'empty')
    } catch (error) {
      setState('error')
      setMessage(error.message || 'Nao foi possivel carregar o painel.')
    }
  }, [])

  useEffect(() => {
    loadOrders()
  }, [loadOrders])

  useEffect(() => {
    if (!supabase) {
      return undefined
    }

    const channel = supabase
      .channel('admin-orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        () => {
          loadOrders({ quiet: true })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [loadOrders])

  const visibleOrders = useMemo(() => {
    if (statusFilter === 'todos') {
      return orders
    }

    return orders.filter((order) => order.status === statusFilter)
  }, [orders, statusFilter])

  const advanceStatus = async (order) => {
    const nextStatus = getNextStatus(order.status)
    if (!nextStatus) {
      return
    }

    setUpdatingOrderId(order.id)
    setMessage('')

    try {
      const token = await getAccessToken()
      const response = await fetch(`${backendApiUrl}/admin/orders/${order.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      })
      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(payload.error || 'Nao foi possivel avancar o pedido.')
      }

      setOrders((currentOrders) =>
        currentOrders.map((currentOrder) => (currentOrder.id === payload.id ? payload : currentOrder))
      )
      setMessage(`Pedido avancou para ${statusLabels[payload.status] || payload.status}.`)
    } catch (error) {
      setMessage(error.message || 'Nao foi possivel avancar o pedido.')
    } finally {
      setUpdatingOrderId('')
    }
  }

  return (
    <section className="panel checkout-page">
      <div className="checkout-header">
        <div>
          <p className="eyebrow">Painel do restaurante</p>
          <h2>Pedidos da minha loja</h2>
          <p className="muted-text">Avance o status dos pedidos sem acessar dados de outras lojas.</p>
        </div>
        <button type="button" className="secondary-button" onClick={() => navigate('/')}>
          Home
        </button>
      </div>

      {message ? <p className={`state-card ${state === 'error' ? 'state-error' : ''}`}>{message}</p> : null}

      <div className="checkout-card">
        <h3>Filtrar por status</h3>
        <div className="filter-row">
          {['todos', ...statusFlow, 'reembolsado'].map((status) => (
            <button
              type="button"
              className={`filter-chip ${statusFilter === status ? 'filter-chip-active' : ''}`}
              key={status}
              onClick={() => setStatusFilter(status)}
            >
              {statusLabels[status]}
            </button>
          ))}
        </div>
      </div>

      {state === 'loading' ? <p className="state-card">Carregando pedidos da loja...</p> : null}
      {state === 'error' ? <p className="state-card state-error">{message}</p> : null}
      {state === 'empty' ? (
        <p className="state-card">Nenhum pedido encontrado para restaurantes que voce administra.</p>
      ) : null}

      {state === 'ready' && visibleOrders.length === 0 ? (
        <p className="state-card">Nenhum pedido neste status.</p>
      ) : null}

      {state === 'ready' && visibleOrders.length > 0 ? (
        <div className="cart-items-list">
          {visibleOrders.map((order) => {
            const nextStatus = getNextStatus(order.status)

            return (
              <article className="cart-item-card" key={order.id}>
                <div className="cart-item-info">
                  <h3>{order.restaurant?.name || 'Restaurante'}</h3>
                  <p>{new Date(order.created_at).toLocaleString('pt-BR')}</p>
                  <p>Status: {statusLabels[order.status] || order.status}</p>
                  <p>{order.delivery_address}</p>
                  <small>{(order.order_items || []).length} itens no pedido</small>
                </div>
                <div className="cart-item-actions">
                  <strong>R$ {Number(order.total).toFixed(2)}</strong>
                  <button type="button" className="secondary-button" onClick={() => navigate(`/pedidos/${order.id}`)}>
                    Ver detalhe
                  </button>
                  <button
                    type="button"
                    className="primary-button"
                    disabled={!nextStatus || updatingOrderId === order.id}
                    onClick={() => advanceStatus(order)}
                  >
                    {updatingOrderId === order.id
                      ? 'Avancando...'
                      : nextStatus
                        ? `Avancar para: ${statusLabels[nextStatus]}`
                        : 'Pedido finalizado'}
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      ) : null}
    </section>
  )
}

export default AdminPage
