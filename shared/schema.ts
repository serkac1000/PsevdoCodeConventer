import { z } from "zod";

// Pseudo code parsing schemas
export const pseudoEventSchema = z.object({
  component: z.string(),
  event: z.string(),
  actions: z.array(z.object({
    component: z.string(),
    property: z.string(),
    value: z.string(),
  })),
});

export const parsedCodeSchema = z.object({
  events: z.array(pseudoEventSchema),
  components: z.array(z.string()),
  errors: z.array(z.object({
    line: z.number(),
    message: z.string(),
  })),
});

export type PseudoEvent = z.infer<typeof pseudoEventSchema>;
export type ParsedCode = z.infer<typeof parsedCodeSchema>;
export type ParseError = { line: number; message: string; };
