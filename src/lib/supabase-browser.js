export { supabase } from './supabase'

export function createClient() {
  const { supabase } = require('./supabase')
  return supabase
}
