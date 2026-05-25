import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  department?: string;
  phoneNumber?: string;
}

export interface Option {
  id: string;
  text: string;
  emoji?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  optionClicked?: string;
}

export interface ChatSession {
  id: string;
  summary: string | null;
  startedAt: string;
}

interface StoreState {
  user: User | null;
  setUser: (user: User | null) => void;
  
  messages: Message[];
  addMessage: (msg: Message) => void;
  setMessages: (msgs: Message[]) => void;
  
  options: Option[];
  setOptions: (opts: Option[]) => void;
  
  isStreaming: boolean;
  setIsStreaming: (status: boolean) => void;
  
  // Session management
  currentSessionId: string | null;
  setCurrentSessionId: (id: string | null) => void;
  
  chatSessions: ChatSession[];
  setChatSessions: (sessions: ChatSession[]) => void;
  
  // Pending option for post-registration continuation
  pendingOption: { id: string; text: string } | null;
  setPendingOption: (opt: { id: string; text: string } | null) => void;

  // Show inline registration
  showInlineRegister: boolean;
  setShowInlineRegister: (show: boolean) => void;
  
  clearChat: () => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      
      messages: [],
      addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
      setMessages: (msgs) => set({ messages: msgs }),
      
      options: [],
      setOptions: (opts) => set({ options: opts }),
      
      isStreaming: false,
      setIsStreaming: (status) => set({ isStreaming: status }),
      
      currentSessionId: null,
      setCurrentSessionId: (id) => set({ currentSessionId: id }),
      
      chatSessions: [],
      setChatSessions: (sessions) => set({ chatSessions: sessions }),
      
      pendingOption: null,
      setPendingOption: (opt) => set({ pendingOption: opt }),

      showInlineRegister: false,
      setShowInlineRegister: (show) => set({ showInlineRegister: show }),
      
      clearChat: () => set({ messages: [], options: [], currentSessionId: null, pendingOption: null, showInlineRegister: false }),
    }),
    {
      name: 'ritza-chat-storage',
      partialize: (state) => ({
        messages: state.messages,
        options: state.options,
        currentSessionId: state.currentSessionId,
        pendingOption: state.pendingOption,
      }),
    }
  )
);
