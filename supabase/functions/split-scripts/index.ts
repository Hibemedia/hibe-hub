import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

const URL_ = Deno.env.get('SUPABASE_URL')!
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
const SCHEMA = { type: 'object', additionalProperties: false, required: ['scripts'], properties: { scripts: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['title', 'body'], properties: { title: { type: 'string' }, body: { type: 'string' } } } } } }

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  const auth = req.headers.get('Authorization') ?? ''
  const user = createClient(URL_, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: auth } } })
  const { data: u } = await user.auth.getUser(auth.replace('Bearer ', ''))
  if (!u?.user) return json({ error: 'Niet ingelogd' }, 401)
  const db = createClient(URL_, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const { data: isAdmin } = await db.rpc('has_role', { _user_id: u.user.id, _role: 'admin' })
  if (!isAdmin) return json({ error: 'Geen toegang' }, 403)
  const { text } = await req.json().catch(() => ({}))
  if (typeof text !== 'string' || !text.trim()) return json({ error: 'Geen tekst' }, 400)

  const res = await fetch('https://ai.gateway.lovable.dev/v1/responses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Lovable-API-Key': Deno.env.get('LOVABLE_API_KEY')! },
    body: JSON.stringify({
      model: 'openai/gpt-6-astra', store: false, reasoning: { effort: 'low' },
      instructions: 'Je krijgt de tekst uit een PDF met meerdere video-scripts van één draaidag. De tekst kan door elkaar staan door de PDF-opmaak (kolommen, tabellen, afgebroken regels). Verdeel hem in de losse scripts, in de volgorde van het document. Zet per script de inhoud overzichtelijk en in de juiste volgorde, zodat het team het makkelijk kan nalopen. Gebruik per shot een eigen regel in de vorm "1e shot: ...", "2e shot: ...", enzovoort; zet voice-over, tekst op beeld en spreektekst als losse regels onder het bijbehorende shot (bijv. "  Voice-over: ...", "  Tekst op beeld: ..."). Staan er geen shots in, gebruik dan korte, duidelijke alinea\'s. Gebruik de woorden uit het document: niets verzinnen, geen inhoud weglaten; alleen herordenen, afgebroken zinnen herstellen en dubbele stukken weghalen. Gebruik geen markdown-sterretjes of emoji. Geef elk script een titel: de titel uit het document, of anders een korte beschrijvende titel. Laat algemene teksten die bij geen script horen (voorblad, inleiding, paginanummers) weg.',
      input: text.slice(0, 120000),
      text: { format: { type: 'json_schema', name: 'scripts', strict: true, schema: SCHEMA } },
    }),
  })
  if (!res.ok) {
    console.error('gateway', res.status, await res.text().catch(() => ''))
    return json({ error: res.status === 402 ? 'AI-tegoed is op.' : res.status === 429 ? 'Even te druk, probeer het zo opnieuw.' : 'Verdelen lukt nu niet.' }, res.status === 402 || res.status === 429 ? res.status : 502)
  }
  const data = await res.json()
  const out = data.output_text ?? (data.output ?? []).flatMap((o: any) => o.content ?? []).filter((c: any) => c.type === 'output_text').map((c: any) => c.text).join('')
  try { return json(JSON.parse(out)) } catch { return json({ error: 'Verdelen lukt nu niet.' }, 502) }
})
