import JSZip from "jszip";
import { ParsedCode } from "@shared/schema";

// MIT App Inventor 2 component types mapping
const COMPONENT_TYPES: Record<string, string> = {
  Screen: "Form",
  Button: "Button", 
  Label: "Label",
  TextBox: "TextBox",
  Image: "Image",
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
  for (const [prefix, type] of Object.entries(COMPONENT_TYPES)) {
    if (componentName.startsWith(prefix)) {
      return type;
    }
  }
  return "Button"; // Default fallback
}

function convertColorValue(value: string): string {
  return COLOR_MAPPING[value] || value;
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

function generateFormFile(parsedCode: ParsedCode): string {
  const components: any[] = [];

  // Create component definitions (excluding Screen components)
  for (const componentName of parsedCode.components) {
    if (componentName.startsWith('Screen')) continue; // Skip screen components
    
    const componentType = getComponentType(componentName);
    
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

  return `#|\n$JSON\n${JSON.stringify(form)}\n|#`;
}

function generateBlocksFile(parsedCode: ParsedCode): string {
  let xml = '<xml>\n';
  let yPosition = 134;

  for (const event of parsedCode.events) {
    xml += `  <block type="component_event" x="20" y="${yPosition}">\n`;
    xml += `    <mutation component_type="${getComponentType(event.component)}" instance_name="${event.component}" event_name="${event.event}"></mutation>\n`;
    xml += `    <title name="COMPONENT_SELECTOR">${event.component}</title>\n`;
    
    if (event.actions.length > 0) {
      xml += `    <statement name="DO">\n`;
      
      // Create action blocks
      for (let i = 0; i < event.actions.length; i++) {
        const action = event.actions[i];
        
        xml += `      <block type="component_set_get">\n`;
        xml += `        <mutation component_type="${getComponentType(action.component)}" set_or_get="set" property_name="${action.property}" is_generic="false" instance_name="${action.component}"></mutation>\n`;
        xml += `        <title name="COMPONENT_SELECTOR">${action.component}</title>\n`;
        xml += `        <value name="VALUE">\n`;
        
        if (action.property.toLowerCase().includes('color')) {
          const colorValue = convertColorValue(action.value);
          xml += `          <block type="color_make_color">\n`;
          xml += `            <title name="COLORLIST">${colorValue}</title>\n`;
          xml += `          </block>\n`;
        } else {
          xml += `          <block type="text">\n`;
          xml += `            <title name="TEXT">${action.value}</title>\n`;
          xml += `          </block>\n`;
        }
        
        xml += `        </value>\n`;
        
        if (i < event.actions.length - 1) {
          xml += `        <next>\n`;
        }
      }
      
      // Close next blocks
      for (let i = 0; i < event.actions.length - 1; i++) {
        xml += `        </next>\n`;
        xml += `      </block>\n`;
      }
      xml += `      </block>\n`;
      xml += `    </statement>\n`;
    }
    
    xml += `  </block>\n`;
    yPosition += 200;
  }
  
  xml += `  <yacodeblocks ya-version="82" language-version="17"></yacodeblocks>\n`;
  xml += '</xml>';
  return xml;
}

export async function generateAIA(parsedCode: ParsedCode): Promise<Blob> {
  const zip = new JSZip();
  
  // Create the correct AIA structure
  zip.file("youngandroidproject/project.properties", generateProjectProperties());
  
  // Generate form file (.scm)
  const formContent = generateFormFile(parsedCode);
  zip.file("src/appinventor/ai_anonymous/ConvertedApp/Screen1.scm", formContent);
  
  // Generate blocks file (.bky) 
  const blocksContent = generateBlocksFile(parsedCode);
  zip.file("src/appinventor/ai_anonymous/ConvertedApp/Screen1.bky", blocksContent);
  
  // Add required meta files
  zip.file("assets/README.txt", "This is the assets folder for your project.\n\nAny files you add here will be packaged with your application.\n\nIf you have media files that you want to use in your app, copy them to this folder.");
  
  // Add build directory structure
  zip.file("build/README.txt", "This is the build folder for your project.\n\nFiles in this folder are generated automatically by App Inventor.\n\nDo not edit the files in this folder.");

  // Generate the ZIP file
  return await zip.generateAsync({ type: "blob" });
}
