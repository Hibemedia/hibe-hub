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
  Link,
  Preview,
  Row,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

import type { TemplateEntry } from './registry.ts'
import * as s from './mail-styles.ts'

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
    <Body style={s.main}>
      <Container style={s.card}>
        <Row>
          <Column>
            <Text style={s.brand}>HIBE</Text>
          </Column>
          <Column align="right">
            <Text style={s.pill}>Edit</Text>
          </Column>
        </Row>
        <Heading style={s.h1}>Edit voor jou</Heading>
        <Text style={s.text}>
          {name ? `Hi ${name},` : 'Hi,'} deze edit is aan jou toegewezen.
        </Text>
        <Section style={s.infoCard}>
          <Text style={s.infoLabel}>Edit</Text>
          <Text style={s.infoValue}>{editTitle ?? 'Naam volgt'}</Text>
          {clientName ? (
            <>
              <Text style={s.infoLabel}>Klant</Text>
              <Text style={s.infoValue}>{clientName}</Text>
            </>
          ) : null}
          {plannedDate ? (
            <>
              <Text style={s.infoLabel}>Montage</Text>
              <Text style={s.infoValue}>{plannedDate}</Text>
            </>
          ) : null}
          {deadline ? (
            <>
              <Text style={s.infoLabel}>Deadline</Text>
              <Text style={s.infoValueLast}>{deadline}</Text>
            </>
          ) : null}
        </Section>
        {driveLink ? (
          <Text style={s.text}>
            Het materiaal staat in{' '}
            <Link href={driveLink} style={s.link}>
              Google Drive
            </Link>
            .
          </Text>
        ) : null}
        {editsUrl ? (
          <Section style={s.cta}>
            <Button style={s.button} href={editsUrl}>
              Ga naar de edits
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
