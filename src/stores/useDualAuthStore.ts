import { create } from 'zustand';

interface DualAuthState {
  // Authentication completion status
  isGithubToolsAuthenticated: boolean;
  isGithubWdfAuthenticated: boolean;
  
  // Loading states
  isGithubToolsLoading: boolean;
  isGithubWdfLoading: boolean;
  
  // Error states
  githubToolsError: string | null;
  githubWdfError: string | null;
  
  // Actions
  setGithubToolsAuthenticated: (authenticated: boolean) => void;
  setGithubWdfAuthenticated: (authenticated: boolean) => void;
  setGithubToolsLoading: (loading: boolean) => void;
  setGithubWdfLoading: (loading: boolean) => void;
  setGithubToolsError: (error: string | null) => void;
  setGithubWdfError: (error: string | null) => void;
  
  // Computed
  isBothAuthenticated: () => boolean;
  isAnyLoading: () => boolean;
  
  // Reset
  reset: () => void;
}

const initialState = {
  isGithubToolsAuthenticated: false,
  isGithubWdfAuthenticated: false,
  isGithubToolsLoading: false,
  isGithubWdfLoading: false,
  githubToolsError: null,
  githubWdfError: null,
};

export const useDualAuthStore = create<DualAuthState>((set, get) => ({
  ...initialState,
  
  setGithubToolsAuthenticated: (authenticated) => 
    set({ isGithubToolsAuthenticated: authenticated, githubToolsError: null }),
  
  setGithubWdfAuthenticated: (authenticated) => 
    set({ isGithubWdfAuthenticated: authenticated, githubWdfError: null }),
  
  setGithubToolsLoading: (loading) => 
    set({ isGithubToolsLoading: loading }),
  
  setGithubWdfLoading: (loading) => 
    set({ isGithubWdfLoading: loading }),
  
  setGithubToolsError: (error) => 
    set({ githubToolsError: error, isGithubToolsLoading: false }),
  
  setGithubWdfError: (error) => 
    set({ githubWdfError: error, isGithubWdfLoading: false }),
  
  isBothAuthenticated: () => {
    const state = get();
    return state.isGithubToolsAuthenticated && state.isGithubWdfAuthenticated;
  },
  
  isAnyLoading: () => {
    const state = get();
    return state.isGithubToolsLoading || state.isGithubWdfLoading;
  },
  
  reset: () => set(initialState),
}));