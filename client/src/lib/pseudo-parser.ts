import { ParsedCode, PseudoEvent, ParseError } from "@shared/schema";

interface PseudoVariable {
  name: string;
  value: string;
}

interface PseudoProcedure {
  name: string;
  parameters: string[];
  actions: any[];
}

interface PseudoAction {
  type: 'set' | 'call' | 'define' | 'assign';
  component?: string;
  property?: string;
  value?: string;
  method?: string;
  parameters?: string[];
  variable?: string;
}

interface ConditionalBlock {
  type: 'if' | 'else_if' | 'else';
  condition?: string;
  actions: PseudoAction[];
}

interface LoopBlock {
  type: 'for_each' | 'while';
  condition?: string;
  item?: string;
  list?: string;
  actions: PseudoAction[];
}

export interface ParsedCode {
  events: Array<{
    component: string;
    event: string;
    actions: Array<{
      type: 'set' | 'call' | 'assign' | 'if' | 'while' | 'foreach';
      component?: string;
      property?: string;
      method?: string;
      value?: string;
      variable?: string;
      condition?: string;
      parameters?: string[];
      actions?: any[];
      elseActions?: any[];
    }>;
  }>;
  variables: Array<{
    name: string;
    value: string;
  }>;
  procedures: Array<{
    name: string;
    parameters: string[];
    actions: any[];
  }>;
  components: string[];
  errors: Array<{
    line: number;
    message: string;
  }>;
}
export function parsePseudoCode(code: string): ParsedCode {
  const lines = code.split('\n');
  const events: ParsedCode['events'] = [];
  const variables: ParsedCode['variables'] = [];
  const procedures: ParsedCode['procedures'] = [];
  const components = new Set<string>();
  const errors: ParsedCode['errors'] = [];

  let currentEvent: ParsedCode['events'][0] | null = null;
  let currentProcedure: ParsedCode['procedures'][0] | null = null;
  let currentContext: 'event' | 'procedure' | 'none' = 'none';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const lineNumber = i + 1;

    // Skip empty lines and comments
    if (!line || line.startsWith('//')) {
      continue;
    }

    // Variable definition: "Define Variable as Value"
    const defineVarMatch = line.match(/^Define\s+(\w+)\s+as\s+(.+)$/i);
    if (defineVarMatch) {
      const [, varName, value] = defineVarMatch;
      variables.push({
        name: varName,
        value: value.trim()
      });
      continue;
    }

    // Procedure definition: "Define ProcedureName(parameters)"
    const defineProcMatch = line.match(/^Define\s+(\w+)(?:\(([^)]*)\))?$/i);
    if (defineProcMatch && !defineVarMatch) {
      const [, procName, params] = defineProcMatch;

      if (currentEvent) {
        events.push(currentEvent);
        currentEvent = null;
      }
      if (currentProcedure) {
        procedures.push(currentProcedure);
      }

      const parameters = params ? params.split(',').map(p => p.trim()) : [];
      currentProcedure = {
        name: procName,
        parameters,
        actions: []
      };
      currentContext = 'procedure';
      continue;
    }

    // Event handler: "When ComponentName.EventName" or "On ComponentName.EventName do"
    const eventMatch = line.match(/^(?:When|On)\s+(\w+)\.(\w+)(?:\s+do)?$/i);
    if (eventMatch) {
      const [, component, event] = eventMatch;

      if (currentEvent) {
        events.push(currentEvent);
      }
      if (currentProcedure) {
        procedures.push(currentProcedure);
        currentProcedure = null;
      }

      currentEvent = {
        component,
        event,
        actions: []
      };
      currentContext = 'event';

      components.add(component);
      continue;
    }

    // Variable assignment: "Set Variable to Value"
    const assignMatch = line.match(/^Set\s+(\w+)\s+to\s+(.+)$/i);
    if (assignMatch && !assignMatch[1].includes('.')) {
      const [, variable, value] = assignMatch;

      if (currentContext === 'none') {
        errors.push({
          line: lineNumber,
          message: "Action found without preceding event handler, procedure, or control structure"
        });
        continue;
      }

      const action = {
        type: 'assign' as const,
        variable,
        value: value.trim()
      };

      if (currentContext === 'event' && currentEvent) {
        currentEvent.actions.push(action);
      } else if (currentContext === 'procedure' && currentProcedure) {
        currentProcedure.actions.push(action);
      }
      continue;
    }

    // Property setting: "Set ComponentName.Property to Value"
    const setMatch = line.match(/^Set\s+(\w+)\.(\w+)\s+to\s+(.+)$/i);
    if (setMatch) {
      const [, component, property, value] = setMatch;

      if (currentContext === 'none') {
        errors.push({
          line: lineNumber,
          message: "Action found without preceding event handler, procedure, or control structure"
        });
        continue;
      }

      const action = {
        type: 'set' as const,
        component,
        property,
        value: value.trim()
      };

      if (currentContext === 'event' && currentEvent) {
        currentEvent.actions.push(action);
      } else if (currentContext === 'procedure' && currentProcedure) {
        currentProcedure.actions.push(action);
      }

      components.add(component);
      continue;
    }

    // Method call: "Call ComponentName.Method" or "Call ProcedureName(params)"
    const callMatch = line.match(/^Call\s+(\w+)(?:\.(\w+))?(?:\s*\(([^)]*)\)|\s+(.+))?$/i);
    if (callMatch) {
      const [, componentOrProc, method, parenParams, spaceParams] = callMatch;

      if (currentContext === 'none') {
        errors.push({
          line: lineNumber,
          message: "Action found without preceding event handler, procedure, or control structure"
        });
        continue;
      }

      let parameters: string[] = [];
      if (parenParams) {
        parameters = parenParams.split(',').map(p => p.trim()).filter(p => p);
      } else if (spaceParams) {
        parameters = [spaceParams.trim()];
      }

      const action = {
        type: 'call' as const,
        component: componentOrProc,
        method: method || componentOrProc,
        parameters
      };

      if (currentContext === 'event' && currentEvent) {
        currentEvent.actions.push(action);
      } else if (currentContext === 'procedure' && currentProcedure) {
        currentProcedure.actions.push(action);
      }

      if (method) {
        components.add(componentOrProc);
      }
      continue;
    }

    // Conditional: "If Condition then"
    const ifMatch = line.match(/^If\s+(.+)\s+then$/i);
    if (ifMatch) {
      const [, condition] = ifMatch;

      if (currentContext === 'none') {
        errors.push({
          line: lineNumber,
          message: "Action found without preceding event handler, procedure, or control structure"
        });
        continue;
      }

      const action = {
        type: 'if' as const,
        condition: condition.trim(),
        actions: [],
        elseActions: []
      };

      if (currentContext === 'event' && currentEvent) {
        currentEvent.actions.push(action);
      } else if (currentContext === 'procedure' && currentProcedure) {
        currentProcedure.actions.push(action);
      }
      continue;
    }

    // While loop: "While Condition do"
    const whileMatch = line.match(/^While\s+(.+)\s+do$/i);
    if (whileMatch) {
      const [, condition] = whileMatch;

      if (currentContext === 'none') {
        errors.push({
          line: lineNumber,
          message: "Action found without preceding event handler, procedure, or control structure"
        });
        continue;
      }

      const action = {
        type: 'while' as const,
        condition: condition.trim(),
        actions: []
      };

      if (currentContext === 'event' && currentEvent) {
        currentEvent.actions.push(action);
      } else if (currentContext === 'procedure' && currentProcedure) {
        currentProcedure.actions.push(action);
      }
      continue;
    }

    // For each loop: "For each Item in List do"
    const forEachMatch = line.match(/^For\s+each\s+(\w+)\s+in\s+(\w+)\s+do$/i);
    if (forEachMatch) {
      const [, item, list] = forEachMatch;

      if (currentContext === 'none') {
        errors.push({
          line: lineNumber,
          message: "Action found without preceding event handler, procedure, or control structure"
        });
        continue;
      }

      const action = {
        type: 'foreach' as const,
        variable: item,
        value: list,
        actions: []
      };

      if (currentContext === 'event' && currentEvent) {
        currentEvent.actions.push(action);
      } else if (currentContext === 'procedure' && currentProcedure) {
        currentProcedure.actions.push(action);
      }
      continue;
    }

    // If we reach here, it's an unrecognized line
    if (line && !line.match(/^(?:Else|End)/i)) {
      errors.push({
        line: lineNumber,
        message: `Unrecognized syntax: ${line}`
      });
    }
  }

  // Add the last event/procedure if exists
  if (currentEvent) {
    events.push(currentEvent);
  }
  if (currentProcedure) {
    procedures.push(currentProcedure);
  }

  // Ensure all required arrays are present and valid
  const result = {
    events: events || [],
    variables: variables || [],
    procedures: procedures || [],
    components: Array.from(components) || [],
    errors: errors || []
  };

  console.log("Parser result:", result);
  return result;
}