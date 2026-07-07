import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'

function CartPage({ selectedCoupon = null }) {
  const navigate = useNavigate()
  const { items, itemCount, subtotal, deliveryFee, total, updateQuantity, removeItem, clearCart } = useCart()

  return (
    <section className="panel cart-page">
      <button type="button" className="secondary-button" onClick={() => navigate('/')}>
        Continuar comprando
      </button>

      <div className="cart-page-header">
        <div>
          <p className="eyebrow">Seu pedido</p>
          <h2>Carrinho</h2>
        </div>
        <p className="cart-count">{itemCount} {itemCount === 1 ? 'item' : 'itens'}</p>
      </div>

      {items.length === 0 ? (
        <div className="state-card">
          <p>Sua sacola esta vazia. Adicione itens para continuar.</p>
        </div>
      ) : null}

      <div className="cart-items-list">
        {items.map((item) => (
          <article className="cart-item-card" key={item.id}>
            <div className="cart-item-info">
              <h3>{item.name}</h3>
              <p>{item.description}</p>
              <p className="cart-item-price">R$ {(item.price * item.quantity).toFixed(2)}</p>
            </div>
            <div className="cart-item-actions">
              <div className="quantity-controls">
                <button type="button" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                  -
                </button>
                <span>{item.quantity}</span>
                <button type="button" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                  +
                </button>
              </div>
              <button type="button" className="secondary-button" onClick={() => removeItem(item.id)}>
                Remover
              </button>
            </div>
          </article>
        ))}
      </div>

      {items.length > 0 ? (
        <div className="cart-summary">
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
            <span>Total</span>
            <strong>R$ {total.toFixed(2)}</strong>
          </div>
          <div className="cart-actions-row">
            <button type="button" className="secondary-button" onClick={clearCart}>
              Limpar carrinho
            </button>
            <button
              type="button"
              className="primary-button"
              onClick={() => navigate('/checkout')}
            >
              Finalizar pedido
            </button>
          </div>
        </div>
      ) : null}
    </section>
  )
}

export default CartPage
