import hibbyAvatar from "@/assets/hibby_avatar.png.asset.json";
import hibbyAvatarBlink from "@/assets/hibby_avatar_blink.png.asset.json";
import { cn } from "@/lib/utils";

/** Hibby's profile photo: the mascot head on a light disc, used everywhere Hibby appears.
 *  The blink layer crossfades in briefly every few seconds so Hibby blinks. */
export function HibbyAvatar({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <span
      className={cn("relative inline-block shrink-0 select-none rounded-full", className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label="Hibby"
    >
      <img
        src={hibbyAvatar.url}
        alt=""
        width={size}
        height={size}
        draggable={false}
        className="absolute inset-0 rounded-full object-cover"
        style={{ width: size, height: size }}
      />
      <img
        src={hibbyAvatarBlink.url}
        alt=""
        width={size}
        height={size}
        draggable={false}
        aria-hidden
        className="hibby-blink absolute inset-0 rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    </span>
  );
}
