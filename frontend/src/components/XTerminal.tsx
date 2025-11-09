import { useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";

interface XTerminalProps {
  output: string;
  onInput?: (data: string) => void;
  clearTerminal?: boolean;
  onClearComplete?: () => void;
}

const XTerminal: React.FC<XTerminalProps> = ({
  output,
  onInput,
  clearTerminal,
  onClearComplete,
}) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const termRef = useRef<Terminal | null>(null);
  const inputBuffer = useRef<string>("");
  const hasMounted = useRef(false);
  const history = useRef<string[]>([]);
  const historyIndex = useRef<number>(-1);
  const printedLength = useRef<number>(0); // Track what we already wrote

  const writePrompt = () => {
    termRef.current?.write("\r\n");
    inputBuffer.current = "";
  };

  const clearLine = () => {
    const len = inputBuffer.current.length;
    const backspaces = "\b \b".repeat(len);
    termRef.current?.write(backspaces);
    inputBuffer.current = "";
    termRef.current?.write("\r");
  };

  useEffect(() => {
    if (!termRef.current && terminalRef.current) {
      const term = new Terminal({
        convertEol: true,
        theme: { 
          background: "#ffffff", 
          foreground: "#111827" 
        },
        fontSize: 14,
        scrollback: 5000,
      });
      const fitAddon = new FitAddon();
      fitAddonRef.current = fitAddon;
      term.loadAddon(fitAddon);
      term.open(terminalRef.current);
      fitAddon.fit();

      window.addEventListener("resize", () => {
        fitAddon.fit();
      });

      termRef.current = term;
      hasMounted.current = true;

      termRef.current.onData((data) => {
        const code = data.charCodeAt(0);

        if (code === 13) {
          // ENTER
          const command = inputBuffer.current;
          onInput?.(command + "\n");
          history.current.push(command);
          historyIndex.current = history.current.length;
          inputBuffer.current = "";
          writePrompt();
        } else if (code === 127) {
          // BACKSPACE
          if (inputBuffer.current.length > 0) {
            inputBuffer.current = inputBuffer.current.slice(0, -1);
            termRef.current?.write("\b \b");
          }
        } else if (data === "\x1B[A") {
          // UP ARROW
          if (history.current.length > 0 && historyIndex.current > 0) {
            historyIndex.current -= 1;
            const cmd = history.current[historyIndex.current];
            clearLine();
            inputBuffer.current = cmd;
            termRef.current?.write(cmd);
          }
        } else if (data === "\x1B[B") {
          // DOWN ARROW
          if (
            history.current.length > 0 &&
            historyIndex.current < history.current.length - 1
          ) {
            historyIndex.current += 1;
            const cmd = history.current[historyIndex.current];
            clearLine();
            inputBuffer.current = cmd;
            termRef.current?.write(cmd);
          } else {
            historyIndex.current = history.current.length;
            clearLine();
            inputBuffer.current = "";
          }
        } else if (data === "\x03") {
          // Ctrl+C
          termRef.current?.write("^C");
          inputBuffer.current = "";
          writePrompt();
        } else {
          // Regular character
          inputBuffer.current += data;
          termRef.current?.write(data);
        }
      });
    }
  }, [onInput]);

  // Handle clearing the terminal
  useEffect(() => {
    if (clearTerminal && termRef.current) {
      termRef.current.clear();
      printedLength.current = 0; // Reset the printed length tracker
      inputBuffer.current = ""; // Clear any input buffer
      onClearComplete?.(); // Signal that clearing is complete
    }
  }, [clearTerminal, onClearComplete]);

  // Only write the "new part" of output
  useEffect(() => {
    if (termRef.current && output.length > 0) {
      const newPart = output.slice(printedLength.current);
      if (newPart.length > 0) {
        termRef.current.write(newPart);
        printedLength.current = output.length;
      }
    }
  }, [output]);

  // Reset printedLength when output is completely cleared
  useEffect(() => {
    if (output.length === 0) {
      printedLength.current = 0;
    }
  }, [output]);

  return (
    <div ref={terminalRef} className="h-full w-full rounded overflow-auto" />
  );
};

export default XTerminal;
