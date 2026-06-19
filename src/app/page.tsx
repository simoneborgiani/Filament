import Link from 'next/link'

const problemi = [
  {
    icon: '⏱',
    titolo: 'Contestazioni tardive',
    testo:
      'Mesi o anni dopo la consegna, qualcuno mette in dubbio quando e come è stata prodotta una perizia. Oggi non hai uno strumento immediato per dimostrarlo.',
  },
  {
    icon: '⚖️',
    titolo: 'Onere della prova',
    testo:
      "Quando l'importo del danno viene contestato, sei tu a dover provare che il documento è autentico e non alterato. Senza una prova verificabile, è solo la tua parola.",
  },
  {
    icon: '💸',
    titolo: 'Notarizzazione costosa',
    testo:
      'La notarizzazione tradizionale costa tempo e denaro per ogni singolo file. Non è sostenibile per studi che gestiscono decine di pratiche al mese.',
  },
]

const passi = [
  {
    titolo: 'Carica il documento',
    testo:
      'PDF, foto, relazione tecnica — qualsiasi file relativo alla pratica.',
  },
  {
    titolo: 'Il sistema certifica automaticamente',
    testo:
      'Data, ora e integrità del file vengono registrate in modo permanente. Nessun intervento manuale.',
  },
  {
    titolo: 'Condividi il certificato',
    testo:
      'Un link pubblico che chiunque può verificare in autonomia, senza account e senza doverti contattare.',
  },
]

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      {/* Hero */}
      <section className="px-6 py-24 text-center">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-6xl dark:text-zinc-50">
            La tua perizia, certificata in un clic
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
            Ogni documento che carichi riceve automaticamente una prova di
            integrità verificabile da chiunque — assicurazione, avvocato, giudice
            — senza bisogno di account o fiducia nella parola dello studio.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="inline-flex w-full items-center justify-center rounded-lg bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-700 sm:w-auto dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              Inizia gratis
            </Link>
            <Link
              href="/login"
              className="inline-flex w-full items-center justify-center rounded-lg border border-zinc-300 px-6 py-3 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-100 sm:w-auto dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800"
            >
              Accedi
            </Link>
          </div>
        </div>
      </section>

      {/* Problema */}
      <section className="border-t border-zinc-200 px-6 py-20 dark:border-zinc-800">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Una perizia contestata può costarti cara
          </h2>
          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
            {problemi.map((p) => (
              <div
                key={p.titolo}
                className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="text-3xl" aria-hidden>
                  {p.icon}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                  {p.titolo}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                  {p.testo}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Come funziona */}
      <section className="border-t border-zinc-200 px-6 py-20 dark:border-zinc-800">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Tre passi, zero complessità
          </h2>
          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
            {passi.map((s, i) => (
              <div key={s.titolo} className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900 text-lg font-semibold text-white dark:bg-zinc-50 dark:text-zinc-900">
                  {i + 1}
                </div>
                <h3 className="mt-5 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                  {s.titolo}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                  {s.testo}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Value prop */}
      <section className="border-t border-zinc-200 px-6 py-20 dark:border-zinc-800">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Pensato per chi lavora con le pratiche ogni giorno
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
            In più, ogni documento viene riassunto automaticamente — parti
            coinvolte, date, importi, tipo di danno dichiarato — così puoi
            orientarti in una pratica in secondi, senza rileggere tutto da capo.
          </p>
          <p className="mx-auto mt-4 max-w-xl text-xs text-zinc-500 dark:text-zinc-500">
            Il resoconto automatico è a scopo organizzativo e non costituisce
            consulenza legale né perizia tecnica.
          </p>
        </div>
      </section>

      {/* CTA finale */}
      <section className="border-t border-zinc-200 px-6 py-20 dark:border-zinc-800">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Inizia a certificare le tue perizie oggi
          </h2>
          <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
            Un mese gratuito, nessuna carta di credito richiesta.
          </p>
          <Link
            href="/signup"
            className="mt-8 inline-flex items-center justify-center rounded-lg bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            Crea il tuo account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-200 px-6 py-10 dark:border-zinc-800">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 text-sm text-zinc-500 sm:flex-row dark:text-zinc-400">
          <p>
            Filament — Sistema di certificazione documenti per studi di
            infortunistica
          </p>
          <Link
            href="/login"
            className="font-medium text-zinc-900 underline underline-offset-4 hover:text-zinc-600 dark:text-zinc-100 dark:hover:text-zinc-300"
          >
            Accedi
          </Link>
        </div>
      </footer>
    </div>
  )
}
