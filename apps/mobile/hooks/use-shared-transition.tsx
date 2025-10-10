import React, { createContext, useContext, useState, ReactNode } from "react";

interface TransitionData {
  x: number;
  y: number;
  width: number;
  height: number;
  imageUrl?: string;
}

interface SharedTransitionContextType {
  transitionData: TransitionData | null;
  setTransitionData: (data: TransitionData | null) => void;
}

const SharedTransitionContext = createContext<SharedTransitionContextType | undefined>(undefined);

export function SharedTransitionProvider({ children }: { children: ReactNode }) {
  const [transitionData, setTransitionData] = useState<TransitionData | null>(null);

  return (
    <SharedTransitionContext.Provider value={{ transitionData, setTransitionData }}>
      {children}
    </SharedTransitionContext.Provider>
  );
}

export function useSharedTransition() {
  const context = useContext(SharedTransitionContext);
  if (!context) {
    throw new Error("useSharedTransition must be used within SharedTransitionProvider");
  }
  return context;
}