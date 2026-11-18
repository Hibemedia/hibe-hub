ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS capcut_style text;
UPDATE public.clients SET capcut_style = v.s FROM (VALUES
('VIP Fashion', $$Lettertype: Mathilde Black
Grootte: 9px
Kleur: #FFFFFF
Stroke: dikte 30px, kleur #000000
Extra: alles in kleine letters en schuin gedrukt$$),
('Eric Franzel', $$Lettertype: MonumentExtended-Blk
Grootte: 7px
Kleur: #000000
Achtergrond: #FFFFFF, blok met hoeken
Height: 0%
Extra: alles in hoofdletters met background
Animatie in: Ruined Film$$),
('De Hollandse Tulp', $$Lettertype: Poppins
Grootte: 8px
Kleur: #FFFFFF
Extra: slagschaduw 100%
Adjust → Basic → Saturation: 16
Video → Retouch → Skin tone: 4e skin
Skin tone → Warmth: 39
Skin tone → Degree: 60$$),
('Feer', $$Lettertype: Poppins
Grootte: 8px
Kleur: #FFFFFF
Schaduw: 100%, hoek -45, wazig 15%
Stroke kleur: #000000
Extra: alles in kleine letters$$),
('Rocketshot', $$Lettertype: Poppins
Grootte: 7px
Stroke: zwart, dikte 40px$$),
('Devil Shot', $$Lettertype: Montserrat
Grootte: 9px
Stroke: zwart, dikte 40px$$),
('Jebroer', $$Lettertype: Poppins-Bold
Grootte: 8px
Stroke: zwart, dikte 40px
Extra: alles in kleine letters$$),
('Nargis', $$Lettertype: RedHat-Blk
Grootte: 7px
Schaduw: zwart 100%, wazig 3%, afstand 8
Extra: alles in hoofdletters en schuin (cursief)$$),
('Grafisch Lyceum Utrecht', $$Lettertype: LEMON MILK
Grootte: 9px
Schaduw: zwart 100%, wazig 4, afstand 8
Extra: slagschaduw (kijk altijd zelf wat het mooiste is bij de video)$$)
) AS v(n, s) WHERE public.clients.name = v.n;