
import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MonacoEditor, MonacoEditorRef } from "@/components/ui/monaco-editor";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Code, 
  Download, 
  HelpCircle, 
  Edit, 
  CheckCircle, 
  Rainbow, 
  FileCode,
  Flag,
  PanelRightClose,
  File,
  Bolt,
  BookUser,
  AlertCircle,
  EllipsisVertical,
  Touchpad
} from "lucide-react";
import { parsePseudoCode } from "@/lib/pseudo-parser";
import { generateAIA } from "@/lib/aia-generator";
import { ParsedCode } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X } from "lucide-react";

const EXAMPLE_CODE = `// Define variables
Define counter as 0
Define message as "Welcome"
Define nameList as ["Alice", "Bob", "Charlie"]

// Procedure definition
Define ShowMessage(text)
    Set Label2.Text to text
    Call Player1.Start

// Event handlers
On Button1.Click do
    Set counter to counter + 1
    Set Label1.Text to counter
    If counter > 5 then
        Set Label3.Text to "High count"
        Set Screen1.BackgroundColor to Green
    Else
        Set Label3.Text to "Low count"
        Set Screen1.BackgroundColor to Red

On Button2.Click do
    Call ShowMessage(message)
    For each name in nameList do
        Set Label4.Text to name

// Extension example (GestureDetector)
On GestureDetector1.Swipe do
    If direction = "left" then
        Set Label5.Text to "Left Swipe"
    Else If direction = "right" then
        Set Label5.Text to "Right Swipe"

// Screen initialization
On Screen1.Initialize do
    Set Label1.Text to "App Started"
    While counter < 3 do
        Set counter to counter + 1`;

const PLACEHOLDER_TEXT = `Enter your pseudo code here...

Supported Commands:
• On Component.Event do / When Component.Event
• Set Component.Property to Value
• Set Variable to Value
• Call Component.Method [with Parameters]
• Define Variable as Value
• Define ProcedureName(parameters)
• If Condition then / Else If / Else
• For each Item in List do
• While Condition do

Extension Support:
• Upload .aix extension files
• Use extension components in your code
• Example: On GestureDetector1.Swipe do

Example:
Define counter as 0

On Button1.Click do
    Set counter to counter + 1
    Set Label1.Text to counter
    If counter > 5 then
        Set Screen1.BackgroundColor to Green
        Call Player1.Start
    Else
        Set Screen1.BackgroundColor to Red

On GestureDetector1.Swipe do
    If direction = "left" then
        Set Label2.Text to "Swiped Left"`;

export default function Converter() {
  const [pseudoCode, setPseudoCode] = useState(EXAMPLE_CODE);
  const [parsedCode, setParsedCode] = useState<ParsedCode | null>(null);
  const [showDocumentation, setShowDocumentation] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const editorRef = useRef<MonacoEditorRef>(null);
  const { toast } = useToast();
  const [extensions, setExtensions] = useState<Array<{name: string, version: string, uuid: string, file?: File}>>([]);

  const handleParsePseudoCode = useCallback((code: string) => {
    try {
      const result = parsePseudoCode(code);
      setParsedCode(result);
    } catch (error) {
      console.error("Parsing error:", error);
      setParsedCode(null);
    }
  }, []);

  useEffect(() => {
    handleParsePseudoCode(pseudoCode);
  }, [pseudoCode, handleParsePseudoCode]);

  useEffect(() => {
    // Test JSZip functionality on mount
    import('../lib/test-jszip').then(({ testJSZip }) => {
      testJSZip().then(success => {
        if (!success) {
          console.error("JSZip test failed - AIA generation may not work properly");
        } else {
          console.log("JSZip test passed - AIA generation should work");
        }
      });
    });
  }, []);

  const handleClearInput = () => {
    setPseudoCode("");
    editorRef.current?.setValue("");
    editorRef.current?.focus();
  };

  const handleLoadExample = () => {
    setPseudoCode(EXAMPLE_CODE);
    editorRef.current?.setValue(EXAMPLE_CODE);
    editorRef.current?.focus();
  };

  const handleDownloadAIA = async () => {
    if (!parsedCode || parsedCode.errors.length > 0) {
      toast({
        title: "Cannot Generate AIA",
        description: "Please fix all parsing errors before generating the AIA file.",
        variant: "destructive",
      });
      return;
    }

    console.log("Starting AIA download process...");
    console.log("Parsed code:", parsedCode);
    console.log("Extensions:", extensions);

    setIsGenerating(true);
    try {
      // Validate parsed code structure
      if (!parsedCode.events || !Array.isArray(parsedCode.events)) {
        throw new Error("Invalid parsed code structure: missing or invalid events array");
      }

      if (!parsedCode.components || !Array.isArray(parsedCode.components)) {
        throw new Error("Invalid parsed code structure: missing or invalid components array");
      }

      console.log("Calling generateAIA...");
      const aiaBlob = await generateAIA(parsedCode, extensions);
      
      if (!aiaBlob || aiaBlob.size === 0) {
        throw new Error("Generated AIA file is empty or invalid");
      }

      console.log("AIA blob generated successfully, size:", aiaBlob.size);

      // Create download link
      const url = URL.createObjectURL(aiaBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'converted_app.aia';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      console.log("Download initiated successfully");

      toast({
        title: "AIA File Generated",
        description: "Your AIA file has been downloaded successfully.",
      });
    } catch (error) {
      console.error("Generation error:", error);
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        parsedCode: parsedCode,
        extensions: extensions
      });
      
      toast({
        title: "Generation Failed",
        description: `Failed to generate AIA file: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExtensionUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      if (file.name.endsWith('.aix')) {
        // Extract extension info from filename
        const name = file.name.replace('.aix', '');
        const newExtension = {
          name: name,
          version: "1",
          uuid: `com.extension.${name.toLowerCase()}`,
          file: file
        };
        setExtensions(prev => [...prev, newExtension]);
        
        toast({
          title: "Extension Added",
          description: `${file.name} has been added to your project.`,
        });
      } else {
        toast({
          title: "Invalid File",
          description: "Please upload only .aix extension files.",
          variant: "destructive",
        });
      }
    });
    
    // Reset input
    event.target.value = '';
  };

  const removeExtension = (index: number) => {
    setExtensions(extensions.filter((_, i) => i !== index));
  };

  const isValid = parsedCode && parsedCode.errors.length === 0;

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="bg-white shadow-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Code className="text-primary text-2xl" />
                <h1 className="text-xl font-medium text-gray-900">PseudoCode Converter</h1>
              </div>
              <Badge variant="secondary" className="hidden sm:inline-block">
                MIT App Inventor 2
              </Badge>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowDocumentation(!showDocumentation)}
              >
                <HelpCircle className="h-5 w-5" />
              </Button>
              <Button 
                onClick={handleDownloadAIA}
                disabled={!isValid || isGenerating}
                className="bg-primary hover:bg-primary-dark"
              >
                <Download className="h-4 w-4 mr-2" />
                Download AIA
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Extension Upload Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Upload className="text-blue-600" />
              <span>Upload Extensions</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <div className="text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4">
                  <label htmlFor="extension-upload" className="cursor-pointer">
                    <span className="mt-2 block text-sm font-medium text-gray-900">
                      Upload .aix extension files
                    </span>
                    <span className="mt-1 block text-sm text-gray-500">
                      Select multiple .aix files to add to your project
                    </span>
                  </label>
                  <input
                    id="extension-upload"
                    type="file"
                    className="sr-only"
                    multiple
                    accept=".aix"
                    onChange={handleExtensionUpload}
                  />
                </div>
                <div className="mt-4">
                  <Button asChild variant="outline">
                    <label htmlFor="extension-upload" className="cursor-pointer">
                      <Upload className="h-4 w-4 mr-2" />
                      Choose Files
                    </label>
                  </Button>
                </div>
              </div>
            </div>

            {extensions.length > 0 && (
              <div className="space-y-2">
                <Label>Uploaded Extensions:</Label>
                <div className="space-y-2">
                  {extensions.map((ext, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-green-50">
                      <div className="flex-1">
                        <div className="font-medium">{ext.name}</div>
                        <div className="text-sm text-gray-600">v{ext.version} • {ext.uuid}</div>
                        {ext.file && <div className="text-xs text-gray-500">{ext.file.name}</div>}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeExtension(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Main Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">

          {/* Input Panel */}
          <Card className="flex flex-col">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Edit className="text-primary" />
                  <span>Pseudo Code Input</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="icon" onClick={handleClearInput}>
                    <Rainbow className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={handleLoadExample}>
                    <FileCode className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>

            <CardContent className="flex-1 p-6">
              <MonacoEditor
                ref={editorRef}
                value={pseudoCode}
                onChange={setPseudoCode}
                placeholder={PLACEHOLDER_TEXT}
                height={384}
                language="pseudocode"
                className="w-full"
              />
            </CardContent>

            {/* Syntax Help */}
            <CardContent className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-xl">
              <div className="flex items-start space-x-3">
                <AlertCircle className="text-primary text-sm mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-1">Syntax Rules</h4>
                  <p className="text-xs text-gray-600">
                    Use <code className="bg-gray-200 px-1 rounded">When ComponentName.Event</code> for events, 
                    <code className="bg-gray-200 px-1 rounded ml-1">Set ComponentName.Property to Value</code> for actions
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Output Panel */}
          <Card className="flex flex-col">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle className="text-secondary" />
                <span>Conversion Output</span>
              </CardTitle>
            </CardHeader>

            {/* Validation Status */}
            {parsedCode && (
              <div className={`px-6 py-3 border-b ${
                isValid 
                  ? 'bg-green-50 border-green-100' 
                  : 'bg-red-50 border-red-100'
              }`}>
                <div className="flex items-center space-x-2">
                  {isValid ? (
                    <>
                      <CheckCircle className="text-secondary text-sm" />
                      <span className="text-sm font-medium text-secondary">
                        Valid pseudo code - Ready for conversion
                      </span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="text-red-600 text-sm" />
                      <span className="text-sm font-medium text-red-600">
                        {parsedCode.errors.length} parsing error(s) found
                      </span>
                    </>
                  )}
                </div>
              </div>
            )}

            <CardContent className="flex-1 p-6">
              {parsedCode && (
                <div className="space-y-4">
                  <div>
                    {/* Variables */}
                    {parsedCode.variables && parsedCode.variables.length > 0 && (
                      <div className="mb-4">
                        <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center space-x-2">
                          <EllipsisVertical className="text-sm" />
                          <span>Variables</span>
                        </h3>
                        <div className="space-y-1">
                          {parsedCode.variables.map((variable, index) => (
                            <div key={index} className="flex items-center space-x-2 text-sm text-gray-700 bg-blue-50 p-2 rounded">
                              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                              <span className="font-mono">
                                {variable.name} = {variable.value}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Procedures */}
                    {parsedCode.procedures && parsedCode.procedures.length > 0 && (
                      <div className="mb-4">
                        <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center space-x-2">
                          <BookUser className="text-sm" />
                          <span>Procedures</span>
                        </h3>
                        <div className="space-y-2">
                          {parsedCode.procedures.map((procedure, index) => (
                            <Card key={index} className="bg-purple-50 border border-purple-200">
                              <CardContent className="p-3">
                                <div className="flex items-center space-x-2 mb-2">
                                  <Bolt className="text-purple-600 text-sm" />
                                  <span className="font-mono text-sm font-medium text-gray-900">
                                    {procedure.name}({procedure.parameters.join(', ')})
                                  </span>
                                </div>
                                <div className="ml-6 space-y-1">
                                  {procedure.actions.map((action, actionIndex) => (
                                    <div key={actionIndex} className="flex items-center space-x-2 text-sm text-gray-700">
                                      <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                                      <span className="font-mono">
                                        {action.type === 'set' && `${action.component}.${action.property} = ${action.value}`}
                                        {action.type === 'call' && `Call ${action.component}.${action.method}`}
                                        {action.type === 'assign' && `${action.variable} = ${action.value}`}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}

                    <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center space-x-2">
                      <Flag className="text-sm" />
                      <span>Event Handlers</span>
                    </h3>

                    {parsedCode.events.map((event, index) => (
                      <Card key={index} className="mb-3 bg-gray-50 border border-gray-200">
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-2 mb-2">
                            <Touchpad className="text-primary text-sm" />
                            <span className="font-mono text-sm font-medium text-gray-900">
                              {event.component}.{event.event}
                            </span>
                          </div>
                          <div className="ml-6 space-y-1">
                            {event.actions.map((action, actionIndex) => (
                              <div key={actionIndex} className="flex items-center space-x-2 text-sm text-gray-700">
                                <span className="w-2 h-2 bg-secondary rounded-full"></span>
                                <span className="font-mono">
                                  {action.component}.{action.property} = {action.value}
                                </span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Components Detected */}
                  <div className="border-t border-gray-200 pt-4">
                    <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center space-x-2">
                      <PanelRightClose className="text-sm" />
                      <span>Detected Components</span>
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {parsedCode.components.map((component, index) => (
                        <Badge 
                          key={index} 
                          variant="secondary"
                          className={
                            component.startsWith('Button') ? 'bg-blue-100 text-blue-800' :
                            component.startsWith('Screen') ? 'bg-purple-100 text-purple-800' :
                            component.startsWith('Label') ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }
                        >
                          {component}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>

            {/* Download Section */}
            <CardContent className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <File className="text-primary" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Ready to Download</p>
                    <p className="text-xs text-gray-600">AIA file will contain all components, blocks, and extensions</p>
                  </div>
                </div>
                <Button 
                  onClick={handleDownloadAIA}
                  disabled={!isValid || isGenerating}
                  className="bg-secondary hover:bg-green-700"
                >
                  <Bolt className="h-4 w-4 mr-2" />
                  {isGenerating ? "Generating..." : "Generate AIA"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Documentation Panel */}
        <Collapsible open={showDocumentation} onOpenChange={setShowDocumentation}>
          <CollapsibleContent>
            <Card className="mt-8">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BookUser className="text-primary" />
                  <span>Documentation & Examples</span>
                </CardTitle>
              </CardHeader>

              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Syntax Guide */}
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">Supported Syntax</h3>
                    <div className="space-y-3 text-sm">
                      <Card className="bg-gray-50 p-3">
                        <h4 className="font-mono font-medium text-gray-900 mb-1">Event Handlers</h4>
                        <code className="text-gray-700">When ComponentName.EventName</code>
                      </Card>
                      <Card className="bg-gray-50 p-3">
                        <h4 className="font-mono font-medium text-gray-900 mb-1">Property Setting</h4>
                        <code className="text-gray-700">Set ComponentName.Property to Value</code>
                      </Card>
                      <Card className="bg-gray-50 p-3">
                        <h4 className="font-mono font-medium text-gray-900 mb-1">Comments</h4>
                        <code className="text-gray-700">// This is a comment</code>
                      </Card>
                    </div>
                  </div>

                  {/* Examples */}
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">Examples</h3>
                    <div className="space-y-3">
                      <Card className="bg-gray-50 p-3">
                        <h4 className="font-medium text-gray-900 mb-2">Basic Button Click</h4>
                        <pre className="font-mono text-xs text-gray-700">
{`When Button1.Click
    Set Label1.Text to "Clicked!"`}
                        </pre>
                      </Card>
                      <Card className="bg-gray-50 p-3">
                        <h4 className="font-medium text-gray-900 mb-2">Color Changes</h4>
                        <pre className="font-mono text-xs text-gray-700">
{`When Button2.Click
    Set Screen1.BackgroundColor to Red
    Set Button2.BackgroundColor to Blue`}
                        </pre>
                      </Card>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>

        {/* Error Panel */}
        {parsedCode && parsedCode.errors.length > 0 && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <h3 className="text-sm font-medium mb-1">Parsing Errors</h3>
              <ul className="text-sm space-y-1">
                {parsedCode.errors.map((error, index) => (
                  <li key={index}>• Line {error.line}: {error.message}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}
      </main>

      {/* Loading Overlay */}
      {isGenerating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-8 flex items-center space-x-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="text-lg font-medium">Generating AIA file...</span>
          </Card>
        </div>
      )}
    </div>
  );
}
