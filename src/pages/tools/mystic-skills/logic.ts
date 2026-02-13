import { ACQUISITION_RATES, MATS_PER_CHEST, WEEKLY_CHESTS } from '@/lib/wwm-constants';

export interface SkillState {
  curTier: number;
  curRank: number;
  targetTier: number;
  targetRank: number;
}

export function calculateTotals(skills: any[], states: Map<string, any>) {
  const skillTotals: Record<string, Record<string, number>> = {};
  const globalTotals: Record<string, number> = {};

  skills.forEach((skill: any) => {
    const id = skill.name.toLowerCase().replace(/\s+/g, '-');
    const curT = states.get(`${id}-curTier`) as number || skill.tiers.starting_tier;
    const curR = states.get(`${id}-curRank`) as number || 0;
    const targetT = states.get(`${id}-targetTier`) as number || skill.tiers.starting_tier;
    const targetR = states.get(`${id}-targetRank`) as number || 0;

    const currentSkillCosts: Record<string, number> = {};

    // Check if any upgrade is needed
    if (targetT < curT || (targetT === curT && targetR <= curR)) {
      skillTotals[skill.name] = {};
      return;
    }

    skill.tiers.rank_ups.forEach((tu: any) => {
      const tier = tu.tier;
      tu.ranks.forEach((r: any) => {
        const rank = r.rank;

        // Determine the state reached AFTER paying this cost
        let nextT: number, nextR: number;
        if (rank === 0 && tier > skill.tiers.starting_tier) {
          nextT = tier;
          nextR = 0;
        } else {
          nextT = tier;
          nextR = rank + 1;
        }

        const isAheadOfCurrent = (nextT > curT) || (nextT === curT && nextR > curR);
        const isAtOrBeforeTarget = (nextT < targetT) || (nextT === targetT && nextR <= targetR);

        if (isAheadOfCurrent && isAtOrBeforeTarget) {
          r.cost.forEach((c: any) => {
            currentSkillCosts[c.item] = (currentSkillCosts[c.item] || 0) + c.amount;
            globalTotals[c.item] = (globalTotals[c.item] || 0) + c.amount;
          });
        }
      });
    });

    skillTotals[skill.name] = currentSkillCosts;
  });

  return { skillTotals, globalTotals };
}

export function sortMaterials(materialNames: string[]): string[] {
  return [...materialNames].sort((a, b) => {
    if (a === 'Ebon Iron') return -1;
    if (b === 'Ebon Iron') return 1;
    return a.localeCompare(b);
  });
}

export function getAcquisitionPlan(totals: Record<string, number>, gatherMode: boolean) {
  const EB_IRON_PER_OUTPOST = 23;
  const ENERGY_PER_OUTPOST = 20;
  const ENERGY_PER_DAY = 180;
  const WEEKLY_CHEST_TOTAL = WEEKLY_CHESTS * MATS_PER_CHEST;

  const ebIronNeeded = totals['Ebon Iron'] || 0;
  const runsNeeded = Math.ceil(ebIronNeeded / EB_IRON_PER_OUTPOST);
  const energyNeeded = runsNeeded * ENERGY_PER_OUTPOST;
  const daysEbIron = Math.ceil(energyNeeded / ENERGY_PER_DAY);

  const rareMats = Object.keys(totals).filter(m => m !== 'Ebon Iron');
  
  // Simulation for Rare Materials
  let daysRare = 0;
  if (rareMats.length > 0) {
    const needs = { ...totals };
    delete needs['Ebon Iron'];

    // Current time: Friday, Feb 13, 2026. getDay() returns 5.
    const now = new Date();
    let currentDayOfWeek = now.getDay();
    
    // If running in build/server, Date() is fixed or system time. 
    // For the UI, we'll use the same logic client-side if needed, 
    // but here we just need a starting point.
    
    while (Object.values(needs).some(v => v > 0) && daysRare < 3650) {
      daysRare++;
      
      // Daily gathering
      rareMats.forEach(mat => {
        if (needs[mat] > 0 && gatherMode) {
          needs[mat] -= (ACQUISITION_RATES[mat] || 3);
        }
      });

      // Weekly Chests on Monday (1)
      if ((currentDayOfWeek + daysRare) % 7 === 1) {
        let chestsLeft = WEEKLY_CHEST_TOTAL;
        while (chestsLeft > 0 && Object.values(needs).some(v => v > 0)) {
          // Find mat that takes longest to gather (Waterspill)
          let worstMat = '';
          let maxDays = -1;
          
          rareMats.forEach(mat => {
            if (needs[mat] > 0) {
              const rate = gatherMode ? (ACQUISITION_RATES[mat] || 3) : 0.1; // small rate to avoid /0
              const d = needs[mat] / rate;
              if (d > maxDays) {
                maxDays = d;
                worstMat = mat;
              }
            }
          });

          if (worstMat) {
            const amount = Math.min(chestsLeft, needs[worstMat]);
            needs[worstMat] -= amount;
            chestsLeft -= amount;
          } else {
            break;
          }
        }
      }
    }
  }

  return {
    daysEbIron,
    daysRare,
    totalDays: Math.max(daysEbIron, daysRare),
    energyNeeded,
    runsNeeded
  };
}
