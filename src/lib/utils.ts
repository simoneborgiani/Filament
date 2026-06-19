/**
 * Concatena classi CSS condizionali in modo sicuro.
 * Filtra valori falsy così da poter usare espressioni come
 * `cn('base', condizione && 'extra')`.
 */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}
