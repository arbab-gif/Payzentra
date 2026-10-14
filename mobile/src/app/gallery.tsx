import { Platform, Text, View } from "react-native";
import { Gallery } from "@/components/gallery/Gallery";

/** Every screen and state of the mobile and web app, light and dark, on one page (browser only). */
export default function GalleryRoute() {
  if (Platform.OS !== "web") {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#1e1e1e", padding: 24 }}>
        <Text style={{ color: "#ffffff", textAlign: "center" }}>The screen gallery opens in a browser.</Text>
      </View>
    );
  }
  return <Gallery />;
}
