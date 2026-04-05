import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { AppProvider } from "./content/AppContext";
import { Auth0Provider } from "@auth0/auth0-react";

// Load from environment variables
const domain = process.env.REACT_APP_AUTH0_DOMAIN;
const clientId = process.env.REACT_APP_AUTH0_CLIENT_ID;
const audience = process.env.REACT_APP_AUTH0_AUDIENCE;

// ✅ Smart redirect URI for both local and production
const redirectUri =
  window.location.hostname === "localhost"
    ? "http://localhost:3000"
    : window.location.origin; // Uses current URL in production

console.log("✅ Auth0 Configured:", {
  domain,
  clientId,
  audience,
  redirectUri,
  hostname: window.location.hostname,
});

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: redirectUri,
        audience: audience,
      }}
      cacheLocation="localstorage"
    >
      <AppProvider>
        <App />
      </AppProvider>
    </Auth0Provider>
  </React.StrictMode>
);
