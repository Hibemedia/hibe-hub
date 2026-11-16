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
    <Body style={s.main}>
      <Container style={s.card}>
        <Row>
          <Column>
            <Text style={s.brand}>HIBE</Text>
          </Column>
          <Column align="right">
            <Text style={s.pill}>Taak</Text>
          </Column>
        </Row>
        <Heading style={s.h1}>Taak voor jou</Heading>
        <Text style={s.text}>
          {name ? `Hi ${name},` : 'Hi,'} deze taak staat op jouw naam.
        </Text>
        <Section style={s.infoCard}>
          <Text style={s.infoLabel}>Taak</Text>
          <Text style={s.infoValue}>{taskTitle ?? 'Naam volgt'}</Text>
          {clientName ? (
            <>
              <Text style={s.infoLabel}>Klant</Text>
              <Text style={s.infoValue}>{clientName}</Text>
            </>
          ) : null}
          <Text style={s.infoLabel}>Ingepland</Text>
          <Text style={s.infoValueLast}>
            {dueDate ? `${dueDate}${dueTime ? ` om ${dueTime}` : ''}` : 'Nog geen datum'}
          </Text>
        </Section>
        {notes ? <Text style={s.note}>{notes}</Text> : null}
        {tasksUrl ? (
          <Section style={s.cta}>
            <Button style={s.button} href={tasksUrl}>
              Bekijk je taken
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
