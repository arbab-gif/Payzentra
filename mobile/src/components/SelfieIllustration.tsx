import Svg, { Circle, Ellipse, G, Path, Rect } from "react-native-svg";
import { useColors } from "@/lib/theme";

const SKIN = "#f2b98f";
const SKIN_SHADE = "#d99b70";
const HAIR = "#1b1f2b";
const SHIRT = "#e8f1ff";
const PHONE = "#0b1220";

/** A hand holding a phone, face framed by scan brackets. Original artwork in the app palette. */
export function SelfieIllustration({ size = 280 }: { size?: number }) {
  const c = useColors();
  return (
    <Svg width={size} height={size} viewBox="0 0 300 300" accessibilityLabel="Hand holding a phone taking a selfie">
      <Circle cx="150" cy="150" r="128" fill={c.primarySoft} />
      <G transform="rotate(-8 150 150)">
        {/* Palm behind the phone */}
        <Path d="M170 230 C200 214 238 228 256 262 L272 300 L176 300 C160 286 156 250 170 230 Z" fill={SKIN} />
        <Path d="M246 250 L292 226 L306 300 L262 300 Z" fill={c.primaryPressed} />

        {/* Phone */}
        <Rect x="88" y="30" width="130" height="230" rx="24" fill={PHONE} />
        <Rect x="97" y="42" width="112" height="206" rx="16" fill={c.primary} />
        <Circle cx="153" cy="54" r="3" fill={PHONE} />

        {/* Person on screen */}
        <Path d="M107 248 V226 C107 196 128 178 153 178 C178 178 199 196 199 226 V248 Z" fill={SHIRT} />
        <Rect x="144" y="150" width="18" height="22" rx="6" fill={SKIN_SHADE} />
        <Ellipse cx="125" cy="130" rx="5" ry="8" fill={SKIN_SHADE} />
        <Ellipse cx="181" cy="130" rx="5" ry="8" fill={SKIN_SHADE} />
        <Ellipse cx="153" cy="126" rx="28" ry="33" fill={SKIN} />
        <Path d="M125 122 C124 98 138 88 153 88 C170 88 182 98 181 122 C176 108 166 102 153 102 C140 102 130 108 125 122 Z" fill={HAIR} />
        <Circle cx="143" cy="128" r="2.6" fill={HAIR} />
        <Circle cx="163" cy="128" r="2.6" fill={HAIR} />
        <Path d="M145 142 Q153 148 161 142" stroke="#8a4b2f" strokeWidth="2.5" fill="none" strokeLinecap="round" />

        {/* Scan brackets */}
        <G stroke="#ffffff" strokeWidth="4" strokeLinecap="round" fill="none">
          <Path d="M112 72 V62 Q112 58 116 58 H126" />
          <Path d="M180 58 H190 Q194 58 194 62 V72" />
          <Path d="M112 160 V170 Q112 174 116 174 H126" />
          <Path d="M194 160 V170 Q194 174 190 174 H180" />
        </G>
        <Rect x="112" y="124" width="82" height="2" rx="1" fill="#ffffff" opacity={0.7} />

        {/* Fingers wrapping the left edge, thumb on the right */}
        {[150, 176, 202, 228].map((y) => (
          <Rect key={y} x="72" y={y} width="34" height="22" rx="11" fill={SKIN} stroke={SKIN_SHADE} strokeWidth="1.5" />
        ))}
        <Path
          d="M214 196 C228 192 240 204 236 218 C232 232 214 246 200 250 C190 252 186 240 194 234 C204 226 206 210 214 196 Z"
          fill={SKIN}
          stroke={SKIN_SHADE}
          strokeWidth="1.5"
        />
      </G>
    </Svg>
  );
}
