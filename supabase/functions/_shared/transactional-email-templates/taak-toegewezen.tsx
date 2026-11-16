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

interface TaakToegewezenProps {
  name?: string
  taskTitle?: string
  clientName?: string
  dueDate?: string
  dueTime?: string
  notes?: string
  tasksUrl?: string
}

const TaakToegewezen = ({
  name,
  taskTitle,
  clientName,
  dueDate,
  dueTime,
  notes,
  tasksUrl,
}: TaakToegewezenProps) => (
  <Html lang="nl" dir="ltr">
    <Head />
    <Preview>
      {taskTitle ? `Taak voor jou: ${taskTitle}` : 'Taak voor jou'}
    </Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>HIBE</Text>
        <Heading style={h1}>Taak voor jou</Heading>
        <Text style={text}>
          {name ? `Hi ${name},` : 'Hi,'} deze taak staat op jouw naam:{' '}
          <strong style={strong}>{taskTitle ?? 'naam volgt'}</strong>
          {clientName ? ` voor ${clientName}` : ''}.
        </Text>
        {dueDate ? (
          <Text style={text}>
            Ingepland op {dueDate}
            {dueTime ? ` om ${dueTime}` : ''}.
          </Text>
        ) : (
          <Text style={text}>Nog geen datum ingepland.</Text>
        )}
        {notes ? <Text style={note}>{notes}</Text> : null}
        {tasksUrl ? (
          <Section style={cta}>
            <Button style={button} href={tasksUrl}>
              Bekijk je taken
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
  component: TaakToegewezen,
  subject: (data: Record<string, any>) =>
    `Taak voor jou: ${data.taskTitle ?? 'nieuwe taak'}`,
  displayName: 'Taak toegewezen',
  previewData: {
    name: 'Jane',
    taskTitle: 'Script schrijven voor shoot',
    clientName: 'VIP Fashion',
    dueDate: 'dinsdag 18 november',
    dueTime: '10:00',
    notes: 'Vooraf afstemmen met de klant.',
    tasksUrl: 'https://hibespace.com/hibe/taken',
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
const note = {
  fontSize: '14px',
  color: '#111111',
  lineHeight: '1.5',
  margin: '0 0 18px',
  padding: '12px 14px',
  backgroundColor: '#F4F4F2',
  borderRadius: '8px',
}
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
