@AGENTS.md

# Filament — Contesto progetto

## Cos'è
SaaS di notarizzazione documenti per periti infortunistica stradale e studi legali.
Nome "Filament" è un placeholder — find & replace globale quando si decide il nome definitivo.

## Come funziona
Upload documento (perizia, foto, relazione tecnica) → hash SHA-256 + firma digitale → append a hash-chain del cliente → certificato pubblico verificabile → resoconto IA fattuale (estrazione dati, no interpretazione legale).

## Architettura core
- Hash-chain lineare per cliente: ogni blocco include hash del blocco precedente. Append-only, mai UPDATE/DELETE.
- Merkle tree giornaliero: aggrega le teste-catena di tutti i clienti attivi. Root salvata in tabella append-only.
- Pagina pubblica /verifica: cronologia root giornaliere, sola lettura, no auth.
- Certificato pubblico /certificato/[id]: hash, data, stato integrità, Merkle proof.
- Resoconto IA: estrazione fattuale (parti, date, importi, tipo danno). MAI giudizi su responsabilità o congruità. Disclaimer sempre visibile.

## Regole architetturali (non negoziabili)
- Permessi DB append-only VERI (RLS Postgres: solo INSERT, mai UPDATE/DELETE, incluso account admin) sulle tabelle hash-chain e merkle_roots.
- getUser() server-side sempre — mai fidarsi del client per l'auth.
- Niente blockchain pubblica, niente Web3, niente token. È un database con hash-chain gestito da un singolo operatore.
- Resoconto IA: descrivere, non valutare. Disclaimer fisso e visibile su ogni resoconto.

## Stack
- Next.js 16 App Router
- TypeScript strict (zero any)
- Tailwind CSS
- Supabase (@supabase/ssr) — Postgres + Storage
- Vercel (Hobby durante validazione, Pro dal primo euro di revenue)
- API Claude per resoconti IA
- crypto nativo Node per SHA-256
- merkletreejs per Merkle tree
- Firma digitale: RSA/ed25519 per cliente, generata alla registrazione, salvata cifrata

## Target e validazione
- Verticale: periti sinistri stradali / studi infortunistica
- Primo contatto: GF Infortunistica
- Prezzo: 30€/mese, mese di prova gratuita prima di chiedere pagamento
- Framework: creo → propongo → vendo o chiudi (ciclo 2-3 settimane)

## Fasi di sviluppo
0. Setup progetto (questo prompt)
1. Schema dati Supabase e auth
2. Upload e hash-chain
3. Certificato pubblico
4. Dashboard cliente
5. Resoconto IA
6. Landing page

## Fuori scope per ora (fase 2+)
- Merkle tree aggregato e pagina trasparenza pubblica
- Ancoraggio esterno (TSA/blockchain pubblica)
- Multi-tenant avanzato, ruoli granulari, integrazioni email/PEC
