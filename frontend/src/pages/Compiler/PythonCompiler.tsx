import { useOutletContext } from "react-router-dom";
import MonacoEditor from "../../components/MonacoEditor";
import { useEffect } from "react";

type LayoutContext = {
  code: string;
  setCode: (s: string) => void;
  setFilename: (s: string) => void;
  setLanguage: (s: string) => void;
};

const PythonCompiler: React.FC = () => {
  const { code, setCode, setFilename, setLanguage } =
    useOutletContext<LayoutContext>();

  useEffect(() => {

    setFilename("main");
    setLanguage("py");
    setCode(`# Online Python compiler (interpreter) to run Python online.
# Write Python 3 code in this online editor and run it.

print("Hello world!")`);

  }, [setFilename, setLanguage, setCode]);

  return (
    <MonacoEditor
      language="python"
      value={code}
      onChange={(val) => setCode(val ?? "")}
    />
  );
};
export default PythonCompiler;
