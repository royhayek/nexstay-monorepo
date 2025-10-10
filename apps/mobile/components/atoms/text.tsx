import type {
  ThemeColors,
  TypographyVariant,
  fontFamilies,
  fontSizes,
  fontWeights,
  letterSpacing,
  lineHeights,
} from "@/theme";
import React from "react";
import { Text as RNText, TextProps as RNTextProps, TextStyle } from "react-native";
import { useUnistyles } from "react-native-unistyles";

export interface TextProps extends Omit<RNTextProps, "style"> {
  variant?: TypographyVariant;
  color?: keyof ThemeColors;
  fontSize?: keyof typeof fontSizes;
  fontWeight?: keyof typeof fontWeights;
  fontFamily?: keyof typeof fontFamilies;
  lineHeight?: keyof typeof lineHeights;
  letterSpacing?: keyof typeof letterSpacing;
  textAlign?: "auto" | "left" | "right" | "center" | "justify";
  textDecorationLine?: "none" | "underline" | "line-through" | "underline line-through";
  textTransform?: "none" | "capitalize" | "uppercase" | "lowercase";
  opacity?: number;
  style?: TextStyle;
}

export const Text: React.FC<TextProps> = ({
  children,
  variant = "bodyLargeRegular",
  color,
  fontSize,
  fontWeight,
  fontFamily,
  lineHeight,
  letterSpacing,
  textAlign,
  textDecorationLine,
  textTransform,
  opacity,
  style,
  ...props
}) => {
  const { theme } = useUnistyles();

  const typographyStyle = theme.typography[variant];

  const textStyle: TextStyle = {
    fontSize: fontSize ? theme.fontSizes[fontSize] : typographyStyle.fontSize,
    fontFamily: fontFamily ? theme.fontFamilies[fontFamily] : typographyStyle.fontFamily,
    fontWeight: fontWeight ? theme.fontWeights[fontWeight] : typographyStyle.fontWeight,
    lineHeight: lineHeight ? theme.lineHeights[lineHeight] : typographyStyle.lineHeight,
    color: color ? theme.colors[color] : theme.colors.text,
    ...(letterSpacing && { letterSpacing: theme.letterSpacing[letterSpacing] }),
    ...(textAlign && { textAlign }),
    ...(textDecorationLine && { textDecorationLine }),
    ...(textTransform && { textTransform }),
    ...(opacity !== undefined && { opacity }),
  };

  return (
    <RNText style={[textStyle, style]} {...props}>
      {children}
    </RNText>
  );
};
