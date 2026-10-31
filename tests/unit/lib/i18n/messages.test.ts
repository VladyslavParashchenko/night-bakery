import { describe, expect, it } from "vitest"
import { getLocale, m } from "$lib/i18n/messages"
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
})
