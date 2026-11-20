import hibbyAvatar from "@/assets/hibby_avatar.png.asset.json";
import { cn } from "@/lib/utils";

/** Hibby's profile photo: the mascot head on a light disc, used everywhere Hibby appears. */
export function HibbyAvatar({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <img
      src={hibbyAvatar.url}
      alt="Hibby"
      width={size}
      height={size}
      draggable={false}
      className={cn("shrink-0 select-none rounded-full object-cover", className)}
      style={{ width: size, height: size }}
    />
  );
}
