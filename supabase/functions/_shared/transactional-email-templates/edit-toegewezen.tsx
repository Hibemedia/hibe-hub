/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

import type { TemplateEntry } from './registry.ts'

interface EditToegewezenProps {
  name?: string
  editTitle?: string
  clientName?: string
  plannedDate?: string
  deadline?: string
  driveLink?: string
  editsUrl?: string
}

const EditToegewezen = ({
  name,
  editTitle,
  clientName,
  plannedDate,
  deadline,
  driveLink,
  editsUrl,
}: EditToegewezenProps) => (
  <Html lang="nl" dir="ltr">
    <Head />
    <Preview>
      {editTitle ? `Edit voor jou: ${editTitle}` : 'Edit voor jou'}
    </Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>HIBE</Text>
        <Heading style={h1}>Edit voor jou</Heading>
        <Text style={text}>
          {name ? `Hi ${name},` : 'Hi,'} deze edit is aan jou toegewezen:{' '}
          <strong style={strong}>{editTitle ?? 'naam volgt'}</strong>
          {clientName ? ` voor ${clientName}` : ''}.
        </Text>
        {plannedDate || deadline ? (
          <Text style={text}>
            {plannedDate ? `Montage gepland op ${plannedDate}.` : ''}
            {plannedDate && deadline ? ' ' : ''}
            {deadline ? `Deadline ${deadline}.` : ''}
          </Text>
        ) : null}
        {driveLink ? (
          <Text style={text}>
            Het materiaal staat in{' '}
            <Link href={driveLink} style={link}>
              Google Drive
            </Link>
            .
          </Text>
        ) : null}
        {editsUrl ? (
          <Section style={cta}>
            <Button style={button} href={editsUrl}>
              Ga naar de edits
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
  component: EditToegewezen,
  subject: (data: Record<string, any>) =>
    `Edit voor jou: ${data.editTitle ?? 'nieuwe edit'}`,
  displayName: 'Edit toegewezen',
  previewData: {
    name: 'Jane',
    editTitle: 'Reel lancering zomercollectie',
    clientName: 'VIP Fashion',
    plannedDate: 'maandag 17 november',
    deadline: 'donderdag 20 november',
    driveLink: 'https://drive.google.com/',
    editsUrl: 'https://hibespace.com/hibe/edits',
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
const link = { color: 'inherit', textDecoration: 'underline' }
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
