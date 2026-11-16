/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="nl" dir="ltr">
    <Head />
    <Preview>Je verificatiecode</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={{ fontSize: '20px', fontWeight: 'bold', color: '#111111', margin: '0 0 24px' }}>HIBE</Text>
        <Heading style={h1}>Bevestig je identiteit</Heading>
        <Text style={text}>Gebruik deze code om je identiteit te bevestigen:</Text>
        <Text style={codeStyle}>{token}</Text>
        <Text style={footer}>
          Deze code is tijdelijk geldig. Heb je deze niet aangevraagd? Dan kun je deze e-mail negeren.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Urbanist, Arial, sans-serif' }
const container = { padding: '32px 24px', maxWidth: '560px' }
const h1 = {
  fontSize: '22px',
  fontWeight: 'bold' as const,
  color: '#111111',
  margin: '0 0 20px',
}
const text = {
  fontSize: '14px',
  color: '#6b6b6b',
  lineHeight: '1.5',
  margin: '0 0 25px',
}
const codeStyle = {
  fontFamily: 'Courier, monospace',
  fontSize: '22px',
  fontWeight: 'bold' as const,
  color: '#111111',
  margin: '0 0 30px',
}
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
