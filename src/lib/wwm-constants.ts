export const BASE_MARKET_TAX = 0.11;

export const EB_IRON_PER_OUTPOST = 23;
export const ENERGY_PER_OUTPOST = 20;
export const ENERGY_PER_DAY = 180;
export const WEEKLY_CHESTS = 18;
export const MATS_PER_CHEST = 3;

export const ACQUISITION_RATES: Record<string, number> = {
  'Vicious Fruit': 3,
  "Beauty's Plume": 8,
  "Buddha's Tear Root": 10,
  'Jade Tower Pearl': 10,
  'Jasmin Stamen': 6,
};

export const SKILL_ORDER = [
  // Block 1
  ['Tai Chi', 'Meridian Touch', 'Celestial Seize', 'Cloud Steps', 'Contortion'],
  // Block 2
  ["Lion's Roar", 'Leaping Toad'],
  // Block 3
  ['Ghost Bind', 'Guardian Palm', 'Flaming Meteor'],
  // Block 4
  ['Talon Strike', 'Yaksha Rush', 'Free Morph', 'Wolflike Frenzy', 'Soaring Spin'],
  // Block 5 (Future)
  ["Dragon's Breath", 'Drunken Poet', 'Dragon Head'],
  // Block 6 (Future)
  ['Blinding Mist', 'Serene Breeze', 'Golden Body', 'Ghostly Steps', 'Honking Havoc', 'Glow of Fireflies', 'Veil of Stillness'],
  // Block 7 (Future)
  ['Cyclone Spin', 'Paired Radiance'],
  // Block 8 (Future)
  ['Divine Counter', 'Star Shift', 'Still Waters', 'Touch of Death', 'Wind Sense'],
  // Block 9 (Future)
  ['Thousand-Mile Flight', 'Meteor Flight', 'Fan Glider', 'Wind Rider'],
  // Block 10 (Future)
  [
    'Wallstride - Swiftstride',
    'Wallstride - Shadowdash',
    'Threefold Skywalk',
    'Skywalk Dash',
    'Mighty Drop',
    'Safe Mighty Drop',
    'Abyss Dive'
  ]
];
