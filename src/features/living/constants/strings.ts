export const STRINGS = {
  // Layout
  FEATURE_TITLE: '🌟 Living Life',
  TAB_EXPLORE: 'Explore',
  TAB_ACTIVITIES: 'Activities',
  TAB_DONE: 'Done',

  // Section headers
  TAB_PLACES: '📍 Places',
  TAB_EXPERIENCES: '✨ Experiences',
  PLACES_TO_GO: 'Places to go',
  THINGS_TO_EXPERIENCE: 'Things to experience',
  THINGS_TO_RESEARCH: 'Things to research',
  THINGS_TO_DO_THERE: 'Things to do there',

  // Empty states
  EMPTY_EXPLORE: 'The world is waiting for you',
  EMPTY_EXPLORE_SUB: 'Add places you want to go and things you want to experience.',
  EMPTY_PLACES: 'No places on your list yet',
  EMPTY_PLACES_SUB: 'Where in the world do you want to go?',
  EMPTY_EXPS: 'No experiences on your list yet',
  EMPTY_EXPS_SUB: 'What do you want to feel, see, or try?',
  EMPTY_RESEARCH: 'Nothing to look up right now',
  EMPTY_RESEARCH_SUB: 'Add research or planning tasks here.',
  PREVIOUSLY_VISITED: 'Previously visited',
  PREVIOUSLY_DONE: 'Previously experienced',

  // Win banner
  WIN_SUFFIX: 'lived. Keep collecting moments.',

  // Counts
  THINGS_TO_DO: (n: number) => `${n} things to do`,
  THINGS_TO_DO_THERE_COUNT: (n: number) => `${n} things to do there`,
  NO_PLANS: 'no plans yet',
  NO_SPECIFIC_PLANS: 'no specific plans yet',

  // Modal titles
  ADD_PLACE: 'Add a place',
  ADD_EXPERIENCE: 'Add an experience',
  EDIT_PLACE: 'Edit place',
  EDIT_EXPERIENCE: 'Edit experience',
  YOU_WENT: 'You went! 🎉',
  YOU_DID_IT: 'You did it! ✨',

  // Field labels
  FIELD_NAME: 'Name',
  FIELD_NOTE: 'What draws you there? (optional)',
  FIELD_IMAGE_URL: 'Image URL (optional)',
  FIELD_LINKED_PLACE: 'Linked to a place (optional)',
  FIELD_WHEN: 'When',
  FIELD_MEMORY: 'What stays with you? (optional)',
  FIELD_PHOTO_URL: 'Photo URL (optional)',

  // Placeholders
  PH_PLACE_NAME: 'Tokyo, Patagonia, Amalfi...',
  PH_PLACE_NOTE: 'the food, the mountains, the quiet...',
  PH_IMAGE_URL: 'https://...',
  PH_EXP_NAME: 'Watch a sunrise alone, Learn to surf...',
  PH_WHEN: 'Apr 2026',
  PH_MEMORY: 'the sounds, the light, the feeling...',
  PH_RESEARCH: 'research, find, look up...',
  PH_ADD_THING: 'add thing to do...',
  NONE: 'None',

  // Buttons
  ADD: '+ add',
  EDIT: 'Edit',
  PLACE_BTN: '📍 Place',
  EXPERIENCE_BTN: '✨ Experience',
  SAVE: 'Save',
  CANCEL: 'Cancel',
  DELETE: 'Delete',
  MARK_VISITED: '✓ Mark as visited',
  MARK_DONE: '✓ Mark as done',

  // Confirm
  CONFIRM_DELETE_PLACE: 'Remove this place from your list?',
  CONFIRM_DELETE_EXP: 'Remove this experience?',
  CONFIRM_DELETE_ACTIVITY: 'Remove this activity?',
  CONFIRM_DELETE_TODO: 'Remove this research item?',

  // Activities
  ADD_ACTIVITY: 'Add an activity',
  EDIT_ACTIVITY: 'Edit activity',
  EMPTY_ACTIVITIES: 'What makes you come alive?',
  EMPTY_ACTIVITIES_SUB: 'Add activities that are part of who you are.',
  PH_ACTIVITY_NAME: 'Trekking, Beach days, Long drives...',

  // Wishlist
  TAB_WISHLIST: 'Wishlist',
  WISHLIST: 'Wishlist',
  ADD_WISH: '+ add',
  EMPTY_WISHLIST: 'Nothing on your wishlist yet.',
  EMPTY_WISHLIST_SUB: 'Add things you want — big or small.',
  FIELD_URL: 'Link (optional)',
  FIELD_PRICE: 'Price (optional)',
  FIELD_NOTES_OPT: 'Notes (optional)',
  PH_WISH_NAME: 'AirPods, Standing desk, Trip to Japan...',
  PH_URL: 'https://...',
  MARK_BOUGHT: '✓ Bought',
  BOUGHT: 'Bought',

  // Done screen
  PLACES_VISITED: 'Places visited',
  EXPERIENCES_HAD: 'Experiences had',
  THINGS_YOU_DID: 'Things you did there',
  EMPTY_DONE: 'Your lived experiences will appear here',
  EMPTY_DONE_SUB: 'Mark places as visited and experiences as done — collect your moments.',
  VISITED_PREFIX: 'Visited',
  DONE_PREFIX: 'Done',
  SAVE_MEMORY: 'Save memory',
  ADD_MEMORY_PROMPT: 'Add a memory?',
} as const
