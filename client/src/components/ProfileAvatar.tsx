import { DiceBearAvatar, parseAvatarUrl, AvatarStyleKey } from "./DiceBearAvatar";

interface ProfileAvatarProps {
  avatarUrl: string;
  name: string;
  size?: number;
  className?: string;
}

/**
 * Smart avatar component that renders either:
 * - DiceBear avatar (if URL starts with "dicebear:")
 * - Regular image (for legacy/uploaded avatars)
 */
export function ProfileAvatar({ 
  avatarUrl, 
  name, 
  size = 40, 
  className = "" 
}: ProfileAvatarProps) {
  const parsed = parseAvatarUrl(avatarUrl);

  if (parsed.isDiceBear && parsed.style && parsed.seed) {
    return (
      <DiceBearAvatar
        seed={parsed.seed}
        style={parsed.style}
        size={size}
        className={className}
      />
    );
  }

  // Legacy avatar (image URL or base64)
  return (
    <img
      src={avatarUrl}
      alt={`${name}'s avatar`}
      className={className}
      style={{ width: size, height: size }}
    />
  );
}

export default ProfileAvatar;
