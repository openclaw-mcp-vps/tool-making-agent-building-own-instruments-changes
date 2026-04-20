"use client";

import Editor from "@monaco-editor/react";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  height?: string;
}

export const CodeEditor = ({
  value,
  onChange,
  language = "javascript",
  height = "320px"
}: CodeEditorProps) => {
  return (
    <div className="overflow-hidden rounded-lg border border-[#30363d]">
      <Editor
        height={height}
        theme="vs-dark"
        defaultLanguage={language}
        value={value}
        onChange={(nextValue) => onChange(nextValue ?? "")}
        options={{
          minimap: { enabled: false },
          fontSize: 13,
          fontFamily: "var(--font-ibm-plex-mono)",
          scrollBeyondLastLine: false,
          automaticLayout: true,
          wordWrap: "on"
        }}
      />
    </div>
  );
};
