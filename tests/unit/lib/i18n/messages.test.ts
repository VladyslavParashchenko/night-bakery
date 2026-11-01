import { describe, expect, it } from "vitest"
import { getLocale, m, pickLocale } from "$lib/i18n/messages"
import en from "../../../../messages/en.json"
import uk from "../../../../messages/uk.json"

function placeholders(template: string) {
  return [...template.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort()
}

describe("messages", () => {
  it("has the same keys and placeholders in every language", () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(uk).sort())
    for (const [key, template] of Object.entries(uk)) {
      expect(placeholders(en[key as keyof typeof en]), key).toEqual(
        placeholders(template),
      )
    }
  })

  it("fills placeholders and leaves missing ones intact", () => {
    const template = { uk, en }[getLocale()].ovenLabel
    expect(m.ovenLabel({ number: 2 })).toBe(template.replace("{number}", "2"))
    expect(m.ovenLabel()).toBe(template)
  })

  it("picks the saved locale, then the browser's, then English", () => {
    expect(pickLocale("uk", ["en-US"])).toBe("uk")
    expect(pickLocale("en", ["uk-UA"])).toBe("en")
    expect(pickLocale(null, ["de-DE", "uk-UA", "en"])).toBe("uk")
    // English never outranks another language the browser asks for.
    expect(pickLocale(null, ["en-US", "zh-CN", "en", "uk"])).toBe("uk")
    expect(pickLocale(null, ["en-US", "zh-CN"])).toBe("en")
    expect(pickLocale(null, ["en-US", "ru-RU"])).toBe("uk")
    expect(pickLocale("ru", ["en-US"])).toBe("en")
    expect(pickLocale("fr", ["es-US", "zh-CN"])).toBe("en")
    expect(pickLocale(null, [])).toBe("en")
  })
})
