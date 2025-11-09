import Editor from "@monaco-editor/react";

interface MonacoEditorProps {
  language: string;
  value: string;
  onChange: (val: string | undefined) => void;
}

const MonacoEditor: React.FC<MonacoEditorProps> = ({
  language,
  value,
  onChange,
}) => {
  return (
    <Editor
      height="100%"
      value={value}
      language={language}
      theme="light" // vs-dark or light
      onChange={onChange}
      options={{
        fontSize: 14,
        minimap: { enabled: false },
        automaticLayout: true,
        tabSize: 4, // Set tab size here
        insertSpaces: true, // Optional: convert tabs to spaces
      }}
    />
  );
};

export default MonacoEditor;
