import { useOutletContext } from "react-router-dom";
import MonacoEditor from "../../components/MonacoEditor";
import { useEffect } from "react";

type LayoutContext = {
  code: string;
  setCode: (s: string) => void;
  setFilename: (s: string) => void;
  setLanguage: (s: string) => void;
};

const CppCompiler: React.FC = () => {
  const { code, setCode, setFilename, setLanguage } =
    useOutletContext<LayoutContext>();

  useEffect(() => {
    setFilename("main");
    setLanguage("cpp");
    setCode(`// Online C++ compiler to run C++ program online
#include <iostream>

int main() {
    // Write C++ code here
    std::cout << "Hello World";

    return 0;
}`);
  }, [setFilename, setLanguage, setCode]);

  return (
    <MonacoEditor
      language="cpp"
      value={code}
      onChange={(val) => setCode(val ?? "")}
    />
  );
};
export default CppCompiler;
