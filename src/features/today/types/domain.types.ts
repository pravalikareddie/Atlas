export type DomainName = 'work' | 'finance' | 'fitness' | 'self_growth' | 'confidence' | 'living' | 'health'
export type DomainStatus = 'needs_attention' | 'holding_steady' | 'no_data'

export interface DomainCard {
  domain: DomainName
  label: string
  icon: string
  status: DomainStatus
  lastEvent: string | null
  action: { text: string; route: string } | null
}

export const DOMAIN_META: Record<DomainName, { label: string; icon: string; priority: number }> = {
  finance:     { label: 'Finance',     icon: '💜', priority: 1 },
  health:      { label: 'Health',      icon: '💚', priority: 2 },
  work:        { label: 'Work',        icon: '💼', priority: 3 },
  fitness:     { label: 'Fitness',     icon: '💪', priority: 4 },
  self_growth: { label: 'Self-growth', icon: '🧠', priority: 5 },
  confidence:  { label: 'Confidence',  icon: '✨', priority: 6 },
  living:      { label: 'Living',      icon: '🌟', priority: 7 },
}

export const ALL_DOMAINS: DomainName[] = ['work', 'finance', 'fitness', 'self_growth', 'confidence', 'living', 'health']
