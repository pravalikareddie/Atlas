export interface Place {
  id: string
  user_id: string
  name: string
  note: string | null
  image_url: string | null
  status: 'want' | 'visited'
  visited_date: string | null
  memory: string | null
  done_image_url: string | null
  target_date: string | null
  order_index?: number
  created_at: string
}

export interface PlaceExperience {
  id: string
  user_id: string
  place_id: string
  name: string
  status: 'want' | 'done'
  done_date: string | null
  created_at: string
}

export interface Experience {
  id: string
  user_id: string
  name: string
  image_url: string | null
  place_id: string | null
  status: 'want' | 'done'
  done_date: string | null
  memory: string | null
  done_image_url: string | null
  target_date: string | null
  order_index?: number
  created_at: string
}

export interface Activity {
  id: string
  user_id: string
  name: string
  image_url: string | null
  target_date: string | null
  order_index?: number
  created_at: string
}

export interface LivingTodo {
  id: string
  user_id: string
  description: string
  status: 'todo' | 'done'
  completed_at: string | null
  order_index?: number
  created_at: string
}

export interface WishlistItem {
  id: string
  user_id: string
  name: string
  url: string | null
  price: string | null
  notes: string | null
  status: 'want' | 'bought'
  order_index?: number
  created_at: string
}
