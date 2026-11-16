/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

import type { TemplateEntry } from './registry.ts'

interface FeedbackToegewezenProps {
  name?: string
  videoTitle?: string
  clientName?: string
  feedbackUrl?: string
}

const FeedbackToegewezen = ({
  name,
  videoTitle,
  clientName,
  feedbackUrl,
}: FeedbackToegewezenProps) => (
  <Html lang="nl" dir="ltr">
    <Head />
    <Preview>
      {videoTitle ? `Feedback voor ${videoTitle}` : 'Feedback voor jou'}
    </Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>HIBE</Text>
        <Heading style={h1}>Feedback voor jou</Heading>
        <Text style={text}>
          {name ? `Hi ${name},` : 'Hi,'} je bent als editor gekoppeld aan
          feedback op{' '}
          <strong style={strong}>
            {videoTitle ?? 'een video'}
          </strong>
          {clientName ? ` voor ${clientName}` : ''}.
        </Text>
        <Text style={text}>
          De feedback staat bij die video klaar. Open de video om te zien wat
          er aangepast moet worden.
        </Text>
        {feedbackUrl ? (
          <Section style={cta}>
            <Button style={button} href={feedbackUrl}>
              Bekijk de feedback
            </Button>
          </Section>
        ) : null}
        <Text style={footer}>
          Verwachtte je deze melding niet? Geef het even door, dan kijken we
          ernaar.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: FeedbackToegewezen,
  subject: (data: Record<string, any>) =>
    `Feedback voor jou: ${data.videoTitle ?? 'een video'}`,
  displayName: 'Feedback toegewezen',
  previewData: {
    name: 'Jane',
    videoTitle: 'Reel lancering zomercollectie',
    clientName: 'VIP Fashion',
    feedbackUrl: 'https://hibespace.com/hibe/videos',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Urbanist, Arial, sans-serif' }
const container = { padding: '32px 24px', maxWidth: '560px' }
const brand = {
  fontSize: '20px',
  fontWeight: 'bold',
  color: '#111111',
  margin: '0 0 24px',
}
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
  margin: '0 0 18px',
}
const strong = { color: '#111111' }
const cta = { margin: '0 0 24px' }
const button = {
  backgroundColor: '#000000',
  color: '#ffffff',
  fontSize: '14px',
  border: '1px solid #000000',
  borderRadius: '12px',
  padding: '12px 20px',
  textDecoration: 'none',
}
const footer = {
  fontSize: '12px',
  color: '#9a9a9a',
  lineHeight: '1.5',
  margin: '0',
}
