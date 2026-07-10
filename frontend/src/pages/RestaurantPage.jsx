import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { backendApiUrl } from '../lib/supabaseClient'
import { useCart } from '../context/CartContext'
import { getMenuItemsForDisplay } from '../lib/menuUtils'

function RestaurantPage() {
  const { restaurantId } = useParams()
  const navigate = useNavigate()
  const { addItem, clearCart, items, restaurantId: cartRestaurantId } = useCart()
  const [restaurant, setRestaurant] = useState(null)
  const [menuData, setMenuData] = useState(null)
  const [reviews, setReviews] = useState([])
  const [reviewsState, setReviewsState] = useState('loading')
  const [state, setState] = useState('loading')
  const [selectedItem, setSelectedItem] = useState(null)
  const [feedbackMessage, setFeedbackMessage] = useState('')

  useEffect(() => {
    const loadRestaurantDetails = async () => {
      setState('loading')

      try {
        const [restaurantResponse, menuResponse, reviewsResponse] = await Promise.all([
          fetch(`${backendApiUrl}/restaurants/${restaurantId}`),
          fetch(`${backendApiUrl}/restaurants/${restaurantId}/menu`),
          fetch(`${backendApiUrl}/restaurants/${restaurantId}/reviews`),
        ])

        if (!restaurantResponse.ok || !menuResponse.ok || !reviewsResponse.ok) {
          throw new Error('Nao foi possivel carregar o restaurante agora.')
        }

        const restaurantPayload = await restaurantResponse.json()
        const menuPayload = await menuResponse.json()
        const reviewsPayload = await reviewsResponse.json()

        setRestaurant(restaurantPayload)
        setMenuData(menuPayload)
        setReviews(Array.isArray(reviewsPayload) ? reviewsPayload : [])
        setReviewsState(reviewsPayload.length ? 'ready' : 'empty')
        setState('ready')
      } catch (error) {
        setState('error')
        setRestaurant(null)
        setMenuData(null)
        setReviews([])
        setReviewsState('error')
        console.error(error)
      }
    }

    loadRestaurantDetails()
  }, [restaurantId])

  const addToCart = (item) => {
    const hasCartItems = items.length > 0
    const hasDifferentRestaurant = hasCartItems && cartRestaurantId && cartRestaurantId !== restaurant?.id

    if (hasDifferentRestaurant) {
      const shouldClear = window.confirm(
        'Seu carrinho atual sera limpo ao adicionar itens de outro restaurante. Continuar?'
      )

      if (!shouldClear) {
        return
      }

      clearCart()
      setFeedbackMessage(`Carrinho limpo. Adicionando ${item.name} de ${restaurant?.name || 'este restaurante'}.`)
    } else {
      setFeedbackMessage(`${item.name} adicionado ao carrinho.`)
    }

    addItem(item, restaurant)
    setSelectedItem(null)
  }

  if (state === 'loading') {
    return (
      <section className="panel centered-panel">
        <h2>Carregando cardapio...</h2>
        <p className="state-card">Estamos buscando as informacoes do restaurante.</p>
      </section>
    )
  }

  if (state === 'error' || !restaurant) {
    return (
      <section className="panel centered-panel">
        <h2>Restaurante indisponivel</h2>
        <p className="state-card state-error">Nao foi possivel carregar o cardapio neste momento.</p>
        <button type="button" className="secondary-button" onClick={() => navigate('/')}>
          Voltar para a home
        </button>
      </section>
    )
  }

  const categories = getMenuItemsForDisplay(menuData?.menu?.categories || [])

  return (
    <section className="panel restaurant-page">
      <button type="button" className="secondary-button" onClick={() => navigate('/')}>
        Voltar para a home
      </button>

      {feedbackMessage ? <p className="state-card cart-feedback">{feedbackMessage}</p> : null}

      <div className="restaurant-hero">
        <div className="restaurant-hero-image" style={{ backgroundImage: `url(${restaurant.image_url})` }} />
        <div className="restaurant-hero-info">
          <p className="eyebrow">{restaurant.category}</p>
          <h2>{restaurant.name}</h2>
          <p>{restaurant.description}</p>
          <div className="restaurant-meta">
            <span>
              {restaurant.review_count
                ? `${Number(restaurant.average_rating).toFixed(1)} · ${restaurant.review_count} avaliacoes`
                : 'Novo'}
            </span>
            <span>Taxa R$ {Number(restaurant.delivery_fee).toFixed(2)}</span>
            <span>{restaurant.estimated_time_min} min</span>
          </div>
        </div>
      </div>

      {categories.length === 0 ? (
        <p className="state-card">Ainda nao ha itens cadastrados para este restaurante.</p>
      ) : null}

      {categories.map((category) => (
        <div key={category.id} className="menu-section">
          <h3>{category.name}</h3>
          <div className="menu-items">
            {category.items.map((item) => (
              <article className="menu-item-card" key={item.id}>
                <div className="menu-item-image" style={{ backgroundImage: `url(${item.image_url})` }} />
                <div className="menu-item-info">
                  <div className="restaurant-title-row">
                    <h4>{item.name}</h4>
                    <span>R$ {Number(item.price).toFixed(2)}</span>
                  </div>
                  <p>{item.description}</p>
                  <div className="menu-item-actions">
                    <button type="button" className="secondary-button" onClick={() => setSelectedItem(item)}>
                      Ver detalhes
                    </button>
                    <button
                      type="button"
                      className="primary-button"
                      disabled={item.isUnavailable}
                      onClick={() => addToCart(item)}
                    >
                      {item.isUnavailable ? 'Indisponivel' : 'Adicionar'}
                    </button>
                  </div>
                  {item.isUnavailable ? <p className="unavailable-label">{item.availabilityLabel}</p> : null}
                </div>
              </article>
            ))}
          </div>
        </div>
      ))}

      <div className="reviews-section">
        <div className="section-title-row">
          <div>
            <p className="eyebrow">Avaliacoes</p>
            <h3>O que clientes disseram</h3>
          </div>
        </div>

        {reviewsState === 'loading' ? <p className="state-card">Carregando avaliacoes...</p> : null}
        {reviewsState === 'empty' ? <p className="state-card">Seja o primeiro a avaliar este restaurante.</p> : null}
        {reviewsState === 'error' ? <p className="state-card state-error">Nao foi possivel carregar avaliacoes.</p> : null}

        {reviews.length ? (
          <div className="review-list">
            {reviews.map((review) => (
              <article className="review-card" key={review.id}>
                <strong>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</strong>
                {review.comment ? <p>{review.comment}</p> : <p className="muted-text">Sem comentario.</p>}
                <small>{new Date(review.created_at).toLocaleDateString('pt-BR')}</small>
              </article>
            ))}
          </div>
        ) : null}
      </div>

      {selectedItem ? (
        <div className="modal-backdrop" onClick={() => setSelectedItem(null)}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <h3>{selectedItem.name}</h3>
            <p>{selectedItem.description}</p>
            <p className="modal-price">R$ {Number(selectedItem.price).toFixed(2)}</p>
            <button
              type="button"
              className="primary-button"
              disabled={selectedItem?.isUnavailable}
              onClick={() => addToCart(selectedItem)}
            >
              {selectedItem?.isUnavailable ? 'Indisponivel' : 'Adicionar ao carrinho'}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  )
}

export default RestaurantPage
