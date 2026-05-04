// ─── Thali Planner Constants ──────────────────────────────────────────────────

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'

export interface ThaliCategory {
  id: string
  label: string
  emoji: string
  defaults: string[]
}

export const MEALS: { key: MealType; label: string; emoji: string }[] = [
  { key: 'breakfast', label: 'Breakfast', emoji: '🌅' },
  { key: 'lunch', label: 'Lunch', emoji: '☀️' },
  { key: 'dinner', label: 'Dinner', emoji: '🌙' },
  { key: 'snack', label: 'Snack', emoji: '🍎' },
]

export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const

const FULL_PLATE: ThaliCategory[] = [
  {
    id: 'carbs',
    label: 'Carbs',
    emoji: '🍚',
    defaults: [
      'White Rice',
      'Lemon Rice',
      'Pulao',
      'Biryani',
      'Bagara',
      'Daddojanam',
      'Chapati',
      'Dosa',
    ],
  },
  {
    id: 'curry',
    label: 'Curry',
    emoji: '🍛',
    defaults: [
      'Mushroom masala',
      'Tomato pachadi',
      'Dondakaya pachadi',
      'Potato fry',
      'Vankaya fry',
      'Goru chikkudu',
      'Chikkudukaya',
    ],
  },
  {
    id: 'veggies',
    label: 'Veggies',
    emoji: '🥬',
    defaults: [
      'Asparagus',
      'Beans poriyal',
      'Cabbage thoran',
      'Beetroot fry',
      'Carrot peas',
      'Palak',
      'Mixed veg',
    ],
  },
  {
    id: 'dal',
    label: 'Dal',
    emoji: '🫘',
    defaults: [
      'Sambar',
      'Pachi pulusu',
      'Kalyana rasam',
      'Spinach pappu',
      'Tomato pappu',
    ],
  },
  {
    id: 'protein',
    label: 'Protein',
    emoji: '🍗',
    defaults: [
      'Chicken curry',
      'Chettinad chicken',
      'Prawns pepper fry',
      'Prawns curry',
      'Fish curry',
      'Fish fry',
      'Egg masala',
    ],
  },
  {
    id: 'curd',
    label: 'Curd',
    emoji: '🥛',
    defaults: ['Plain Curd', 'Raita', 'Buttermilk'],
  },
]

const BREAKFAST: ThaliCategory[] = [
  {
    id: 'Item',
    label: 'Item',
    emoji: '🍳',
    defaults: ['Idli', 'Dosa', 'Upma', 'Pesarattu', 'Bread toast'],
  },
]

const SNACK_CATS: ThaliCategory[] = [
  { id: 'snack', label: 'Snack', emoji: '🍿', defaults: ['Fruits'] },
]

export function getCategoriesForMeal(meal: MealType): ThaliCategory[] {
  if (meal === 'breakfast') return BREAKFAST
  if (meal === 'snack') return SNACK_CATS
  return FULL_PLATE
}

export const EXTRAS = [
  {
    id: 'juice',
    label: 'Smoothie & Juice',
    emoji: '🥤',
    items: ['Veggie Juice', 'Fruit Smoothie', 'Nuts', 'Chia Seeds'],
  },
  {
    id: 'supps',
    label: 'Supplements',
    emoji: '💊',
    items: ['Protein Powder', 'Creatine', 'D3', 'B12', 'Iron'],
  },
] as const

export const THALI_STRINGS = {
  WEEK_PLAN: 'Week Plan',
  OPTIONS: 'Options',
  COPY_LAST_WEEK: 'Copy last week',
  NOT_PLANNED: 'Not planned',
  ADD_OPTION: 'Add option',
  ADD_CUSTOM: 'Add custom option',
  NEW_OPTION_PH: 'New option...',
  ADD_OPTION_PH: 'Add option...',
  SELECTED: 'Selected',
  CLEAR: 'Clear',
  EATEN: '✓ Eaten',
  EAT: 'Eat',
  ADD: 'Add',
  MANAGE: 'Manage',
} as const
