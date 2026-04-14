export function useAuth() {
  return {
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    login: async () => {},
    register: async () => {},
    logout: () => {},
  }
}
