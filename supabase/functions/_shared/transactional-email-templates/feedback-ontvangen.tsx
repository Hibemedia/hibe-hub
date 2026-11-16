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

interface FeedbackOntvangenProps {
  name?: string
  videoTitle?: string
  clientName?: string
  feedbackUrl?: string
}

const FeedbackOntvangen = ({
  name,
  videoTitle,
  clientName,
  feedbackUrl,
}: FeedbackOntvangenProps) => (
  <Html lang="nl" dir="ltr">
    <Head />
    <Preview>
      {videoTitle ? `Nieuwe feedback op ${videoTitle}` : 'Nieuwe feedback voor jou'}
    </Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>HIBE</Text>
        <Heading style={h1}>Je hebt feedback gekregen</Heading>
        <Text style={text}>
          {name ? `Hi ${name},` : 'Hi,'} er is nieuwe feedback binnengekomen
          op{' '}
          <strong style={strong}>
            {videoTitle ?? 'een video'}
          </strong>
          {clientName ? ` voor ${clientName}` : ''} — jij staat daar als
          editor op.
        </Text>
        <Text style={text}>
          Open de video om de opmerkingen te bekijken en een nieuwe versie te
          maken.
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
  component: FeedbackOntvangen,
  subject: (data: Record<string, any>) =>
    `Je hebt feedback gekregen: ${data.videoTitle ?? 'een video'}`,
  displayName: 'Feedback ontvangen',
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
