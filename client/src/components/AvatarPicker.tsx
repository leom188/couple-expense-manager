import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DiceBearAvatar, POPULAR_STYLES, AVATAR_STYLES, AvatarStyleKey, generateAvatarUrl } from "./DiceBearAvatar";
import { RefreshCw, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface AvatarPickerProps {
  currentSeed: string;
  currentStyle: AvatarStyleKey;
  onSelect: (avatarUrl: string) => void;
  partnerName: string;
}

export function AvatarPicker({ 
  currentSeed, 
  currentStyle, 
  onSelect, 
  partnerName 
}: AvatarPickerProps) {
  const [selectedStyle, setSelectedStyle] = useState<AvatarStyleKey>(currentStyle);
  const [seed, setSeed] = useState(currentSeed);

  // Generate random seed
  const randomizeSeed = () => {
    const randomSeed = `${partnerName}-${Math.random().toString(36).substring(2, 8)}`;
    setSeed(randomSeed);
  };

  // Preview avatars for each style with current seed
  const stylePreviewsRow1 = useMemo(() => {
    return POPULAR_STYLES.slice(0, 6).map((styleKey) => ({
      key: styleKey,
      name: AVATAR_STYLES[styleKey].name,
    }));
  }, []);

  const stylePreviewsRow2 = useMemo(() => {
    return POPULAR_STYLES.slice(6, 12).map((styleKey) => ({
      key: styleKey,
      name: AVATAR_STYLES[styleKey].name,
    }));
  }, []);

  const handleConfirm = () => {
    onSelect(generateAvatarUrl(seed, selectedStyle));
  };

  return (
    <div className="space-y-4">
      {/* Current Preview */}
      <div className="flex flex-col items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
        <DiceBearAvatar 
          seed={seed} 
          style={selectedStyle} 
          size={80} 
          className="rounded-full ring-4 ring-white dark:ring-slate-700 shadow-lg"
        />
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {AVATAR_STYLES[selectedStyle].name}
        </p>
      </div>

      {/* Seed Input */}
      <div className="space-y-2">
        <Label className="text-sm dark:text-slate-300">Avatar Seed</Label>
        <div className="flex gap-2">
          <Input
            value={seed}
            onChange={(e) => setSeed(e.target.value)}
            placeholder="Enter a seed..."
            className="flex-1 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
          />
          <Button 
            variant="outline" 
            size="icon"
            onClick={randomizeSeed}
            className="shrink-0 dark:border-slate-700 dark:text-slate-300"
          >
            <RefreshCw size={16} />
          </Button>
        </div>
        <p className="text-xs text-slate-400">
          Same seed = same avatar. Try your name or a fun phrase!
        </p>
      </div>

      {/* Style Selection */}
      <div className="space-y-2">
        <Label className="text-sm dark:text-slate-300">Avatar Style</Label>
        <ScrollArea className="h-[200px] pr-2">
          <div className="grid grid-cols-3 gap-2">
            {POPULAR_STYLES.map((styleKey) => (
              <button
                key={styleKey}
                onClick={() => setSelectedStyle(styleKey)}
                className={cn(
                  "relative flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all",
                  selectedStyle === styleKey
                    ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30"
                    : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                )}
              >
                {selectedStyle === styleKey && (
                  <div className="absolute top-1 right-1 w-4 h-4 bg-indigo-500 rounded-full flex items-center justify-center">
                    <Check size={10} className="text-white" />
                  </div>
                )}
                <DiceBearAvatar 
                  seed={seed} 
                  style={styleKey} 
                  size={40} 
                  className="rounded-lg"
                />
                <span className="text-[10px] text-slate-600 dark:text-slate-400 text-center leading-tight">
                  {AVATAR_STYLES[styleKey].name}
                </span>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Confirm Button */}
      <Button 
        onClick={handleConfirm}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
      >
        Use This Avatar
      </Button>
    </div>
  );
}

export default AvatarPicker;
