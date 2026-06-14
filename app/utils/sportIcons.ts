export type SportSlug =
  | 'tennis'
  | 'padel'
  | 'football'
  | 'fitness'
  | 'yoga'
  | 'swim'
  | 'basketball'
  | 'boxing'

export interface SportIconPart {
  d: string
  strokeWidth?: number
  strokeLinecap?: 'round' | 'butt'
  strokeLinejoin?: 'round' | 'miter'
}

export const SPORT_SLUGS: SportSlug[] = [
  'tennis',
  'padel',
  'football',
  'fitness',
  'yoga',
  'swim',
  'basketball',
  'boxing',
]

/** Inline paths from public/icons/sports/*.svg (Classic Seam, 48×48). */
export const sportIconParts: Record<SportSlug, SportIconPart[]> = {
  tennis: [
    { d: 'M24 7C33 7 37.5 12 37.5 17.5C37.5 22.5 34.5 26.5 29.5 28L24 29.5L18.5 28C13.5 26.5 10.5 22.5 10.5 17.5C10.5 12 15 7 24 7Z', strokeWidth: 2.25, strokeLinejoin: 'round' },
    { d: 'M13 14h22M12.5 18.5h23M13 23h22', strokeWidth: 1.5, strokeLinecap: 'round' },
    { d: 'M18 11v16M24 10.5v16.5M30 11v16', strokeWidth: 1.5, strokeLinecap: 'round' },
    { d: 'M24 29.5V40.5', strokeWidth: 2.75, strokeLinecap: 'round' },
    { d: 'M21.5 36.5h5', strokeWidth: 1.5, strokeLinecap: 'round' },
    { d: 'M20.5 40.5h7', strokeWidth: 2.25, strokeLinecap: 'round' },
  ],
  padel: [
    { d: 'M24 7.5C33 7.5 37.5 10.5 37.5 14.5V21.5C37.5 24.5 35.5 27 32.5 27.5H15.5C12.5 27 10.5 24.5 10.5 21.5V14.5C10.5 10.5 15 7.5 24 7.5Z', strokeWidth: 2.25, strokeLinejoin: 'round' },
    { d: 'M17 15a1 1 0 1 0 2 0 1 1 0 0 0-2 0M23 15a1 1 0 1 0 2 0 1 1 0 0 0-2 0M29 15a1 1 0 1 0 2 0 1 1 0 0 0-2 0M17 20a1 1 0 1 0 2 0 1 1 0 0 0-2 0M23 20a1 1 0 1 0 2 0 1 1 0 0 0-2 0M29 20a1 1 0 1 0 2 0 1 1 0 0 0-2 0', strokeWidth: 1.5 },
    { d: 'M17.5 27.5H30.5', strokeWidth: 2, strokeLinecap: 'round' },
    { d: 'M24 27.5V40.5', strokeWidth: 3, strokeLinecap: 'round' },
    { d: 'M21.5 36h5', strokeWidth: 1.5, strokeLinecap: 'round' },
    { d: 'M20 40.5h8', strokeWidth: 2.25, strokeLinecap: 'round' },
  ],
  football: [
    { d: 'M4 40H44', strokeWidth: 2.25, strokeLinecap: 'round' },
    { d: 'M5 14V40', strokeWidth: 2.25, strokeLinecap: 'round' },
    { d: 'M43 14V40', strokeWidth: 2.25, strokeLinecap: 'round' },
    { d: 'M5 14H43', strokeWidth: 2.25, strokeLinecap: 'round' },
    { d: 'M5 14L10 40', strokeWidth: 1.5, strokeLinecap: 'round' },
    { d: 'M24 14V40', strokeWidth: 1.5, strokeLinecap: 'round' },
    { d: 'M43 14L38 40', strokeWidth: 1.5, strokeLinecap: 'round' },
    { d: 'M5 22H43', strokeWidth: 1.5, strokeLinecap: 'round' },
    { d: 'M5 31H43', strokeWidth: 1.5, strokeLinecap: 'round' },
  ],
  fitness: [
    { d: 'M24 10a3 3 0 1 1 0 6 3 3 0 0 1 0-6Z', strokeWidth: 2.25 },
    { d: 'M24 16v13', strokeWidth: 2.25, strokeLinecap: 'round' },
    { d: 'M24 17 13.5 13', strokeWidth: 2.25, strokeLinecap: 'round' },
    { d: 'M13.5 13 11.5 8', strokeWidth: 2.25, strokeLinecap: 'round' },
    { d: 'M24 17 34.5 13', strokeWidth: 2.25, strokeLinecap: 'round' },
    { d: 'M34.5 13 36.5 8', strokeWidth: 2.25, strokeLinecap: 'round' },
    { d: 'M24 29 17.5 41', strokeWidth: 2.25, strokeLinecap: 'round' },
    { d: 'M24 29 30.5 41', strokeWidth: 2.25, strokeLinecap: 'round' },
  ],
  yoga: [
    { d: 'M24 8.5a3.25 3.25 0 1 1 0 6.5 3.25 3.25 0 0 1 0-6.5Z', strokeWidth: 2.25 },
    { d: 'M24 15v5', strokeWidth: 2.25, strokeLinecap: 'round' },
    { d: 'M24 16.5 15 23.5', strokeWidth: 2.25, strokeLinecap: 'round' },
    { d: 'M24 16.5 33 23.5', strokeWidth: 2.25, strokeLinecap: 'round' },
    { d: 'M14 23.5C17 32.5 20.5 36.5 24 37C27.5 36.5 31 32.5 34 23.5', strokeWidth: 2.25, strokeLinecap: 'round', strokeLinejoin: 'round' },
    { d: 'M17 25H31', strokeWidth: 2.25, strokeLinecap: 'round' },
  ],
  swim: [
    { d: 'M5 35c4 2.5 8 2.5 12 0s8-2.5 12 0 8 2.5 12 0', strokeWidth: 2.25, strokeLinecap: 'round' },
    { d: 'M5 40c4 2.5 8 2.5 12 0s8-2.5 12 0 8 2.5 12 0', strokeWidth: 1.75, strokeLinecap: 'round' },
    { d: 'M15 19.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7Z', strokeWidth: 2.25 },
    { d: 'M18.5 21.5c7-1 13-4 18-8', strokeWidth: 2.25, strokeLinecap: 'round' },
    { d: 'M17.5 24c5 2.5 10 3 16 1', strokeWidth: 2.25, strokeLinecap: 'round' },
    { d: 'M16 26.5c-1.5 3-1 6 2.5 8', strokeWidth: 1.75, strokeLinecap: 'round' },
    { d: 'M33.5 16.5 37 14', strokeWidth: 1.75, strokeLinecap: 'round' },
  ],
  basketball: [
    { d: 'M41.5 24a17.5 17.5 0 1 1-35 0 17.5 17.5 0 1 1 35 0', strokeWidth: 2.25 },
    { d: 'M24 6.5v35', strokeWidth: 1.75, strokeLinecap: 'round' },
    { d: 'M6.5 24h35', strokeWidth: 1.75, strokeLinecap: 'round' },
    { d: 'M9.2 14.8c7.8 5.2 21.8 5.2 29.6 0', strokeWidth: 1.75, strokeLinecap: 'round' },
    { d: 'M9.2 33.2c7.8-5.2 21.8-5.2 29.6 0', strokeWidth: 1.75, strokeLinecap: 'round' },
  ],
  boxing: [
    { d: 'M25 6C35 6 40.5 12 40 20C39.5 26.5 36 29.5 29.5 30.5V42H20.5V30.5C14 29.5 10.5 25.5 11 19C11.5 12 17 6 25 6Z', strokeWidth: 2.25, strokeLinejoin: 'round' },
    { d: 'M11 19.5C4.5 16.5 2 22.5 3.5 29C5 35.5 11 39 17.5 36.5C21 35 21.5 30 19 25.5C17 22 13.5 20 11 19.5Z', strokeWidth: 2.25, strokeLinejoin: 'round' },
    { d: 'M25 9.5V27.5', strokeWidth: 1.75, strokeLinecap: 'round' },
    { d: 'M21 12.5V24.5', strokeWidth: 1.5, strokeLinecap: 'round' },
    { d: 'M29 12.5V24.5', strokeWidth: 1.5, strokeLinecap: 'round' },
    { d: 'M20.5 37H29.5', strokeWidth: 1.75, strokeLinecap: 'round' },
  ],
}

export function isSportSlug(value: string): value is SportSlug {
  return (SPORT_SLUGS as string[]).includes(value)
}

export function sportIconUrl(slug: string): string {
  const s = isSportSlug(slug) ? slug : 'tennis'
  return `/icons/sports/${s}.svg`
}
