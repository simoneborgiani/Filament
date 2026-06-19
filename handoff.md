# Filament — Handoff

## Sessione corrente: Fase 6 — Landing page

### Completato
- `src/app/page.tsx` — landing page pubblica completa: hero (titolo + sottotitolo + CTA "Inizia gratis"→/signup e "Accedi"→/login), sezione problema (3 card), come funziona (3 step numerati), value prop (+ disclaimer resoconto IA), CTA finale, footer minimo. Tutto in italiano, **zero termini tecnici** (niente hash/Merkle/crittografia/blockchain), dark mode.
- `src/app/certificato/[id]/page.tsx` — aggiunto link "← Torna alla dashboard" in cima, visibile SOLO se l'utente è autenticato (`getUser()` server-side, pagina resta pubblica e senza redirect).
- `npm run build` e `npm run lint` → zero warning.

### Scelte tecniche di questa sessione
- **Contenuti landing come array** (`problemi`, `passi`) mappati nel JSX: meno ripetizione, più facile da editare. Copy preso letteralmente dallo spec.
- **`getUser()` nel certificato senza renderlo protetto.** La pagina certificato è pubblica: `getUser()` viene usato SOLO per decidere se mostrare il link alla dashboard, mai per redirigere. Conforme alla regola "getUser solo in Server Component/Layout" (è un Server Component) e a "il certificato è pubblico".
- Riuso dello stesso stile del link "← Torna alla dashboard" già presente in upload/settings per coerenza visiva.

### Verifica eseguita
- Build + lint puliti.
- `/` → 200, tutte le sezioni presenti (verificato il testo di hero/problema/come-funziona/value/CTA), CTA `/signup` e `/login` presenti, **nessun termine tecnico** nel markup (check su hash/merkle/blockchain/crittograf → assenti).
- `/certificato/[id]` **non loggato** → 200, link "Torna alla dashboard" **assente** (verificato con HttpClient senza cookie di sessione).
- Il caso loggato (link visibile) resta verifica manuale di Simone (serve sessione reale), ma la logica è simmetrica al caso non-loggato già confermato.

### Stato progetto
Fasi 0-6 complete. MVP funzionale: landing → signup → upload+firma → certificato pubblico verificabile → dashboard → resoconto IA (in attesa crediti OpenAI). Restano "fuori scope" (fase 2+): Merkle tree aggregato, pagina trasparenza pubblica, ancoraggio esterno TSA. Eventuale follow-up: resoconto IA per i PDF (limite OpenAI image_url, vedi Fase 5).

### Note aperte (storiche)
- Supabase: secondo progetto free (il primo è usato da Huntlist).
- Nome "Filament" è placeholder — find & replace quando si decide il nome definitivo.
- File convention: l'auth proxy vive in `src/proxy.ts` (NON `src/middleware.ts`) per via della deprecazione in Next.js 16.

---

## Sessione precedente: Fase 5 — Resoconto IA

### Completato
- `src/app/dashboard/upload/actions.ts` — aggiunta `generateAiSummary()`: invia il file (base64) all'API Claude (`claude-sonnet-4-6`), estrae SOLO dati fattuali (tipo doc, data, parti, importi, veicoli, luogo, note), salva il JSON in `documents.ai_summary` + `ai_summary_at` via service role. Fail-silent totale. Lanciata in background dopo l'insert.
- `src/app/certificato/[id]/page.tsx` — query estesa con `ai_summary, ai_summary_at`; nuova sezione "Resoconto documento" con due stati (in elaborazione / popolato), campi null/array vuoti → "—", disclaimer IA sempre visibile.
- `npm run build` e `npm run lint` → zero warning.

### ⚠️ DECISIONE ARCHITETTURALE DA NOTARE (conflitto con regola non negoziabile)
- **CLAUDE.md dice: append-only VERO "incluso account admin", mai UPDATE/DELETE sulle tabelle hash-chain.** Questa fase introduce un **UPDATE** su `documents` (campi `ai_summary`/`ai_summary_at`) via **service role**. È un'eccezione consapevole richiesta dallo spec di Fase 5: "questo è l'unico UPDATE permesso, ma solo via service role".
- **Mitigazione:** l'UPDATE tocca SOLO i due campi del resoconto IA (metadati mutabili). I campi che garantiscono l'integrità della catena (`file_hash`, `previous_hash`, `block_hash`, `signature`) restano immutabili e firmati. La firma copre il `block_hash`, che NON include `ai_summary`: aggiornare il resoconto non invalida né altera la verifica crittografica.
- **Azione per Simone:** se in futuro vuoi blindare davvero l'append-only anche contro il service role (es. trigger `BEFORE UPDATE` che blocca modifiche ai campi-catena, consentendo solo `ai_summary`/`ai_summary_at`), va aggiunto a livello DB. Oggi non c'è: il service role può tecnicamente modificare tutto. Da valutare prima della produzione.

### Scelte tecniche di questa sessione
- **`after()` di `next/server` al posto del fire-and-forget dello spec.** Lo spec proponeva `generateAiSummary(...).catch(()=>{})` non atteso. Su Vercel (target di deploy) una promise non attesa viene **terminata** appena la response è inviata → il resoconto non si genererebbe mai in produzione. `after()` è il primitivo Next.js 16 pensato esattamente per questo: esegue il callback DOPO la response, mantenendo viva la funzione per la max duration della route. In dev funziona identico. Deviazione giustificata dalla correttezza in produzione.
- **Resoconto SOLO descrittivo.** System prompt vincolato a estrazione fattuale, mai giudizi su responsabilità/congruità/validità legale (regola CLAUDE.md). Disclaimer fisso e visibile sia in stato "in elaborazione" sia con resoconto popolato.
- **Tipo `AiSummary`** esplicito (no `any`); `ai_summary` JSONB tipizzato come `AiSummary | null`. Parsing del JSON dell'AI in `Record<string, unknown>` lato action.
- **Degradazione graziosa senza API key.** Con `ANTHROPIC_API_KEY` placeholder, la fetch torna 401 → `response.ok` false → return silenzioso → `ai_summary` resta null → la pagina mostra "in elaborazione". L'upload non è mai impattato. (Confermato dalla logica; per vedere un resoconto reale serve la key vera.)
- **Nessun GRANT nuovo necessario:** la pagina certificato legge via service role (già `GRANT ALL ... TO service_role`), l'update è via service role. Nessuna nuova query con client `authenticated`.

### Verifica eseguita
- Build + lint puliti.
- Colonne `ai_summary`/`ai_summary_at` confermate esistenti via PostgREST (status 200).
- **Test end-to-end su documento reale** (`0ff6027d-…`, caricato in Fase 2, `ai_summary` null): `/certificato/[id]` → 200, sezione "Resoconto documento" presente, stato "Resoconto in elaborazione…", disclaimer IA visibile, badge "Firma verificata" ancora corretto. Nessuna regressione dall'aggiunta delle colonne al select.
- **NON testato il resoconto reale generato dall'AI**: richiede un nuovo upload + `ANTHROPIC_API_KEY` valida (ora placeholder). Resta verifica manuale di Simone.

### Da fare manualmente (Simone)
1. Compilare `ANTHROPIC_API_KEY` in `.env.local` con una key vera per attivare i resoconti.
2. Caricare un nuovo documento → `/certificato/[id]` mostra "in elaborazione" subito → dopo ~5-10s ricaricare → resoconto popolato.
3. (Opzionale, pre-produzione) Valutare un trigger DB per blindare l'append-only anche contro il service role sui campi-catena.

### Aggiornamento: provider IA passato da Anthropic a OpenAI
- `generateAiSummary` ora chiama **OpenAI** (`gpt-4o`, endpoint `chat/completions`) invece di Anthropic. Estrae lo stesso JSON fattuale, stesse regole (solo descrizione, mai giudizi), stesso salvataggio in `documents.ai_summary` via service role, stesso `after()` non bloccante e fail-silent.
- Aggiunta `OPENAI_API_KEY` in `.env.local` e `.env.example`. `ANTHROPIC_API_KEY` non è più usata dal codice (lasciata negli env per ora; rimovibile).
- **`fileName` mantenuto nel prompt** (`questo documento (${fileName})`): la versione OpenAI dello spec non lo usava, ma tenerlo evita un errore lint `no-unused-vars` (zero-warning) e dà un minimo di contesto al modello. Deviazione minima.
- **⚠️ Limite importante: niente resoconto per i PDF.** L'endpoint OpenAI `chat/completions` con `image_url` accetta **solo immagini** (jpg/png/webp), NON i PDF. Un PDF caricato come data URL fa fallire la chiamata → return silenzioso → `ai_summary` resta null → la pagina certificato mostra "in elaborazione" per sempre. Con Anthropic invece i PDF erano gestiti (blocco `document`). L'upload e la hash-chain restano comunque funzionanti (il resoconto è un bonus). Da decidere: per i PDF servirebbe un passaggio extra (estrazione testo lato server, oppure OpenAI Responses API con input file, oppure rendering pagina→immagine). Per ora i PDF non producono resoconto.
- Build + lint puliti dopo lo switch.
- **Sessione di debug sul path OpenAI** (log temporanei su presenza key / status / body della risposta): log rimossi a fine debug. Il `catch` di `generateAiSummary` è tornato **fail-silent** (`// Fail silently`), coerente con il principio "il resoconto IA non blocca né disturba il flusso principale". Build + lint puliti.

### Prossimo step
Fase 6 — Landing page. (Fasi 2+ "fuori scope" restano: Merkle tree aggregato, pagina trasparenza pubblica, ancoraggio esterno.)
Eventuale follow-up: gestione resoconto IA per i PDF (vedi limite sopra).

### Note aperte (storiche)
- Supabase: secondo progetto free (il primo è usato da Huntlist).
- Nome "Filament" è placeholder — find & replace quando si decide il nome definitivo.
- File convention: l'auth proxy vive in `src/proxy.ts` (NON `src/middleware.ts`) per via della deprecazione in Next.js 16.

---

## Sessione precedente: Fase 4 — Dashboard cliente

### Completato
- `src/app/dashboard/page.tsx` — dashboard completa: header "Benvenuto, [studio_name]" (fetch `profiles`), statistiche (totale documenti, data primo, data ultimo), tabella documenti (nome, dimensione con `formatFileSize`, data con `formatDate`, badge verde "✓ Firmato", link "Certificato"), bottone upload, link "Impostazioni", empty-state.
- `src/app/dashboard/upload/page.tsx` — migliorato: area **drag & drop** (bordo cambia colore su drag-over), preview nome+dimensione del file selezionato, bottone disabilitato finché non c'è un file, indicatore di progresso durante l'upload.
- `src/app/dashboard/settings/page.tsx` — nuovo: email + nome studio (fetch `profiles`), chiave pubblica troncata+copiabile (`CopyHash`), bottone "Esci" (signOut + redirect a `/login`).
- `src/app/dashboard/layout.tsx` — già esistente dalla Fase 1: **non toccato**.
- `npm run build` e `npm run lint` → zero warning.

### Scelte tecniche di questa sessione
- **Logout come Server Action inline.** Invece di un client handler con `router.push`, ho usato un'azione `'use server'` (`signOutAction`) che fa `supabase.auth.signOut()` + `redirect('/login')`, invocata da `<form action={...}>`. Tutto server-side, cookie di sessione invalidati correttamente, nessun client component extra.
- **Drag & drop sincronizzato con un input file nascosto.** L'input `name="file"` resta la sorgente della FormData (così la server action `uploadAction` non cambia); il drop assegna `dataTransfer.files` direttamente a `inputRef.current.files` e aggiorna lo stato per la preview. La dropzone è accessibile (role=button, tabIndex, gestione Enter/Spazio).
- **Statistiche derivate dall'ordinamento esistente.** La query documents è `order(created_at desc)`: `docs[0]` = ultimo caricato, `docs[total-1]` = primo. Niente query extra per le date min/max.
- **`formatDate`/`formatFileSize`/`truncateHash` riusati** da `src/lib/format.ts`; `CopyHash` riusato da `src/components/ui/copy-hash.tsx` (Fase 3). Zero duplicazione.
- **Badge "✓ Firmato" statico**: ogni documento è firmato per costruzione (l'insert avviene solo dopo firma riuscita). La verifica crittografica reale della firma resta nella pagina certificato pubblica; in dashboard sarebbe un costo inutile per riga.

### Bug / punti d'attenzione
- Nessun bug bloccante.
- Nota: `fileInputRef.current.files = droppedFiles` per il drag&drop funziona sui browser moderni (FileList assegnabile). Nessun fallback per browser molto datati, ma l'input classico (click) resta sempre disponibile.

### Verifica eseguita
- Build + lint puliti.
- `/dashboard`, `/dashboard/settings`, `/dashboard/upload` senza sessione → **307 → /login** (gate del layout, testato con HttpClient). Anche la nuova route settings è protetta.
- **NON ho testato il rendering autenticato** (dashboard con dati, drag&drop reale, logout): richiede sessione + documenti reali. Resta verifica manuale di Simone.

### Prossimo step
Fase 5 — Resoconto IA:
- Estrazione fattuale (parti, date, importi, tipo danno) con API Claude.
- Disclaimer fisso e visibile su ogni resoconto. Mai giudizi su responsabilità/congruità.
- Popolamento async di `documents.ai_summary` + `ai_summary_at`.
- `ANTHROPIC_API_KEY` in `.env.local` è ancora placeholder: da compilare.

### Note aperte (storiche)
- Supabase: secondo progetto free (il primo è usato da Huntlist).
- Nome "Filament" è placeholder — find & replace quando si decide il nome definitivo.
- File convention: l'auth proxy vive in `src/proxy.ts` (NON `src/middleware.ts`) per via della deprecazione in Next.js 16.

---

## Sessione precedente: Fase 3 — Certificato pubblico

### Completato
- `src/app/certificato/[id]/page.tsx` — pagina **pubblica** (no auth, no getUser, no redirect). Server Component: query `documents` via admin client selezionando SOLO i campi pubblici (`id, file_name, file_size, file_hash, previous_hash, block_hash, signature, created_at, profile_id` — mai `storage_path`/chiavi), query `profiles` per `public_key` + `studio_name`, verifica firma `verifySignature(block_hash, signature, public_key)`, badge verde/rosso, hash troncati con copia, link al certificato precedente, disclaimer fisso. `notFound()` se l'id non esiste.
- `src/lib/format.ts` — `formatFileSize`, `formatDate` (it-IT, Europe/Rome), `truncateHash`.
- `src/components/ui/copy-hash.tsx` — bottone client "Copia" (clipboard, feedback "Copiato!" 2s).
- `src/app/dashboard/page.tsx` — il link "Carica nuovo documento" era già presente dalla Fase 2: nessuna modifica necessaria.
- `npm run build` e `npm run lint` → zero warning.

### Scelte tecniche di questa sessione
- **Verifica integrità = verifica della firma, non ricalcolo del block_hash.** Come da spec: il `block_hash` include il `timestamp` ISO che non è ricalcolabile server-side, quindi l'integrità si attesta verificando la firma ed25519 sul `block_hash` con la chiave pubblica del cliente. Verifica avvolta in try/catch → firma malformata = badge rosso, mai crash.
- **Link al documento precedente via seconda query.** `previous_hash` è il `block_hash` del blocco precedente, NON un id: risalgo all'id con una query `documents.block_hash = previous_hash` (`maybeSingle`). Se per qualche motivo non si trova, mostro l'hash non linkato invece di rompere la pagina.
- **`maybeSingle` ovunque** per le letture opzionali: id inesistente o UUID malformato → `data: null` → `notFound()` pulito (404), senza eccezioni. Verificato: `/certificato/id-falso` e un UUID inesistente danno entrambi 404 senza redirect.
- **Admin client (service role) anche qui**, pur essendo pagina pubblica: la policy `documents: SELECT USING (true)` basterebbe per l'anon, ma usando l'admin con select esplicita controllo io quali colonne escono, senza dipendere dalla permissività della policy. I campi sensibili non vengono mai selezionati.
- **Entità HTML** `&apos;` nel disclaimer per evitare il warning ESLint `react/no-unescaped-entities`.

### Bug / punti d'attenzione
- Nessun bug bloccante in questa fase.
- Promemoria (ancora valido): la policy pubblica `documents: SELECT USING (true)` resta permissiva a livello DB; qui è mitigata dalla select esplicita lato app, ma a tendere conviene una view pubblica che esponga solo i campi del certificato.

### Verifica eseguita
- Build + lint puliti.
- `/certificato/id-falso` (non-UUID) → **404**, nessun redirect (pagina pubblica). OK.
- `/certificato/<uuid-inesistente>` → **404**, nessun redirect. OK.
- Nessuna eccezione non gestita nei log del dev server.
- **NON ho testato un certificato reale con firma valida**: richiede un documento caricato (upload autenticato). Resta verifica manuale di Simone (badge verde, copia hash, link al precedente). La verifica firma ed25519 era già provata a runtime in Fase 1.

### Prossimo step
Fase 4 — Dashboard cliente (rifinitura) oppure Fase 5 — Resoconto IA:
- Resoconto IA fattuale (estrazione parti/date/importi/tipo danno) con API Claude, disclaimer fisso, popolamento async di `documents.ai_summary`.

### Note aperte (storiche)
- Supabase: secondo progetto free (il primo è usato da Huntlist).
- Nome "Filament" è placeholder — find & replace quando si decide il nome definitivo.
- File convention: l'auth proxy vive in `src/proxy.ts` (NON `src/middleware.ts`) per via della deprecazione in Next.js 16.

---

## Sessione precedente: Fase 2 — Upload e hash-chain

### Completato
- `src/app/dashboard/upload/actions.ts` — server action `uploadAction`: getUser → SHA-256 del file → recupero ultimo blocco (previous_hash) → `block_hash = SHA-256(fileHash | previousHash|GENESIS | timestamp)` → decifra chiave privata con la password e firma il block_hash → upload in Storage → insert append-only in `documents`. Rollback dello Storage se l'insert fallisce.
- `src/app/dashboard/upload/page.tsx` — form client: input file (pdf/jpg/jpeg/png/webp), campo password, stato loading, errore inline, redirect a `/certificato/[id]` al successo. Dark mode.
- `src/app/dashboard/page.tsx` — Server Component: lista documenti del cliente (filtro per `profile_id`), data formattata it-IT, link "Vedi certificato", empty-state con link all'upload, bottone "Carica nuovo documento".
- `supabase/storage-policies.sql` — policy Storage (insert/select only own folder). **Da eseguire manualmente.**
- `npm run build` e `npm run lint` → zero warning.

### Scelte tecniche di questa sessione
- **`randomUUID` importato da `node:crypto`** invece del `crypto.randomUUID()` globale dello spec. Sotto `strict` + `no-require-imports`, affidarsi al global `crypto` rischiava un "Cannot find name 'crypto'"; l'import nominato è esplicito e coerente con la regola del progetto.
- **`.maybeSingle()` invece di `.single()`** per il lookup dell'ultimo blocco (genesis): con zero righe `.single()` restituisce un errore PGRST116, `.maybeSingle()` restituisce `null` pulito. Comportamento identico (la catena parte con `previous_hash = null`), ma senza errore spurio.
- **Filtro esplicito `profile_id` nella dashboard.** La tabella `documents` ha una policy `SELECT USING (true)` (per i certificati pubblici): essendo permissiva, senza filtro un utente autenticato vedrebbe TUTTI i documenti. Il filtro per `profile_id = user.id` è quindi necessario, non opzionale.
- **Insert documenti via service-role (`admin`)** come da spec; lo Storage usa invece il client authenticated così le policy "own folder" valgono. La firma e l'hashing avvengono server-side (la password non lascia mai il server se non per derivare la chiave).
- **`.returns<DocumentRow[]>()`** per tipizzare la query Supabase senza `any` e senza generare tipi dal DB.

### Bug / punti d'attenzione
- **Bug: limite body delle Server Actions (1MB) vs file fino a 50MB.** Le Server Actions di Next.js hanno un limite di default di **1MB** sul body. L'upload tramite `uploadAction` passa il file dentro la FormData della server action, quindi qualsiasi documento > 1MB falliva con "Body exceeded 1mb limit" — incompatibile con il bucket Storage (50MB). **Fix:** in `next.config.ts` aggiunto `experimental.serverActions.bodySizeLimit: '50mb'` per allinearlo al limite dello Storage. Build verificato (config riconosciuta sotto `experimental`).
- Due adattamenti rispetto allo spec (randomUUID import, maybeSingle) per robustezza/lint — vedi sopra.
- Promemoria sicurezza per Fase 3: la policy pubblica `documents: SELECT USING (true)` espone TUTTE le colonne (inclusi `storage_path`, `signature`, `file_hash`). Per il certificato pubblico esporre solo i campi necessari (view o select mirata), non la riga intera.

### Verifica eseguita
- Build + lint puliti.
- `/dashboard` e `/dashboard/upload` senza sessione → **307 → /login** (gate del layout + proxy, testato con HttpClient).
- **NON ho testato un upload reale**: richiede sessione autenticata + Storage reale; resta verifica manuale di Simone. La logica crypto/hash-chain è già stata verificata a runtime nella Fase 1.

### Da fare manualmente (Simone) prima di testare
1. Eseguire `supabase/storage-policies.sql` nel SQL Editor.
2. Verifica flusso: login → `/dashboard` (lista vuota) → `/dashboard/upload` → carica PDF + password corretta → redirect a `/certificato/[id]` → record in `documents` con `previous_hash` null al primo doc, e `previous_hash` del secondo = `block_hash` del primo.

### Prossimo step
Fase 3 — Certificato pubblico (`/certificato/[id]`):
- Pagina pubblica (no auth) che mostra hash, data, stato integrità, e in prospettiva la Merkle proof.
- Esporre SOLO i campi pubblici necessari (vedi nota sicurezza sopra).
- Verifica firma con la chiave pubblica del cliente.

### Note aperte (storiche)
- Supabase: secondo progetto free (il primo è usato da Huntlist).
- Nome "Filament" è placeholder — find & replace quando si decide il nome definitivo.
- File convention: l'auth proxy vive in `src/proxy.ts` (NON `src/middleware.ts`) per via della deprecazione in Next.js 16.

---

## Sessione precedente: Fase 1 — Schema dati Supabase e auth

### Completato
- SQL schema completo in `supabase/schema.sql` (profiles, documents, merkle_roots, RLS, note bucket Storage). **Da eseguire manualmente** in Supabase SQL Editor — non l'ho eseguito io.
- `src/app/dashboard/layout.tsx` — vero gate di autenticazione: `getUser()` server-side, redirect a `/login` se non autenticato. Il proxy resta come prima linea di difesa (redirect rapido), la verifica reale è qui.
- `src/lib/crypto.ts` — generazione coppia ed25519, firma/verifica, cifratura/decifratura chiave privata (PBKDF2 100k → AES-256-GCM). Solo server-side.
- `src/lib/supabase/admin.ts` — client service-role (bypass RLS), usato solo nel signup server-side.
- `src/app/(auth)/signup/page.tsx` (form client) + `src/app/(auth)/signup/actions.ts` (server action): signUp → genera chiavi → cifra privata → insert in `profiles`.
- `src/app/(auth)/login/page.tsx` — form client con `signInWithPassword`, errore inline, redirect a `/dashboard`.
- `.env.local` e `.env.example` — aggiunta `SUPABASE_SERVICE_ROLE_KEY`.
- `npm run build` e `npm run lint` → zero warning.

### Scelte tecniche di questa sessione
- **Dipendenze a versione major più nuova dello spec.** `@noble/ed25519` installato è **v3.1.0** (non v1/v2) e `@noble/hashes` **v2.2.0**. L'API è cambiata:
  - `ed.utils.randomPrivateKey()` → **`ed.utils.randomSecretKey()`**.
  - Lo shim `ed.etc.sha512Sync = …` e l'import `@noble/hashes/sha512` dello spec sono **obsoleti**: in v3 l'hashing SHA-512 è integrato e le API async (`getPublicKeyAsync`/`signAsync`/`verifyAsync`) funzionano senza setup. Rimossi.
  - Verificato a runtime: keygen + sign/verify + encrypt/decrypt + rifiuto password errata (GCM) tutti OK.
- **`node:crypto` con import nominati** invece di `const crypto = require('crypto')`: il `require` faceva scattare la regola ESLint `no-require-imports` (zero-warning richiesto). Stessa logica AES-256-GCM, formato blob invariato: `iv(12) | authTag(16) | ciphertext`, base64.
- **Service-role client per l'insert del profilo (deviazione necessaria).** Con email-confirmation attiva, dopo `signUp()` NON c'è sessione → `auth.uid()` è null → la policy RLS `profiles: insert own` (auth.uid() = id) **bloccherebbe** l'insert dall'authenticated client. Soluzione standard: insert via service role (bypassa RLS) dentro la server action. Richiede `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` (vedi Note aperte). Le policy RLS dello schema restano invariate e strette.
- **Signup come Server Action** (`signup/actions.ts`, `'use server'`) + form client: la crittografia usa `node:crypto`/`Buffer` (solo server), quindi `crypto.ts` non deve mai finire nel bundle browser. Il form client gestisce errori/stato inline e chiama l'action. File extra rispetto allo spec ma necessario e isolato.
- **Login: `router.refresh()` poi `router.push('/dashboard')`** dopo il login, così i Server Component rileggono il cookie di sessione appena impostato dal browser client.

### Bug incontrati e risolti
- **API noble v3 ≠ spec (v1/v2).** `randomPrivateKey`/`sha512Sync` non esistono più → build sarebbe fallito. Adattato all'API v3 (vedi sopra).
- **Insert profilo bloccato da RLS in signup.** Risolto col service-role client (vedi sopra). Senza, il profilo non veniva mai creato con email-confirmation attiva.
- **`no-require-imports`** sul `require('crypto')` dello spec → sostituito con import nominati `node:crypto`.

### Verifica eseguita
- Crypto roundtrip a runtime: chiave privata encrypt→decrypt OK; password errata rifiutata (auth tag GCM) OK; firma/verifica ed25519 OK.
- `/signup` → 200, form con "Nome studio"/email/password. OK.
- `/login` → 200, form + link "Non hai un account? Registrati". OK.
- `/dashboard` e `/dashboard/anything` senza sessione → **307 redirect a `/login`** (verificato con HttpClient, no auto-redirect). OK.
- Build + lint puliti.
- **NON ho testato un signup reale**: invierebbe una mail vera e creerebbe un utente nel progetto Supabase di Simone. Lasciato alla verifica manuale.

### Da fare manualmente (Simone) prima di testare il flusso completo
1. Eseguire `supabase/schema.sql` nel SQL Editor di Supabase.
2. Creare il bucket Storage `documents` (privato, 50MB, MIME pdf/jpeg/png/webp).
3. Compilare `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` (Dashboard → Settings → API → service_role). **Segreta**, mai esporla al client.
4. (Opzionale) Decidere se tenere l'email-confirmation attiva o disattivarla per i test.

### Prossimo step
Fase 2 — Upload e hash-chain:
- Upload file → SHA-256 → calcolo `block_hash` (file_hash + previous_hash + timestamp) → firma con chiave privata (decifrata con la password al momento) → insert in `documents`.
- Recupero `previous_hash` dall'ultimo blocco del cliente.
- Salvataggio file in Storage `documents`.

### Note aperte (storiche)
- Supabase: secondo progetto free (il primo è usato da Huntlist).
- Nome "Filament" è placeholder — find & replace quando si decide il nome definitivo.
- File convention: l'auth proxy vive in `src/proxy.ts` (NON `src/middleware.ts`) per via della deprecazione in Next.js 16.

---

## Sessione precedente: Fase 0 — Setup progetto

### Completato
- Progetto Next.js 16 creato con TypeScript strict, Tailwind, App Router, src-dir
- Dipendenze installate: @supabase/supabase-js, @supabase/ssr
- Supabase client configurato (client.ts per browser, server.ts per server con cookies())
- Auth proxy configurato: protegge /dashboard, rinnova sessione, getUser() server-side
- Struttura cartelle creata: app/, components/ui/, lib/supabase/, lib/utils.ts
- Pagine placeholder create: /, /login, /dashboard, /certificato/[id]
- Dark mode funzionante su tutte le pagine placeholder
- .env.local creato (valori da compilare manualmente)
- .env.example creato e committabile
- CLAUDE.md creato con contesto completo del progetto
- handoff.md creato (questo file)
- `npm run lint` → zero warning. `npm run build` → compila pulito, zero warning.

### Scelte tecniche di questa sessione
- @supabase/ssr usato al posto del client legacy per compatibilità con Next.js App Router e cookies server-side.
- **middleware → proxy (Next.js 16)**: il prompt originale prevedeva `src/middleware.ts`, ma questa versione di Next.js ha **deprecato** la convenzione `middleware` rinominandola `proxy` (il build emetteva un warning). Per avere un build pulito ho migrato la logica in `src/proxy.ts` (export `proxy`, stesso `matcher: ['/dashboard/:path*']`). La logica di refresh sessione + protezione route vive in `src/lib/supabase/middleware.ts` (`updateSession`), invocata da `proxy.ts`. Comportamento identico a quello richiesto.
- `proxy.ts` gestisce il refresh della sessione su ogni request alle route protette per evitare sessioni scadute silenziosamente.
- Route group `(auth)` usato per isolare le pagine di autenticazione senza influenzare il path URL (`/login` resta `/login`).
- Fail-safe auth in `updateSession`: se Supabase non è raggiungibile/configurato, sia la creazione del client sia `getUser()` sono in try/catch e l'utente viene trattato come **non autenticato** → le route protette vengono rimandate a `/login`. Questo rafforza la regola "mai fidarsi del client per l'auth" (fallimento = accesso negato) e ha reso possibile testare il redirect anche con `.env.local` non ancora compilato.
- `turbopack.root` impostato in `next.config.ts` su `__dirname`: esiste un `package-lock.json` anche nella home dell'utente (`C:\Users\simon\`) e Turbopack lo inferiva erroneamente come root del workspace. Pinnando la root il warning sparisce.

### Bug incontrati e risolti
- **`/dashboard` restituiva 500 invece del redirect.** Causa: `.env.local` contiene placeholder (`your-supabase-url`), e `createServerClient` lancia `Invalid supabaseUrl: Must be a valid HTTP or HTTPS URL`. Risolto con il fail-safe in `updateSession` (vedi sopra): ora con env placeholder `/dashboard` → **307 redirect a `/login`** invece di 500. Con credenziali Supabase reali il comportamento è quello atteso (sessione valida → accesso; nessuna sessione → /login).
- **Build con warning** (convenzione `middleware` deprecata + lockfile multipli). Risolti con la migrazione a `proxy` e con `turbopack.root`.

### Verifica manuale eseguita (dev server)
- `GET /` → 200, contiene "Filament". OK.
- `GET /dashboard` → 307 redirect a `/login` (con env placeholder, grazie al fail-safe). OK.
- `GET /login` → 200, contiene "Login". OK.
- `GET /certificato/abc123` → 200, mostra l'id dinamico. OK.

### Prossimo step
Fase 1 — Schema dati Supabase e auth:
- Tabelle: profiles, documents, merkle_roots
- RLS append-only sulle tabelle critiche
- Generazione coppia chiavi RSA/ed25519 per cliente alla registrazione
- Login/signup funzionante con Supabase Auth

### Note aperte
- `.env.local` da compilare con URL e anon key del progetto Supabase (ora contiene placeholder).
- Supabase: secondo progetto free (il primo è usato da Huntlist).
- Nome "Filament" è placeholder — find & replace quando si decide il nome definitivo.
- `CLAUDE.md` importa `AGENTS.md` (generato da create-next-app) che avverte: questa versione di Next.js 16 ha breaking changes rispetto al training — consultare `node_modules/next/dist/docs/` prima di scrivere codice. L'import è stato mantenuto in cima a CLAUDE.md.
- File convention: l'auth proxy vive in `src/proxy.ts` (NON `src/middleware.ts`) per via della deprecazione in Next.js 16.
