// Shared HIBE look for all app emails: light-grey card on white, lime accent
// pill, black CTA. Inline styles only — email clients ignore external CSS.

export const main = {
  backgroundColor: '#ffffff',
  fontFamily: 'Urbanist, Arial, sans-serif',
  padding: '24px 12px',
}

export const card = {
  backgroundColor: '#F4F4F2',
  borderRadius: '16px',
  padding: '28px',
  maxWidth: '520px',
}

export const brand = {
  fontSize: '18px',
  fontWeight: 'bold' as const,
  letterSpacing: '2px',
  color: '#111111',
  margin: '0',
}

export const pill = {
  backgroundColor: '#C8F135',
  color: '#1a1a1a',
  fontSize: '11px',
  fontWeight: 'bold' as const,
  letterSpacing: '1px',
  textTransform: 'uppercase' as const,
  borderRadius: '999px',
  padding: '5px 12px',
  margin: '0',
  display: 'inline-block',
}

export const h1 = {
  fontSize: '22px',
  fontWeight: 'bold' as const,
  color: '#111111',
  margin: '20px 0 12px',
}

export const text = {
  fontSize: '14px',
  color: '#555555',
  lineHeight: '1.6',
  margin: '0 0 16px',
}

export const strong = { color: '#111111' }

export const infoCard = {
  backgroundColor: '#ffffff',
  border: '1px solid #E7E7E3',
  borderRadius: '12px',
  padding: '14px 16px',
  margin: '0 0 20px',
}

export const infoLabel = {
  fontSize: '11px',
  fontWeight: 'bold' as const,
  letterSpacing: '1px',
  textTransform: 'uppercase' as const,
  color: '#9a9a9a',
  margin: '0 0 2px',
}

export const infoValue = {
  fontSize: '14px',
  color: '#111111',
  lineHeight: '1.5',
  margin: '0 0 10px',
}

export const infoValueLast = { ...infoValue, margin: '0' }

export const link = { color: '#111111', textDecoration: 'underline' }

export const note = {
  fontSize: '14px',
  color: '#111111',
  lineHeight: '1.5',
  margin: '0 0 16px',
  padding: '12px 14px',
  backgroundColor: '#ffffff',
  border: '1px solid #E7E7E3',
  borderRadius: '12px',
}

export const cta = { margin: '4px 0 20px' }

export const button = {
  backgroundColor: '#000000',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: 'bold' as const,
  border: '1px solid #000000',
  borderRadius: '12px',
  padding: '12px 22px',
  textDecoration: 'none',
}

export const footer = {
  fontSize: '12px',
  color: '#9a9a9a',
  lineHeight: '1.5',
  margin: '0',
}

export const footerBrand = {
  fontSize: '12px',
  color: '#9a9a9a',
  textAlign: 'center' as const,
  margin: '16px 0 0',
}
