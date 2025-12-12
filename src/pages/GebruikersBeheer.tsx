import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Users } from "lucide-react";
import { UserTable } from "@/components/UserTable"
import { supabase } from "@/integrations/supabase/client";
const { data: users, error: errors } = await supabase
            .from("users")
            .select("*");


const GebruikersBeheer = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
              <p className="text-sm text-muted-foreground">
                Gebruikers beheer
              </p>
            </div>
          </div>
          {/* <CreateUserDialog onCreateUser={handleCreateUser} /> */}
        </div>

        {/* Stats */}
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">Total Users</p>
            <p className="text-2xl font-semibold">{users.length}</p>
          </div>
        </div>

        {/* Table */}
        <UserTable users={users} />
      </div>
    </div>
  );
};

export default GebruikersBeheer;
