import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  // The Replit authentication mechanism uses httpOnly cookies.
  // The token is not (and should not be) accessible to client-side JavaScript.
  // `fetch` calls with `credentials: "include"` (as used in `apiRequest`)
  // will automatically send the session cookie to the backend for authentication.
  // Thus, no explicit token handling is needed here or in API calling components
  // for the purpose of an Authorization header.

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    // No token is exposed here as it's not available/needed for manual header setting.
  };
}
