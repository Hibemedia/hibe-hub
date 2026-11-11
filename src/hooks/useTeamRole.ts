import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { UserAuth } from "@/context/AuthContext.jsx";
import type { TeamRole } from "@/lib/dashboard";

/** All HIBE team roles (Beheerder/Editor). A team member without a row counts as Editor. */
export function useTeamRoles() {
  return useQuery({
    queryKey: ["team-roles"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("team_roles").select("user_id,role");
      if (error) throw error;
      return Object.fromEntries(((data ?? []) as any[]).map((r) => [r.user_id, r.role])) as Record<string, TeamRole>;
    },
  });
}
export function useMyTeamRole() {
  const me = ((UserAuth() as any)?.user?.id as string) ?? "";
  const { data, isLoading } = useTeamRoles();
  return { role: (data?.[me] ?? (isLoading ? null : "editor")) as TeamRole | null, isLoading, me };
}
