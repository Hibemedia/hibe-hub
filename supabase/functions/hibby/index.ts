import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { authenticateCronRequest } from '../_shared/cron-auth.ts'

export const HIBBY_ID = '00000000-0000-4000-8000-00000000b1bb'
const URL_ = Deno.env.get('SUPABASE_URL')!
const admin = () => createClient(URL_, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
const ams = (d: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Amsterdam', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d)
const amsHour = () => Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Amsterdam', hour: '2-digit', hourCycle: 'h23' }).format(new Date()))
const STATUS: Record<string, string> = { internal_review: 'Interne controle', feedback: 'Feedback verwerken', approved_internal: 'CapCut (goedgekeurd intern)', ready_for_client: 'Mag naar klant', client_review: 'Ter controle bij klant', approved_client: 'Goedgekeurd (klant)', scheduled: 'Ingepland' }

async function infoRoom(db: any) {
  const { data } = await db.from('chat_rooms').select('id').eq('kind', 'channel').eq('name', 'Informatie').limit(1).maybeSingle()
  return data?.id as string | undefined
}

async function context(db: any) {
  const today = new Date(); const from = ams(new Date(today.getTime() - 7 * 864e5)); const to = ams(new Date(today.getTime() + 28 * 864e5))
  const [clients, users, moments, crew, edits, videos] = await Promise.all([
    db.from('clients').select('id,name'),
    db.from('users').select('id,full_name,email'),
    db.from('content_moments').select('id,client_id,title,type,date,start_time,location,status').gte('date', from).lte('date', to).order('date'),
    db.from('moment_crew').select('moment_id,user_id,role'),
    db.from('edits').select('title,client_id,editor_id,status,deadline').neq('status', 'delivered').order('deadline', { nullsFirst: false }),
    db.from('video_items').select('title,client_id,status').is('archived_at', null).neq('status', 'archived'),
  ])
  const cn = (id: string) => clients.data?.find((c: any) => c.id === id)?.name ?? 'onbekende klant'
  const un = (id: string | null) => { const u = users.data?.find((x: any) => x.id === id); return u ? (u.full_name || u.email.split('@')[0]) : 'niemand' }
  const lines: string[] = [`Vandaag: ${ams(today)} (${today.toLocaleDateString('nl-NL', { weekday: 'long', timeZone: 'Europe/Amsterdam' })})`, '', 'CONTENTMOMENTEN / DRAAIDAGEN (afgelopen week t/m 4 weken vooruit):']
  for (const m of moments.data ?? []) {
    const c = (crew.data ?? []).filter((x: any) => x.moment_id === m.id).map((x: any) => un(x.user_id) + (x.role ? ` (${x.role})` : ''))
    lines.push(`- ${m.date}${m.start_time ? ' ' + String(m.start_time).slice(0, 5) : ''} | ${cn(m.client_id)} | ${m.title} | type ${m.type} | status ${m.status}${m.location ? ' | ' + m.location : ''} | crew: ${c.length ? c.join(', ') : 'nog niemand'}`)
  }
  if (!moments.data?.length) lines.push('- geen')
  lines.push('', 'OPENSTAANDE EDITS:')
  for (const e of edits.data ?? []) lines.push(`- ${cn(e.client_id)} | ${e.title} | editor ${un(e.editor_id)} | ${({ assign: 'Editor aanwijzen', todo: 'To-do', editing: 'Wordt gemonteerd', on_hold: 'On hold' } as any)[e.status] ?? e.status} | deadline ${e.deadline ?? 'geen'}`)
  if (!edits.data?.length) lines.push('- geen')
  lines.push('', "VIDEO'S IN MEDIA MANAGEMENT (niet gearchiveerd):")
  for (const v of videos.data ?? []) lines.push(`- ${cn(v.client_id)} | ${v.title} | ${STATUS[v.status] ?? v.status}`)
  if (!videos.data?.length) lines.push('- geen')
  return lines.join('\n')
}

const SYSTEM = `Je bent Hibby, de vrolijke maar to-the-point assistent van videobureau HIBE Media. Je praat Nederlands, informeel (je/jij), kort en duidelijk, zonder emoji en zonder markdown-opmaak (geen sterretjes of kopjes; gewone tekst met streepjes voor lijstjes). Elk gebruikersbericht begint met de naam van de afzender, gevolgd door een dubbele punt. Je weet dus altijd wie iets vraagt: spreek die persoon bij de voornaam aan en houd de namen van verschillende sprekers uit elkaar. Je beantwoordt vragen over de werkzaamheden (draaidagen/contentmomenten, edits, video's en hun status) uitsluitend op basis van de meegegeven gegevens. Staat iets er niet in, zeg dat eerlijk. Gebruik korte lijstjes met datums als dag + datum (bijv. "di 12 nov").`

async function agendaContext(db: any) {
  const today = new Date(); const from = ams(today); const to = ams(new Date(today.getTime() + 42 * 864e5))
  const [ev, att, tasks, users, clients] = await Promise.all([
    db.from('calendar_events').select('id,kind,title,start_date,end_date,start_time,end_time,person_id').lte('start_date', to).gte('end_date', from).order('start_date'),
    db.from('calendar_attendees').select('event_id,user_id'),
    db.from('tasks').select('title,assignee_id,due_date,due_time,client_id').is('done_at', null).order('due_date', { nullsFirst: false }),
    db.from('users').select('id,full_name,email'),
    db.from('clients').select('id,name').is('archived_at', null),
  ])
  const un = (id: string | null) => { const u = users.data?.find((x: any) => x.id === id); return u ? (u.full_name || u.email.split('@')[0]) : 'niemand' }
  const l = ['', 'AGENDA (afspraken en vakanties, komende 6 weken):']
  for (const e of ev.data ?? []) {
    const who = [e.person_id, ...(att.data ?? []).filter((a: any) => a.event_id === e.id).map((a: any) => a.user_id)].filter(Boolean).map(un)
    l.push(`- ${e.start_date}${e.end_date !== e.start_date ? ' t/m ' + e.end_date : ''}${e.start_time ? ' ' + String(e.start_time).slice(0, 5) + (e.end_time ? '-' + String(e.end_time).slice(0, 5) : '') : ''} | ${e.kind === 'vacation' ? 'VAKANTIE' : 'afspraak'} | ${e.title} | ${who.join(', ') || 'iedereen'}`)
  }
  if (!ev.data?.length) l.push('- geen')
  l.push('', 'OPEN TAKEN:')
  for (const t of tasks.data ?? []) l.push(`- ${t.due_date ?? 'geen datum'}${t.due_time ? ' ' + String(t.due_time).slice(0, 5) : ''} | ${t.title} | voor ${un(t.assignee_id)}`)
  l.push('', 'TEAMLEDEN (id = naam):', ...(users.data ?? []).map((u: any) => `- ${u.id} = ${un(u.id)}`))
  l.push('', 'ACTIEVE KLANTEN (id = naam):', ...(clients.data ?? []).map((c: any) => `- ${c.id} = ${c.name}`))
  return l.join('\n')
}

const TOOLS = [
  { type: 'function', name: 'create_task', description: 'Maak een taak aan in de takenlijst.', parameters: { type: 'object', additionalProperties: false, required: ['title', 'assignee_id', 'due_date', 'due_time', 'client_id', 'notes'], properties: { title: { type: 'string' }, assignee_id: { type: 'string', description: 'id van teamlid; standaard de vrager' }, due_date: { type: ['string', 'null'], description: 'YYYY-MM-DD' }, due_time: { type: ['string', 'null'], description: 'HH:MM' }, client_id: { type: ['string', 'null'] }, notes: { type: ['string', 'null'] } } } },
  { type: 'function', name: 'create_calendar_event', description: 'Zet een afspraak (meeting) of vakantie in de HIBE-agenda.', parameters: { type: 'object', additionalProperties: false, required: ['kind', 'title', 'start_date', 'end_date', 'start_time', 'end_time', 'location', 'attendee_ids'], properties: { kind: { type: 'string', enum: ['meeting', 'vacation'] }, title: { type: 'string' }, start_date: { type: 'string' }, end_date: { type: 'string' }, start_time: { type: ['string', 'null'] }, end_time: { type: ['string', 'null'] }, location: { type: ['string', 'null'] }, attendee_ids: { type: 'array', items: { type: 'string' } } } } },
  { type: 'function', name: 'create_shoot_day', description: 'Plan een draaidag/contentmoment voor een klant in.', parameters: { type: 'object', additionalProperties: false, required: ['client_id', 'title', 'date', 'start_time', 'location', 'status', 'crew_ids'], properties: { client_id: { type: 'string' }, title: { type: 'string' }, date: { type: 'string' }, start_time: { type: ['string', 'null'] }, location: { type: ['string', 'null'] }, status: { type: 'string', enum: ['bevestigd', 'aangevraagd'], description: 'bevestigd = vast, aangevraagd = in optie' }, crew_ids: { type: 'array', items: { type: 'string' } } } } },
]

async function runTool(udb: any, me: string, name: string, a: any) {
  const nz = (v: any) => (v === '' || v === undefined ? null : v)
  if (name === 'create_task') {
    const { data, error } = await udb.from('tasks').insert({ title: a.title, assignee_id: a.assignee_id || me, due_date: nz(a.due_date), due_time: nz(a.due_time), client_id: nz(a.client_id), notes: nz(a.notes), created_by: me }).select('id').single()
    return error ? { ok: false, error: error.message } : { ok: true, id: data.id }
  }
  if (name === 'create_calendar_event') {
    const { data, error } = await udb.from('calendar_events').insert({ kind: a.kind, title: a.title, start_date: a.start_date, end_date: a.end_date || a.start_date, start_time: nz(a.start_time), end_time: nz(a.end_time), location: nz(a.location), person_id: a.kind === 'vacation' ? (a.attendee_ids?.[0] || me) : null, created_by: me }).select('id').single()
    if (error) return { ok: false, error: error.message }
    const ids = [...new Set<string>(a.kind === 'meeting' ? [me, ...(a.attendee_ids ?? [])] : [])]
    if (ids.length) await udb.from('calendar_attendees').insert(ids.map((user_id) => ({ event_id: data.id, user_id, invited_by: me, seen_at: user_id === me ? new Date().toISOString() : null })))
    return { ok: true, id: data.id }
  }
  if (name === 'create_shoot_day') {
    const { data, error } = await udb.from('content_moments').insert({ client_id: a.client_id, title: a.title, type: 'shoot', date: a.date, start_time: nz(a.start_time), location: nz(a.location), status: a.status || 'bevestigd', attendees: [], requested_by: me }).select('id').single()
    if (error) return { ok: false, error: error.message }
    if (a.crew_ids?.length) await udb.from('moment_crew').insert(a.crew_ids.map((user_id: string) => ({ moment_id: data.id, user_id, created_by: me })))
    return { ok: true, id: data.id }
  }
  return { ok: false, error: 'onbekende actie' }
}

const AGENT = `Je bent nu de persoonlijke assistent van deze ene persoon (een privégesprek). Je kunt ook echt dingen regelen met je acties: taken aanmaken, afspraken of vakanties in de agenda zetten en draaidagen inplannen. Doe dat meteen als de vraag duidelijk is; vraag alleen door als iets essentieels ontbreekt (bijv. welke klant of welke datum). Vragen als "wanneer kan ik ..." beantwoord je door de agenda, vakanties, draaidagen en taken te bekijken en 2-3 concrete vrije momenten voor te stellen. Gebruik altijd de id's uit de lijsten. Bevestig na een actie kort wat je hebt vastgelegd (wat, wanneer, voor wie). Zeg nooit dat iets is gelukt als de actie een fout gaf.`

async function agent(input: any[], data: string, udb: any, me: string) {
  for (let i = 0; i < 6; i++) {
    const res = await fetch('https://ai.gateway.lovable.dev/v1/responses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Lovable-API-Key': Deno.env.get('LOVABLE_API_KEY')!, 'X-Lovable-AIG-SDK': 'fetch' },
      body: JSON.stringify({ model: 'openai/gpt-6-astra', store: false, reasoning: { effort: 'low' }, instructions: `${SYSTEM}\n\n${AGENT}\n\nGEGEVENS:\n${data}`, input, tools: TOOLS }),
    })
    if (!res.ok) { const t = await res.text(); throw Object.assign(new Error(t.slice(0, 300)), { status: res.status }) }
    const out = (await res.json()).output ?? []
    const calls = out.filter((o: any) => o.type === 'function_call')
    if (!calls.length) return out.filter((o: any) => o.type === 'message').flatMap((m: any) => m.content ?? []).map((c: any) => c.text ?? '').join('').trim()
    input.push(...calls)
    for (const c of calls) {
      let args: any = {}; try { args = JSON.parse(c.arguments) } catch { /* bad args */ }
      input.push({ type: 'function_call_output', call_id: c.call_id, output: JSON.stringify(await runTool(udb, me, c.name, args)) })
    }
  }
  return 'Dat lukte niet in één keer, probeer het iets specifieker.'
}

async function ask(messages: { role: 'user' | 'assistant'; content: string }[], data: string) {
  const res = await fetch('https://ai.gateway.lovable.dev/v1/responses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Lovable-API-Key': Deno.env.get('LOVABLE_API_KEY')!, 'X-Lovable-AIG-SDK': 'fetch' },
    body: JSON.stringify({ model: 'openai/gpt-6-astra', stream: true, store: false, reasoning: { effort: 'low' }, instructions: `${SYSTEM}\n\nGEGEVENS:\n${data}`, input: messages }),
  })
  if (!res.ok || !res.body) { const t = await res.text(); throw Object.assign(new Error(t.slice(0, 300)), { status: res.status }) }
  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader(); let buf = '', out = ''
  for (;;) {
    const { value, done } = await reader.read(); if (done) break
    buf += value; const parts = buf.split('\n'); buf = parts.pop() ?? ''
    for (const l of parts) {
      if (!l.startsWith('data:')) continue
      try { const e = JSON.parse(l.slice(5)); if (e.type === 'response.output_text.delta') out += e.delta } catch { /* skip */ }
    }
  }
  return out.trim()
}

const post = (db: any, room_id: string, body: string) => db.from('chat_messages').insert({ room_id, user_id: HIBBY_ID, body, mentions: [] })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  const db = admin()
  const auth = req.headers.get('authorization') ?? ''
  let body: any = {}; try { body = await req.json() } catch { /* empty */ }

  if (body.mode === 'weekly') {
    const fail = authenticateCronRequest(req); if (fail) return fail
    if (!body.force && amsHour() !== 8) return json({ skipped: 'not 08:00 Amsterdam' })
    const room = await infoRoom(db); if (!room) return json({ error: 'no room' }, 404)
    const text = await ask([{ role: 'user', content: 'Het is maandagochtend. Geef het team een weekoverzicht voor deze week (maandag t/m zondag): draaidagen met klant, tijd, locatie en crew (meld als er nog niemand is ingepland), edits met deadline deze week of te laat, en welke video\'s wachten op actie. Begin met "Goedemorgen team, zo ziet de week eruit:".' }], await context(db))
    await post(db, room, text)
    return json({ ok: true })
  }

  // ask mode: signed-in HIBE admin
  const user = createClient(URL_, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: auth } } })
  const { data: u } = await user.auth.getUser(auth.replace('Bearer ', ''))
  if (!u?.user) return json({ error: 'Niet ingelogd' }, 401)
  const { data: isAdmin } = await db.rpc('has_role', { _user_id: u.user.id, _role: 'admin' })
  if (!isAdmin) return json({ error: 'Geen toegang' }, 403)
  const info = await infoRoom(db)
  const { data: own } = await db.from('chat_rooms').select('id,kind').eq('id', body.room_id ?? '').maybeSingle()
  const { data: mem } = await db.from('chat_members').select('user_id').eq('room_id', body.room_id ?? '')
  const personal = own?.kind === 'hibby' && mem?.length === 1 && mem[0].user_id === u.user.id
  const room = body.room_id as string
  if (!personal && room !== info) return json({ error: 'Hibby werkt alleen in Informatie of je eigen Hibby-gesprek' }, 400)
  const { data: hist } = await db.from('chat_messages').select('user_id,body').eq('room_id', room).order('created_at', { ascending: false }).limit(20)
  const { data: names } = await db.from('users').select('id,full_name,email')
  const nameOf = (id: string) => { const x = names?.find((n: any) => n.id === id); return x ? (x.full_name || x.email.split('@')[0]) : 'iemand' }
  const msgs = (hist ?? []).reverse().filter((m: any) => m.body).map((m: any) => m.user_id === HIBBY_ID
    ? { role: 'assistant', content: m.body }
    : { role: 'user', content: `${nameOf(m.user_id)}: ${m.body}` }) as any
  msgs.push({ role: 'user', content: `[De laatste vraag komt van ${nameOf(u.user.id)}. Spreek deze persoon bij de voornaam aan.]` })
  try {
    const text = personal ? await agent(msgs, (await context(db)) + (await agendaContext(db)), user, u.user.id) : await ask(msgs, await context(db))
    await post(db, room, text || 'Ik kon daar even geen antwoord op vinden.')
    return json({ ok: true })
  } catch (e: any) {
    const s = e.status === 402 ? 'De AI-tegoeden zijn op. Vul ze aan om Hibby weer te laten antwoorden.' : e.status === 429 ? 'Hibby is even druk, probeer het zo nog eens.' : 'Hibby kon nu niet antwoorden.'
    await post(db, room, s)
    return json({ error: s }, e.status ?? 500)
  }
})
