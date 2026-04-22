"use client";

import Editor from "@monaco-editor/react";

type CodeEditorProps = {
  value: string;
  onChange: (value: string) => void;
  height?: string;
};

export function CodeEditor({ value, onChange, height = "320px" }: CodeEditorProps) {
  return (
    <Editor
      language="javascript"
      value={value}
      height={height}
      theme="vs-dark"
      options={{
        fontSize: 13,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        automaticLayout: true,
      }}
      onChange={(nextValue) => onChange(nextValue ?? "")}
    />
  );
}
