import { useMemo } from "react";
import { createAvatar } from "@dicebear/core";
import { 
  adventurer,
  adventurerNeutral,
  avataaars,
  avataaarsNeutral,
  bigEars,
  bigEarsNeutral,
  bigSmile,
  bottts,
  botttsNeutral,
  croodles,
  croodlesNeutral,
  funEmoji,
  icons,
  identicon,
  initials,
  lorelei,
  loreleiNeutral,
  micah,
  miniavs,
  notionists,
  notionistsNeutral,
  openPeeps,
  personas,
  pixelArt,
  pixelArtNeutral,
  rings,
  shapes,
  thumbs
} from "@dicebear/collection";

// Available avatar styles
export const AVATAR_STYLES = {
  adventurer: { name: "Adventurer", style: adventurer },
  adventurerNeutral: { name: "Adventurer Neutral", style: adventurerNeutral },
  avataaars: { name: "Avataaars", style: avataaars },
  avataaarsNeutral: { name: "Avataaars Neutral", style: avataaarsNeutral },
  bigEars: { name: "Big Ears", style: bigEars },
  bigEarsNeutral: { name: "Big Ears Neutral", style: bigEarsNeutral },
  bigSmile: { name: "Big Smile", style: bigSmile },
  bottts: { name: "Robots", style: bottts },
  botttsNeutral: { name: "Robots Neutral", style: botttsNeutral },
  croodles: { name: "Croodles", style: croodles },
  croodlesNeutral: { name: "Croodles Neutral", style: croodlesNeutral },
  funEmoji: { name: "Fun Emoji", style: funEmoji },
  icons: { name: "Icons", style: icons },
  identicon: { name: "Identicon", style: identicon },
  initials: { name: "Initials", style: initials },
  lorelei: { name: "Lorelei", style: lorelei },
  loreleiNeutral: { name: "Lorelei Neutral", style: loreleiNeutral },
  micah: { name: "Micah", style: micah },
  miniavs: { name: "Mini Avatars", style: miniavs },
  notionists: { name: "Notionists", style: notionists },
  notionistsNeutral: { name: "Notionists Neutral", style: notionistsNeutral },
  openPeeps: { name: "Open Peeps", style: openPeeps },
  personas: { name: "Personas", style: personas },
  pixelArt: { name: "Pixel Art", style: pixelArt },
  pixelArtNeutral: { name: "Pixel Art Neutral", style: pixelArtNeutral },
  rings: { name: "Rings", style: rings },
  shapes: { name: "Shapes", style: shapes },
  thumbs: { name: "Thumbs", style: thumbs },
} as const;

export type AvatarStyleKey = keyof typeof AVATAR_STYLES;

// Curated list of popular styles for the picker
export const POPULAR_STYLES: AvatarStyleKey[] = [
  "adventurer",
  "avataaars",
  "bigSmile",
  "bottts",
  "funEmoji",
  "lorelei",
  "micah",
  "miniavs",
  "notionists",
  "openPeeps",
  "personas",
  "pixelArt",
];

interface DiceBearAvatarProps {
  seed: string;
  style?: AvatarStyleKey;
  size?: number;
  className?: string;
}

export function DiceBearAvatar({ 
  seed, 
  style = "adventurer", 
  size = 40,
  className = "" 
}: DiceBearAvatarProps) {
  const avatarSvg = useMemo(() => {
    const styleConfig = AVATAR_STYLES[style]?.style || AVATAR_STYLES.adventurer.style;
    const avatar = createAvatar(styleConfig, {
      seed,
      size,
    });
    return avatar.toDataUri();
  }, [seed, style, size]);

  return (
    <img 
      src={avatarSvg} 
      alt={`Avatar for ${seed}`}
      className={className}
      style={{ width: size, height: size }}
    />
  );
}

// Helper to generate avatar URL for storage
export function generateAvatarUrl(seed: string, style: AvatarStyleKey = "adventurer"): string {
  return `dicebear:${style}:${seed}`;
}

// Helper to parse stored avatar URL
export function parseAvatarUrl(url: string): { isDiceBear: boolean; style?: AvatarStyleKey; seed?: string } {
  if (url.startsWith("dicebear:")) {
    const parts = url.split(":");
    return {
      isDiceBear: true,
      style: parts[1] as AvatarStyleKey,
      seed: parts.slice(2).join(":"), // In case seed contains colons
    };
  }
  return { isDiceBear: false };
}

export default DiceBearAvatar;
