import { lazy, Suspense } from "react";
import { createBrowserRouter } from "react-router-dom";

const NotFound = lazy(() => import("../pages/Home/NotFound"));

import CompilerRoute from "./CompilerRoute";
import HomeRoute from "./HomeRoute";

const router = createBrowserRouter([
  ...HomeRoute,
  ...CompilerRoute,
  {
    path: "*",
    element: (
      <Suspense fallback={<div>Loading...</div>}>
        <NotFound />
      </Suspense>
    ),
  },
]);

export default router;
