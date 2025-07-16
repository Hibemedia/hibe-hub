import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";

interface Client {
  id: string;
  brand_name: string;
  blog_id: number;
  is_active: boolean;
}

interface ClientSelectorProps {
  onClientSelect: (blogId: number, brandName: string) => void;
  selectedClient?: string;
}

export function ClientSelector({ onClientSelect, selectedClient }: ClientSelectorProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('metricool_config')
        .select('*')
        .eq('is_active', true)
        .order('brand_name');

      if (error) {
        console.error('Error loading clients:', error);
        return;
      }

      setClients(data || []);
    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClientChange = (value: string) => {
    const client = clients.find(c => c.id === value);
    if (client) {
      onClientSelect(client.blog_id, client.brand_name);
    }
  };

  if (loading) {
    return (
      <div className="space-y-2">
        <Label>Klant selecteren</Label>
        <Select disabled>
          <SelectTrigger>
            <SelectValue placeholder="Laden..." />
          </SelectTrigger>
        </Select>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label>Klant selecteren</Label>
      <Select value={selectedClient} onValueChange={handleClientChange}>
        <SelectTrigger>
          <SelectValue placeholder="Selecteer een klant" />
        </SelectTrigger>
        <SelectContent>
          {clients.map((client) => (
            <SelectItem key={client.id} value={client.id}>
              {client.brand_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}