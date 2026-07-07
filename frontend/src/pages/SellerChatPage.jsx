import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { backendApiUrl, supabase } from '../lib/supabaseClient'

async function getAccessToken() {
  if (!supabase) {
    throw new Error('Supabase nao configurado no frontend.')
  }

  const { data, error } = await supabase.auth.getSession()
  if (error || !data?.session?.access_token) {
    throw new Error('Faca login para conversar com o vendedor.')
  }

  return data.session.access_token
}

function SellerChatPage() {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const [chat, setChat] = useState(null)
  const [messages, setMessages] = useState([])
  const [state, setState] = useState('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const loadChat = async () => {
      try {
        const token = await getAccessToken()
        const response = await fetch(`${backendApiUrl}/orders/${orderId}/chat`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const payload = await response.json().catch(() => ({}))
        if (!response.ok) {
          throw new Error(payload.error || 'Nao foi possivel abrir o chat.')
        }
        setChat(payload)
        setMessages([{ from: 'seller', text: payload.greeting }])
        setState('ready')
      } catch (error) {
        setState('error')
        setMessage(error.message || 'Nao foi possivel abrir o chat.')
      }
    }

    loadChat()
  }, [orderId])

  const chooseOption = async (option) => {
    setMessages((current) => [...current, { from: 'user', text: option.label }])

    try {
      const token = await getAccessToken()
      const response = await fetch(`${backendApiUrl}/orders/${orderId}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ optionId: option.id }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(payload.error || 'Nao foi possivel responder.')
      }
      setMessages((current) => [...current, { from: 'seller', text: payload.answer }])
    } catch (error) {
      setMessages((current) => [...current, { from: 'seller', text: error.message || 'Nao consegui responder agora.' }])
    }
  }

  if (state === 'loading') {
    return <section className="panel centered-panel"><p className="state-card">Abrindo chat...</p></section>
  }

  if (state === 'error') {
    return (
      <section className="panel centered-panel">
        <p className="state-card state-error">{message}</p>
        <button type="button" className="secondary-button" onClick={() => navigate(`/pedidos/${orderId}`)}>
          Voltar ao pedido
        </button>
      </section>
    )
  }

  return (
    <section className="panel checkout-page">
      <button type="button" className="secondary-button" onClick={() => navigate(`/pedidos/${orderId}`)}>
        Voltar ao pedido
      </button>
      <div className="checkout-header">
        <div>
          <p className="eyebrow">Chat</p>
          <h2>Vendedor</h2>
        </div>
      </div>

      <div className="chat-box">
        {messages.map((item, index) => (
          <p className={`chat-message ${item.from === 'user' ? 'chat-message-user' : ''}`} key={`${item.from}-${index}`}>
            {item.text}
          </p>
        ))}
      </div>

      <div className="checkout-card">
        <h3>Opcoes de ajuda</h3>
        <div className="chat-options">
          {(chat?.options || []).map((option) => (
            <button type="button" className="secondary-button" key={option.id} onClick={() => chooseOption(option)}>
              <strong>{option.label}</strong>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}

export default SellerChatPage
