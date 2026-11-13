import { useState } from "react";
import { Portal } from "@radix-ui/react-tooltip";
import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "./button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";
import { cn } from "@/lib/utils";

export type StackUser = { id?: string; name: string; avatar_url?: string | null };
function StackAvatar({ user }: { user: StackUser }) {
  const [open, setOpen] = useState(false);
  return <Tooltip open={open} onOpenChange={setOpen} delayDuration={150}><TooltipTrigger asChild>
    <Button variant="ghost" size="icon" aria-label={user.name} onClick={(e) => { e.stopPropagation(); setOpen(!open); }} className="relative h-8 w-8 shrink-0 rounded-avatar p-0 hover:z-10 focus-visible:z-10">
      <UserAvatar userId={user.id} name={user.name} url={user.avatar_url} size={32} className="ring-2 ring-card" />
    </Button>
  </TooltipTrigger><Portal><TooltipContent className="max-w-64 whitespace-normal rounded-tag text-center">{user.name}</TooltipContent></Portal></Tooltip>;
}
export function AvatarStack({ users, max = 3, className, label = "Teamleden" }: { users: StackUser[]; max?: number; className?: string; label?: string }) {
  return <span role="group" aria-label={label} className={cn("flex max-w-full items-center -space-x-2", className)}>
    {users.slice(0, max).map((user, i) => <StackAvatar key={user.id ?? `${user.name}-${i}`} user={user} />)}
    {users.length > max && <span title={users.slice(max).map((u) => u.name).join(", ")} className="relative flex h-8 min-w-8 items-center justify-center rounded-avatar bg-muted px-1 text-xs font-medium ring-2 ring-card">+{users.length - max}</span>}
  </span>;
}