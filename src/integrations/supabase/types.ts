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
      calendar_attendees: {
        Row: {
          created_at: string
          event_id: string
          invited_by: string | null
          seen_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          invited_by?: string | null
          seen_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          invited_by?: string | null
          seen_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_attendees_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "calendar_events"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_events: {
        Row: {
          created_at: string
          created_by: string | null
          end_date: string
          end_time: string | null
          id: string
          kind: string
          location: string | null
          notes: string | null
          person_id: string | null
          start_date: string
          start_time: string | null
          title: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          end_date: string
          end_time?: string | null
          id?: string
          kind?: string
          location?: string | null
          notes?: string | null
          person_id?: string | null
          start_date: string
          start_time?: string | null
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          end_date?: string
          end_time?: string | null
          id?: string
          kind?: string
          location?: string | null
          notes?: string | null
          person_id?: string | null
          start_date?: string
          start_time?: string | null
          title?: string
        }
        Relationships: []
      }
      chat_members: {
        Row: {
          joined_at: string
          last_read_at: string
          room_id: string
          user_id: string
        }
        Insert: {
          joined_at?: string
          last_read_at?: string
          room_id: string
          user_id: string
        }
        Update: {
          joined_at?: string
          last_read_at?: string
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_members_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          body: string
          created_at: string
          edited_at: string | null
          id: string
          image_path: string | null
          mentions: string[]
          room_id: string
          user_id: string
        }
        Insert: {
          body?: string
          created_at?: string
          edited_at?: string | null
          id?: string
          image_path?: string | null
          mentions?: string[]
          room_id: string
          user_id?: string
        }
        Update: {
          body?: string
          created_at?: string
          edited_at?: string | null
          id?: string
          image_path?: string | null
          mentions?: string[]
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_notifications: {
        Row: {
          actor_id: string | null
          created_at: string
          id: string
          kind: string
          message_id: string | null
          preview: string
          read_at: string | null
          recipient_id: string
          room_id: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          id?: string
          kind: string
          message_id?: string | null
          preview?: string
          read_at?: string | null
          recipient_id: string
          room_id: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          id?: string
          kind?: string
          message_id?: string | null
          preview?: string
          read_at?: string | null
          recipient_id?: string
          room_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_notifications_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_notifications_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_rooms: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          kind: string
          name: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          kind: string
          name?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          kind?: string
          name?: string | null
        }
        Relationships: []
      }
      clients: {
        Row: {
          archived_at: string | null
          created_at: string
          id: string
          logo_url: string | null
          metricool_blog_id: string | null
          metricool_brand_label: string | null
          monthly_video_target: number | null
          name: string
          tiktok_handle: string | null
          video_only: boolean
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          metricool_blog_id?: string | null
          metricool_brand_label?: string | null
          monthly_video_target?: number | null
          name: string
          tiktok_handle?: string | null
          video_only?: boolean
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          metricool_blog_id?: string | null
          metricool_brand_label?: string | null
          monthly_video_target?: number | null
          name?: string
          tiktok_handle?: string | null
          video_only?: boolean
        }
        Relationships: []
      }
      content_moment_comments: {
        Row: {
          created_at: string
          id: string
          moment_id: string
          text: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          moment_id: string
          text: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          moment_id?: string
          text?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_moment_comments_moment_id_fkey"
            columns: ["moment_id"]
            isOneToOne: false
            referencedRelation: "content_moments"
            referencedColumns: ["id"]
          },
        ]
      }
      content_moments: {
        Row: {
          attendees: string[]
          client_id: string
          created_at: string
          date: string | null
          id: string
          location: string | null
          notes: string | null
          requested_by: string | null
          script: string | null
          show_crew_to_client: boolean
          start_time: string | null
          status: string
          title: string
          type: string
        }
        Insert: {
          attendees?: string[]
          client_id: string
          created_at?: string
          date?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          requested_by?: string | null
          script?: string | null
          show_crew_to_client?: boolean
          start_time?: string | null
          status?: string
          title: string
          type?: string
        }
        Update: {
          attendees?: string[]
          client_id?: string
          created_at?: string
          date?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          requested_by?: string | null
          script?: string | null
          show_crew_to_client?: boolean
          start_time?: string | null
          status?: string
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_moments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
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
      edits: {
        Row: {
          client_id: string
          created_at: string
          created_by: string | null
          deadline: string | null
          drive_link: string | null
          editor_id: string | null
          id: string
          notes: string | null
          planned_date: string | null
          shoot_date: string | null
          status: string
          title: string
          updated_at: string
          video_item_id: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          created_by?: string | null
          deadline?: string | null
          drive_link?: string | null
          editor_id?: string | null
          id?: string
          notes?: string | null
          planned_date?: string | null
          shoot_date?: string | null
          status?: string
          title: string
          updated_at?: string
          video_item_id?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          created_by?: string | null
          deadline?: string | null
          drive_link?: string | null
          editor_id?: string | null
          id?: string
          notes?: string | null
          planned_date?: string | null
          shoot_date?: string | null
          status?: string
          title?: string
          updated_at?: string
          video_item_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "edits_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "edits_video_item_id_fkey"
            columns: ["video_item_id"]
            isOneToOne: false
            referencedRelation: "video_items"
            referencedColumns: ["id"]
          },
        ]
      }
      hibe_notifications: {
        Row: {
          actor_id: string | null
          client_id: string
          created_at: string
          edit_id: string | null
          id: string
          item_id: string | null
          kind: string
          moment_id: string | null
          read_at: string | null
          recipient_id: string | null
          video_title: string
        }
        Insert: {
          actor_id?: string | null
          client_id: string
          created_at?: string
          edit_id?: string | null
          id?: string
          item_id?: string | null
          kind: string
          moment_id?: string | null
          read_at?: string | null
          recipient_id?: string | null
          video_title: string
        }
        Update: {
          actor_id?: string | null
          client_id?: string
          created_at?: string
          edit_id?: string | null
          id?: string
          item_id?: string | null
          kind?: string
          moment_id?: string | null
          read_at?: string | null
          recipient_id?: string | null
          video_title?: string
        }
        Relationships: [
          {
            foreignKeyName: "hibe_notifications_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hibe_notifications_edit_id_fkey"
            columns: ["edit_id"]
            isOneToOne: false
            referencedRelation: "edits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hibe_notifications_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "video_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hibe_notifications_moment_id_fkey"
            columns: ["moment_id"]
            isOneToOne: false
            referencedRelation: "content_moments"
            referencedColumns: ["id"]
          },
        ]
      }
      library_files: {
        Row: {
          category: string
          client_id: string
          created_at: string
          description: string | null
          file_name: string
          id: string
          mime_type: string | null
          size_bytes: number | null
          storage_path: string
          uploaded_by: string | null
        }
        Insert: {
          category: string
          client_id: string
          created_at?: string
          description?: string | null
          file_name: string
          id?: string
          mime_type?: string | null
          size_bytes?: number | null
          storage_path: string
          uploaded_by?: string | null
        }
        Update: {
          category?: string
          client_id?: string
          created_at?: string
          description?: string | null
          file_name?: string
          id?: string
          mime_type?: string | null
          size_bytes?: number | null
          storage_path?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "library_files_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      moment_crew: {
        Row: {
          created_at: string
          created_by: string | null
          moment_id: string
          role: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          moment_id: string
          role?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          moment_id?: string
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "moment_crew_moment_id_fkey"
            columns: ["moment_id"]
            isOneToOne: false
            referencedRelation: "content_moments"
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
          weather_lat: number
          weather_location: string
          weather_lon: number
        }
        Insert: {
          full_name?: string | null
          notify_new_video?: boolean
          phone?: string | null
          updated_at?: string
          user_id: string
          weather_lat?: number
          weather_location?: string
          weather_lon?: number
        }
        Update: {
          full_name?: string | null
          notify_new_video?: boolean
          phone?: string | null
          updated_at?: string
          user_id?: string
          weather_lat?: number
          weather_location?: string
          weather_lon?: number
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
      social_post_video_links: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          post_date: string
          social_client_id: string
          video_item_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          post_date: string
          social_client_id: string
          video_item_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          post_date?: string
          social_client_id?: string
          video_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_post_video_links_video_item_id_fkey"
            columns: ["video_item_id"]
            isOneToOne: false
            referencedRelation: "video_items"
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
      tasks: {
        Row: {
          assignee_id: string
          client_id: string | null
          created_at: string
          created_by: string | null
          done_at: string | null
          due_date: string | null
          due_time: string | null
          id: string
          notes: string | null
          title: string
        }
        Insert: {
          assignee_id: string
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          done_at?: string | null
          due_date?: string | null
          due_time?: string | null
          id?: string
          notes?: string | null
          title: string
        }
        Update: {
          assignee_id?: string
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          done_at?: string | null
          due_date?: string | null
          due_time?: string | null
          id?: string
          notes?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      team_roles: {
        Row: {
          role: string
          updated_at: string
          updated_by: string | null
          user_id: string
        }
        Insert: {
          role?: string
          updated_at?: string
          updated_by?: string | null
          user_id: string
        }
        Update: {
          role?: string
          updated_at?: string
          updated_by?: string | null
          user_id?: string
        }
        Relationships: []
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
          first_name: string | null
          full_name: string | null
          id: string
          job_title: string | null
          last_name: string | null
        }
        Insert: {
          avatar_url?: string | null
          brandid?: string | null
          client_id?: string | null
          created_at?: string
          email: string
          first_name?: string | null
          full_name?: string | null
          id: string
          job_title?: string | null
          last_name?: string | null
        }
        Update: {
          avatar_url?: string | null
          brandid?: string | null
          client_id?: string | null
          created_at?: string
          email?: string
          first_name?: string | null
          full_name?: string | null
          id?: string
          job_title?: string | null
          last_name?: string | null
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
      video_comments: {
        Row: {
          created_at: string
          id: string
          internal: boolean
          item_id: string
          number: number
          resolved: boolean
          text: string
          time_seconds: number
          user_id: string
          version_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          internal?: boolean
          item_id: string
          number?: number
          resolved?: boolean
          text: string
          time_seconds?: number
          user_id?: string
          version_id: string
        }
        Update: {
          created_at?: string
          id?: string
          internal?: boolean
          item_id?: string
          number?: number
          resolved?: boolean
          text?: string
          time_seconds?: number
          user_id?: string
          version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_comments_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "video_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_comments_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "video_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      video_items: {
        Row: {
          archived_at: string | null
          client_id: string
          created_at: string
          created_by: string | null
          current_version: number
          drive_link: string | null
          id: string
          status: string
          status_changed_at: string
          title: string
        }
        Insert: {
          archived_at?: string | null
          client_id: string
          created_at?: string
          created_by?: string | null
          current_version?: number
          drive_link?: string | null
          id?: string
          status?: string
          status_changed_at?: string
          title: string
        }
        Update: {
          archived_at?: string | null
          client_id?: string
          created_at?: string
          created_by?: string | null
          current_version?: number
          drive_link?: string | null
          id?: string
          status?: string
          status_changed_at?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_items_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      video_versions: {
        Row: {
          created_at: string
          file_name: string
          id: string
          item_id: string
          mime_type: string | null
          r2_key: string
          size_bytes: number | null
          upload_id: string | null
          upload_status: string
          uploaded_by: string | null
          version: number
        }
        Insert: {
          created_at?: string
          file_name: string
          id?: string
          item_id: string
          mime_type?: string | null
          r2_key: string
          size_bytes?: number | null
          upload_id?: string | null
          upload_status?: string
          uploaded_by?: string | null
          version: number
        }
        Update: {
          created_at?: string
          file_name?: string
          id?: string
          item_id?: string
          mime_type?: string | null
          r2_key?: string
          size_bytes?: number | null
          upload_id?: string | null
          upload_status?: string
          uploaded_by?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "video_versions_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "video_items"
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
      view_as_log: {
        Row: {
          admin_id: string
          client_id: string
          id: string
          started_at: string
        }
        Insert: {
          admin_id: string
          client_id: string
          id?: string
          started_at?: string
        }
        Update: {
          admin_id?: string
          client_id?: string
          id?: string
          started_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "view_as_log_client_id_fkey"
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
      chat_open_dm: { Args: { _other: string }; Returns: string }
      chat_unread: {
        Args: never
        Returns: {
          room_id: string
          unread: number
        }[]
      }
      client_moment_crew: {
        Args: never
        Returns: {
          avatar_url: string
          first_name: string
          moment_id: string
        }[]
      }
      client_ranking: {
        Args: {
          _from: string
          _prev_from: string
          _prev_to: string
          _to: string
        }
        Returns: {
          client_id: string
          followers: number
          posts: number
          prev_views: number
          views: number
        }[]
      }
      current_client_id: { Args: never; Returns: string }
      has_role: { Args: { _role: string; _user_id: string }; Returns: boolean }
      is_beheerder: { Args: { _user_id: string }; Returns: boolean }
      is_chat_member: {
        Args: { _room: string; _user: string }
        Returns: boolean
      }
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
      start_view_as: { Args: { _client: string }; Returns: string }
      video_client_action: {
        Args: { _action: string; _item_id: string }
        Returns: {
          archived_at: string | null
          client_id: string
          created_at: string
          created_by: string | null
          current_version: number
          drive_link: string | null
          id: string
          status: string
          status_changed_at: string
          title: string
        }
        SetofOptions: {
          from: "*"
          to: "video_items"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      video_client_visible: { Args: { _item_id: string }; Returns: boolean }
      visible_profiles: {
        Args: never
        Returns: {
          avatar_url: string
          id: string
          name: string
        }[]
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
