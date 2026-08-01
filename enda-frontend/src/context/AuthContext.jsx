import { createContext, useContext, useEffect, useState } from "react";
import { initKeycloak, getUser, logout } from "../services/KeycloakService";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      try {
        const auth = await initKeycloak();

        setAuthenticated(auth);

        if (auth) {
          setUser(getUser());
        }

      } catch (error) {
        console.error("Keycloak error:", error);
      } finally {
        setInitialized(true);
      }
    };

    initialize();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        authenticated,
        initialized,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}