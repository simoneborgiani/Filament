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
          <h1 className="font-heading text-4xl font-bold tracking-tight text-ink sm:text-6xl dark:text-snow">
            La tua perizia, certificata in un clic
          </h1>
          <p className="font-body mx-auto mt-6 max-w-2xl text-lg text-ink/70 dark:text-snow/70">
            Ogni documento che carichi riceve automaticamente una prova di
            integrità verificabile da chiunque — assicurazione, avvocato, giudice
            — senza bisogno di account o fiducia nella parola dello studio.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="neo-btn inline-flex w-full items-center justify-center rounded-sm border-2 border-ink bg-blue-brand px-5 py-2.5 font-body font-medium text-snow sm:w-auto dark:border-edge"
            >
              Inizia gratis
            </Link>
            <Link
              href="/login"
              className="neo-btn inline-flex w-full items-center justify-center rounded-sm border-2 border-ink bg-paper px-5 py-2.5 font-body font-medium text-ink sm:w-auto dark:border-edge dark:bg-void dark:text-snow"
            >
              Accedi
            </Link>
          </div>
        </div>
      </section>

      {/* Problema */}
      <section className="border-t-2 border-ink px-6 py-20 dark:border-edge">
        <div className="mx-auto max-w-5xl">
          <h2 className="font-heading text-center text-3xl font-bold tracking-tight text-ink dark:text-snow">
            Una perizia contestata può costarti cara
          </h2>
          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
            {problemi.map((p) => (
              <div
                key={p.titolo}
                className="rounded-sm border-2 border-ink bg-paper p-6 shadow-neo dark:border-edge dark:bg-surface dark:shadow-neo-dark"
              >
                <div className="text-3xl" aria-hidden>
                  {p.icon}
                </div>
                <h3 className="font-heading mt-4 text-lg font-bold text-ink dark:text-snow">
                  {p.titolo}
                </h3>
                <p className="font-body mt-2 text-sm leading-relaxed text-ink/70 dark:text-snow/70">
                  {p.testo}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Come funziona */}
      <section className="border-t-2 border-ink px-6 py-20 dark:border-edge">
        <div className="mx-auto max-w-5xl">
          <h2 className="font-heading text-center text-3xl font-bold tracking-tight text-ink dark:text-snow">
            Tre passi, zero complessità
          </h2>
          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
            {passi.map((s, i) => (
              <div key={s.titolo} className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-sm border-2 border-ink bg-blue-brand font-heading text-lg font-bold text-snow dark:border-edge">
                  {i + 1}
                </div>
                <h3 className="font-heading mt-5 text-lg font-bold text-ink dark:text-snow">
                  {s.titolo}
                </h3>
                <p className="font-body mt-2 text-sm leading-relaxed text-ink/70 dark:text-snow/70">
                  {s.testo}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Value prop */}
      <section className="border-t-2 border-ink px-6 py-20 dark:border-edge">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-heading text-3xl font-bold tracking-tight text-ink dark:text-snow">
            Pensato per chi lavora con le pratiche ogni giorno
          </h2>
          <p className="font-body mx-auto mt-6 max-w-2xl text-lg text-ink/70 dark:text-snow/70">
            In più, ogni documento viene riassunto automaticamente — parti
            coinvolte, date, importi, tipo di danno dichiarato — così puoi
            orientarti in una pratica in secondi, senza rileggere tutto da capo.
          </p>
          <p className="font-body mx-auto mt-4 max-w-xl text-xs text-ink/50 dark:text-snow/50">
            Il resoconto automatico è a scopo organizzativo e non costituisce
            consulenza legale né perizia tecnica.
          </p>
        </div>
      </section>

      {/* CTA finale */}
      <section className="border-t-2 border-ink px-6 py-20 dark:border-edge">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-3xl font-bold tracking-tight text-ink dark:text-snow">
            Inizia a certificare le tue perizie oggi
          </h2>
          <p className="font-body mt-4 text-lg text-ink/70 dark:text-snow/70">
            Un mese gratuito, nessuna carta di credito richiesta.
          </p>
          <Link
            href="/signup"
            className="neo-btn mt-8 inline-flex items-center justify-center rounded-sm border-2 border-ink bg-blue-brand px-5 py-2.5 font-body font-medium text-snow dark:border-edge"
          >
            Crea il tuo account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t-2 border-ink px-6 py-10 dark:border-edge">
        <div className="font-body mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 text-sm text-ink/60 sm:flex-row dark:text-snow/60">
          <p>
            Filament — Sistema di certificazione documenti per studi di
            infortunistica
          </p>
          <Link
            href="/login"
            className="font-medium text-ink underline underline-offset-4 hover:text-blue-brand dark:text-snow"
          >
            Accedi
          </Link>
        </div>
      </footer>
    </div>
  )
}
