export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      people: {
        Row: {
          id: string;
          name: string;
          email: string | null;
          phone: string | null;
          birth_date: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          email?: string | null;
          phone?: string | null;
          birth_date?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string | null;
          phone?: string | null;
          birth_date?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
      };
      users: {
        Row: {
          id: string;
          person_id: string;
          hierarchy_parent_id: string | null;
          hierarchy_path: string;
          hierarchy_depth: number;
          is_admin: boolean;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id: string;
          person_id: string;
          hierarchy_parent_id?: string | null;
          hierarchy_path?: string;
          hierarchy_depth?: number;
          is_admin?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          person_id?: string;
          hierarchy_parent_id?: string | null;
          hierarchy_path?: string;
          hierarchy_depth?: number;
          is_admin?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
      };
      growth_groups: {
        Row: {
          id: string;
          name: string;
          mode: 'in_person' | 'online' | 'hybrid';
          address: string | null;
          weekday: number | null;
          time: string | null;
          status: 'active' | 'inactive' | 'multiplying';
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          mode: 'in_person' | 'online' | 'hybrid';
          address?: string | null;
          weekday?: number | null;
          time?: string | null;
          status?: 'active' | 'inactive' | 'multiplying';
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          mode?: 'in_person' | 'online' | 'hybrid';
          address?: string | null;
          weekday?: number | null;
          time?: string | null;
          status?: 'active' | 'inactive' | 'multiplying';
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
      };
      growth_group_participants: {
        Row: {
          id: string;
          gc_id: string;
          person_id: string;
          role: 'member' | 'leader' | 'co_leader' | 'supervisor';
          status: 'active' | 'inactive' | 'transferred';
          joined_at: string;
          left_at: string | null;
          added_by_user_id: string | null;
          converted_from_visitor_id: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          gc_id: string;
          person_id: string;
          role: 'member' | 'leader' | 'co_leader' | 'supervisor';
          status?: 'active' | 'inactive' | 'transferred';
          joined_at?: string;
          left_at?: string | null;
          added_by_user_id?: string | null;
          converted_from_visitor_id?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          gc_id?: string;
          person_id?: string;
          role?: 'member' | 'leader' | 'co_leader' | 'supervisor';
          status?: 'active' | 'inactive' | 'transferred';
          joined_at?: string;
          left_at?: string | null;
          added_by_user_id?: string | null;
          converted_from_visitor_id?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
      };
      visitors: {
        Row: {
          id: string;
          person_id: string;
          gc_id: string;
          status: 'active' | 'converted' | 'inactive';
          visit_count: number;
          first_visit_date: string;
          last_visit_date: string | null;
          converted_at: string | null;
          converted_by_user_id: string | null;
          converted_to_participant_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          person_id: string;
          gc_id: string;
          status?: 'active' | 'converted' | 'inactive';
          visit_count?: number;
          first_visit_date?: string;
          last_visit_date?: string | null;
          converted_at?: string | null;
          converted_by_user_id?: string | null;
          converted_to_participant_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          person_id?: string;
          gc_id?: string;
          status?: 'active' | 'converted' | 'inactive';
          visit_count?: number;
          first_visit_date?: string;
          last_visit_date?: string | null;
          converted_at?: string | null;
          converted_by_user_id?: string | null;
          converted_to_participant_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      lesson_series: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          created_by_user_id: string;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          created_by_user_id: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          created_by_user_id?: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
      };
      lessons: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          series_id: string | null;
          order_in_series: number | null;
          created_by_user_id: string;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
          link: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          series_id?: string | null;
          order_in_series?: number | null;
          created_by_user_id: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
          link?: string | null;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          series_id?: string | null;
          order_in_series?: number | null;
          created_by_user_id?: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
          link?: string | null;
        };
      };
      meetings: {
        Row: {
          id: string;
          gc_id: string;
          lesson_template_id: string | null;
          lesson_title: string;
          datetime: string;
          comments: string | null;
          registered_by_user_id: string;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          gc_id: string;
          lesson_template_id?: string | null;
          lesson_title: string;
          datetime: string;
          comments?: string | null;
          registered_by_user_id: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          gc_id?: string;
          lesson_template_id?: string | null;
          lesson_title?: string;
          datetime?: string;
          comments?: string | null;
          registered_by_user_id?: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
      };
      meeting_member_attendance: {
        Row: {
          id: string;
          meeting_id: string;
          participant_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          meeting_id: string;
          participant_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          meeting_id?: string;
          participant_id?: string;
          created_at?: string;
        };
      };
      meeting_visitor_attendance: {
        Row: {
          id: string;
          meeting_id: string;
          visitor_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          meeting_id: string;
          visitor_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          meeting_id?: string;
          visitor_id?: string;
          created_at?: string;
        };
      };
      visitor_conversion_events: {
        Row: {
          id: string;
          visitor_id: string;
          participant_id: string;
          person_id: string;
          gc_id: string;
          converted_at: string;
          converted_by_user_id: string | null;
          conversion_source: 'auto' | 'manual';
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          visitor_id: string;
          participant_id: string;
          person_id: string;
          gc_id: string;
          converted_at?: string;
          converted_by_user_id?: string | null;
          conversion_source: 'auto' | 'manual';
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          visitor_id?: string;
          participant_id?: string;
          person_id?: string;
          gc_id?: string;
          converted_at?: string;
          converted_by_user_id?: string | null;
          conversion_source?: 'auto' | 'manual';
          notes?: string | null;
          created_at?: string;
        };
      };
      config: {
        Row: {
          key: string;
          value: Json;
          description: string | null;
          updated_at: string;
        };
        Insert: {
          key: string;
          value: Json;
          description?: string | null;
          updated_at?: string;
        };
        Update: {
          key?: string;
          value?: Json;
          description?: string | null;
          updated_at?: string;
        };
      };
    };
    Views: {
      dashboard_metrics: {
        Row: {
          gc_id: string;
          gc_name: string;
          meetings_current_month: number | null;
          average_attendance: number | null;
          total_active_members: number | null;
          growth_30d: number | null;
          conversions_30d: number | null;
          unique_visitors_30d: number | null;
          conversion_rate_pct: number | null;
        };
      };
      user_gc_roles: {
        Row: {
          user_id: string;
          name: string;
          email: string | null;
          is_admin: boolean;
          is_leader: boolean;
          is_supervisor: boolean;
          is_coordinator: boolean;
          gcs_led: number;
          gcs_supervised: number;
          direct_subordinates: number;
        };
      };
    };
    Functions: Record<string, never>;
    Enums: never;
  };
}
