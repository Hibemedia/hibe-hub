import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { authenticateCronRequest } from '../_shared/cron-auth.ts'

export const HIBBY_ID = '00000000-0000-4000-8000-00000000b1bb'
const URL_ = Deno.env.get('SUPABASE_URL')!
const admin = () => createClient(URL_, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
const ams = (d: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Amsterdam', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d)
const amsHour = () => Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Amsterdam', hour: '2-digit', hourCycle: 'h23' }).format(new Date()))
const STATUS: Record<string, string> = { internal_review: 'Interne controle', feedback: 'Feedback verwerken', approved_internal: 'Goedgekeurd (intern)', ready_for_client: 'Mag naar klant', client_review: 'Ter controle bij klant', client_approved: 'Goedgekeurd (klant)', scheduled: 'Ingepland' }

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
    db.from('edits').select('title,client_id,editor_id,status,deadline').neq('status', 'Ingeleverd').order('deadline', { nullsFirst: false }),
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
  for (const e of edits.data ?? []) lines.push(`- ${cn(e.client_id)} | ${e.title} | editor ${un(e.editor_id)} | ${e.status} | deadline ${e.deadline ?? 'geen'}`)
  if (!edits.data?.length) lines.push('- geen')
  lines.push('', "VIDEO'S IN MEDIA MANAGEMENT (niet gearchiveerd):")
  for (const v of videos.data ?? []) lines.push(`- ${cn(v.client_id)} | ${v.title} | ${STATUS[v.status] ?? v.status}`)
  if (!videos.data?.length) lines.push('- geen')
  return lines.join('\n')
}

const SYSTEM = `Je bent Hibby, de vrolijke maar to-the-point assistent van videobureau HIBE Media. Je praat Nederlands, informeel (je/jij), kort en duidelijk, zonder emoji. Je beantwoordt vragen over de werkzaamheden (draaidagen/contentmomenten, edits, video's en hun status) uitsluitend op basis van de meegegeven gegevens. Staat iets er niet in, zeg dat eerlijk. Gebruik korte lijstjes met datums als dag + datum (bijv. "di 12 nov").`

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
  const room = await infoRoom(db)
  if (!room || body.room_id !== room) return json({ error: 'Hibby werkt alleen in Informatie' }, 400)
  const { data: hist } = await db.from('chat_messages').select('user_id,body').eq('room_id', room).order('created_at', { ascending: false }).limit(20)
  const msgs = (hist ?? []).reverse().filter((m: any) => m.body).map((m: any) => ({ role: m.user_id === HIBBY_ID ? 'assistant' : 'user', content: m.body })) as any
  try {
    const text = await ask(msgs, await context(db))
    await post(db, room, text || 'Ik kon daar even geen antwoord op vinden.')
    return json({ ok: true })
  } catch (e: any) {
    const s = e.status === 402 ? 'De AI-tegoeden zijn op. Vul ze aan om Hibby weer te laten antwoorden.' : e.status === 429 ? 'Hibby is even druk, probeer het zo nog eens.' : 'Hibby kon nu niet antwoorden.'
    await post(db, room, s)
    return json({ error: s }, e.status ?? 500)
  }
})
