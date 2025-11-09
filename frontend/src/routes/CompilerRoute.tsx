import { lazy, Suspense } from "react";
import { RouteObject } from "react-router-dom";

const CompilerLayout = lazy(() => import("../layouts/CompilerLayout"));
const CppCompiler = lazy(() => import("../pages/Compiler/CppCompiler"));
const JavaCompiler = lazy(() => import("../pages/Compiler/JavaCompiler"));
const PythonCompiler = lazy(() => import("../pages/Compiler/PythonCompiler"));
const CompilerHome = lazy(() => import("../pages/Compiler/CompilerHome"));

const CompilerRoute: RouteObject[] = [
  {
    path: "/online-compiler",
    element: (
      <Suspense fallback={<div>Loading...</div>}>
        <CompilerHome />
      </Suspense>
    ),
  },
  {
    path: "/online-compiler",
    element: (
      <Suspense fallback={<div>Loading...</div>}>
        <CompilerLayout />
      </Suspense>
    ),
    children: [
      {
        path: "java",
        element: (
          <Suspense fallback={<div>Loading...</div>}>
            <JavaCompiler />
          </Suspense>
        ),
      },
      {
        path: "cpp",
        element: (
          <Suspense fallback={<div>Loading...</div>}>
            <CppCompiler />
          </Suspense>
        ),
      },
      {
        path: "py",
        element: (
          <Suspense fallback={<div>Loading...</div>}>
            <PythonCompiler />
          </Suspense>
        ),
      },
    ],
  },
];

export default CompilerRoute;
