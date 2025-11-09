import { Link } from "react-router-dom";

const CompilerHome: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h1 className="text-2xl font-bold">Choose a Compiler</h1>
      <div className="flex gap-4">
        <Link
          to="/online-compiler/java"
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Java
        </Link>
        <Link
          to="/online-compiler/cpp"
          className="px-4 py-2 bg-green-500 text-white rounded"
        >
          C++
        </Link>
        <Link
          to="/online-compiler/py"
          className="px-4 py-2 bg-yellow-500 text-white rounded"
        >
          Python
        </Link>
      </div>
    </div>
  );
};

export default CompilerHome;
