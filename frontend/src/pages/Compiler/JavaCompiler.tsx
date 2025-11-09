import { useOutletContext } from "react-router-dom";
import MonacoEditor from "../../components/MonacoEditor";
import { useEffect } from "react";

type LayoutContext = {
  code: string;
  setCode: (s: string) => void;
  setFilename: (s: string) => void;
  setLanguage: (s: string) => void;
};

const JavaCompiler: React.FC = () => {
  const { code, setCode, setFilename, setLanguage } =
    useOutletContext<LayoutContext>();

  useEffect(() => {
    setFilename("Main");
    setLanguage("java");
    setCode(`// Online Java Compiler
// Use this editor to write, compile and run your Java code online

class Main {
    public static void main(String[] args) {
        System.out.println("Hello world!");
    }
}`);
  }, [setFilename, setLanguage, setCode]);

  return (
    <MonacoEditor
      language="java"
      value={code}
      onChange={(val) => setCode(val ?? "")}
    />
  );
};
export default JavaCompiler;
