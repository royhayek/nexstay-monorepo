import React from "react";
import { TouchableOpacity, TouchableOpacityProps, View } from "react-native";

export interface IconButtonProps extends TouchableOpacityProps {
  children: React.ReactNode;
}

/**
 * IconButton component that prevents child elements from blocking touch events.
 */
export function IconButton({
  children,
  style,
  ...props
}: IconButtonProps) {
  return (
    <TouchableOpacity
      {...props}
      style={style}
    >
      <View pointerEvents="none">
        {children}
      </View>
    </TouchableOpacity>
  );
}