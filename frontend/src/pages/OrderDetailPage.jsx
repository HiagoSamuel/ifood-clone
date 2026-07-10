import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { backendApiUrl, supabase } from '../lib/supabaseClient'

const statusSteps = [
  { value: 'recebido', label: 'Recebido', estimate: 'Agora' },
  { value: 'confirmado', label: 'Confirmado', estimate: '2 min' },
  { value: 'preparando', label: 'Preparando', estimate: '15 min' },
  { value: 'saiu_para_entrega', label: 'Saiu para entrega', estimate: '30 min' },
  { value: 'entregue', label: 'Entregue', estimate: 'Finalizado' },
]

async function getAccessToken(message = 'Faca login para ver o pedido.') {
  if (!supabase) {
    throw new Error('Supabase nao configurado no frontend.')
  }

  const { data, error } = await supabase.auth.getSession()
  if (error || !data?.session?.access_token) {
    throw new Error(message)
  }

  return data.session.access_token
}

function StatusTimeline({ status }) {
  if (status === 'reembolsado') {
    return (
      <div className="status-timeline">
        <div className="status-step status-step-current">
          <span className="status-dot">!</span>
          <div>
            <strong>Reembolsado</strong>
            <p>Pedido encerrado por reembolso</p>
          </div>
        </div>
      </div>
    )
  }

  const currentIndex = Math.max(0, statusSteps.findIndex((step) => step.value === status))

  return (
    <div className="status-timeline">
      {statusSteps.map((step, index) => {
        const isDone = index < currentIndex || status === 'entregue'
        const isCurrent = index === currentIndex && status !== 'entregue'

        return (
          <div
            className={`status-step ${isDone ? 'status-step-done' : ''} ${isCurrent ? 'status-step-current' : ''}`}
            key={step.value}
          >
            <span className="status-dot">{isDone ? '✓' : index + 1}</span>
            <div>
              <strong>{step.label}</strong>
              <p>{step.estimate}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function OrderDetailPage() {
  const navigate = useNavigate()
  const { orderId } = useParams()
  const [order, setOrder] = useState(null)
  const [state, setState] = useState('loading')
  const [message, setMessage] = useState('')
  const [toast, setToast] = useState('')
  const [refundState, setRefundState] = useState('idle')
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [reviewState, setReviewState] = useState('idle')

  const loadOrder = useCallback(async ({ quiet = false } = {}) => {
    if (!quiet) {
      setState('loading')
    }
    setMessage('')

    try {
      const token = await getAccessToken()
      const response = await fetch(`${backendApiUrl}/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(payload.error || 'Nao foi possivel carregar o pedido.')
      }

      setOrder((currentOrder) => {
        if (currentOrder && currentOrder.status !== payload.status) {
          setToast(`Status atualizado: ${payload.status}`)
        }
        return payload
      })
      setState('ready')
    } catch (error) {
      setState('error')
      setMessage(error.message || 'Nao foi possivel carregar o pedido.')
    }
  }, [orderId])

  useEffect(() => {
    loadOrder()
  }, [loadOrder])

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      loadOrder({ quiet: true })
    }, 15000)

    return () => window.clearInterval(intervalId)
  }, [loadOrder])

  useEffect(() => {
    if (!supabase || !orderId) {
      return undefined
    }

    const channel = supabase
      .channel(`order-status-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          const nextStatus = payload.new?.status
          if (!nextStatus) {
            return
          }

          setOrder((currentOrder) => {
            if (!currentOrder || currentOrder.status === nextStatus) {
              return currentOrder
            }

            setToast(`Status atualizado em tempo real: ${nextStatus}`)
            return { ...currentOrder, status: nextStatus }
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [orderId])

  useEffect(() => {
    if (!toast) {
      return undefined
    }

    const timeoutId = window.setTimeout(() => setToast(''), 3500)
    return () => window.clearTimeout(timeoutId)
  }, [toast])

  const requestRefund = async () => {
    setRefundState('loading')
    setMessage('')

    try {
      const token = await getAccessToken('Faca login para pedir reembolso.')
      const response = await fetch(`${backendApiUrl}/orders/${orderId}/refund`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      })
      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(payload.error || 'Nao foi possivel pedir reembolso.')
      }

      setOrder((currentOrder) => ({ ...currentOrder, ...payload }))
      setToast('Reembolso solicitado e registrado no backend.')
    } catch (error) {
      setMessage(error.message || 'Nao foi possivel pedir reembolso.')
    } finally {
      setRefundState('idle')
    }
  }

  const submitReview = async (event) => {
    event.preventDefault()
    setReviewState('loading')
    setMessage('')

    try {
      const token = await getAccessToken('Faca login para avaliar o pedido.')
      const response = await fetch(`${backendApiUrl}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderId,
          rating: reviewRating,
          comment: reviewComment,
        }),
      })
      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(payload.error || 'Nao foi possivel enviar a avaliacao.')
      }

      setOrder((currentOrder) => ({ ...currentOrder, review: payload }))
      setReviewComment('')
      setToast('Avaliacao enviada. A nota do restaurante foi recalculada.')
    } catch (error) {
      setMessage(error.message || 'Nao foi possivel enviar a avaliacao.')
    } finally {
      setReviewState('idle')
    }
  }

  if (state === 'loading') {
    return <section className="panel centered-panel"><p className="state-card">Carregando pedido...</p></section>
  }

  if (state === 'error' || !order) {
    return (
      <section className="panel centered-panel">
        <p className="state-card state-error">{message}</p>
        <button type="button" className="secondary-button" onClick={() => navigate('/pedidos')}>
          Voltar aos pedidos
        </button>
      </section>
    )
  }

  return (
    <section className="panel checkout-page">
      <button type="button" className="secondary-button" onClick={() => navigate('/pedidos')}>
        Voltar aos pedidos
      </button>

      {toast ? <p className="status-toast">{toast}</p> : null}
      {message ? <p className="state-card state-error">{message}</p> : null}

      <div className="checkout-header">
        <div>
          <p className="eyebrow">Acompanhamento</p>
          <h2>{order.restaurant?.name || 'Restaurante'}</h2>
        </div>
        <p className="cart-count">{order.status}</p>
      </div>

      <div className="checkout-card">
        <h3>Acoes do pedido</h3>
        <div className="cart-actions-row">
          <button type="button" className="secondary-button" onClick={() => navigate(`/pedidos/${orderId}/chat`)}>
            Conversar com vendedor
          </button>
          <button type="button" className="secondary-button" onClick={() => navigate(`/pedidos/${orderId}/pagamento`)}>
            Pix falso
          </button>
          <button
            type="button"
            className="secondary-button"
            disabled={refundState === 'loading' || order.payment_status === 'reembolsado'}
            onClick={requestRefund}
          >
            {order.payment_status === 'reembolsado' ? 'Reembolsado' : refundState === 'loading' ? 'Reembolsando...' : 'Pedir reembolso'}
          </button>
        </div>
      </div>

      <div className="checkout-card">
        <div className="cart-page-header">
          <div>
            <h3>Status do pedido</h3>
            <p>Estimativa simples para acompanhar a jornada do pedido.</p>
          </div>
        </div>
        <StatusTimeline status={order.status} />
      </div>

      {order.status === 'entregue' ? (
        <div className="checkout-card">
          <h3>Avaliacao</h3>
          {order.review ? (
            <div className="review-card review-card-own">
              <strong>{'★'.repeat(order.review.rating)}{'☆'.repeat(5 - order.review.rating)}</strong>
              {order.review.comment ? <p>{order.review.comment}</p> : <p className="muted-text">Voce avaliou sem comentario.</p>}
              <small>Pedido ja avaliado.</small>
            </div>
          ) : (
            <form className="review-form" onSubmit={submitReview}>
              <div className="star-rating" aria-label="Nota do restaurante">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    type="button"
                    className={rating <= reviewRating ? 'star-button star-button-active' : 'star-button'}
                    key={rating}
                    onClick={() => setReviewRating(rating)}
                    aria-label={`${rating} estrelas`}
                  >
                    ★
                  </button>
                ))}
              </div>
              <label className="checkout-field">
                <span>Comentario opcional</span>
                <textarea
                  value={reviewComment}
                  placeholder="Conte como foi sua experiencia"
                  onChange={(event) => setReviewComment(event.target.value)}
                />
              </label>
              <button type="submit" className="primary-button" disabled={reviewState === 'loading'}>
                {reviewState === 'loading' ? 'Enviando...' : 'Enviar avaliacao'}
              </button>
            </form>
          )}
        </div>
      ) : null}

      <div className="checkout-card">
        <h3>Itens</h3>
        <ul className="checkout-item-list">
          {(order.order_items || []).map((item) => (
            <li key={item.id}>
              <span>{item.quantity}x {item.name_at_order}</span>
              <strong>R$ {(Number(item.unit_price) * item.quantity).toFixed(2)}</strong>
            </li>
          ))}
        </ul>
      </div>

      <div className="checkout-card">
        <h3>Resumo financeiro</h3>
        <div className="summary-row">
          <span>Subtotal</span>
          <strong>R$ {Number(order.subtotal).toFixed(2)}</strong>
        </div>
        <div className="summary-row">
          <span>Taxa de entrega</span>
          <strong>R$ {Number(order.delivery_fee).toFixed(2)}</strong>
        </div>
        <div className="summary-row summary-total">
          <span>Total</span>
          <strong>R$ {Number(order.total).toFixed(2)}</strong>
        </div>
      </div>

      <div className="checkout-card">
        <h3>Entrega e pagamento</h3>
        <p>{order.delivery_address}</p>
        <p>{order.payment_method === 'pix_entrega' ? 'Pix na entrega' : 'Cartao na entrega'}</p>
        <p>Status do pagamento: {order.payment_status || 'pendente'}</p>
      </div>
    </section>
  )
}

export default OrderDetailPage
