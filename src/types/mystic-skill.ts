export interface TierBonus {
  tier: number
  effect: string
}

export interface MysticSkill {
  slug: string
  name: string
  category: string
  description: string
  vitality_cost: string | number
  cooldown: string | number
  tags: string[]
  tier_bonuses?: TierBonus[]
}
