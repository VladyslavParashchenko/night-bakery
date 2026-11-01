import en from "../../../messages/en.json"
import uk from "../../../messages/uk.json"

export const locales = ["uk", "en"] as const
export type Locale = (typeof locales)[number]

type Key = keyof typeof uk
type Params = Record<string, string | number>
export type Message = (params?: Params) => string

const STORAGE_KEY = "night-bakery:locale"
// For players whose browser asks for neither Ukrainian nor English.
const BASE_LOCALE: Locale = "en"
// Browser languages served by one of ours.
const ALIASES: Record<string, Locale> = { ru: "uk" }

// A message missing from any catalog is a type error.
const catalogs: Record<Locale, Record<Key, string>> = { uk, en }

function isLocale(value: unknown): value is Locale {
  return locales.includes(value as Locale)
}

// A saved choice wins. Otherwise English is only the fallback: browsers list
// it by default, so it should not hide another language we have further down.
// Regional variants such as "uk-UA" count as their language, and aliases
// such as Russian count as Ukrainian.
export function pickLocale(
  stored: string | null,
  languages: readonly string[],
): Locale {
  if (isLocale(stored)) return stored
  const preferred = languages
    .map((language) => language.split("-")[0].toLowerCase())
    .map((language) => ALIASES[language] ?? language)
    .find(
      (language): language is Locale =>
        isLocale(language) && language !== BASE_LOCALE,
    )
  return preferred ?? BASE_LOCALE
}

function detectLocale(): Locale {
  let stored: string | null = null
  try {
    stored = localStorage.getItem(STORAGE_KEY)
  } catch {
    // No storage: use the browser languages.
  }
  return pickLocale(stored, globalThis.navigator?.languages ?? [])
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
