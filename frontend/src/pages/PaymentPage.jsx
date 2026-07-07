import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { backendApiUrl, supabase } from '../lib/supabaseClient'

async function getAccessToken() {
  if (!supabase) {
    throw new Error('Supabase nao configurado no frontend.')
  }

  const { data, error } = await supabase.auth.getSession()
  if (error || !data?.session?.access_token) {
    throw new Error('Faca login para pagar o pedido.')
  }

  return data.session.access_token
}

function FakeQrCode() {
  return (
    <div className="fake-qr" aria-label="QR Code falso">
      {Array.from({ length: 49 }).map((_, index) => (
        <span className={(index * 7 + index * index) % 5 < 2 ? 'qr-dark' : ''} key={index} />
      ))}
    </div>
  )
}

function PaymentPage() {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [state, setState] = useState('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const loadOrder = async () => {
      try {
        const token = await getAccessToken()
        const response = await fetch(`${backendApiUrl}/orders/${orderId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const payload = await response.json().catch(() => ({}))
        if (!response.ok) {
          throw new Error(payload.error || 'Nao foi possivel carregar o pedido.')
        }
        setOrder(payload)
        setState('ready')
      } catch (error) {
        setState('error')
        setMessage(error.message || 'Nao foi possivel carregar o pedido.')
      }
    }

    loadOrder()
  }, [orderId])

  const confirmPayment = async () => {
    setState('loading')
    setMessage('')

    try {
      const token = await getAccessToken()
      const response = await fetch(`${backendApiUrl}/orders/${orderId}/payment`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(payload.error || 'Nao foi possivel confirmar o pagamento.')
      }
      setOrder(payload)
      setState('ready')
      setMessage('Pagamento falso confirmado pelo backend.')
    } catch (error) {
      setState('error')
      setMessage(error.message || 'Nao foi possivel confirmar o pagamento.')
    }
  }

  if (state === 'loading' && !order) {
    return <section className="panel centered-panel"><p className="state-card">Carregando pagamento...</p></section>
  }

  return (
    <section className="panel centered-panel">
      <p className="eyebrow">Pix falso</p>
      <h2>Pagamento do pedido</h2>
      {message ? <p className={`state-card ${state === 'error' ? 'state-error' : ''}`}>{message}</p> : null}

      {order ? (
        <>
          <FakeQrCode />
          <p>Total: R$ {Number(order.total).toFixed(2)}</p>
          <p>Status do pagamento: {order.payment_status}</p>
          <p className="panel-copy">Este QR Code nao funciona de verdade. Ele simula o pagamento da Fase 4/5.</p>
          <div className="cart-actions-row">
            <button type="button" className="secondary-button" onClick={() => navigate(`/pedidos/${orderId}`)}>
              Voltar ao pedido
            </button>
            <button
              type="button"
              className="primary-button"
              disabled={state === 'loading' || order.payment_status === 'pago'}
              onClick={confirmPayment}
            >
              {order.payment_status === 'pago' ? 'Pagamento confirmado' : 'Simular pagamento recebido'}
            </button>
          </div>
        </>
      ) : null}
    </section>
  )
}

export default PaymentPage
