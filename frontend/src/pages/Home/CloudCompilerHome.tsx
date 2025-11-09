import { useState, useEffect } from "react";
import JavaLogoSvg from "../../assets/java-icon.svg";
import CPPLogoSvg from "../../assets/cpp-icon.svg";
import PythonLogoSvg from "../../assets/python-icon.svg";
import JavaScriptLogoSvg from "../../assets/javascript-icon.svg";
import CLogoSvg from "../../assets/c-icon.svg";
import SQLDatabaseLogoSvg from "../../assets/sql-database-icon.svg";

interface Compiler {
  id: string;
  name: string;
  icon: string;
  description: string;
  url?: string;
  available: boolean;
  color: string;
}

interface Feature {
  icon: string;
  title: string;
  description: string;
}

export default function CloudCompilerHome() {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    console.log(hoveredCard);
    console.log(mounted);
  }, [hoveredCard, mounted]);

  const availableCompilers: Compiler[] = [
    {
      id: "java",
      name: "Java",
      icon: JavaLogoSvg,
      description: "Full JDK support",
      url: "/online-compiler/java",
      available: true,
      color: "#EF6C00",
    },
    {
      id: "cpp",
      name: "C++",
      icon: CPPLogoSvg,
      description: "Modern C++ standards",
      url: "/online-compiler/cpp",
      available: true,
      color: "#1565C0",
    },
    {
      id: "python",
      name: "Python",
      icon: PythonLogoSvg,
      description: "Popular libraries included",
      url: "/online-compiler/py",
      available: true,
      color: "#FBC02D",
    },
  ];

  const comingSoonCompilers: Compiler[] = [
    {
      id: "javascript",
      name: "JavaScript",
      icon: JavaScriptLogoSvg,
      description: "Node.js environment",
      available: false,
      color: "#FDD835",
    },
    {
      id: "c",
      name: "C",
      icon: CLogoSvg,
      description: "Classic GCC compiler",
      available: false,
      color: "#526683ff",
    },
    {
      id: "sql",
      name: "SQL",
      icon: SQLDatabaseLogoSvg,
      description: "Sample databases",
      available: false,
      color: "#0078D7",
    },
  ];

  const features: Feature[] = [
    {
      icon: "⚡",
      title: "Fast Execution",
      description: "Compile instantly on powerful servers.",
    },
    {
      icon: "🔒",
      title: "Secure",
      description: "Run your code safely in isolated sandboxes.",
    },
    {
      icon: "💾",
      title: "Save Code",
      description: "Store and share snippets effortlessly.",
    },
    {
      icon: "🌐",
      title: "Anywhere Access",
      description: "Use from any device with an internet connection.",
    },
  ];

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-gray-100 font-sans">
      {/* Header / Navbar */}
      <header className="sticky top-0 z-50 bg-gray-900 bg-opacity-90 backdrop-blur-sm border-b border-gray-700">
        <nav className="max-w-7xl mx-auto px-6 md:px-12 flex justify-between items-center h-16">
          <div
            className="text-2xl font-extrabold tracking-wide cursor-pointer"
            onClick={() => scrollTo("top")}
          >
            CloudCompiler
          </div>
          <ul className="hidden md:flex gap-8 text-gray-300 font-semibold">
            <li>
              <button
                onClick={() => scrollTo("compilers")}
                className="hover:text-white transition cursor-pointer"
              >
                Compilers
              </button>
            </li>
            <li>
              <button
                onClick={() => scrollTo("features")}
                className="hover:text-white transition cursor-pointer"
              >
                Features
              </button>
            </li>
            <li>
              <button
                onClick={() => scrollTo("contact")}
                className="hover:text-white transition cursor-pointer"
              >
                Contact
              </button>
            </li>
          </ul>
        </nav>
      </header>

      {/* Hero Section */}
      <section
        id="top"
        className="flex flex-col items-center justify-center h-screen px-6 text-center max-w-4xl mx-auto"
      >
        <h1 className="text-5xl md:text-7xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-pink-400 to-purple-400">
          Code. Compile. Ship.
        </h1>
        <p className="text-lg md:text-xl max-w-xl text-gray-300 mb-8">
          Powerful, secure, and fast online compilers. No setup needed — start
          coding immediately in multiple languages, right from your browser.
        </p>
        <div className="flex flex-wrap gap-6 justify-center">
          <button
            onClick={() => scrollTo("compilers")}
            className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-lg text-white font-semibold transition cursor-pointer"
          >
            Start Coding
          </button>
          <button
            onClick={() => scrollTo("features")}
            className="px-8 py-3 border border-indigo-600 hover:bg-indigo-700 hover:text-white rounded-lg shadow-lg text-indigo-400 transition cursor-pointer"
          >
            Learn More
          </button>
        </div>
      </section>

      {/* Compiler Cards Section */}
      <section id="compilers" className="max-w-7xl mx-auto px-6 md:px-12 py-20">
        <h2 className="text-4xl font-bold mb-10 text-center text-indigo-400">
          Choose Your Language
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {availableCompilers.map(
            ({ id, name, icon, description, url, color }) => (
              <div
                key={id}
                onClick={() => url && window.location.assign(url)}
                onMouseEnter={() => setHoveredCard(id)}
                onMouseLeave={() => setHoveredCard(null)}
                className={`cursor-pointer flex flex-col items-center p-8 rounded-xl shadow-lg transform transition-transform duration-300 hover:scale-105 hover:shadow-indigo-500/50`}
                style={{
                  borderTop: `6px solid ${color}`,
                  backgroundColor: "#1E293B",
                }}
                aria-label={`${name} compiler card`}
                tabIndex={0}
                role="button"
                // onKeyDown={(e) => {
                //   if (e.key === "Enter") url && window.location.assign(url);
                // }}
              >
                <div className="text-7xl mb-5">
                  <img
                    src={icon}
                    alt={name}
                    className="w-[75px] h-[75px] p-1 flex justify-center items-center text-[24px] font-bold select-none my-[5px]"
                  />
                </div>
                <h3 className="text-2xl font-semibold mb-2">{name}</h3>
                <p className="text-gray-400 text-center">{description}</p>
                <span className="mt-4 inline-block px-3 py-1 rounded-full bg-green-600 text-white font-bold text-xs tracking-wide">
                  Available Now
                </span>
              </div>
            )
          )}

          {comingSoonCompilers.map(({ id, name, icon, description, color }) => (
            <div
              key={id}
              className="flex flex-col items-center p-8 rounded-xl shadow-md bg-gray-700 cursor-not-allowed opacity-60"
              style={{ borderTop: `6px solid ${color}` }}
              aria-disabled="true"
            >
              <div className="text-7xl mb-5">
                <img
                  src={icon}
                  alt={name}
                  className="w-[75px] h-[75px] p-1 flex justify-center items-center text-[24px] font-bold select-none my-[5px]"
                />
              </div>
              <h3 className="text-2xl font-semibold mb-2">{name}</h3>
              <p className="text-gray-400 text-center">{description}</p>
              <span className="mt-4 inline-block px-3 py-1 rounded-full bg-gray-500 text-gray-300 font-bold text-xs tracking-wide">
                Coming Soon
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-gray-800 py-20 px-6 md:px-12">
        <h2 className="text-4xl font-bold mb-12 text-center text-indigo-400">
          Why CloudCompiler?
        </h2>
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
          {features.map(({ icon, title, description }) => (
            <div
              key={title}
              className="bg-gray-700 p-8 rounded-xl text-center shadow-lg hover:shadow-indigo-500/40 transition-shadow cursor-default select-none"
            >
              <div className="text-6xl mb-6">{icon}</div>
              <h3 className="text-2xl font-semibold mb-3">{title}</h3>
              <p className="text-gray-400">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Contact / Footer Section */}
      <section
        id="contact"
        className="py-16 bg-gray-900 text-gray-300 text-center px-6 md:px-12"
      >
        <h2 className="text-3xl font-semibold mb-6 text-indigo-400">
          Get In Touch
        </h2>
        <p className="mb-8 max-w-xl mx-auto">
          Questions? Feedback? Reach out on any of the platforms below.
        </p>
        <div className="flex justify-center gap-8 flex-wrap text-xl text-indigo-400">
          <a
            href="https://www.linkedin.com/in/kallol-khatua/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn Profile"
            className="hover:text-indigo-600 transition"
          >
            🔗 LinkedIn
          </a>
          <a
            href="mailto:kallolkhatua2005@gmail.com"
            aria-label="Send Email"
            className="hover:text-indigo-600 transition"
          >
            📧 Email
          </a>
          <a
            href="https://github.com/kallol-khatua/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub Profile"
            className="hover:text-indigo-600 transition"
          >
            🐙 GitHub
          </a>
          <a
            href="https://codolio.com/profile/kallol_khatua"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Codolio Profile"
            className="hover:text-indigo-600 transition"
          >
            💻 Codolio
          </a>
        </div>

        <p className="mt-12 text-gray-600 text-sm">
          © 2025 CloudCompiler.live. All rights reserved.
        </p>
      </section>
    </div>
  );
}
