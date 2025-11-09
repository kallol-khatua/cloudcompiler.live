import { Outlet } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import XTerminal from "../components/XTerminal";
import JavaLogoSvg from "../assets/java-icon.svg";
import CPPLogoSvg from "../assets/c-icon.svg";
import PythonLogoSvg from "../assets/python-icon.svg";
import CircularLoader from "../components/loaders/CircularLoader";

type compilerLink = {
  url: string;
  title: string;
  name: string;
  logo: string;
};

const compilers: compilerLink[] = [
  {
    url: "https://cloudcompiler.live/online-compiler/java",
    name: "Java",
    title: "Online Java Compiler",
    logo: JavaLogoSvg,
  },
  {
    url: "https://cloudcompiler.live/online-compiler/cpp",
    name: "C++",
    title: "Online C++ Compiler",
    logo: CPPLogoSvg,
  },
  {
    url: "https://cloudcompiler.live/online-compiler/py",
    name: "Python",
    title: "Online Python Interpreter",
    logo: PythonLogoSvg,
  },
];

const CompilerLayout: React.FC = () => {
  const [clearTerminal, setClearTerminal] = useState<boolean>(false);
  const [output, setOutput] = useState<string>("");

  const [language, setLanguage] = useState<string>("");
  const [filename, setFilename] = useState<string>("");
  const [code, setCode] = useState<string>("");

  const socketRef = useRef<WebSocket | null>(null);
  const jobIdRef = useRef<string>("");
  const [isCompiling, setIsCompiling] = useState<boolean>(false);

  const handleRun = () => {
    if (socketRef.current) {
      console.warn("code already running");
      return;
    }

    setIsCompiling(true);
    // send code to backend for execution
    // Clear output and signal terminal to clear
    setOutput("");
    setClearTerminal(true); // This will trigger terminal clearing

    socketRef.current = new WebSocket("wss://websocket.cloudcompiler.live/ws");
    // socketRef.current = new WebSocket("ws://localhost:8009/ws");

    socketRef.current.onopen = () => {
      console.log("Connected to WebSocket");
      const runMessage = {
        type: "RUN_EVENT",
        data: {
          file_name: filename,
          language: language,

          source_code: code,
        },
      };
      socketRef.current?.send(JSON.stringify(runMessage));
    };

    socketRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      // console.log("Received:", data);

      if (data.type === "SESSION_CREATED") {
        console.log("SESSION_CREATED Job id: " + data.job_id);
        jobIdRef.current = data.job_id;
      } else if (data.type === "STDOUT" || data.type === "STDERR") {
        setIsCompiling(false);
        setOutput((prev) => prev + data.content);
      } else if (data.type === "COMPLETION") {
        console.log(data.content);
        setIsCompiling(false);
        if (data.content.exitCode === 0) {
          setOutput((prev) => prev + "\n=== Code Execution Successful ===\n");
        } else {
          setOutput((prev) => prev + "\n=== Code Exited With Errors ===\n");
        }
        setOutput(
          (prev) =>
            prev +
            `\nExecution time: ${
              Number(data.content.metrics.executionTime) / 1000
            } sec\n`
        );
      } else if (data.type === "TERMINATION") {
        console.log(data.content);
        setOutput((prev) => prev + "\n=== Execution Halted ===\n");
        setOutput(
          (prev) =>
            prev +
            `\nExecution time: ${
              Number(data.content.metrics.executionTime) / 1000
            } sec\n`
        );
      } else {
        // console.log(data);
      }
    };

    socketRef.current.onclose = () => {
      console.log("WebSocket connection closed");
      socketRef.current = null;
      jobIdRef.current = "";
    };

    socketRef.current.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
  };

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const handleInput = (content: string) => {
    // send data through websocket as user input

    // console.log("Job Id: " + jobIdRef.current)

    if (!socketRef.current || !jobIdRef.current) {
      console.warn("Socket not connected or Job ID not set yet");
      setClearTerminal(true);
      return;
    }

    const inputMessage = {
      type: "INPUT_EVENT",
      data: {
        job_id: jobIdRef.current,
        content: content,
      },
    };

    console.log("Sending input:", content);
    socketRef.current.send(JSON.stringify(inputMessage));
  };

  const handleClearComplete = () => {
    setClearTerminal(false);
  };

  const inputRef = useRef<HTMLInputElement | null>(null);
  const spanRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (filename[filename.length - 1] == " ")
      setFilename(filename.substring(0, filename.length - 1));
    if (spanRef.current && inputRef.current) {
      const spanWidth = spanRef.current.offsetWidth;
      inputRef.current.style.width = `${spanWidth}px`;
    }
  }, [filename]);

  return (
    <>
      <div>
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6525165640417107"
          crossOrigin="anonymous"
        ></script>
        <ins
          className="adsbygoogle"
          style={{ display: "block" }}
          data-ad-client="ca-pub-6525165640417107"
          data-ad-slot="3000742128"
          data-ad-format="auto"
          data-full-width-responsive="true"
        ></ins>
        <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
      </div>

      <div className="h-screen flex flex-col">
        <div className="flex-none">
          <a href="https://cloudcompiler.live/" rel="noopener" target="_blank">
            <div
              className="text-2xl font-extrabold tracking-wide cursor-pointer my-[10px] ml-[10px]"
              onClick={() => scrollTo("top")}
            >
              CloudCompiler
            </div>
          </a>

          {/* google abs */}
          <div>
            <script
              async
              src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6525165640417107"
              crossOrigin="anonymous"
            ></script>
            <ins
              className="adsbygoogle"
              style={{ display: "block" }}
              data-ad-client="ca-pub-6525165640417107"
              data-ad-slot="3000742128"
              data-ad-format="auto"
              data-full-width-responsive="true"
            ></ins>
            <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
          </div>
        </div>

        <div className="flex flex-1 overflow-auto">
          {/* sidebar */}
          <div className="bg-slate-100 w-[60px] py-[5px] border-gray-300 border-t border-l border-b flex flex-col items-center  overflow-y-auto no-scrollbar">
            {compilers.map((compiler, idx) => {
              return (
                <div key={idx}>
                  <a
                    target="_blank"
                    href={compiler.url}
                    title={compiler.title}
                    rel="noopener noreferrer"
                  >
                    <img
                      src={compiler.logo}
                      alt={compiler.name}
                      className="w-[40px] h-[40px] p-1 flex justify-center items-center border border-gray-300 text-[24px] font-bold select-none bg-slate-50 my-[5px]"
                    />
                  </a>
                </div>
              );
            })}
          </div>

          {/* Editor and output terminal */}
          <div className="flex h-full w-full">
            {/* Editor swaps by route */}
            <div className="w-1/2 flex flex-col">
              <div className="flex items-center border border-gray-300 justify-between p-2  flex-shrink-0">
                <div className="font-semibold px-4">
                  {/* {filename} */}
                  <label className="w-full ">
                    <span
                      className="absolute w-fit left-0 top-0 text-transparent "
                      style={{
                        fontFamily: "monospace",
                        fontSize: "1rem",
                      }}
                      ref={spanRef}
                    >
                      {filename || " "}
                    </span>
                    <input
                      type="text"
                      ref={inputRef}
                      value={filename}
                      className=" min-w-2 border-0 focus:ring-0 focus:border-0 focus:outline-none "
                      onChange={(e) => {
                        setFilename(e.target.value);
                      }}
                      // onBlur={()=>handleBlur()}
                      style={{
                        fontFamily: "monospace",
                        fontSize: "1rem",
                      }}
                    />
                  </label>
                  .{language}
                </div>
                <button
                  onClick={handleRun}
                  className={`bg-blue-500 border border-gray-500 text-white px-4 py-1 rounded hover:bg-blue-600 w-18 ${
                    isCompiling ? "cursor-not-allowed" : "cursor-pointer font-semibold"
                  }`}
                >
                  {isCompiling ? <CircularLoader /> : "Run"}
                </button>
              </div>

              {/* Language specific text editor */}
              <div className="flex-1 border-r border-l border-b border-gray-300">
                <Outlet
                  context={{
                    code,
                    setCode,
                    setFilename,
                    setLanguage,
                  }}
                />
              </div>
            </div>

            {/* output terminal */}
            <div className="w-1/2 h-full flex flex-col">
              {/* Output section */}
              <div className="flex border border-l-0 border-gray-300 items-center justify-between p-2 flex-shrink-0">
                <div className="font-semibold px-4">Output</div>
                <div className="flex space-x-2 px-4">
                  <button
                    onClick={() => {
                      setOutput("");
                      setClearTerminal(true);
                    }}
                    className="cursor-pointer px-4 py-1 border border-gray-500 rounded hover:bg-gray-100"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-auto p-2 border-r border-b border-gray-300">
                <XTerminal
                  output={output}
                  onInput={handleInput}
                  clearTerminal={clearTerminal}
                  onClearComplete={handleClearComplete}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CompilerLayout;
