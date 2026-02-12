import salesTaxData from '../../../wwm-data/guild/sales-tax.yaml'
import salesBonusData from '../../../wwm-data/guild/sales-bonus.yaml'
import { BASE_MARKET_TAX } from './constants'

export interface Rank {
  rank: number
  value: number
  cost: { item: string; amount: number }[]
}

export const taxes: Rank[] = (salesTaxData as { technique: { ranks: Rank[] } }).technique.ranks
export const bonuses: Rank[] = (salesBonusData as { technique: { ranks: Rank[] } }).technique.ranks

export interface OptimizationResult {
  bestTaxLevel: number
  bestBonusLevel: number
  usedJades: number
  profitFactor: number
}

export function optimizeWealth(
  availableJades: number,
  currentTaxL: number,
  currentBonusL: number,
): OptimizationResult {
  let bestResult: OptimizationResult = {
    bestTaxLevel: currentTaxL,
    bestBonusLevel: currentBonusL,
    usedJades: 0,
    profitFactor: calculateFactor(currentTaxL, currentBonusL),
  }

  for (let t = currentTaxL; t <= 20; t++) {
    for (let b = currentBonusL; b <= 20; b++) {
      const costT = getCumulativeCost(currentTaxL, t, taxes)
      const costB = getCumulativeCost(currentBonusL, b, bonuses)
      const totalCost = costT + costB

      if (totalCost <= availableJades) {
        const factor = calculateFactor(t, b)
        if (
          factor > bestResult.profitFactor ||
          (factor === bestResult.profitFactor && totalCost < bestResult.usedJades)
        ) {
          bestResult = {
            bestTaxLevel: t,
            bestBonusLevel: b,
            usedJades: totalCost,
            profitFactor: factor,
          }
        }
      }
    }
  }

  return bestResult
}

function getCumulativeCost(startL: number, endL: number, data: Rank[]): number {
  let total = 0
  for (let index = startL; index < endL; index++) {
    // Rank 1 is at index 0
    const nextRank = data[index]
    if (nextRank) {
      const jadeCost = nextRank.cost.find(c => c.item === 'Wonder Jade')
      if (jadeCost) total += jadeCost.amount
    }
  }
  return total
}

export function calculateFactor(taxL: number, bonusL: number): number {
  const reduction = taxL > 0 ? taxes[taxL - 1].value : 0
  const bonus = bonusL > 0 ? bonuses[bonusL - 1].value : 0
  const guildTax = BASE_MARKET_TAX - reduction
  return (1 + bonus) * (1 - guildTax)
}
