export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      config: {
        Row: {
          description: string | null
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      growth_group_participants: {
        Row: {
          added_by_user_id: string | null
          converted_from_visitor_id: string | null
          created_at: string
          deleted_at: string | null
          gc_id: string
          id: string
          joined_at: string
          left_at: string | null
          notes: string | null
          person_id: string
          role: string
          status: string
          updated_at: string
        }
        Insert: {
          added_by_user_id?: string | null
          converted_from_visitor_id?: string | null
          created_at?: string
          deleted_at?: string | null
          gc_id: string
          id?: string
          joined_at?: string
          left_at?: string | null
          notes?: string | null
          person_id: string
          role: string
          status?: string
          updated_at?: string
        }
        Update: {
          added_by_user_id?: string | null
          converted_from_visitor_id?: string | null
          created_at?: string
          deleted_at?: string | null
          gc_id?: string
          id?: string
          joined_at?: string
          left_at?: string | null
          notes?: string | null
          person_id?: string
          role?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_growth_group_participants_converted_from_visitor"
            columns: ["converted_from_visitor_id"]
            isOneToOne: false
            referencedRelation: "visitors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "growth_group_participants_added_by_user_id_fkey"
            columns: ["added_by_user_id"]
            isOneToOne: false
            referencedRelation: "user_gc_roles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "growth_group_participants_added_by_user_id_fkey"
            columns: ["added_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "growth_group_participants_gc_id_fkey"
            columns: ["gc_id"]
            isOneToOne: false
            referencedRelation: "dashboard_metrics"
            referencedColumns: ["gc_id"]
          },
          {
            foreignKeyName: "growth_group_participants_gc_id_fkey"
            columns: ["gc_id"]
            isOneToOne: false
            referencedRelation: "growth_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "growth_group_participants_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      growth_groups: {
        Row: {
          address: string | null
          created_at: string
          deleted_at: string | null
          id: string
          mode: string
          name: string
          status: string
          time: string | null
          updated_at: string
          weekday: number | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          mode: string
          name: string
          status?: string
          time?: string | null
          updated_at?: string
          weekday?: number | null
        }
        Update: {
          address?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          mode?: string
          name?: string
          status?: string
          time?: string | null
          updated_at?: string
          weekday?: number | null
        }
        Relationships: []
      }
      lesson_series: {
        Row: {
          created_at: string
          created_by_user_id: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by_user_id: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by_user_id?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_series_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "user_gc_roles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "lesson_series_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          created_at: string
          created_by_user_id: string
          description: string | null
          id: string
          link: string | null
          order_in_series: number | null
          series_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by_user_id: string
          description?: string | null
          id?: string
          link?: string | null
          order_in_series?: number | null
          series_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by_user_id?: string
          description?: string | null
          id?: string
          link?: string | null
          order_in_series?: number | null
          series_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lessons_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "user_gc_roles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "lessons_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "lesson_series"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_member_attendance: {
        Row: {
          created_at: string
          id: string
          meeting_id: string
          participant_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          meeting_id: string
          participant_id: string
        }
        Update: {
          created_at?: string
          id?: string
          meeting_id?: string
          participant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_member_attendance_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_member_attendance_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "growth_group_participants"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_visitor_attendance: {
        Row: {
          created_at: string
          id: string
          meeting_id: string
          visitor_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          meeting_id: string
          visitor_id: string
        }
        Update: {
          created_at?: string
          id?: string
          meeting_id?: string
          visitor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_visitor_attendance_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_visitor_attendance_visitor_id_fkey"
            columns: ["visitor_id"]
            isOneToOne: false
            referencedRelation: "visitors"
            referencedColumns: ["id"]
          },
        ]
      }
      meetings: {
        Row: {
          comments: string | null
          created_at: string
          datetime: string
          deleted_at: string | null
          gc_id: string
          id: string
          lesson_template_id: string | null
          lesson_title: string
          registered_by_user_id: string
          updated_at: string
        }
        Insert: {
          comments?: string | null
          created_at?: string
          datetime: string
          deleted_at?: string | null
          gc_id: string
          id?: string
          lesson_template_id?: string | null
          lesson_title: string
          registered_by_user_id: string
          updated_at?: string
        }
        Update: {
          comments?: string | null
          created_at?: string
          datetime?: string
          deleted_at?: string | null
          gc_id?: string
          id?: string
          lesson_template_id?: string | null
          lesson_title?: string
          registered_by_user_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meetings_gc_id_fkey"
            columns: ["gc_id"]
            isOneToOne: false
            referencedRelation: "dashboard_metrics"
            referencedColumns: ["gc_id"]
          },
          {
            foreignKeyName: "meetings_gc_id_fkey"
            columns: ["gc_id"]
            isOneToOne: false
            referencedRelation: "growth_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_lesson_template_id_fkey"
            columns: ["lesson_template_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_registered_by_user_id_fkey"
            columns: ["registered_by_user_id"]
            isOneToOne: false
            referencedRelation: "user_gc_roles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "meetings_registered_by_user_id_fkey"
            columns: ["registered_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      people: {
        Row: {
          birth_date: string | null
          created_at: string
          deleted_at: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          birth_date?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          birth_date?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          is_admin: boolean
          person_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id: string
          is_admin?: boolean
          person_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_admin?: boolean
          person_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: true
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_auth_user_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      visitor_conversion_events: {
        Row: {
          conversion_source: string
          converted_at: string
          converted_by_user_id: string | null
          created_at: string
          gc_id: string
          id: string
          notes: string | null
          participant_id: string
          person_id: string
          visitor_id: string
        }
        Insert: {
          conversion_source: string
          converted_at?: string
          converted_by_user_id?: string | null
          created_at?: string
          gc_id: string
          id?: string
          notes?: string | null
          participant_id: string
          person_id: string
          visitor_id: string
        }
        Update: {
          conversion_source?: string
          converted_at?: string
          converted_by_user_id?: string | null
          created_at?: string
          gc_id?: string
          id?: string
          notes?: string | null
          participant_id?: string
          person_id?: string
          visitor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visitor_conversion_events_converted_by_user_id_fkey"
            columns: ["converted_by_user_id"]
            isOneToOne: false
            referencedRelation: "user_gc_roles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "visitor_conversion_events_converted_by_user_id_fkey"
            columns: ["converted_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visitor_conversion_events_gc_id_fkey"
            columns: ["gc_id"]
            isOneToOne: false
            referencedRelation: "dashboard_metrics"
            referencedColumns: ["gc_id"]
          },
          {
            foreignKeyName: "visitor_conversion_events_gc_id_fkey"
            columns: ["gc_id"]
            isOneToOne: false
            referencedRelation: "growth_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visitor_conversion_events_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "growth_group_participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visitor_conversion_events_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visitor_conversion_events_visitor_id_fkey"
            columns: ["visitor_id"]
            isOneToOne: false
            referencedRelation: "visitors"
            referencedColumns: ["id"]
          },
        ]
      }
      visitors: {
        Row: {
          converted_at: string | null
          converted_by_user_id: string | null
          converted_to_participant_id: string | null
          created_at: string
          first_visit_date: string
          gc_id: string
          id: string
          last_visit_date: string | null
          person_id: string
          status: string
          updated_at: string
          visit_count: number
        }
        Insert: {
          converted_at?: string | null
          converted_by_user_id?: string | null
          converted_to_participant_id?: string | null
          created_at?: string
          first_visit_date?: string
          gc_id: string
          id?: string
          last_visit_date?: string | null
          person_id: string
          status?: string
          updated_at?: string
          visit_count?: number
        }
        Update: {
          converted_at?: string | null
          converted_by_user_id?: string | null
          converted_to_participant_id?: string | null
          created_at?: string
          first_visit_date?: string
          gc_id?: string
          id?: string
          last_visit_date?: string | null
          person_id?: string
          status?: string
          updated_at?: string
          visit_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "visitors_converted_by_user_id_fkey"
            columns: ["converted_by_user_id"]
            isOneToOne: false
            referencedRelation: "user_gc_roles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "visitors_converted_by_user_id_fkey"
            columns: ["converted_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visitors_converted_to_participant_id_fkey"
            columns: ["converted_to_participant_id"]
            isOneToOne: false
            referencedRelation: "growth_group_participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visitors_gc_id_fkey"
            columns: ["gc_id"]
            isOneToOne: false
            referencedRelation: "dashboard_metrics"
            referencedColumns: ["gc_id"]
          },
          {
            foreignKeyName: "visitors_gc_id_fkey"
            columns: ["gc_id"]
            isOneToOne: false
            referencedRelation: "growth_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visitors_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      dashboard_metrics: {
        Row: {
          average_attendance: number | null
          conversion_rate_pct: number | null
          conversions_30d: number | null
          gc_id: string | null
          gc_name: string | null
          growth_30d: number | null
          meetings_current_month: number | null
          total_active_members: number | null
          unique_visitors_30d: number | null
        }
        Relationships: []
      }
      user_gc_roles: {
        Row: {
          direct_subordinates: number
          email: string | null
          gcs_led: number
          gcs_supervised: number
          is_admin: boolean
          is_coordinator: boolean
          is_leader: boolean
          is_supervisor: boolean
          name: string | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      gtrgm_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_options: {
        Args: { "": unknown }
        Returns: undefined
      }
      gtrgm_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      set_limit: {
        Args: { "": number }
        Returns: number
      }
      show_limit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      show_trgm: {
        Args: { "": string }
        Returns: string[]
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
