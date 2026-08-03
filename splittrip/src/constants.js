export const C = {
  bg:           '#080b14',
  surface:      '#0f1520',
  card:         '#141b2d',
  cardHover:    '#1a2340',
  border:       '#1e2d4a',
  borderBright: '#2a3d62',
  accent:       '#3d8bff',
  accentDim:    '#0d2044',
  teal:         '#00d4aa',
  tealDim:      '#002d25',
  amber:        '#f5a623',
  amberDim:     '#2a1a00',
  red:          '#ff5c5c',
  redDim:       '#2a0808',
  text:         '#dde4f0',
  muted:        '#5a7090',
  white:        '#ffffff',
}

export const POPULAR = [
  { code: 'SGD', name: 'Singapore Dollar',    flag: '🇸🇬' },
  { code: 'MYR', name: 'Malaysian Ringgit',   flag: '🇲🇾' },
  { code: 'USD', name: 'US Dollar',           flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro',                flag: '🇪🇺' },
  { code: 'GBP', name: 'British Pound',       flag: '🇬🇧' },
  { code: 'JPY', name: 'Japanese Yen',        flag: '🇯🇵' },
  { code: 'AUD', name: 'Australian Dollar',   flag: '🇦🇺' },
  { code: 'THB', name: 'Thai Baht',           flag: '🇹🇭' },
  { code: 'IDR', name: 'Indonesian Rupiah',   flag: '🇮🇩' },
  { code: 'INR', name: 'Indian Rupee',        flag: '🇮🇳' },
  { code: 'HKD', name: 'Hong Kong Dollar',    flag: '🇭🇰' },
  { code: 'KRW', name: 'South Korean Won',    flag: '🇰🇷' },
  { code: 'CNY', name: 'Chinese Yuan',        flag: '🇨🇳' },
  { code: 'TWD', name: 'Taiwan Dollar',       flag: '🇹🇼' },
  { code: 'VND', name: 'Vietnamese Dong',     flag: '🇻🇳' },
  { code: 'PHP', name: 'Philippine Peso',     flag: '🇵🇭' },
  { code: 'BDT', name: 'Bangladeshi Taka',    flag: '🇧🇩' },
  { code: 'PKR', name: 'Pakistani Rupee',     flag: '🇵🇰' },
  { code: 'LKR', name: 'Sri Lankan Rupee',    flag: '🇱🇰' },
  { code: 'NZD', name: 'New Zealand Dollar',  flag: '🇳🇿' },
  { code: 'CAD', name: 'Canadian Dollar',     flag: '🇨🇦' },
  { code: 'CHF', name: 'Swiss Franc',         flag: '🇨🇭' },
  { code: 'AED', name: 'UAE Dirham',          flag: '🇦🇪' },
  { code: 'SAR', name: 'Saudi Riyal',         flag: '🇸🇦' },
  { code: 'QAR', name: 'Qatari Riyal',        flag: '🇶🇦' },
  { code: 'ZAR', name: 'South African Rand',  flag: '🇿🇦' },
  { code: 'MXN', name: 'Mexican Peso',        flag: '🇲🇽' },
  { code: 'BRL', name: 'Brazilian Real',      flag: '🇧🇷' },
  { code: 'NOK', name: 'Norwegian Krone',     flag: '🇳🇴' },
  { code: 'SEK', name: 'Swedish Krona',       flag: '🇸🇪' },
  { code: 'DKK', name: 'Danish Krone',        flag: '🇩🇰' },
]

export const CURR_MAP = Object.fromEntries(POPULAR.map(c => [c.code, c]))

const SYMS = {
  SGD:'S$', MYR:'RM', USD:'$', EUR:'€', GBP:'£', JPY:'¥',
  AUD:'A$', THB:'฿', IDR:'Rp', INR:'₹', HKD:'HK$', KRW:'₩',
  CNY:'¥', TWD:'NT$', VND:'₫', PHP:'₱', NZD:'NZ$', CAD:'C$',
  CHF:'Fr', AED:'د.إ', SAR:'﷼', QAR:'﷼', BRL:'R$', MXN:'$', ZAR:'R',
}

export const NO_DECIMAL = ['JPY','KRW','IDR','VND']

export function currSymbol(code) { return SYMS[code] || (code + ' ') }
export function currLabel(code)  {
  const c = CURR_MAP[code]
  return c ? `${c.flag} ${code}` : code
}
export function fmtAmt(amount, code) {
  const sym = currSymbol(code)
  const dp  = NO_DECIMAL.includes(code) ? 0 : 2
  return `${sym}${Math.abs(amount).toFixed(dp)}`
}
