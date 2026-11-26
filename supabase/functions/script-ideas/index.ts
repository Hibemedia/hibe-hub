import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

const URL_ = Deno.env.get('SUPABASE_URL')!
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

const SCHEMA = {
  type: 'object', additionalProperties: false, required: ['trends', 'ideas'],
  properties: {
    trends: { type: 'array', items: { type: 'string' } },
    ideas: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['title', 'trend', 'hook', 'script'],
      properties: { title: { type: 'string' }, trend: { type: 'string' }, hook: { type: 'string' }, script: { type: 'string' } } } },
  },
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  const auth = req.headers.get('Authorization') ?? ''
  const user = createClient(URL_, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: auth } } })
  const { data: u } = await user.auth.getUser(auth.replace('Bearer ', ''))
  if (!u?.user) return json({ error: 'Niet ingelogd' }, 401)
  const db = createClient(URL_, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const { data: isAdmin } = await db.rpc('has_role', { _user_id: u.user.id, _role: 'admin' })
  if (!isAdmin) return json({ error: 'Geen toegang' }, 403)

  const { client_id, focus } = await req.json().catch(() => ({}))
  const { data: c } = await db.from('clients').select('name,brief,video_only,capcut_style').eq('id', client_id ?? '').maybeSingle()
  if (!c) return json({ error: 'Klant niet gevonden' }, 404)
  const { data: scripts } = await db.from('scripts').select('title,body,moment_id').eq('client_id', client_id).order('created_at', { ascending: false }).limit(25)
  const { data: vids } = await db.from('videos').select('title,views').eq('client_id', client_id).order('views', { ascending: false }).limit(8)

  const { data: made } = await db.from('video_items').select('title').eq('client_id', client_id).is('trashed_at', null).in('status', ['client_review', 'approved_client', 'scheduled', 'archived']).order('created_at', { ascending: false }).limit(30)
  const { data: brand } = await db.from('library_files').select('category,file_name,description').eq('client_id', client_id).order('created_at', { ascending: false }).limit(40)
  const used = (scripts ?? []).filter((s) => s.moment_id && s.body).slice(0, 4)
  const prompt = `Klant: ${c.name}
Over de klant: ${c.brief || '(niet ingevuld — leid het af uit de naam en zoek online wat dit bedrijf doet)'}
Branding van de klant (huisstijl om in te passen):
- CapCut-stijl: ${c.capcut_style || 'niet ingevuld'}
- Brandingbestanden: ${(brand ?? []).map((f) => `${f.category}: ${f.file_name}${f.description ? ` (${f.description})` : ''}`).join('; ') || 'geen'}
${focus ? `Extra focus van het team: ${focus}\n` : ''}Eerdere scripts (niet herhalen): ${(scripts ?? []).map((s) => s.title).join('; ') || 'geen'}
Best bekeken video's: ${(vids ?? []).map((v) => `${v.title ?? 'zonder titel'} (${v.views ?? 0})`).join('; ') || 'onbekend'}
Eerder gemaakte video's voor deze klant (stijl, toon en formats om op voort te bouwen): ${(made ?? []).map((v) => v.title).join('; ') || 'nog geen'}
${used.length ? `Voorbeelden van gebruikte scripts (neem stijl en toon over):\n${used.map((s) => `- ${s.title}: ${s.body.slice(0, 500)}`).join('\n')}` : ''}`

  const res = await fetch('https://ai.gateway.lovable.dev/v1/responses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Lovable-API-Key': Deno.env.get('LOVABLE_API_KEY')!, 'X-Lovable-AIG-SDK': 'fetch' },
    body: JSON.stringify({
      model: 'openai/gpt-6-astra', stream: true, store: false, reasoning: { effort: 'low' },
      tools: [{ type: 'web_search' }],
      instructions: 'Je bent contentstrateeg bij HIBE, een Nederlands social-media bureau. Zoek op het web naar actuele trends (producten, stijlen, formats, geluiden) in de branche van de klant, zoals een interieurbedrijf met banken die nu populair zijn. Geef 3-5 korte trends en 5 concrete video-ideeën voor TikTok/Instagram Reels, in het Nederlands, zonder emoji. Elk script: korte scènes en voice-over/tekst op beeld, max 120 woorden. Sluit aan bij de stijl, toon en formats van de eerder gemaakte video\'s en scripts van deze klant, maar herhaal ze niet. Pas de ideeën aan op de branding (huisstijl, lettertype, beeldtaal en omschrijvingen van brandingbestanden).',
      input: prompt,
      text: { format: { type: 'json_schema', name: 'ideas', strict: true, schema: SCHEMA } },
    }),
  })
  if (!res.ok || !res.body) {
    const t = await res.text().catch(() => '')
    console.error('gateway', res.status, t)
    const msg = res.status === 402 ? 'AI-tegoed is op.' : res.status === 429 ? 'Even te druk, probeer het zo opnieuw.' : 'Ideeën maken lukt nu niet.'
    return json({ error: msg }, res.status === 402 || res.status === 429 ? res.status : 502)
  }
  // Consume the stream server-side, return the final JSON.
  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader()
  let buf = '', out = ''
  for (;;) {
    const { value, done } = await reader.read(); if (done) break
    buf += value
    let i
    while ((i = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1)
      if (!line.startsWith('data:')) continue
      try { const ev = JSON.parse(line.slice(5)); if (ev.type === 'response.output_text.delta') out += ev.delta } catch { /* ignore */ }
    }
  }
  try { return json(JSON.parse(out)) } catch { return json({ error: 'Ideeën maken lukt nu niet.' }, 502) }
})
