// Personal iCal feed for the HIBE agenda: a phone or Mac subscribes to
// /functions/v1/agenda-ics?key=<token> and gets the agenda it may see.
// The token lives in public.agenda_feeds (own row only, admins create it), so
// no login is needed on the phone while access still follows the person.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { buildIcs, feedScope, type IcsEvent } from '../_shared/ics.ts'

const URL_ = Deno.env.get('SUPABASE_URL')!
const KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const db = () => createClient(URL_, KEY)

const amsDay = (d: Date) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Amsterdam', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d)
const hhmm = (t: string | null | undefined) => (t ? String(t).slice(0, 5) : null)
const plain = (body: string, status: number) =>
  new Response(body, { status, headers: { ...corsHeaders, 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' } })

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders })
  if (req.method !== 'GET') return plain('De agenda-koppeling is alleen om te lezen.', 405)

  try {
    const url = new URL(req.url)
    const pathToken = url.pathname.split('/').filter(Boolean).pop() ?? ''
    const key = url.searchParams.get('key') ?? (/^[0-9a-f]{32,64}$/i.test(pathToken) ? pathToken : '')
    if (!key) return plain('Geen agenda-koppeling opgegeven.', 400)

    const client = db()
    const { data: feed, error: feedError } = await client.from('agenda_feeds').select('user_id,scope').eq('token', key).maybeSingle()
    if (feedError) return plain('De agenda-koppeling kan nu niet worden gelezen.', 500)
    if (!feed?.user_id) return plain('Deze agenda-koppeling bestaat niet meer. Maak een nieuwe koppeling in de HIBE-agenda.', 404)
    const me = feed.user_id as string

    const { data: adminRow } = await client.from('user_roles').select('role').eq('user_id', me).eq('role', 'admin').maybeSingle()
    const isAdmin = !!adminRow
    // A feed only lives as long as its person is still a HIBE admin: leaving the
    // team stops the address on the phone without anyone having to remember it.
    if (!isAdmin) return plain('Deze agenda-koppeling is niet meer actief. Maak een nieuwe koppeling in de HIBE-agenda.', 404)
    const scope = feedScope(feed.scope, isAdmin)

    const now = new Date()
    const from = amsDay(new Date(now.getTime() - 60 * 864e5))
    const to = amsDay(new Date(now.getTime() + 365 * 864e5))

    // What counts as "mine" for this person: meetings they are invited to,
    // shoot days they are on crew for.
    let eventIds: string[] = []
    let momentIds: string[] = []
    if (scope === 'me') {
      const [att, crew] = await Promise.all([
        client.from('calendar_attendees').select('event_id').eq('user_id', me),
        client.from('moment_crew').select('moment_id').eq('user_id', me),
      ])
      eventIds = (att.data ?? []).map((r: any) => r.event_id)
      momentIds = (crew.data ?? []).map((r: any) => r.moment_id)
    }

    const evq = client.from('calendar_events').select('*').lte('start_date', to).gte('end_date', from)
    if (scope === 'me') {
      const parts = [`person_id.eq.${me}`]
      if (eventIds.length) parts.push(`id.in.(${eventIds.join(',')})`)
      evq.or(parts.join(','))
    }
    const moq = client
      .from('content_moments')
      .select('id,client_id,title,date,start_time,location,notes,status,requested_by,crew:moment_crew(user_id)')
      .gte('date', from)
      .lte('date', to)
    if (scope === 'me') {
      const parts = [`requested_by.eq.${me}`]
      if (momentIds.length) parts.push(`id.in.(${momentIds.join(',')})`)
      moq.or(parts.join(','))
    }
    const tq = client.from('tasks').select('*').is('done_at', null).not('due_date', 'is', null).gte('due_date', from).lte('due_date', to)
    if (scope === 'me') tq.eq('assignee_id', me)
    const edq = client
      .from('edits')
      .select('id,title,client_id,editor_id,planned_date,notes,status')
      .not('planned_date', 'is', null)
      .neq('status', 'delivered')
      .gte('planned_date', from)
      .lte('planned_date', to)
    if (scope === 'me') edq.eq('editor_id', me)

    const [ev, mo, tk, ed, cl, us] = await Promise.all([
      evq,
      moq,
      tq,
      edq,
      client.from('clients').select('id,name'),
      client.from('users').select('id,full_name,first_name,last_name,email'),
    ])

    const cn = (id: string | null) => cl.data?.find((c: any) => c.id === id)?.name ?? 'Klant'
    const un = (id: string | null | undefined) => {
      const u = us.data?.find((x: any) => x.id === id)
      if (!u) return 'teamlid'
      return u.full_name || [u.first_name, u.last_name].filter(Boolean).join(' ') || String(u.email ?? '').split('@')[0] || 'teamlid'
    }

    const events: IcsEvent[] = []
    for (const m of mo.data ?? []) {
      if (!m.date || m.status === 'cancelled' || m.status === 'geannuleerd') continue
      const tentative = m.status !== 'bevestigd' && m.status !== 'confirmed'
      const crew = (m.crew ?? []).map((c: any) => un(c.user_id))
      events.push({
        uid: `hibe-shoot-${m.id}@hibespace.com`,
        title: `${cn(m.client_id)} · ${m.title}${tentative ? ' (in optie)' : ''}`,
        start: m.date,
        end: m.date,
        startTime: hhmm(m.start_time),
        location: m.location,
        description: [m.notes, crew.length ? `Crew: ${crew.join(', ')}` : ''].filter(Boolean).join('\n'),
        category: 'Draaidag',
        tentative,
      })
    }
    for (const e of ev.data ?? []) {
      const vac = e.kind === 'vacation'
      events.push({
        uid: `hibe-${vac ? 'vacation' : 'meeting'}-${e.id}@hibespace.com`,
        title: vac ? `${un(e.person_id)} · ${e.title}` : e.title,
        start: e.start_date,
        end: e.end_date,
        startTime: e.end_date > e.start_date ? null : hhmm(e.start_time),
        endTime: hhmm(e.end_time),
        location: e.location,
        description: e.notes,
        category: vac ? 'Vrij' : 'Meeting',
        transparent: vac,
      })
    }
    for (const t of tk.data ?? []) {
      events.push({
        uid: `hibe-task-${t.id}@hibespace.com`,
        title: scope === 'team' ? `${un(t.assignee_id)}: ${t.title}` : t.title,
        start: t.due_date,
        end: t.due_date,
        startTime: hhmm(t.due_time),
        description: [t.notes, `Voor ${un(t.assignee_id)}`].filter(Boolean).join('\n'),
        category: 'Taak',
      })
    }
    for (const e of ed.data ?? []) {
      events.push({
        uid: `hibe-edit-${e.id}@hibespace.com`,
        title: `${cn(e.client_id)} · ${e.title}`,
        start: e.planned_date,
        end: e.planned_date,
        description: [e.notes, 'Montagedag'].filter(Boolean).join('\n'),
        category: 'Montage',
      })
    }
    events.sort((a, b) => (a.start === b.start ? a.title.localeCompare(b.title) : a.start < b.start ? -1 : 1))

    const ics = buildIcs(events, { name: scope === 'team' ? 'HIBE Agenda (team)' : `HIBE Agenda · ${un(me)}`, stamp: new Date().toISOString() })
    return new Response(ics, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/calendar; charset=utf-8',
        'Cache-Control': 'no-store',
        'Content-Disposition': 'inline',
      },
    })
  } catch {
    return plain('De agenda-koppeling is mislukt. Probeer het later opnieuw.', 500)
  }
})
