import React, { useMemo } from "react";
import Editor from "@monaco-editor/react";

export default function CodeEditor({
  value,
  onChange,
  language = "python",
  theme = "vs-dark",
  height = "420px",
  readOnly = false,
}) {
  const monacoLang = useMemo(() => {
    switch (language) {
      case "python": return "python";
      case "javascript": return "javascript";
      case "java": return "java";
      case "cpp": return "cpp";
      default: return "plaintext";
    }
  }, [language]);

  return (
    <div className="border border-zinc-800 rounded-xl overflow-hidden">
      <Editor
        height={height}
        language={monacoLang}
        theme={theme}
        value={value}
        onChange={(v) => onChange?.(v ?? "")}
        options={{
          fontLigatures: true,
          fontSize: 14,
          minimap: { enabled: false },
          wordWrap: "on",
          smoothScrolling: true,
          scrollBeyondLastLine: false,
          readOnly,
          automaticLayout: true,
        }}
      />
    </div>
  );
}
