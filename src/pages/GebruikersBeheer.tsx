  import { useEffect, useState } from "react";
  import { Users } from "lucide-react";
  import { UserTable } from "@/components/UserTable";
  import { supabase } from "@/integrations/supabase/client";
  import { MetricoolService } from "@/integrations/metricool.service";
  const mapBrandsById = (brandsArray) => {
    return brandsArray.reduce((acc, brand) => {
      acc[brand.id] = brand;
      return acc;
    }, {});
  };
  const GebruikersBeheer = () => {
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState([]);
    const [allBrandsInfo, setAllBrandsInfo] = useState(null);

    useEffect(() => {
      const loadData = async () => {
        try {
          // Users ophalen
          const { data, error } = await supabase
            .from("users")
            .select("*");

          if (error) throw error;
          setUsers(data);

          // Metricool brands ophalen
          const brands = await MetricoolService.getFromMetricool("getBrands");
          setAllBrandsInfo(mapBrandsById(brands));
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      };

      loadData();
    }, []); // 👈 slechts 1x bij mount

    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-6xl px-4 py-8">

          {/* Header */}
          <div className="mb-8 flex items-center gap-3">
            <Users />
            <h1 className="text-2xl font-semibold">Users</h1>
          </div>

          {/* Stats */}
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border p-4">
              <p>Total Users</p>
              <p className="text-2xl">{users.length}</p>
            </div>
          </div>


          {/* Users table */}
          <UserTable users={users} brands={allBrandsInfo} />
        </div>
      </div>
    );
  };

  export default GebruikersBeheer;
