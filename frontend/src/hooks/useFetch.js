// src/hooks/useFetch.js
import { useState, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";

export const useFetch = (url, options = {}, autoFetch = true) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState(null);

  const { getAccessTokenSilently, isAuthenticated } = useAuth0();

  const fetchData = async (overrideOptions = {}) => {
    setLoading(true);
    try {
      let headers = {
        ...(options.headers || {}),
        ...(overrideOptions.headers || {}),
      };

      if (isAuthenticated) {
        const token = await getAccessTokenSilently();
        headers = {
          ...headers,
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        };
      }

      const response = await fetch(url, {
        ...options,
        ...overrideOptions,
        headers,
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || "Network response was not ok");
      }

      const result = await response.json();
      setData(result);
      return result; // return data for manual calls
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoFetch) fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, isAuthenticated]);

  return { data, loading, error, refetch: fetchData };
};
