/** Design tokens for the phone app: the same indigo / mint / coral palette as the web app. */
export const C = {
  bg: '#EEF0F8',
  surface: '#FFFFFF',
  ink: '#1A1A3B',
  ink2: '#3D3F66',
  muted: '#565A7C',
  faint: '#B4B7D0',
  line: '#E0E4F3',
  primary: '#5A3DF0',
  primaryDark: '#4A2FD1',
  primaryDeep: '#2B1C86',
  primarySoft: '#E7E3FF',
  primarySofter: '#F4F2FF',
  mint: '#2FD6BF',
  mintDark: '#0B9D89',
  mintSoft: '#D4F8F0',
  pink: '#FF7D95',
  pinkDark: '#E5486C',
  pinkSoft: '#FFE1E8',
  coral: '#FF7A59',
  coralSoft: '#FFE6DF',
  gold: '#FFC14D',
  goldSoft: '#FFF2CC',
  sky: '#4FC3E8',
  skySoft: '#DCF3FB',
  lilacSoft: '#ECE5FF',
  peachSoft: '#FFEADD',
  success: '#16A34A',
  successSoft: '#DCFCE7',
  danger: '#DC2626',
  dangerSoft: '#FEE2E2',
  warn: '#B45309',
  warnSoft: '#FEF3C7',
  white: '#FFFFFF',
} as const;

export const R = { card: 24, tile: 20, pill: 999, input: 16 } as const;

export const shadow = {
  card: { shadowColor: '#5A3DF0', shadowOpacity: 0.14, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 4 },
  lift: { shadowColor: '#5A3DF0', shadowOpacity: 0.3, shadowRadius: 22, shadowOffset: { width: 0, height: 12 }, elevation: 8 },
} as const;

export type Tone = 'indigo' | 'mint' | 'pink' | 'sky' | 'peach' | 'lilac' | 'gold';
/** [pastel backdrop, glyph gradient from, glyph gradient to] */
export const TONES: Record<Tone, [string, string, string]> = {
  indigo: ['#E7E3FF', '#8A76FF', '#4A2FD1'],
  mint: ['#D4F8F0', '#5EEAD4', '#0B9D89'],
  pink: ['#FFE1E8', '#FF9DB0', '#E5486C'],
  sky: ['#DCF3FB', '#6FD3F2', '#1B94C4'],
  peach: ['#FFEADD', '#FFB184', '#EE6A2F'],
  lilac: ['#ECE5FF', '#B49BFF', '#7B4EE0'],
  gold: ['#FFF2CC', '#FFD36B', '#E89A0C'],
};
