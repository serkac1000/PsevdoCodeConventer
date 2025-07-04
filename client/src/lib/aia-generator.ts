import JSZip from "jszip";
import { ParsedCode } from "@shared/schema";

// MIT App Inventor 2 component types mapping
const COMPONENT_TYPES: Record<string, string> = {
  Screen: "Form",
  Button: "Button", 
  Label: "Label",
  TextBox: "TextBox",
  Image: "Image",
  Player: "Player",
  Clock: "Clock",
  TinyDB: "TinyDB",
  Notifier: "Notifier",
};

// Extension definitions - add your extensions here
const EXTENSIONS: Record<string, any> = {
  // Example: Clock extension
  Clock: {
    name: "Clock",
    version: "1",
    uuid: "com.google.appinventor.components.runtime.Clock"
  },
  // GestureDetector extension
  GestureDetector: {
    name: "GestureDetector",
    version: "1",
    uuid: "com.extension.aryan.gupta.gesturesdetector"
  },
  // Add more extensions as needed
};

// Color mapping for MIT App Inventor (corrected format)
const COLOR_MAPPING: Record<string, string> = {
  Red: "&HFFFF0000",
  Green: "&HFF00FF00", 
  Blue: "&HFF0000FF",
  Yellow: "&HFFFFFF00",
  White: "&HFFFFFFFF",
  Black: "&HFF000000",
  Gray: "&HFF808080",
  Orange: "&HFFFFA500",
  Purple: "&HFF800080",
  Pink: "&HFFFFC0CB",
};

function getComponentType(componentName: string): string {
  // Handle undefined or null componentName
  if (!componentName || typeof componentName !== 'string') {
    return "Button"; // Default fallback
  }

  // Check for extensions first
  for (const [extName, extInfo] of Object.entries(EXTENSIONS)) {
    if (componentName.startsWith(extName)) {
      return extName;
    }
  }

  // Then check built-in components
  for (const [prefix, type] of Object.entries(COMPONENT_TYPES)) {
    if (componentName.startsWith(prefix)) {
      return type;
    }
  }
  return "Button"; // Default fallback
}

function convertColorValue(value: string): string {
  const color = COLOR_MAPPING[value];
  if (color) {
    return color;
  }
  // If it's already a hex color, convert to MIT App Inventor format
  if (value.startsWith('#')) {
    return `&HFF${value.substring(1).toUpperCase()}`;
  }
  return value;
}

function generateProjectProperties(): string {
  return `main=appinventor.ai_anonymous.ConvertedApp.Screen1
name=ConvertedApp
assets=../assets
source=../src
build=../build
versioncode=1
versionname=1.0
useslocation=False`;
}

function generateFormFile(parsedCode: ParsedCode, userExtensions: Array<{name: string, version: string, uuid: string}> = []): string {
  const components: any[] = [];
  const usedExtensions = new Set<string>();

  // Merge user extensions with built-in extensions
  const allExtensions = {...EXTENSIONS};
  userExtensions.forEach(ext => {
    allExtensions[ext.name] = {
      name: ext.name,
      version: ext.version,
      uuid: ext.uuid
    };
  });

  // Create component definitions (excluding Screen components)
  for (const componentName of parsedCode.components) {
    if (componentName.startsWith('Screen')) continue; // Skip screen components

    const componentType = getComponentType(componentName);

    // Track which extensions are used
    if (allExtensions[componentType]) {
      usedExtensions.add(componentType);
    }

    const component: any = {
      "$Name": componentName,
      "$Type": componentType,
      "$Version": componentType === "Button" ? "5" : "2",
      "Uuid": Math.floor(Math.random() * 1000000000).toString()
    };

    // Add default properties based on component type
    if (componentType === "Button") {
      component.Text = componentName;
    } else if (componentType === "Label") {
      component.Text = componentName;
      component.FontSize = "14";
    }

    components.push(component);
  }

  const form = {
    "YaVersion": "82",
    "Source": "Form",
    "Properties": {
      "$Name": "Screen1",
      "$Type": "Form", 
      "$Version": "11",
      "Uuid": "0",
      "Title": "Screen1",
      "$Components": components
    }
  };

  // Add extensions if any are used
  if (usedExtensions.size > 0) {
    form.Properties["$Extensions"] = Array.from(usedExtensions).map(extName => ({
      "$Name": extName,
      "$Version": allExtensions[extName].version,
      "$UUID": allExtensions[extName].uuid
    }));
  }

  return `#|\n$JSON\n${JSON.stringify(form)}\n|#`;
}

function generateBlocksFile(parsedCode: ParsedCode, userExtensions: Array<{name: string, version: string, uuid: string}> = []): string {
  let xml = `<xml xmlns="https://developers.google.com/blockly/xml">
`;

  let yPosition = 20;

  // Generate variable definitions
  if (parsedCode.variables && parsedCode.variables.length > 0) {
    for (const variable of parsedCode.variables) {
      xml += `  <block type="global_declaration" x="20" y="${yPosition}">\n`;
      xml += `    <title name="NAME">${variable.name}</title>\n`;
      xml += `    <value name="VALUE">\n`;

      if (variable.value.match(/^\d+$/)) {
        xml += `      <block type="math_number">\n`;
        xml += `        <title name="NUM">${variable.value}</title>\n`;
        xml += `      </block>\n`;
      } else if (variable.value === 'true' || variable.value === 'false') {
        xml += `      <block type="logic_boolean">\n`;
        xml += `        <title name="BOOL">${variable.value.toUpperCase()}</title>\n`;
        xml += `      </block>\n`;
      } else {
        xml += `      <block type="text">\n`;
        xml += `        <title name="TEXT">${variable.value}</title>\n`;
        xml += `      </block>\n`;
      }

      xml += `    </value>\n`;
      xml += `  </block>\n`;
      yPosition += 100;
    }
  }

  // Generate procedure definitions
  if (parsedCode.procedures && parsedCode.procedures.length > 0) {
    for (const procedure of parsedCode.procedures) {
      xml += `  <block type="procedures_defnoreturn" x="20" y="${yPosition}">\n`;
      xml += `    <mutation>\n`;

      for (const param of procedure.parameters) {
        xml += `      <arg name="${param}"></arg>\n`;
      }

      xml += `    </mutation>\n`;
      xml += `    <title name="NAME">${procedure.name}</title>\n`;

      if (procedure.actions.length > 0) {
        xml += `    <statement name="STACK">\n`;
        xml += generateActionBlocks(procedure.actions, 0);
        xml += `    </statement>\n`;
      }

      xml += `  </block>\n`;
      yPosition += 150;
    }
  }

  // Generate event blocks
  for (const event of parsedCode.events) {
    const componentType = getComponentType(event.component);
    xml += `  <block type="component_event" x="20" y="${yPosition}">\n`;
    xml += `    <mutation component_type="${componentType}" instance_name="${event.component}" event_name="${event.event}" is_generic="false"></mutation>\n`;
    xml += `    <title name="COMPONENT_SELECTOR">${event.component}</title>\n`;

    if (event.actions.length > 0) {
      xml += `    <statement name="DO">\n`;
      xml += generateActionBlocks(event.actions, 0);
      xml += `    </statement>\n`;
    }

    xml += `  </block>\n`;
    yPosition += 150;
  }

  xml += `</xml>`;
  return xml;
}

function generateActionBlocks(actions: any[], depth: number): string {
  let xml = '';

  for (let i = 0; i < actions.length; i++) {
    const action = actions[i];

    if (action.type === 'call') {
      // Method call - check if it's a component method or procedure call
      if (action.component && action.method && action.component !== action.method) {
        // Component method call
        const componentType = getComponentType(action.component);
        xml += `      <block type="component_method">\n`;
        xml += `        <mutation component_type="${componentType}" method_name="${action.method}" is_generic="false" instance_name="${action.component}"></mutation>\n`;
        xml += `        <title name="COMPONENT_SELECTOR">${action.component}</title>\n`;

        if (action.parameters && action.parameters.length > 0) {
          for (let p = 0; p < action.parameters.length; p++) {
            xml += `        <value name="ARG${p}">\n`;
            xml += generateValueBlock(action.parameters[p]);
            xml += `        </value>\n`;
          }
        }
      } else {
        // Procedure call
        xml += `      <block type="procedures_callnoreturn">\n`;
        xml += `        <mutation name="${action.method || action.component}">\n`;
        if (action.parameters && action.parameters.length > 0) {
          for (const param of action.parameters) {
            xml += `          <arg name="${param}"></arg>\n`;
          }
        }
        xml += `        </mutation>\n`;
        xml += `        <title name="PROCNAME">${action.method || action.component}</title>\n`;
        
        if (action.parameters && action.parameters.length > 0) {
          for (let p = 0; p < action.parameters.length; p++) {
            xml += `        <value name="ARG${p}">\n`;
            xml += generateValueBlock(action.parameters[p]);
            xml += `        </value>\n`;
          }
        }
      }

    } else if (action.type === 'assign') {
      // Variable assignment
      xml += `      <block type="lexical_variable_set">\n`;
      xml += `        <title name="VAR">${action.variable}</title>\n`;
      xml += `        <value name="VALUE">\n`;
      xml += generateValueBlock(action.value);
      xml += `        </value>\n`;

    } else if (action.type === 'set' && action.component && action.property) {
      // Property setting using 'set' type
      const componentType = getComponentType(action.component);
      const isGeneric = EXTENSIONS[componentType] ? "true" : "false";

      xml += `      <block type="component_set_get">\n`;
      xml += `        <mutation component_type="${componentType}" set_or_get="set" property_name="${action.property}" is_generic="${isGeneric}" instance_name="${action.component}"></mutation>\n`;
      xml += `        <title name="COMPONENT_SELECTOR">${action.component}</title>\n`;
      xml += `        <value name="VALUE">\n`;
      xml += generateValueBlock(action.value);
      xml += `        </value>\n`;

    } else if (action.type === 'define') {
      // Variable definition (handled at top level)
      continue;

    } else if (action.type === 'if') {
      // If statement
      xml += `      <block type="controls_if">\n`;
      xml += `        <value name="IF0">\n`;
      xml += `          <block type="logic_compare">\n`;
      xml += `            <title name="OP">GT</title>\n`;
      xml += `            <value name="A">\n`;
      xml += `              <block type="text">\n`;
      xml += `                <title name="TEXT">${action.condition}</title>\n`;
      xml += `              </block>\n`;
      xml += `            </value>\n`;
      xml += `          </block>\n`;
      xml += `        </value>\n`;
      xml += `        <statement name="DO0">\n`;
      if (action.actions && action.actions.length > 0) {
        xml += generateActionBlocks(action.actions, depth + 1);
      }
      xml += `        </statement>\n`;
      if (action.elseActions && action.elseActions.length > 0) {
        xml += `        <statement name="ELSE">\n`;
        xml += generateActionBlocks(action.elseActions, depth + 1);
        xml += `        </statement>\n`;
      }

    } else if (action.type === 'foreach') {
      // For each loop
      xml += `      <block type="controls_forEach">\n`;
      xml += `        <title name="VAR">${action.variable}</title>\n`;
      xml += `        <value name="LIST">\n`;
      xml += `          <block type="lexical_variable_get">\n`;
      xml += `            <title name="VAR">${action.value}</title>\n`;
      xml += `          </block>\n`;
      xml += `        </value>\n`;
      xml += `        <statement name="DO">\n`;
      if (action.actions && action.actions.length > 0) {
        xml += generateActionBlocks(action.actions, depth + 1);
      }
      xml += `        </statement>\n`;

    } else if (action.type === 'while') {
      // While loop
      xml += `      <block type="controls_whileUntil">\n`;
      xml += `        <title name="MODE">WHILE</title>\n`;
      xml += `        <value name="BOOL">\n`;
      xml += `          <block type="text">\n`;
      xml += `            <title name="TEXT">${action.condition}</title>\n`;
      xml += `          </block>\n`;
      xml += `        </value>\n`;
      xml += `        <statement name="DO">\n`;
      if (action.actions && action.actions.length > 0) {
        xml += generateActionBlocks(action.actions, depth + 1);
      }
      xml += `        </statement>\n`;

    } else if (action.component && action.property && action.value !== undefined) {
      // Property setting - only process if component, property and value exist
      const componentType = getComponentType(action.component);
      const isGeneric = EXTENSIONS[componentType] ? "true" : "false";

      xml += `      <block type="component_set_get">\n`;
      xml += `        <mutation component_type="${componentType}" set_or_get="set" property_name="${action.property}" is_generic="${isGeneric}" instance_name="${action.component}"></mutation>\n`;
      xml += `        <title name="COMPONENT_SELECTOR">${action.component}</title>\n`;
      xml += `        <value name="VALUE">\n`;
      xml += generateValueBlock(action.value);
      xml += `        </value>\n`;
    } else {
      // Skip unknown or incomplete action types
      console.warn('Skipping incomplete action:', action);
      continue;
    }

    if (i < actions.length - 1) {
      xml += `        <next>\n`;
    }
    xml += `      </block>\n`;

    if (i < actions.length - 1) {
      xml += `        </next>\n`;
    }
  }

  return xml;
}

function generateValueBlock(value: string): string {
  let xml = '';

  // Handle different value types
  if (COLOR_MAPPING[value]) {
    // Use appropriate color block type based on the color
    const colorBlockType = value === 'Red' ? 'color_red' : 
                          value === 'Green' ? 'color_green' : 
                          value === 'Blue' ? 'color_blue' : 'color_red';
    xml += `          <block type="${colorBlockType}">\n`;
    xml += `            <title name="COLOR">${COLOR_MAPPING[value]}</title>\n`;
    xml += `          </block>\n`;
  } else if (value.match(/^\d+$/)) {
    xml += `          <block type="math_number">\n`;
    xml += `            <title name="NUM">${value}</title>\n`;
    xml += `          </block>\n`;
  } else if (value === 'true' || value === 'false') {
    xml += `          <block type="logic_boolean">\n`;
    xml += `            <title name="BOOL">${value.toUpperCase()}</title>\n`;
    xml += `          </block>\n`;
  } else if (value.includes(' + ') || value.includes(' - ') || value.includes(' * ') || value.includes(' / ')) {
    // Simple arithmetic expression
    xml += `          <block type="text">\n`;
    xml += `            <title name="TEXT">${value}</title>\n`;
    xml += `          </block>\n`;
  } else {
    xml += `          <block type="text">\n`;
    xml += `            <title name="TEXT">${value}</title>\n`;
    xml += `          </block>\n`;
  }

  return xml;
}

export async function generateAIA(parsedCode: ParsedCode, userExtensions: Array<{name: string, version: string, uuid: string, file?: File}> = []): Promise<Blob> {
  try {
    console.log("Starting AIA generation...", { parsedCode, userExtensions });
    
    if (!parsedCode) {
      throw new Error("Parsed code is null or undefined");
    }

    if (!parsedCode.events || !Array.isArray(parsedCode.events)) {
      throw new Error("Invalid parsed code: events array is missing or invalid");
    }

    const zip = new JSZip();

    // Create the correct AIA structure
    const projectProperties = generateProjectProperties();
    console.log("Generated project properties:", projectProperties);
    zip.file("youngandroidproject/project.properties", projectProperties);

    // Generate form file (.scm)
    const formContent = generateFormFile(parsedCode, userExtensions);
    console.log("Generated form content:", formContent.substring(0, 200) + "...");
    zip.file("src/appinventor/ai_anonymous/ConvertedApp/Screen1.scm", formContent);

    // Generate blocks file (.bky) 
    const blocksContent = generateBlocksFile(parsedCode, userExtensions);
    console.log("Generated blocks content:", blocksContent.substring(0, 200) + "...");
    zip.file("src/appinventor/ai_anonymous/ConvertedApp/Screen1.bky", blocksContent);

    // Add required meta files
    zip.file("assets/README.txt", "This is the assets folder for your project.\n\nAny files you add here will be packaged with your application.\n\nIf you have media files that you want to use in your app, copy them to this folder.");

    // Add build directory structure
    zip.file("build/README.txt", "This is the build folder for your project.\n\nFiles in this folder are generated automatically by App Inventor.\n\nDo not edit the files in this folder.");

    // Add extension files if provided
    for (const extension of userExtensions) {
      if (extension.file) {
        try {
          console.log("Adding extension file:", extension.file.name);
          const extensionData = await extension.file.arrayBuffer();
          zip.file(`assets/${extension.file.name}`, extensionData);
        } catch (extError) {
          console.error("Error adding extension file:", extension.file.name, extError);
          throw new Error(`Failed to add extension file ${extension.file.name}: ${extError.message}`);
        }
      }
    }

    console.log("Generating ZIP file...");
    // Generate the ZIP file
    const blob = await zip.generateAsync({ 
      type: "blob",
      compression: "DEFLATE",
      compressionOptions: {
        level: 6
      }
    });
    
    console.log("AIA generation completed successfully, blob size:", blob.size);
    return blob;
    
  } catch (error) {
    console.error("AIA generation failed:", error);
    console.error("Error stack:", error.stack);
    console.error("Parsed code state:", parsedCode);
    throw new Error(`AIA generation failed: ${error.message}`);
  }
}