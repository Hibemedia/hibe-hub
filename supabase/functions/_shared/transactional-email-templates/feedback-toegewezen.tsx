/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Row,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

import type { TemplateEntry } from './registry.ts'
import * as s from './mail-styles.ts'

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
    <Body style={s.main}>
      <Container style={s.card}>
        <Row>
          <Column>
            <Text style={s.brand}>HIBE</Text>
          </Column>
          <Column align="right">
            <Text style={s.pill}>Feedback</Text>
          </Column>
        </Row>
        <Heading style={s.h1}>Feedback voor jou</Heading>
        <Text style={s.text}>
          {name ? `Hi ${name},` : 'Hi,'} je bent als editor gekoppeld aan
          feedback op een video. De feedback staat bij die video klaar — open
          de video om te zien wat er aangepast moet worden.
        </Text>
        <Section style={s.infoCard}>
          <Text style={s.infoLabel}>Video</Text>
          <Text style={clientName ? s.infoValue : s.infoValueLast}>
            {videoTitle ?? 'Naam volgt'}
          </Text>
          {clientName ? (
            <>
              <Text style={s.infoLabel}>Klant</Text>
              <Text style={s.infoValueLast}>{clientName}</Text>
            </>
          ) : null}
        </Section>
        {feedbackUrl ? (
          <Section style={s.cta}>
            <Button style={s.button} href={feedbackUrl}>
              Bekijk de feedback
            </Button>
          </Section>
        ) : null}
        <Text style={s.footer}>
          Verwachtte je deze melding niet? Geef het even door, dan kijken we
          ernaar.
        </Text>
      </Container>
      <Text style={s.footerBrand}>HIBE · hibespace.com</Text>
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
