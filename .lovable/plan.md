# Overzicht en Performance duidelijk onderscheiden

## Gekozen richting
**Overzicht wordt een korte klantstartpagina. Performance blijft de plek voor verdieping.** De huidige stijl en klantnamen blijven behouden.

De twee pagina’s tonen nu dezelfde kerncijfers, daggrafiek, platformtabel en videoprestaties, grotendeels in een andere volgorde. Dat maakt het verschil klein.

## Overzicht: in één oogopslag
- Behoud de periodekeuze, standaard de laatste 30 dagen.
- Toon bovenaan de bestaande vier kerncijfers: volgers, weergaven, interacties en posts, met dezelfde groeiberekening.
- Toon één uitgelichte video: de best bekeken video binnen de gekozen periode, met thumbnail, titel, kanaal, weergaven en een link naar de post.
- Voeg een compact blok **Te beoordelen** toe met het echte aantal openstaande video's en een link naar Video Goedkeuring.
- Toon maximaal drie eerstvolgende bevestigde of geplande contentmomenten met datum en een link naar Contentmomenten.
- Verwijder hier de uitgebreide daggrafiek, platformtabel, lange videolijst en losse periodesamenvatting.
- Geef een duidelijke knop **Bekijk Performance** voor de volledige cijfers.
- Toon passende lege, laad- en foutmeldingen; ontbrekende gegevens worden niet als nul gepresenteerd.

## Performance: de volledige analyse
- Behoud de periodekeuze en bestaande kerncijfers.
- Behoud de grafiek met **Totaal / Per kanaal**, de interactieslijn en legenda.
- Behoud de volledige platformtabel, de tien best bekeken video's binnen de periode en de periodesamenvatting.
- Behoud de bestaande HIBE-beheeracties. Geen extra analysemogelijkheden nodig voor deze wijziging.

## Behouden
- Lichtgrijs canvas, zwarte capsules, limegroene accenten, ronde knoppen en Urbanist.
- Dezelfde cijfers en definities op beide pagina’s bij dezelfde periode.
- Geen wijzigingen aan synchronisatie, opgeslagen gegevens, klantnamen, rollen of rechten.
- Het algemene HIBE Dashboard op `/hibe` blijft ongemoeid; dit betreft de klantpagina’s, ook wanneer HIBE een klant opent.

## Technische aanpak
- Pas de indeling van `src/pages/Dashboard.tsx` aan; hergebruik de bestaande cijfers, video-opmaak en klantgebonden goedkeuringsteller.
- Haal komende contentmomenten alleen op voor de geselecteerde `clientId`. Gebruik bestaande gegevens en rechten; geen nieuwe tabellen of wijzigingen aan de backend.
- Houd links correct in zowel de Klantomgeving als `/hibe/klant/:id` via `useBase()`.
- Houd de berekeningen in `src/lib/stats.ts` en de sync ongewijzigd. Gedeelde onderdelen alleen aanpassen als dat nodig is voor de compacte presentatie.

## Controle
- Controleer beide pagina’s bij dezelfde klant en periode: de kerncijfers moeten overeenkomen, de inhoud moet duidelijk verschillen.
- Test de links naar Performance, Video Goedkeuring en Contentmomenten vanuit beide omgevingen.
- Controleer dat de uitgelichte video de best bekeken video binnen de periode is en dat alleen toekomstige bevestigde/geplande momenten verschijnen; voeg gerichte tests toe voor deze selectie.
- Bekijk desktop en mobiel, inclusief een klant zonder video's of contentmomenten, en toon screenshots van beide pagina’s.