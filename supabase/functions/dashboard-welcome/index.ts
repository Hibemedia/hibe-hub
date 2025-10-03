import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { customerName, metrics } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Je genereert persoonlijke welkomstberichten voor een social media dashboard.
- Begin altijd met: "Hallo [klantnaam]," waarbij je de naam warm en direct aanspreekt.
- Spreek de klant direct aan alsof je een goede bekende bent die oprecht geïnteresseerd is in hun succes.
- Geef een persoonlijke, positieve samenvatting van hun cijfers met emotie en enthousiasme.
- Gebruik persoonlijke woorden zoals "je", "jouw", "trots", "blij", "geweldig" en complimenteer ze oprecht.
- De toon is warm, betrokken, vriendelijk en mag speels zijn - alsof een goede vriend enthousiast hun cijfers bespreekt.
- Focus altijd op het positieve en laat merken dat je echt onder de indruk bent.
- Houd het kort maar krachtig: maximaal 2 à 3 zinnen met veel persoonlijkheid.
- Gebruik Nederlandse taal.

Voorbeelden van de gewenste persoonlijke stijl:
"Hallo Lisa, wat gaaf om te zien dat je bereik deze week zo mooi groeit! Steeds meer mensen ontdekken je content en dat zie je terug in de reacties - super trots op je! 🎉"
"Hallo Tom, je engagement cijfers zijn echt lekker bezig deze maand! Je community wordt actiever en dat is precies wat we willen zien. Keep it up! 💪"`;

    const userPrompt = `Genereer een persoonlijk, warm welkomstbericht voor ${customerName}.

Hun dashboard cijfers:
- Totaal Views: ${metrics.totalViews} - echt indrukwekkend!
- Engagement Rate: ${metrics.engagementRate} - mensen reageren actief!
- Click-Through Rate: ${metrics.ctr} - conversie loopt lekker!
- Organic Impressions: ${metrics.organicImpressions} - natuurlijke groei!
- Platform prestaties: TikTok groeit +24%, Instagram +8%, YouTube Shorts zelfs +31%!

Maak een persoonlijk, enthousiast welkomstbericht van 2-3 zinnen alsof je een goede vriend bent die echt blij is met hun resultaten. Gebruik emoji's om het extra persoonlijk te maken.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Te veel verzoeken, probeer het later opnieuw." }), 
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Betaling vereist." }), 
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI gateway fout" }), 
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const data = await response.json();
    const message = data.choices?.[0]?.message?.content || "Welkom terug!";

    return new Response(
      JSON.stringify({ message }), 
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Welcome message error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Onbekende fout" 
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
