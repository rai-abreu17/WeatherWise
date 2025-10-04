import { z } from "zod";

export const climateAnalysisSchema = z.object({
  location: z.string()
    .trim()
    .min(2, { message: "Localização deve ter pelo menos 2 caracteres" })
    .max(200, { message: "Localização muito longa" }),
  date: z.string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Data inválida" }),
  eventType: z.enum([
    "wedding",
    "sports",
    "festival",
    "agriculture",
    "corporate",
    "outdoor"
  ], { message: "Tipo de evento inválido" }),
  preferredTemperature: z.number()
    .min(15, { message: "Temperatura mínima: 15°C" })
    .max(40, { message: "Temperatura máxima: 40°C" })
});

export type ClimateAnalysisInput = z.infer<typeof climateAnalysisSchema>;
