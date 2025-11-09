// import { lazy, Suspense } from "react";
import { RouteObject } from "react-router-dom";

import CloudCompilerHome from "../pages/Home/CloudCompilerHome";

const HomeRoute: RouteObject[] = [
  {
    path: "/",
    element: <CloudCompilerHome />,
  },
];

export default HomeRoute;
