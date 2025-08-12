export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      metricool_brands: {
        Row: {
          adwords: string | null
          adwordsaccountname: string | null
          adwordsuserid: string | null
          analyticmodewhitelabellink: string | null
          availableconnectors: string | null
          bluesky: string | null
          blueskyhandle: string | null
          blueskypicture: string | null
          brandrole: string | null
          created_at: string | null
          deleted: boolean | null
          deleted_at: string | null
          deletedate: string | null
          description: string | null
          engagementratio: number | null
          facebook: string | null
          facebookads: string | null
          facebookadsname: string | null
          facebookadspicture: string | null
          facebookgroup: string | null
          facebookgroupid: string | null
          facebookgrouppicture: string | null
          facebookpageid: string | null
          facebookpicture: string | null
          fbbusinessid: string | null
          fbuserid: string | null
          feedrss: string | null
          firstconnectiondate: string | null
          frontendversion: string | null
          gmb: string | null
          gmbaccountname: string | null
          gmbaddress: string | null
          gmburl: string | null
          gmbuserid: string | null
          googleplus: string | null
          hash: string | null
          id: number
          instagram: string | null
          instagramconnectiontype: string | null
          instagrampicture: string | null
          inuserid: string | null
          isshared: boolean | null
          iswhitelabel: boolean | null
          iswhitelabelonlyread: boolean | null
          joindate: string | null
          label: string | null
          last_synced_at: string | null
          lastreadinboxmessagetimestamp: string | null
          lastresolvedinboxmessagetimestamp: string | null
          linkedincompany: string | null
          linkedincompanyname: string | null
          linkedincompanypicture: string | null
          linkedinpicture: string | null
          linkedintokenexpiration: string | null
          linkedinuserprofileurl: string | null
          owneruserid: number | null
          ownerusername: string | null
          picture: string | null
          pinterest: string | null
          pinterestbusiness: string | null
          pinterestpicture: string | null
          raw_data: Json | null
          role: string | null
          threads: string | null
          threadsaccountname: string | null
          threadspicture: string | null
          tiktok: string | null
          tiktokaccounttype: string | null
          tiktokads: string | null
          tiktokadsdisplayname: string | null
          tiktokadspicture: string | null
          tiktokadsuserid: string | null
          tiktokbusinesstokenexpiration: string | null
          tiktokpicture: string | null
          tiktokuserprofileurl: string | null
          timezone: string | null
          title: string | null
          twitch: string | null
          twitchchannelid: string | null
          twitchname: string | null
          twitchpicture: string | null
          twitter: string | null
          twitterpicture: string | null
          twittersubscriptiontype: string | null
          updated_at: string | null
          url: string | null
          userid: number | null
          version: string | null
          whitelabelalias: string | null
          whitelabellink: string | null
          youtube: string | null
          youtubechannelname: string | null
          youtubechannelpicture: string | null
        }
        Insert: {
          adwords?: string | null
          adwordsaccountname?: string | null
          adwordsuserid?: string | null
          analyticmodewhitelabellink?: string | null
          availableconnectors?: string | null
          bluesky?: string | null
          blueskyhandle?: string | null
          blueskypicture?: string | null
          brandrole?: string | null
          created_at?: string | null
          deleted?: boolean | null
          deleted_at?: string | null
          deletedate?: string | null
          description?: string | null
          engagementratio?: number | null
          facebook?: string | null
          facebookads?: string | null
          facebookadsname?: string | null
          facebookadspicture?: string | null
          facebookgroup?: string | null
          facebookgroupid?: string | null
          facebookgrouppicture?: string | null
          facebookpageid?: string | null
          facebookpicture?: string | null
          fbbusinessid?: string | null
          fbuserid?: string | null
          feedrss?: string | null
          firstconnectiondate?: string | null
          frontendversion?: string | null
          gmb?: string | null
          gmbaccountname?: string | null
          gmbaddress?: string | null
          gmburl?: string | null
          gmbuserid?: string | null
          googleplus?: string | null
          hash?: string | null
          id: number
          instagram?: string | null
          instagramconnectiontype?: string | null
          instagrampicture?: string | null
          inuserid?: string | null
          isshared?: boolean | null
          iswhitelabel?: boolean | null
          iswhitelabelonlyread?: boolean | null
          joindate?: string | null
          label?: string | null
          last_synced_at?: string | null
          lastreadinboxmessagetimestamp?: string | null
          lastresolvedinboxmessagetimestamp?: string | null
          linkedincompany?: string | null
          linkedincompanyname?: string | null
          linkedincompanypicture?: string | null
          linkedinpicture?: string | null
          linkedintokenexpiration?: string | null
          linkedinuserprofileurl?: string | null
          owneruserid?: number | null
          ownerusername?: string | null
          picture?: string | null
          pinterest?: string | null
          pinterestbusiness?: string | null
          pinterestpicture?: string | null
          raw_data?: Json | null
          role?: string | null
          threads?: string | null
          threadsaccountname?: string | null
          threadspicture?: string | null
          tiktok?: string | null
          tiktokaccounttype?: string | null
          tiktokads?: string | null
          tiktokadsdisplayname?: string | null
          tiktokadspicture?: string | null
          tiktokadsuserid?: string | null
          tiktokbusinesstokenexpiration?: string | null
          tiktokpicture?: string | null
          tiktokuserprofileurl?: string | null
          timezone?: string | null
          title?: string | null
          twitch?: string | null
          twitchchannelid?: string | null
          twitchname?: string | null
          twitchpicture?: string | null
          twitter?: string | null
          twitterpicture?: string | null
          twittersubscriptiontype?: string | null
          updated_at?: string | null
          url?: string | null
          userid?: number | null
          version?: string | null
          whitelabelalias?: string | null
          whitelabellink?: string | null
          youtube?: string | null
          youtubechannelname?: string | null
          youtubechannelpicture?: string | null
        }
        Update: {
          adwords?: string | null
          adwordsaccountname?: string | null
          adwordsuserid?: string | null
          analyticmodewhitelabellink?: string | null
          availableconnectors?: string | null
          bluesky?: string | null
          blueskyhandle?: string | null
          blueskypicture?: string | null
          brandrole?: string | null
          created_at?: string | null
          deleted?: boolean | null
          deleted_at?: string | null
          deletedate?: string | null
          description?: string | null
          engagementratio?: number | null
          facebook?: string | null
          facebookads?: string | null
          facebookadsname?: string | null
          facebookadspicture?: string | null
          facebookgroup?: string | null
          facebookgroupid?: string | null
          facebookgrouppicture?: string | null
          facebookpageid?: string | null
          facebookpicture?: string | null
          fbbusinessid?: string | null
          fbuserid?: string | null
          feedrss?: string | null
          firstconnectiondate?: string | null
          frontendversion?: string | null
          gmb?: string | null
          gmbaccountname?: string | null
          gmbaddress?: string | null
          gmburl?: string | null
          gmbuserid?: string | null
          googleplus?: string | null
          hash?: string | null
          id?: number
          instagram?: string | null
          instagramconnectiontype?: string | null
          instagrampicture?: string | null
          inuserid?: string | null
          isshared?: boolean | null
          iswhitelabel?: boolean | null
          iswhitelabelonlyread?: boolean | null
          joindate?: string | null
          label?: string | null
          last_synced_at?: string | null
          lastreadinboxmessagetimestamp?: string | null
          lastresolvedinboxmessagetimestamp?: string | null
          linkedincompany?: string | null
          linkedincompanyname?: string | null
          linkedincompanypicture?: string | null
          linkedinpicture?: string | null
          linkedintokenexpiration?: string | null
          linkedinuserprofileurl?: string | null
          owneruserid?: number | null
          ownerusername?: string | null
          picture?: string | null
          pinterest?: string | null
          pinterestbusiness?: string | null
          pinterestpicture?: string | null
          raw_data?: Json | null
          role?: string | null
          threads?: string | null
          threadsaccountname?: string | null
          threadspicture?: string | null
          tiktok?: string | null
          tiktokaccounttype?: string | null
          tiktokads?: string | null
          tiktokadsdisplayname?: string | null
          tiktokadspicture?: string | null
          tiktokadsuserid?: string | null
          tiktokbusinesstokenexpiration?: string | null
          tiktokpicture?: string | null
          tiktokuserprofileurl?: string | null
          timezone?: string | null
          title?: string | null
          twitch?: string | null
          twitchchannelid?: string | null
          twitchname?: string | null
          twitchpicture?: string | null
          twitter?: string | null
          twitterpicture?: string | null
          twittersubscriptiontype?: string | null
          updated_at?: string | null
          url?: string | null
          userid?: number | null
          version?: string | null
          whitelabelalias?: string | null
          whitelabellink?: string | null
          youtube?: string | null
          youtubechannelname?: string | null
          youtubechannelpicture?: string | null
        }
        Relationships: []
      }
      metricool_content_sync_logs: {
        Row: {
          brand_id: number | null
          created_at: string
          errors: Json | null
          id: string
          platform: string | null
          posts_fetched: number | null
          raw_response: Json | null
          synced_at: string
        }
        Insert: {
          brand_id?: number | null
          created_at?: string
          errors?: Json | null
          id?: string
          platform?: string | null
          posts_fetched?: number | null
          raw_response?: Json | null
          synced_at?: string
        }
        Update: {
          brand_id?: number | null
          created_at?: string
          errors?: Json | null
          id?: string
          platform?: string | null
          posts_fetched?: number | null
          raw_response?: Json | null
          synced_at?: string
        }
        Relationships: []
      }
      metricool_credentials: {
        Row: {
          access_token: string
          created_at: string | null
          id: number
          singleton_check: boolean | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          access_token: string
          created_at?: string | null
          id?: number
          singleton_check?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          access_token?: string
          created_at?: string | null
          id?: number
          singleton_check?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      metricool_sync_logs: {
        Row: {
          created: number | null
          created_at: string | null
          error_message: string | null
          finished_at: string | null
          id: number
          marked_deleted: number | null
          source: string | null
          started_at: string | null
          status: string | null
          updated: number | null
        }
        Insert: {
          created?: number | null
          created_at?: string | null
          error_message?: string | null
          finished_at?: string | null
          id?: number
          marked_deleted?: number | null
          source?: string | null
          started_at?: string | null
          status?: string | null
          updated?: number | null
        }
        Update: {
          created?: number | null
          created_at?: string | null
          error_message?: string | null
          finished_at?: string | null
          id?: number
          marked_deleted?: number | null
          source?: string | null
          started_at?: string | null
          status?: string | null
          updated?: number | null
        }
        Relationships: []
      }
      metricool_sync_schedule: {
        Row: {
          created_at: string
          enabled: boolean
          id: number
          interval_hours: number
          last_run_at: string | null
          next_run_at: string | null
          singleton_check: boolean | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          id?: number
          interval_hours?: number
          last_run_at?: string | null
          next_run_at?: string | null
          singleton_check?: boolean | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          id?: number
          interval_hours?: number
          last_run_at?: string | null
          next_run_at?: string | null
          singleton_check?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      post_metrics_daily: {
        Row: {
          average_time_watched: number | null
          clicks: number | null
          comments: number | null
          created_at: string
          date: string
          duration: number | null
          engagement: number | null
          full_video_watched_rate: number | null
          id: string
          impression_sources: Json | null
          impressions: number | null
          likes: number | null
          post_id: string
          raw_data: Json | null
          reach: number | null
          saves: number | null
          shares: number | null
          total_time_watched: number | null
          updated_at: string
          views: number | null
        }
        Insert: {
          average_time_watched?: number | null
          clicks?: number | null
          comments?: number | null
          created_at?: string
          date: string
          duration?: number | null
          engagement?: number | null
          full_video_watched_rate?: number | null
          id?: string
          impression_sources?: Json | null
          impressions?: number | null
          likes?: number | null
          post_id: string
          raw_data?: Json | null
          reach?: number | null
          saves?: number | null
          shares?: number | null
          total_time_watched?: number | null
          updated_at?: string
          views?: number | null
        }
        Update: {
          average_time_watched?: number | null
          clicks?: number | null
          comments?: number | null
          created_at?: string
          date?: string
          duration?: number | null
          engagement?: number | null
          full_video_watched_rate?: number | null
          id?: string
          impression_sources?: Json | null
          impressions?: number | null
          likes?: number | null
          post_id?: string
          raw_data?: Json | null
          reach?: number | null
          saves?: number | null
          shares?: number | null
          total_time_watched?: number | null
          updated_at?: string
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "post_metrics_daily_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          brand_id: number | null
          content: string | null
          created_at: string
          id: string
          media_url: string | null
          platform: string
          post_id: string
          posted_at: string | null
          updated_at: string
          url: string | null
        }
        Insert: {
          brand_id?: number | null
          content?: string | null
          created_at?: string
          id?: string
          media_url?: string | null
          platform: string
          post_id: string
          posted_at?: string | null
          updated_at?: string
          url?: string | null
        }
        Update: {
          brand_id?: number | null
          content?: string | null
          created_at?: string
          id?: string
          media_url?: string | null
          platform?: string
          post_id?: string
          posted_at?: string | null
          updated_at?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "metricool_brands"
            referencedColumns: ["id"]
          },
        ]
      }
      social_accounts: {
        Row: {
          account_id: string | null
          account_name: string | null
          brand_id: number | null
          created_at: string
          id: string
          platform: string
          updated_at: string
        }
        Insert: {
          account_id?: string | null
          account_name?: string | null
          brand_id?: number | null
          created_at?: string
          id?: string
          platform: string
          updated_at?: string
        }
        Update: {
          account_id?: string | null
          account_name?: string | null
          brand_id?: number | null
          created_at?: string
          id?: string
          platform?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_accounts_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "metricool_brands"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          id: string
          metricool_brand_id: number | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id: string
          metricool_brand_id?: number | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          metricool_brand_id?: number | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_metricool_brand_id_fkey"
            columns: ["metricool_brand_id"]
            isOneToOne: false
            referencedRelation: "metricool_brands"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_deleted_metricool_brands: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["user_role"]
      }
      is_admin_user: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      user_role: "admin" | "manager" | "klant"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      user_role: ["admin", "manager", "klant"],
    },
  },
} as const
