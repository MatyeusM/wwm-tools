import { calculateFactor } from './optimizer'
import { BASE_MARKET_TAX } from './constants'

export interface TableElements {
  tableBody: Element
  shiftingHeaderBtn: HTMLElement
  headerText: HTMLElement
  guildProfitHeader: HTMLElement
}

export function updateTable(s: Map<string, unknown>, elements: TableElements) {
  const { tableBody, shiftingHeaderBtn, headerText, guildProfitHeader } = elements
  const taxL = s.get('taxLevel') as number
  const bonusL = s.get('saleBonusRank') as number
  const mode = s.get('flexMode') as boolean

  const factorG = calculateFactor(taxL, bonusL)
  const factorN = 1 - BASE_MARKET_TAX

  // Update Headers based on mode
  if (mode) {
    headerText.textContent = 'Equivalent Guild %'
    // Ensure specific order: BTN then Guild Profit
    shiftingHeaderBtn.after(guildProfitHeader)
  } else {
    headerText.textContent = 'Equivalent Non-Guild %'
    // Ensure specific order: Guild Profit then BTN
    guildProfitHeader.after(shiftingHeaderBtn)
  }

  tableBody.innerHTML = ''

  for (let p = 300; p >= 120; p -= 20) {
    const baseFactor = 1 + p / 100
    const profitN = baseFactor * factorN
    const profitG = baseFactor * factorG

    const flexValue = mode
      ? (baseFactor * factorN) / factorG - 1
      : (baseFactor * factorG) / factorN - 1

    const row = document.createElement('tr')

    const flexCell = `<td><strong>+${(flexValue * 100).toFixed(1)}%</strong></td>`
    const guildCell = `<td>+${((profitG - 1) * 100).toFixed(1)}%</td>`
    const nonGuildCell = `<td>+${((profitN - 1) * 100).toFixed(1)}%</td>`
    const baseCell = `<td>+${p}%</td>`

    row.innerHTML = mode
      ? `${baseCell}${nonGuildCell}${flexCell}${guildCell}`
      : `${baseCell}${nonGuildCell}${guildCell}${flexCell}`

    tableBody.append(row)
  }
}
