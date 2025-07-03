
import { z } from "zod";

export const PseudoActionSchema = z.object({
  type: z.enum(['set', 'call', 'define', 'assign']).optional(),
  component: z.string().optional(),
  property: z.string().optional(),
  value: z.string().optional(),
  method: z.string().optional(),
  parameters: z.array(z.string()).optional(),
  variable: z.string().optional(),
});

export const ConditionalBlockSchema = z.object({
  type: z.enum(['if', 'else_if', 'else']),
  condition: z.string().optional(),
  actions: z.array(PseudoActionSchema),
});

export const LoopBlockSchema = z.object({
  type: z.enum(['for_each', 'while']),
  condition: z.string().optional(),
  item: z.string().optional(),
  list: z.string().optional(),
  actions: z.array(PseudoActionSchema),
});

export const PseudoVariableSchema = z.object({
  name: z.string(),
  value: z.string(),
});

export const PseudoProcedureSchema = z.object({
  name: z.string(),
  parameters: z.array(z.string()),
  actions: z.array(PseudoActionSchema),
});

export const PseudoEventSchema = z.object({
  component: z.string(),
  event: z.string(),
  actions: z.array(PseudoActionSchema),
});

export const ParseErrorSchema = z.object({
  line: z.number(),
  message: z.string(),
});

export const ParsedCodeSchema = z.object({
  events: z.array(PseudoEventSchema),
  components: z.array(z.string()),
  errors: z.array(ParseErrorSchema),
  variables: z.array(PseudoVariableSchema).optional(),
  procedures: z.array(PseudoProcedureSchema).optional(),
});

export type PseudoAction = z.infer<typeof PseudoActionSchema>;
export type ConditionalBlock = z.infer<typeof ConditionalBlockSchema>;
export type LoopBlock = z.infer<typeof LoopBlockSchema>;
export type PseudoVariable = z.infer<typeof PseudoVariableSchema>;
export type PseudoProcedure = z.infer<typeof PseudoProcedureSchema>;
export type PseudoEvent = z.infer<typeof PseudoEventSchema>;
export type ParseError = z.infer<typeof ParseErrorSchema>;
export type ParsedCode = z.infer<typeof ParsedCodeSchema>;
