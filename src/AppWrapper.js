import React from "react";
import { Route, Router } from "react-router-dom";
import App from "./App";

function AppWrapper() {
  const navigate = useNavigate();

  return <Route path="*" element={<App navigate={navigate} />} />;
}

export default AppWrapper;
