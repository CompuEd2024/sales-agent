import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { Agent } from '../types/database';
import {
  portalService,
  getSupabaseClient,
  getSupabaseCredentials,
  DEMO_AGENTS,
} from '../lib/supabase';

const AGENT_NOT_RECOGNIZED_MESSAGE =
  'Agent not recognized. You are not registered as an agent, so you cannot enter the app.';

interface AgentContextType {
  currentAgent: Agent | null;
  agentId: string | null;
  isLoading: boolean;
  error: string | null;
  isLiveSupabase: boolean;
  demoAgents: Agent[];
  switchDemoAgent: (agentId: string) => void;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string; errorCode?: string; agent?: Agent }>;
  logout: () => Promise<void>;
  refreshAgent: () => Promise<void>;
  clearError: () => void;
}

const AgentContext = createContext<AgentContextType | undefined>(undefined);

export function AgentProvider({ children }: { children: ReactNode }) {
  const [currentAgent, setCurrentAgent] = useState<Agent | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [demoAgents, setDemoAgents] = useState<Agent[]>(DEMO_AGENTS);

  const creds = getSupabaseCredentials();
  const isLiveSupabase = creds.isConfigured;

  // Refs to prevent duplicate concurrent resolution, break retry loops, and enforce login-first on startup
  const isResolvingRef = useRef<boolean>(false);
  const resolvedUserIdRef = useRef<string | null>(null);
  const bootCompleteRef = useRef<boolean>(false);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Refresh auth state cleanly without auto-entering on cold boot or demo mode
  const refreshAgent = useCallback(async () => {
    if (isResolvingRef.current) return;
    isResolvingRef.current = true;
    setIsLoading(true);
    setError(null);
    try {
      const availableAgents = portalService.getDemoAgents();
      setDemoAgents(availableAgents);

      // If no user has explicitly logged in during this session, remain on the login screen
      if (!resolvedUserIdRef.current) {
        setCurrentAgent(null);
        return;
      }

      const supabase = getSupabaseClient();
      if (supabase) {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          const agentProfile = await portalService.fetchAgentByAuthUser(session.user);
          if (agentProfile) {
            setCurrentAgent(agentProfile);
            resolvedUserIdRef.current = session.user.id;
            return;
          }

          await supabase.auth.signOut().catch(() => {});
          resolvedUserIdRef.current = null;
          setCurrentAgent(null);
          setError(AGENT_NOT_RECOGNIZED_MESSAGE);
          return;
        }

        resolvedUserIdRef.current = null;
        setCurrentAgent(null);
      }
    } catch (err: any) {
      console.error('Agent state refresh error:', err);
      setError(err.message || 'Failed to refresh agent profile');
      resolvedUserIdRef.current = null;
      setCurrentAgent(null);
    } finally {
      setIsLoading(false);
      isResolvingRef.current = false;
    }
  }, []);

  // Always start on the login page on app boot, then listen for Supabase Auth changes
  useEffect(() => {
    let isCancelled = false;

    const initializeLoginFirst = async () => {
      setIsLoading(true);
      setError(null);
      resolvedUserIdRef.current = null;
      setCurrentAgent(null);

      try {
        try {
          localStorage.removeItem('opticportal_active_agent_id');
        } catch {}

        const supabase = getSupabaseClient();
        if (supabase) {
          await supabase.auth.signOut().catch(() => {});
        }

        if (!isCancelled) {
          setDemoAgents(portalService.getDemoAgents());
        }
      } catch (err: any) {
        console.error('Agent state initialization error:', err);
      } finally {
        if (!isCancelled) {
          bootCompleteRef.current = true;
          setCurrentAgent(null);
          setIsLoading(false);
        }
      }
    };

    initializeLoginFirst();

    const supabase = getSupabaseClient();
    if (supabase) {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_OUT') {
          resolvedUserIdRef.current = null;
          setCurrentAgent(null);
          setIsLoading(false);
          return;
        }

        // Ignore cached/initial session events fired before login-first startup cleanup completes
        if (!bootCompleteRef.current) {
          return;
        }

        // Only handle user authentication state changes; avoid loops on background token refresh
        if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
          if (session?.user) {
            if (resolvedUserIdRef.current === session.user.id) {
              return;
            }
            if (isResolvingRef.current) {
              return;
            }

            isResolvingRef.current = true;
            try {
              const agentProfile = await portalService.fetchAgentByAuthUser(session.user);
              if (agentProfile) {
                setCurrentAgent(agentProfile);
                resolvedUserIdRef.current = session.user.id;
                setError(null);
              } else {
                await supabase.auth.signOut().catch(() => {});
                resolvedUserIdRef.current = null;
                setCurrentAgent(null);
                setError(AGENT_NOT_RECOGNIZED_MESSAGE);
              }
            } catch (err) {
              console.warn('onAuthStateChange profile error:', err);
              await supabase.auth.signOut().catch(() => {});
              resolvedUserIdRef.current = null;
              setCurrentAgent(null);
              setError(AGENT_NOT_RECOGNIZED_MESSAGE);
            } finally {
              setIsLoading(false);
              isResolvingRef.current = false;
            }
          }
        }
      });

      return () => {
        isCancelled = true;
        subscription.unsubscribe();
      };
    }

    return () => {
      isCancelled = true;
    };
  }, []);

  // Demo Agent Switcher (switches active agent and triggers UI update)
  const switchDemoAgent = useCallback((agentId: string) => {
    setIsLoading(true);
    try {
      localStorage.setItem('opticportal_active_agent_id', agentId);
      const found = demoAgents.find((a) => a.id === agentId);
      if (found) {
        resolvedUserIdRef.current = found.id;
        setCurrentAgent(found);
      } else {
        const agent = portalService.setActiveDemoAgent(agentId);
        resolvedUserIdRef.current = agent.id;
        setCurrentAgent(agent);
      }
    } finally {
      setIsLoading(false);
    }
  }, [demoAgents]);

  const login = useCallback(
    async (email: string, password: string) => {
      isResolvingRef.current = true;
      setError(null);
      try {
        const res = await portalService.loginAgent(email, password);
        if (res.success && res.agent) {
          resolvedUserIdRef.current = res.agent.auth_user_id || res.agent.id;
          setCurrentAgent(res.agent);
          setDemoAgents(portalService.getDemoAgents());
          return res;
        } else {
          resolvedUserIdRef.current = null;
          setCurrentAgent(null);
          setError(res.error || 'Login failed');
          return res;
        }
      } catch (err: any) {
        resolvedUserIdRef.current = null;
        setCurrentAgent(null);
        setError(err.message || 'Login error');
        return { success: false, error: err.message };
      } finally {
        isResolvingRef.current = false;
      }
    },
    []
  );

  const logout = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    resolvedUserIdRef.current = null;
    try {
      await portalService.logout();
      setCurrentAgent(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <AgentContext.Provider
      value={{
        currentAgent,
        agentId: currentAgent?.id || null,
        isLoading,
        error,
        isLiveSupabase,
        demoAgents,
        switchDemoAgent,
        login,
        logout,
        refreshAgent,
        clearError,
      }}
    >
      {children}
    </AgentContext.Provider>
  );
}

export function useAgent(): AgentContextType {
  const context = useContext(AgentContext);
  if (!context) {
    throw new Error('useAgent must be used within an AgentProvider');
  }
  return context;
}
