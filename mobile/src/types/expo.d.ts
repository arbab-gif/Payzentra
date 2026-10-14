/// <reference types="expo/types" />

// Image imports resolve to a source Metro can load (a number on native, a URI object on web).
declare module "*.png" {
  import type { ImageSourcePropType } from "react-native";
  const source: ImageSourcePropType;
  export default source;
}

declare module "*.jpg" {
  import type { ImageSourcePropType } from "react-native";
  const source: ImageSourcePropType;
  export default source;
}
