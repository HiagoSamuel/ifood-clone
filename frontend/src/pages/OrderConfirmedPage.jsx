import { useNavigate, useParams } from 'react-router-dom'

function OrderConfirmedPage() {
  const navigate = useNavigate()
  const { orderId } = useParams()

  return (
    <section className="panel centered-panel">
      <p className="eyebrow">Pedido confirmado</p>
      <h2>Recebemos seu pedido</h2>
      <p>O pedido foi criado com status inicial recebido.</p>
      <p className="state-card">Codigo do pedido: {orderId}</p>
      <div className="cart-actions-row">
        <button type="button" className="secondary-button" onClick={() => navigate('/pedidos')}>
          Ver meus pedidos
        </button>
        <button type="button" className="primary-button" onClick={() => navigate('/')}>
          Voltar para a home
        </button>
      </div>
    </section>
  )
}

export default OrderConfirmedPage
