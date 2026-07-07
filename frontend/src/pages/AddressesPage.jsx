import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { backendApiUrl, supabase } from '../lib/supabaseClient'

const emptyAddress = {
  cep: '',
  nickname: '',
  street: '',
  number: '',
  neighborhood: '',
  complement: '',
  reference_point: '',
  is_default: false,
}

async function getAccessToken() {
  if (!supabase) {
    throw new Error('Supabase nao configurado no frontend.')
  }

  const { data, error } = await supabase.auth.getSession()
  if (error || !data?.session?.access_token) {
    throw new Error('Faca login para gerenciar seus enderecos.')
  }

  return data.session.access_token
}

function formatAddress(address) {
  const cep = address.cep ? `CEP ${address.cep} | ` : ''
  const complement = address.complement ? `, ${address.complement}` : ''
  const reference = address.reference_point ? ` | Ref.: ${address.reference_point}` : ''

  return `${cep}${address.street}, ${address.number}${complement} - ${address.neighborhood}${reference}`
}

function AddressesPage() {
  const navigate = useNavigate()
  const [addresses, setAddresses] = useState([])
  const [form, setForm] = useState(emptyAddress)
  const [editingId, setEditingId] = useState(null)
  const [state, setState] = useState('loading')
  const [saveState, setSaveState] = useState('idle')
  const [cepState, setCepState] = useState('idle')
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('info')

  const loadAddresses = useCallback(async ({ quiet = false } = {}) => {
    if (!quiet) {
      setState('loading')
    }
    setMessage('')
    setMessageType('info')

    try {
      const token = await getAccessToken()
      const response = await fetch(`${backendApiUrl}/addresses`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const payload = await response.json().catch(() => [])

      if (!response.ok) {
        throw new Error(payload.error || 'Nao foi possivel carregar seus enderecos.')
      }

      setAddresses(Array.isArray(payload) ? payload : [])
      setState(payload.length ? 'ready' : 'empty')
    } catch (error) {
      setState('error')
      setMessageType('error')
      setMessage(error.message || 'Nao foi possivel carregar seus enderecos.')
    }
  }, [])

  useEffect(() => {
    loadAddresses()
  }, [loadAddresses])

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const fetchAddressByCep = async () => {
    const cep = form.cep.replace(/\D/g, '')

    if (!cep) {
      return
    }

    if (cep.length !== 8) {
      setMessage('Informe um CEP com 8 digitos.')
      setMessageType('error')
      return
    }

    setCepState('loading')
    setMessage('')
    setMessageType('info')

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
      if (!response.ok) {
        throw new Error('Nao foi possivel consultar o CEP agora.')
      }

      const data = await response.json()
      if (data.erro) {
        throw new Error('CEP nao encontrado.')
      }

      setForm((current) => ({
        ...current,
        cep: data.cep || cep,
        street: data.logradouro || current.street,
        neighborhood: data.bairro || current.neighborhood,
        complement: data.complemento || current.complement,
      }))
      setMessageType('info')
      setMessage('Endereco preenchido pelo ViaCEP. Complete o numero e revise os dados.')
    } catch (error) {
      setMessageType('error')
      setMessage(error.message || 'Nao foi possivel consultar o CEP.')
    } finally {
      setCepState('idle')
    }
  }

  const resetForm = () => {
    setForm(emptyAddress)
    setEditingId(null)
  }

  const submitAddress = async (event) => {
    event.preventDefault()
    setMessage('')
    setMessageType('info')

    const requiredFields = [
      ['nickname', 'apelido'],
      ['street', 'rua'],
      ['number', 'numero'],
      ['neighborhood', 'bairro'],
    ]
    const missingField = requiredFields.find(([field]) => !String(form[field] || '').trim())

    if (missingField) {
      setMessageType('error')
      setMessage(`Preencha o campo ${missingField[1]} antes de adicionar o endereco.`)
      return
    }

    setSaveState('loading')

    try {
      const token = await getAccessToken()
      const response = await fetch(`${backendApiUrl}/addresses${editingId ? `/${editingId}` : ''}`, {
        method: editingId ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      })
      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(payload.error || 'Nao foi possivel salvar o endereco.')
      }

      resetForm()
      await loadAddresses({ quiet: true })
      setMessageType('info')
      setMessage(editingId ? 'Endereco atualizado.' : 'Endereco criado.')
    } catch (error) {
      setMessageType('error')
      setMessage(error.message || 'Nao foi possivel salvar o endereco.')
    } finally {
      setSaveState('idle')
    }
  }

  const editAddress = (address) => {
    setEditingId(address.id)
    setForm({
      cep: address.cep || '',
      nickname: address.nickname || '',
      street: address.street || '',
      number: address.number || '',
      neighborhood: address.neighborhood || '',
      complement: address.complement || '',
      reference_point: address.reference_point || '',
      is_default: Boolean(address.is_default),
    })
  }

  const removeAddress = async (address) => {
    const shouldRemove = window.confirm(`Remover o endereco "${address.nickname}"?`)
    if (!shouldRemove) {
      return
    }

    setMessage('')
    setMessageType('info')

    try {
      const token = await getAccessToken()
      const response = await fetch(`${backendApiUrl}/addresses/${address.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok && response.status !== 204) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload.error || 'Nao foi possivel remover o endereco.')
      }

      await loadAddresses({ quiet: true })
      setMessageType('info')
      setMessage('Endereco removido.')
    } catch (error) {
      setMessageType('error')
      setMessage(error.message || 'Nao foi possivel remover o endereco.')
    }
  }

  const makeDefault = async (address) => {
    setMessage('')
    setMessageType('info')

    try {
      const token = await getAccessToken()
      const response = await fetch(`${backendApiUrl}/addresses/${address.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...address, is_default: true }),
      })
      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(payload.error || 'Nao foi possivel marcar como padrao.')
      }

      await loadAddresses({ quiet: true })
      setMessageType('info')
      setMessage('Endereco padrao atualizado.')
    } catch (error) {
      setMessageType('error')
      setMessage(error.message || 'Nao foi possivel marcar como padrao.')
    }
  }

  return (
    <main className="page-container address-page">
      <div className="section-title-row">
        <div>
          <p className="eyebrow">Perfil</p>
          <h1>Meus enderecos</h1>
        </div>
        <button type="button" className="secondary-button" onClick={() => navigate('/checkout')}>
          Ir para checkout
        </button>
      </div>

      {message ? <p className={`state-card ${messageType === 'error' ? 'state-error' : ''}`}>{message}</p> : null}

      <section className="address-layout">
        <div className="simple-card">
          <h2>{editingId ? 'Editar endereco' : 'Adicionar endereco'}</h2>
          <form className="address-form" onSubmit={submitAddress}>
            <label className="checkout-field">
              <span>CEP</span>
              <div className="cep-field-row">
                <input
                  value={form.cep}
                  placeholder="00000-000"
                  inputMode="numeric"
                  onBlur={fetchAddressByCep}
                  onChange={(event) => updateForm('cep', event.target.value)}
                />
                <button
                  type="button"
                  className="secondary-button"
                  disabled={cepState === 'loading'}
                  onClick={fetchAddressByCep}
                >
                  {cepState === 'loading' ? 'Buscando...' : 'Buscar CEP'}
                </button>
              </div>
            </label>
            <label className="checkout-field">
              <span>Apelido</span>
              <input required value={form.nickname} placeholder="Casa, Trabalho..." onChange={(event) => updateForm('nickname', event.target.value)} />
            </label>
            <label className="checkout-field">
              <span>Rua</span>
              <input required value={form.street} onChange={(event) => updateForm('street', event.target.value)} />
            </label>
            <label className="checkout-field">
              <span>Numero</span>
              <input required value={form.number} onChange={(event) => updateForm('number', event.target.value)} />
            </label>
            <label className="checkout-field">
              <span>Bairro</span>
              <input required value={form.neighborhood} onChange={(event) => updateForm('neighborhood', event.target.value)} />
            </label>
            <label className="checkout-field">
              <span>Complemento</span>
              <input value={form.complement} onChange={(event) => updateForm('complement', event.target.value)} />
            </label>
            <label className="checkout-field">
              <span>Ponto de referencia</span>
              <input value={form.reference_point} onChange={(event) => updateForm('reference_point', event.target.value)} />
            </label>
            <label className="filter-toggle address-default-toggle">
              <input
                type="checkbox"
                checked={form.is_default}
                onChange={(event) => updateForm('is_default', event.target.checked)}
              />
              Definir como endereco padrao
            </label>
            <div className="cart-actions-row">
              {editingId ? (
                <button type="button" className="secondary-button" onClick={resetForm}>
                  Cancelar edicao
                </button>
              ) : null}
              <button type="submit" className="primary-button" disabled={saveState === 'loading'}>
                {saveState === 'loading' ? 'Salvando...' : editingId ? 'Salvar alteracoes' : 'Adicionar endereco'}
              </button>
            </div>
          </form>
        </div>

        <div className="address-list-column">
          {state === 'loading' ? <p className="state-card">Carregando enderecos...</p> : null}
          {state === 'error' ? <p className="state-card state-error">{message}</p> : null}
          {state === 'empty' ? <p className="state-card">Voce ainda nao tem enderecos salvos.</p> : null}

          {addresses.map((address) => (
            <article className={`address-card ${address.is_default ? 'address-card-default' : ''}`} key={address.id}>
              <div>
                <div className="address-card-title">
                  <h3>{address.nickname}</h3>
                  {address.is_default ? <span>Padrao</span> : null}
                </div>
                <p>{formatAddress(address)}</p>
              </div>
              <div className="cart-actions-row">
                {!address.is_default ? (
                  <button type="button" className="secondary-button" onClick={() => makeDefault(address)}>
                    Tornar padrao
                  </button>
                ) : null}
                <button type="button" className="secondary-button" onClick={() => editAddress(address)}>
                  Editar
                </button>
                <button type="button" className="text-button" onClick={() => removeAddress(address)}>
                  Remover
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}

export default AddressesPage
