
import React from 'react';
import {
  createBrowserRouter,
  RouterProvider,
  Route,
  Link,
  Outlet,
} from "react-router-dom";
import Index from "@/pages/Index";
import NotFound from "@/pages/NotFound";
import DeepgramTest from "@/pages/DeepgramTest";
import DocumentAnalyzer from "@/pages/DocumentAnalyzer";

const router = createBrowserRouter([
  {
    path: "/",
    element: <DocumentAnalyzer />,
    errorElement: <NotFound />
  },
  {
    path: "/index",
    element: <Index />
  },
  {
    path: "/deepgram-test",
    element: <DeepgramTest />
  },
]);

function App() {
  return (
    <React.StrictMode>
      <RouterProvider router={router} />
    </React.StrictMode>
  );
}

export default App;
