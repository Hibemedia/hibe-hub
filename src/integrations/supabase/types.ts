export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      clients: {
        Row: {
          created_at: string
          id: string
          logo_url: string | null
          metricool_blog_id: string | null
          name: string
          tiktok_handle: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          logo_url?: string | null
          metricool_blog_id?: string | null
          name: string
          tiktok_handle?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          logo_url?: string | null
          metricool_blog_id?: string | null
          name?: string
          tiktok_handle?: string | null
        }
        Relationships: []
      }
      daily_stats: {
        Row: {
          client_id: string
          created_at: string
          date: string
          followers: number | null
          followers_gained: number | null
          followers_lost: number | null
          id: string
          interactions: number | null
          network: string
          posts: number | null
          reach: number | null
          views: number | null
        }
        Insert: {
          client_id: string
          created_at?: string
          date: string
          followers?: number | null
          followers_gained?: number | null
          followers_lost?: number | null
          id?: string
          interactions?: number | null
          network: string
          posts?: number | null
          reach?: number | null
          views?: number | null
        }
        Update: {
          client_id?: string
          created_at?: string
          date?: string
          followers?: number | null
          followers_gained?: number | null
          followers_lost?: number | null
          id?: string
          interactions?: number | null
          network?: string
          posts?: number | null
          reach?: number | null
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_stats_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles_settings: {
        Row: {
          full_name: string | null
          notify_new_video: boolean
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          full_name?: string | null
          notify_new_video?: boolean
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          full_name?: string | null
          notify_new_video?: boolean
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      review_events: {
        Row: {
          action: string
          created_at: string
          id: string
          note: string | null
          review_item_id: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          note?: string | null
          review_item_id: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          note?: string | null
          review_item_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "review_events_review_item_id_fkey"
            columns: ["review_item_id"]
            isOneToOne: false
            referencedRelation: "review_items"
            referencedColumns: ["id"]
          },
        ]
      }
      review_items: {
        Row: {
          caption: string | null
          client_id: string
          created_at: string
          created_by: string | null
          external_link: string | null
          id: string
          metricool_post_id: string | null
          metricool_post_uuid: string | null
          networks: string[]
          planned_date: string | null
          source: string
          status: string
          storage_path: string | null
          title: string
        }
        Insert: {
          caption?: string | null
          client_id: string
          created_at?: string
          created_by?: string | null
          external_link?: string | null
          id?: string
          metricool_post_id?: string | null
          metricool_post_uuid?: string | null
          networks?: string[]
          planned_date?: string | null
          source?: string
          status?: string
          storage_path?: string | null
          title: string
        }
        Update: {
          caption?: string | null
          client_id?: string
          created_at?: string
          created_by?: string | null
          external_link?: string | null
          id?: string
          metricool_post_id?: string | null
          metricool_post_uuid?: string | null
          networks?: string[]
          planned_date?: string | null
          source?: string
          status?: string
          storage_path?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_items_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      sync_runs: {
        Row: {
          client_id: string
          days_count: number | null
          error: string | null
          finished_at: string | null
          id: string
          mode: string | null
          started_at: string
          status: string
          videos_count: number | null
        }
        Insert: {
          client_id: string
          days_count?: number | null
          error?: string | null
          finished_at?: string | null
          id?: string
          mode?: string | null
          started_at?: string
          status?: string
          videos_count?: number | null
        }
        Update: {
          client_id?: string
          days_count?: number | null
          error?: string | null
          finished_at?: string | null
          id?: string
          mode?: string | null
          started_at?: string
          status?: string
          videos_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sync_runs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          avatar_url: string | null
          brandid: string | null
          client_id: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
        }
        Insert: {
          avatar_url?: string | null
          brandid?: string | null
          client_id?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
        }
        Update: {
          avatar_url?: string | null
          brandid?: string | null
          client_id?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      videos: {
        Row: {
          client_id: string
          comments: number | null
          created_at: string
          external_id: string
          id: string
          likes: number | null
          network: string
          published_at: string | null
          saves: number | null
          shares: number | null
          thumbnail_url: string | null
          title: string | null
          url: string | null
          views: number | null
        }
        Insert: {
          client_id: string
          comments?: number | null
          created_at?: string
          external_id: string
          id?: string
          likes?: number | null
          network: string
          published_at?: string | null
          saves?: number | null
          shares?: number | null
          thumbnail_url?: string | null
          title?: string | null
          url?: string | null
          views?: number | null
        }
        Update: {
          client_id?: string
          comments?: number | null
          created_at?: string
          external_id?: string
          id?: string
          likes?: number | null
          network?: string
          published_at?: string | null
          saves?: number | null
          shares?: number | null
          thumbnail_url?: string | null
          title?: string | null
          url?: string | null
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "videos_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_client_id: { Args: never; Returns: string }
      has_role: { Args: { _role: string; _user_id: string }; Returns: boolean }
      review_action: {
        Args: {
          _action: string
          _item_id: string
          _note?: string
          _storage_path?: string
        }
        Returns: {
          caption: string | null
          client_id: string
          created_at: string
          created_by: string | null
          external_link: string | null
          id: string
          metricool_post_id: string | null
          metricool_post_uuid: string | null
          networks: string[]
          planned_date: string | null
          source: string
          status: string
          storage_path: string | null
          title: string
        }
        SetofOptions: {
          from: "*"
          to: "review_items"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
