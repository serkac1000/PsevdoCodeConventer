import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { cn } from "@/lib/utils";

// Monaco Editor types
declare global {
  interface Window {
    monaco: any;
    require: any;
  }
}

interface MonacoEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  height?: string | number;
  theme?: "vs" | "vs-dark" | "hc-black";
  readOnly?: boolean;
  language?: string;
}

export interface MonacoEditorRef {
  getValue: () => string;
  setValue: (value: string) => void;
  focus: () => void;
}

const MonacoEditor = forwardRef<MonacoEditorRef, MonacoEditorProps>(
  ({ 
    value = "", 
    onChange, 
    placeholder = "", 
    className,
    height = 400,
    theme = "vs",
    readOnly = false,
    language = "plaintext"
  }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const editorRef = useRef<any>(null);
    const monacoRef = useRef<any>(null);

    useImperativeHandle(ref, () => ({
      getValue: () => editorRef.current?.getValue() || "",
      setValue: (newValue: string) => editorRef.current?.setValue(newValue),
      focus: () => editorRef.current?.focus()
    }));

    useEffect(() => {
      // Load Monaco Editor from CDN
      const loadMonaco = async () => {
        if (window.monaco) {
          initializeEditor();
          return;
        }

        // Load Monaco Editor
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/loader.js";
        script.onload = () => {
          window.require.config({ 
            paths: { vs: "https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs" } 
          });
          
          window.require(["vs/editor/editor.main"], () => {
            monacoRef.current = window.monaco;
            registerPseudoCodeLanguage();
            initializeEditor();
          });
        };
        document.head.appendChild(script);
      };

      const registerPseudoCodeLanguage = () => {
        const monaco = monacoRef.current;
        if (!monaco) return;

        // Register a new language for pseudo code
        monaco.languages.register({ id: "pseudocode" });

        // Define the language syntax
        monaco.languages.setMonarchTokensProvider("pseudocode", {
          tokenizer: {
            root: [
              // Comments
              [/\/\/.*$/, "comment"],
              
              // When statements
              [/\bWhen\b/, "keyword.when"],
              [/\bSet\b/, "keyword.set"],
              [/\bto\b/, "keyword.to"],
              
              // Component names and events
              [/\b[A-Z][a-zA-Z0-9]*\b/, "entity.name.type"],
              
              // Properties and events after dot
              [/\.[a-zA-Z][a-zA-Z0-9]*/, "entity.name.function"],
              
              // String values
              [/"([^"\\]|\\.)*$/, "string.invalid"],
              [/"/, "string", "@string"],
              [/'([^'\\]|\\.)*$/, "string.invalid"],
              [/'/, "string", "@string_single"],
              
              // Numbers
              [/\d+/, "number"],
              
              // Colors
              [/\b(Red|Green|Blue|Yellow|White|Black|Gray|Orange|Purple|Pink)\b/, "constant.language"],
            ],
            
            string: [
              [/[^\\"]+/, "string"],
              [/\\./, "string.escape.invalid"],
              [/"/, "string", "@pop"]
            ],
            
            string_single: [
              [/[^\\']+/, "string"],
              [/\\./, "string.escape.invalid"],
              [/'/, "string", "@pop"]
            ]
          }
        });

        // Define the theme
        monaco.editor.defineTheme("pseudocode-theme", {
          base: "vs",
          inherit: true,
          rules: [
            { token: "comment", foreground: "6a737d", fontStyle: "italic" },
            { token: "keyword.when", foreground: "d73a49", fontStyle: "bold" },
            { token: "keyword.set", foreground: "d73a49", fontStyle: "bold" },
            { token: "keyword.to", foreground: "d73a49" },
            { token: "entity.name.type", foreground: "6f42c1", fontStyle: "bold" },
            { token: "entity.name.function", foreground: "005cc5" },
            { token: "string", foreground: "032f62" },
            { token: "number", foreground: "005cc5" },
            { token: "constant.language", foreground: "e36209", fontStyle: "bold" }
          ],
          colors: {
            "editor.background": "#fafafa",
            "editor.foreground": "#24292e"
          }
        });

        // Set language configuration
        monaco.languages.setLanguageConfiguration("pseudocode", {
          brackets: [
            ['{', '}'],
            ['[', ']'],
            ['(', ')']
          ],
          autoClosingPairs: [
            { open: '{', close: '}' },
            { open: '[', close: ']' },
            { open: '(', close: ')' },
            { open: '"', close: '"' },
            { open: "'", close: "'" }
          ],
          surroundingPairs: [
            { open: '{', close: '}' },
            { open: '[', close: ']' },
            { open: '(', close: ')' },
            { open: '"', close: '"' },
            { open: "'", close: "'" }
          ]
        });
      };

      const initializeEditor = () => {
        if (!containerRef.current || !monacoRef.current) return;

        const monaco = monacoRef.current;
        
        editorRef.current = monaco.editor.create(containerRef.current, {
          value: value,
          language: language === "pseudocode" ? "pseudocode" : language,
          theme: language === "pseudocode" ? "pseudocode-theme" : theme,
          readOnly: readOnly,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          fontSize: 14,
          fontFamily: "'Roboto Mono', Consolas, 'Courier New', monospace",
          lineNumbers: "on",
          folding: true,
          wordWrap: "on",
          automaticLayout: true,
          tabSize: 4,
          insertSpaces: true,
          renderWhitespace: "selection",
          renderLineHighlight: "line",
          cursorStyle: "line",
          cursorBlinking: "blink",
          selectOnLineNumbers: true,
          roundedSelection: false,
          overviewRulerLanes: 0,
          overviewRulerBorder: false,
          hideCursorInOverviewRuler: true,
          scrollbar: {
            vertical: "visible",
            horizontal: "visible",
            useShadows: false,
            verticalHasArrows: false,
            horizontalHasArrows: false,
            verticalScrollbarSize: 10,
            horizontalScrollbarSize: 10
          }
        });

        // Add placeholder functionality
        if (placeholder && !value) {
          const placeholderNode = document.createElement("div");
          placeholderNode.className = "monaco-placeholder";
          placeholderNode.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            font-family: 'Roboto Mono', Consolas, 'Courier New', monospace;
            font-size: 14px;
            color: #6a737d;
            pointer-events: none;
            padding: 8px 0 0 60px;
            white-space: pre;
            z-index: 1;
          `;
          placeholderNode.textContent = placeholder;
          containerRef.current.appendChild(placeholderNode);

          const updatePlaceholder = () => {
            const currentValue = editorRef.current.getValue();
            placeholderNode.style.display = currentValue ? "none" : "block";
          };

          editorRef.current.onDidChangeModelContent(updatePlaceholder);
          updatePlaceholder();
        }

        // Handle value changes
        editorRef.current.onDidChangeModelContent(() => {
          const currentValue = editorRef.current.getValue();
          onChange?.(currentValue);
        });

        // Set initial value
        if (value !== editorRef.current.getValue()) {
          editorRef.current.setValue(value);
        }
      };

      loadMonaco();

      return () => {
        if (editorRef.current) {
          editorRef.current.dispose();
        }
      };
    }, []);

    // Update value when prop changes
    useEffect(() => {
      if (editorRef.current && value !== editorRef.current.getValue()) {
        editorRef.current.setValue(value);
      }
    }, [value]);

    return (
      <div 
        ref={containerRef} 
        className={cn(
          "w-full border border-gray-300 rounded-lg overflow-hidden bg-gray-50",
          "focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent",
          className
        )}
        style={{ height: typeof height === "number" ? `${height}px` : height }}
      />
    );
  }
);

MonacoEditor.displayName = "MonacoEditor";

export { MonacoEditor };
