import { supabase } from '../../lib/supabase'

interface HasId {
  id: string
}

interface FetchOptions {
  orderBy?: string
  ascending?: boolean
  filters?: Record<string, string>
}

export function createCrudService<T extends HasId>(
  table: string,
  defaultFetchOptions?: FetchOptions,
) {
  async function fetchAll(): Promise<T[]> {
    let q = supabase.from(table).select('*')
    const opts = defaultFetchOptions
    if (opts?.filters) {
      for (const [k, v] of Object.entries(opts.filters)) {
        q = q.eq(k, v)
      }
    }
    q = q.order(opts?.orderBy ?? 'created_at', {
      ascending: opts?.ascending ?? false,
    })
    const { data, error } = await q
    if (error) throw new Error(error.message)
    return (data as T[]) ?? []
  }

  async function insert(row: Omit<T, 'id' | 'created_at'>): Promise<T> {
    const { data, error } = await supabase
      .from(table)
      .insert(row as any)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data as T
  }

  async function update(id: string, updates: Partial<T>): Promise<void> {
    const { error } = await supabase.from(table).update(updates as any).eq('id', id)
    if (error) throw new Error(error.message)
  }

  async function remove(id: string): Promise<void> {
    const { error } = await supabase.from(table).delete().eq('id', id)
    if (error) throw new Error(error.message)
  }

  return { fetchAll, insert, update, remove }
}
