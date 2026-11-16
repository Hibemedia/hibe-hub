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
        <Heading style={s.h1}>Je hebt feedback gekregen</Heading>
        <Text style={s.text}>
          {name ? `Hi ${name},` : 'Hi,'} er is nieuwe feedback binnengekomen
          waar jij als editor op staat. Open de video om de opmerkingen te
          bekijken en een nieuwe versie te maken.
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
