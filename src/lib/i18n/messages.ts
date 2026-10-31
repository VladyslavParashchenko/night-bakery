import en from "../../../messages/en.json"
import uk from "../../../messages/uk.json"

export const locales = ["uk", "en"] as const
export type Locale = (typeof locales)[number]

type Key = keyof typeof uk
type Params = Record<string, string | number>
export type Message = (params?: Params) => string

const STORAGE_KEY = "night-bakery:locale"
const BASE_LOCALE: Locale = "uk"

// A message missing from any catalog is a type error.
const catalogs: Record<Locale, Record<Key, string>> = { uk, en }

function isLocale(value: unknown): value is Locale {
  return locales.includes(value as Locale)
}

function detectLocale(): Locale {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (isLocale(stored)) return stored
  } catch {
    // No storage: use the browser languages.
  }
  const preferred = (globalThis.navigator?.languages ?? [])
    .map((language) => language.split("-")[0])
    .find(isLocale)
  return preferred ?? BASE_LOCALE
}

const locale = detectLocale()

export function getLocale() {
  return locale
}

// The locale is fixed at startup, so switching reloads the page.
export function setLocale(next: Locale) {
  try {
    localStorage.setItem(STORAGE_KEY, next)
  } catch {
    // Without storage the reload would lose the choice.
    return
  }
  location.reload()
}

function format(template: string, params: Params = {}) {
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  )
}

export const m = Object.fromEntries(
  Object.entries(catalogs[locale]).map(([key, template]) => [
    key,
    (params?: Params) => format(template, params),
  ]),
) as Record<Key, Message>
