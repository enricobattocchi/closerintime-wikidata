import { NextResponse } from "next/server";
import { fetchWikidataEvents } from "@/lib/wikidata";

// Curated list of notable events/entities with known dates on Wikidata
const NOTABLE_QIDS = [
  // People
  "Q1299", // The Beatles
  "Q5593", // Galileo Galilei
  "Q937", // Albert Einstein
  "Q7186", // Marie Curie
  "Q1067", // Frida Kahlo
  "Q692", // William Shakespeare
  "Q1339", // Johann Sebastian Bach
  "Q8023", // Nelson Mandela
  "Q36844", // Elizabeth II
  "Q9358", // Nikola Tesla
  "Q42", // Douglas Adams
  "Q1394", // Alan Turing
  "Q7243", // Leonardo da Vinci
  "Q312885", // Amelia Earhart
  "Q1035", // Charles Darwin
  "Q352", // Adolf Hitler
  "Q307", // Galileo Galilei
  "Q5879", // Johann Wolfgang von Goethe
  "Q9439", // Victoria
  "Q2831", // Michael Jackson

  // Historical events
  "Q12418", // Mona Lisa
  "Q131805", // Treaty of Versailles
  "Q8686", // French Revolution
  "Q362", // World War II
  "Q8676", // World War I
  "Q178561", // Battle of Hastings
  "Q128160", // Fall of Constantinople
  "Q192334", // Signing of the Magna Carta
  "Q43653", // Apollo 11
  "Q181795", // Storming of the Bastille
  "Q170382", // Chernobyl disaster
  "Q223195", // Gutenberg Bible
  "Q9217", // Great Wall of China

  // Buildings & places
  "Q18712", // Eiffel Tower
  "Q11696", // Taj Mahal
  "Q12506", // Colosseum
  "Q9188", // Empire State Building
  "Q42798", // Hagia Sophia
  "Q46239", // Parthenon
  "Q201469", // Sagrada Família
  "Q81", // Panama Canal

  // Science & tech
  "Q11768", // World Wide Web
  "Q94", // Android
  "Q312", // Apple Inc.
  "Q131723", // Sputnik 1
  "Q107", // Apollo 11
  "Q1092", // Hubble Space Telescope
  "Q181642", // Internet
  "Q183257", // Rosetta Stone

  // Music, film, books
  "Q186341", // Don Quixote
  "Q74181", // The Lord of the Rings
  "Q21198", // Nineteen Eighty-Four
  "Q25338", // Titanic (film)
  "Q132689", // Star Wars
  "Q103474", // 2001: A Space Odyssey
  "Q147787", // Abbey Road
  "Q169226", // Beethoven's 5th Symphony

  // Organizations
  "Q37156", // United Nations
  "Q11173", // UNESCO
  "Q2283", // Wikipedia
];

export async function GET(request: Request) {
  const url = new URL(request.url);
  const excludeParam = url.searchParams.get("exclude");
  const excludeIds = excludeParam ? excludeParam.split(",") : [];
  const lang = url.searchParams.get("lang") ?? "en";

  const available = NOTABLE_QIDS.filter((id) => !excludeIds.includes(id));
  if (available.length === 0) {
    return NextResponse.json(null);
  }

  // Try up to 3 times to find a valid event (has date + wiki link)
  for (let attempt = 0; attempt < 3; attempt++) {
    const randomId = available[Math.floor(Math.random() * available.length)];
    try {
      const events = await fetchWikidataEvents(randomId, lang);
      if (events.length > 0 && events[0].link) {
        return NextResponse.json(events[0]);
      }
    } catch {
      // try another
    }
  }

  return NextResponse.json(null);
}
