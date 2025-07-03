import { ParsedCode, PseudoEvent, ParseError } from "@shared/schema";

export function parsePseudoCode(code: string): ParsedCode {
  const lines = code.split('\n');
  const events: PseudoEvent[] = [];
  const components = new Set<string>();
  const errors: ParseError[] = [];
  
  let currentEvent: PseudoEvent | null = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const lineNumber = i + 1;
    
    // Skip empty lines and comments
    if (!line || line.startsWith('//')) {
      continue;
    }
    
    // Parse event handlers: "When Button1.Click"
    const eventMatch = line.match(/^When\s+(\w+)\.(\w+)$/);
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
      continue;
    }
    
    // Parse actions: "Set Screen1.BackgroundColor to Red"
    const actionMatch = line.match(/^\s*Set\s+(\w+)\.(\w+)\s+to\s+(.+)$/);
    if (actionMatch) {
      if (!currentEvent) {
        errors.push({
          line: lineNumber,
          message: "Action found without preceding event handler"
        });
        continue;
      }
      
      const [, component, property, value] = actionMatch;
      components.add(component);
      
      currentEvent.actions.push({
        component,
        property,
        value: value.replace(/^["']|["']$/g, '') // Remove quotes if present
      });
      continue;
    }
    
    // If we reach here, the line doesn't match any known pattern
    errors.push({
      line: lineNumber,
      message: `Invalid syntax - expected 'When ComponentName.Event' or 'Set ComponentName.Property to Value'`
    });
  }
  
  // Don't forget the last event
  if (currentEvent) {
    events.push(currentEvent);
  }
  
  return {
    events,
    components: Array.from(components).sort(),
    errors
  };
}
