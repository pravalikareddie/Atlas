export interface CustomList {
  id: string
  user_id: string
  title: string
  emoji: string
  order_index?: number
  created_at: string
}

export interface CustomListItem {
  id: string
  user_id: string
  list_id: string
  content: string
  status: 'todo' | 'done'
  order_index?: number
  created_at: string
}
