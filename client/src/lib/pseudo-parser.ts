
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

export function parsePseudoCode(code: string): ParsedCode {
  const lines = code.split('\n');
  const events: PseudoEvent[] = [];
  const components = new Set<string>();
  const errors: ParseError[] = [];
  const variables: PseudoVariable[] = [];
  const procedures: PseudoProcedure[] = [];
  
  let currentEvent: PseudoEvent | null = null;
  let currentProcedure: PseudoProcedure | null = null;
  let currentConditional: ConditionalBlock | null = null;
  let currentLoop: LoopBlock | null = null;
  let indentLevel = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();
    const lineNumber = i + 1;
    
    // Skip empty lines and comments
    if (!trimmedLine || trimmedLine.startsWith('//')) {
      continue;
    }
    
    // Calculate indentation level
    const currentIndent = line.length - line.trimStart().length;
    
    // Reset context based on indentation
    if (currentIndent <= indentLevel) {
      currentConditional = null;
      currentLoop = null;
    }
    
    try {
      // 1. Event Handlers: "On Component.Event do" or "When Component.Event"
      const eventMatch = trimmedLine.match(/^(?:On|When)\s+(\w+)\.(\w+)(?:\s+do)?$/i);
      if (eventMatch) {
        // Save previous event if exists
        if (currentEvent) {
          events.push(currentEvent);
        }
        
        const [, component, event] = eventMatch;
        components.add(component);
        
        currentEvent = {
          component,
          event,
          actions: []
        };
        indentLevel = currentIndent;
        continue;
      }
      
      // 2. Property Setting: "Set Component.Property to Value"
      const setPropertyMatch = trimmedLine.match(/^Set\s+(\w+)\.(\w+)\s+to\s+(.+)$/i);
      if (setPropertyMatch) {
        const [, component, property, value] = setPropertyMatch;
        components.add(component);
        
        const action = {
          component,
          property,
          value: value.replace(/^["']|["']$/g, '') // Remove quotes if present
        };
        
        addActionToCurrentContext(action, currentEvent, currentConditional, currentLoop, currentProcedure, errors, lineNumber);
        continue;
      }
      
      // 3. Variable Assignment: "Set Variable to Value"
      const setVariableMatch = trimmedLine.match(/^Set\s+(\w+)\s+to\s+(.+)$/i);
      if (setVariableMatch && !setPropertyMatch) {
        const [, variable, value] = setVariableMatch;
        
        const action = {
          type: 'assign' as const,
          variable,
          value: value.replace(/^["']|["']$/g, '')
        };
        
        addActionToCurrentContext(action, currentEvent, currentConditional, currentLoop, currentProcedure, errors, lineNumber);
        continue;
      }
      
      // 4. Method Calls: "Call Component.Method" or "Call Component.Method with Parameters"
      const callMatch = trimmedLine.match(/^Call\s+(\w+)\.(\w+)(?:\s+with\s+(.+))?$/i) || 
                       trimmedLine.match(/^Call\s+(\w+)\(([^)]*)\)$/i);
      if (callMatch) {
        const [, component, method, params] = callMatch;
        components.add(component);
        
        const parameters = params ? params.split(',').map(p => p.trim().replace(/^["']|["']$/g, '')) : [];
        
        const action = {
          type: 'call' as const,
          component,
          method,
          parameters
        };
        
        addActionToCurrentContext(action, currentEvent, currentConditional, currentLoop, currentProcedure, errors, lineNumber);
        continue;
      }
      
      // 5. Variable Declaration: "Define Variable as Value"
      const defineVariableMatch = trimmedLine.match(/^Define\s+(\w+)\s+as\s+(.+)$/i);
      if (defineVariableMatch) {
        const [, variable, value] = defineVariableMatch;
        
        variables.push({
          name: variable,
          value: value.replace(/^["']|["']$/g, '')
        });
        
        const action = {
          type: 'define' as const,
          variable,
          value: value.replace(/^["']|["']$/g, '')
        };
        
        addActionToCurrentContext(action, currentEvent, currentConditional, currentLoop, currentProcedure, errors, lineNumber);
        continue;
      }
      
      // 6. Procedure Definition: "Define ProcedureName" or "Define ProcedureName(parameters)"
      const defineProcedureMatch = trimmedLine.match(/^Define\s+(\w+)(?:\(([^)]*)\))?$/i);
      if (defineProcedureMatch) {
        const [, procName, params] = defineProcedureMatch;
        
        const parameters = params ? params.split(',').map(p => p.trim()) : [];
        
        currentProcedure = {
          name: procName,
          parameters,
          actions: []
        };
        
        procedures.push(currentProcedure);
        indentLevel = currentIndent;
        continue;
      }
      
      // 7. Conditional Logic: "If Condition then"
      const ifMatch = trimmedLine.match(/^If\s+(.+)\s+then$/i);
      if (ifMatch) {
        const [, condition] = ifMatch;
        
        currentConditional = {
          type: 'if',
          condition: condition.trim(),
          actions: []
        };
        
        indentLevel = currentIndent;
        continue;
      }
      
      // 8. Else If: "Else If Condition then"
      const elseIfMatch = trimmedLine.match(/^Else\s+If\s+(.+)\s+then$/i);
      if (elseIfMatch) {
        const [, condition] = elseIfMatch;
        
        currentConditional = {
          type: 'else_if',
          condition: condition.trim(),
          actions: []
        };
        
        indentLevel = currentIndent;
        continue;
      }
      
      // 9. Else: "Else"
      if (trimmedLine.match(/^Else$/i)) {
        currentConditional = {
          type: 'else',
          actions: []
        };
        
        indentLevel = currentIndent;
        continue;
      }
      
      // 10. For Each Loop: "For each Item in List do"
      const forEachMatch = trimmedLine.match(/^For\s+each\s+(\w+)\s+in\s+(\w+)\s+do$/i);
      if (forEachMatch) {
        const [, item, list] = forEachMatch;
        
        currentLoop = {
          type: 'for_each',
          item,
          list,
          actions: []
        };
        
        indentLevel = currentIndent;
        continue;
      }
      
      // 11. While Loop: "While Condition do"
      const whileMatch = trimmedLine.match(/^While\s+(.+)\s+do$/i);
      if (whileMatch) {
        const [, condition] = whileMatch;
        
        currentLoop = {
          type: 'while',
          condition: condition.trim(),
          actions: []
        };
        
        indentLevel = currentIndent;
        continue;
      }
      
      // If we reach here, the line doesn't match any known pattern
      errors.push({
        line: lineNumber,
        message: `Invalid syntax - see documentation for supported commands`
      });
      
    } catch (error) {
      errors.push({
        line: lineNumber,
        message: `Parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  }
  
  // Don't forget the last event
  if (currentEvent) {
    events.push(currentEvent);
  }
  
  return {
    events,
    components: Array.from(components).sort(),
    errors,
    variables,
    procedures
  };
}

function addActionToCurrentContext(
  action: any,
  currentEvent: PseudoEvent | null,
  currentConditional: ConditionalBlock | null,
  currentLoop: LoopBlock | null,
  currentProcedure: PseudoProcedure | null,
  errors: ParseError[],
  lineNumber: number
) {
  if (currentLoop) {
    currentLoop.actions.push(action);
  } else if (currentConditional) {
    currentConditional.actions.push(action);
  } else if (currentProcedure) {
    currentProcedure.actions.push(action);
  } else if (currentEvent) {
    currentEvent.actions.push(action);
  } else {
    errors.push({
      line: lineNumber,
      message: "Action found without preceding event handler, procedure, or control structure"
    });
  }
}
