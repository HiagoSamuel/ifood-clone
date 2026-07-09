import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const isValidSupabaseUrl = (value) =>
  typeof value === 'string' &&
  /^https?:\/\//i.test(value) &&
  !value.includes('<') &&
  !value.includes('>') &&
  !value.includes('seu-projeto')

const hasValidAnonKey = (key) =>
  typeof key === 'string' &&
  key.startsWith('sb_publishable_') &&
  !key.includes('SEU_VALOR')

export const supabaseConfigValid =
  isValidSupabaseUrl(supabaseUrl) && hasValidAnonKey(supabaseAnonKey)

export const supabase = supabaseConfigValid
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

const normalizeBackendApiUrl = (value) => {
  const apiUrl = String(value || '').trim()

  if (!apiUrl) {
    return '/api'
  }

  if (apiUrl.startsWith('/') || /^https?:\/\//i.test(apiUrl)) {
    return apiUrl.replace(/\/$/, '')
  }

  return `https://${apiUrl.replace(/\/$/, '')}`
}

export const backendApiUrl = normalizeBackendApiUrl(import.meta.env.VITE_API_URL)
