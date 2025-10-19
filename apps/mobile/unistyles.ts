import { StyleSheet } from "react-native-unistyles";
import { darkTheme, lightTheme } from "./theme";

const appThemes = {
  light: lightTheme,
  dark: darkTheme,
} as const;

type AppThemes = {
  light: typeof lightTheme;
  dark: typeof darkTheme;
};

declare module "react-native-unistyles" {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface UnistylesThemes extends AppThemes {}
}

StyleSheet.configure({
  themes: appThemes,
  settings: {
    adaptiveThemes: false,
    initialTheme: "light",
  },
});

// Export the themes
export { darkTheme, lightTheme };
