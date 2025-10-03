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

    const systemPrompt = `Je genereert welkomstberichten voor een social media dashboard.
- Begin altijd met: "Hallo [klantnaam]," waarbij je de naam gebruikt die gegeven wordt.
- Geef daarna een korte, positieve samenvatting van de belangrijkste cijfers (zoals bereik, engagement, volgers of groei).
- De toon is luchtig, vriendelijk en mag een vleugje humor bevatten (bijvoorbeeld een knipoog, speelse vergelijking of compliment in creatieve stijl).
- Focus altijd op het positieve, ook als de cijfers minder sterk zijn.
- Houd het kort en pakkend: maximaal 2 à 3 zinnen.
- Gebruik Nederlandse taal.

Voorbeelden van de gewenste stijl:
"Hallo Lisa, je bereik laat deze week een mooie beweging zien en steeds meer mensen reageren op je content. Een prachtig signaal dat je merk sterker wordt!"
"Hallo Tom, er zijn deze maand mooie stappen gezet in je engagement en je community wordt actiever. Dat is een goede basis voor verdere groei!"`;

    const userPrompt = `Genereer een welkomstboodschap voor ${customerName}.

Dashboard metrics:
- Totaal Views: ${metrics.totalViews}
- Engagement Rate: ${metrics.engagementRate}
- Click-Through Rate: ${metrics.ctr}
- Organic Impressions: ${metrics.organicImpressions}
- Platform groei: TikTok +24%, Instagram +8%, YouTube Shorts +31%

Maak een positief, motiverend welkomstbericht van 2-3 zinnen.`;

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
