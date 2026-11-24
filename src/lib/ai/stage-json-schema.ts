import { z } from "zod"

/**
 * zod-Schema → JSON-Schema für grammatikgebundene Dekodierung (ADR-0002).
 *
 * Ergebnisse werden gecacht: die Stufen-Schemata sind Modul-Konstanten, die
 * Konvertierung liefe sonst bei jedem Analyseaufruf erneut. Schlaegt sie fehl,
 * wird `undefined` geliefert — der Provider faellt dann auf `json_object`
 * zurueck, statt den Aufruf scheitern zu lassen.
 */
const jsonSchemaCache = new WeakMap<z.ZodType<unknown>, Record<string, unknown> | undefined>()

export function stageJsonSchema(schema: z.ZodType<unknown>): Record<string, unknown> | undefined {
  if (jsonSchemaCache.has(schema)) return jsonSchemaCache.get(schema)
  let converted: Record<string, unknown> | undefined
  try {
    converted = z.toJSONSchema(schema, {
      target: "draft-7",
      io: "input",
      override: ({ jsonSchema }) => {
        // Preserve the previous converter's closed object contract.
        if (jsonSchema.type === "object" && jsonSchema.additionalProperties === undefined) {
          jsonSchema.additionalProperties = false
        }
      }
    }) as Record<string, unknown>
  } catch {
    converted = undefined
  }
  jsonSchemaCache.set(schema, converted)
  return converted
}

