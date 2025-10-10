import type { BottomSheetMethods } from '@gorhom/bottom-sheet/lib/typescript/types';
import React, { createContext, useContext, useRef, ReactNode, useState } from 'react';

import { CustomBottomSheet, type BottomSheetVariant } from '@/components/molecules';

interface BottomSheetButton {
  text: string;
  variant?: "filled" | "outlined" | "text" | "ghost";
  color?: "primary" | "secondary" | "success" | "warning" | "error" | "info" | "neutral";
  size?: "small" | "medium" | "large";
  shape?: "rectangular" | "rounded" | "circular";
  disabled?: boolean;
  loading?: boolean;
  onPress?: () => void;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

interface BottomSheetConfig {
  variant?: BottomSheetVariant;
  title?: string;
  message?: string;
  icon?: React.ReactNode;
  buttons?: BottomSheetButton[];
  snapPoints?: string[];
}

interface BottomSheetContextType {
  showBottomSheet: (config: BottomSheetConfig) => void;
  hideBottomSheet: () => void;
}

const BottomSheetContext = createContext<BottomSheetContextType | undefined>(undefined);

interface BottomSheetProviderProps {
  children: ReactNode;
}

export const BottomSheetProvider: React.FC<BottomSheetProviderProps> = ({ children }) => {
  const bottomSheetRef = useRef<BottomSheetMethods>(null);
  const [config, setConfig] = useState<BottomSheetConfig>({});

  const showBottomSheet = (newConfig: BottomSheetConfig) => {
    setConfig(newConfig);
    bottomSheetRef.current?.snapToIndex(0);
  };

  const hideBottomSheet = () => {
    bottomSheetRef.current?.close();
  };

  return (
    <BottomSheetContext.Provider value={{ showBottomSheet, hideBottomSheet }}>
      {children}
      <CustomBottomSheet
        ref={bottomSheetRef}
        variant={config.variant}
        title={config.title}
        message={config.message}
        icon={config.icon}
        buttons={config.buttons}
        snapPoints={config.snapPoints}
      />
    </BottomSheetContext.Provider>
  );
};

export const useBottomSheet = (): BottomSheetContextType => {
  const context = useContext(BottomSheetContext);
  if (!context) {
    throw new Error('useBottomSheet must be used within a BottomSheetProvider');
  }
  return context;
};