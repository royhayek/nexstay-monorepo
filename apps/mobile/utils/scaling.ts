// Packages
import { Dimensions, Platform, StatusBar } from "react-native";

const { width, height } = Dimensions.get("window");
const [shortDimension, longDimension] = width < height ? [width, height] : [height, width];

// Default guideline sizes are based on the figma design system
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

/**
 * Check if the device is an iPhone X
 * @returns {boolean} Whether the device is an iPhone X
 */
export const isIphoneX = (): boolean => {
  const dimen = Dimensions.get("window");
  return (
    Platform.OS === "ios" &&
    !Platform.isPad &&
    !Platform.isTV &&
    (dimen.height === 780 ||
      dimen.width === 780 ||
      dimen.height === 812 ||
      dimen.width === 812 ||
      dimen.height === 844 ||
      dimen.width === 844 ||
      dimen.height === 896 ||
      dimen.width === 896 ||
      dimen.height === 926 ||
      dimen.width === 926)
  );
};

// Spacing scaling functions
export const scale = (size: number) => (shortDimension / guidelineBaseWidth) * size;
export const verticalScale = (size: number) => (longDimension / guidelineBaseHeight) * size;
export const moderateScale = (size: number, factor: number = 0.5) => size + (scale(size) - size) * factor;
export const moderateVerticalScale = (size: number, factor: number = 0.5) =>
  size + (verticalScale(size) - size) * factor;

export const s = scale;
export const vs = verticalScale;
export const ms = moderateScale;
export const mvs = moderateVerticalScale;

// Response Font size scaling functions
export function RFValue(fontSize: number) {
  const standardLength = width > height ? width : height;
  const offset = width > height ? 0 : Platform.OS === "ios" ? 78 : StatusBar.currentHeight; // iPhone X style SafeAreaView size in portrait

  const deviceHeight = (isIphoneX() || Platform.OS === "android") && offset ? standardLength - offset : standardLength;

  const heightPercent = (fontSize * deviceHeight) / guidelineBaseHeight;
  return Math.round(heightPercent);
}
