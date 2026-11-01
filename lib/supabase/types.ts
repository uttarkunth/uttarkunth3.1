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
      admin_audit_log: {
        Row: {
          action: string
          actor_user_id: string | null
          created_at: string
          details: Json
          id: string
          target_id: string
          target_type: string
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          created_at?: string
          details?: Json
          id?: string
          target_id: string
          target_type: string
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          created_at?: string
          details?: Json
          id?: string
          target_id?: string
          target_type?: string
        }
        Relationships: []
      }
      booking_rate_limits: {
        Row: {
          created_at: string
          id: number
          ip_hash: string
        }
        Insert: {
          created_at?: string
          id?: never
          ip_hash: string
        }
        Update: {
          created_at?: string
          id?: never
          ip_hash?: string
        }
        Relationships: []
      }
      booking_requests: {
        Row: {
          adults: number
          booking_reference: string
          cancellation_reason: string | null
          check_in: string
          check_out: string
          children: number
          created_at: string
          estimated_total: number | null
          guest_access_token_hash: string | null
          guest_email: string
          guest_name: string
          guest_phone: string
          guest_user_id: string | null
          host_notes: string | null
          id: string
          property_id: string
          room_unit_id: string
          special_requests: string | null
          status: string
          updated_at: string
        }
        Insert: {
          adults?: number
          booking_reference: string
          cancellation_reason?: string | null
          check_in: string
          check_out: string
          children?: number
          created_at?: string
          estimated_total?: number | null
          guest_access_token_hash?: string | null
          guest_email: string
          guest_name: string
          guest_phone: string
          guest_user_id?: string | null
          host_notes?: string | null
          id?: string
          property_id: string
          room_unit_id: string
          special_requests?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          adults?: number
          booking_reference?: string
          cancellation_reason?: string | null
          check_in?: string
          check_out?: string
          children?: number
          created_at?: string
          estimated_total?: number | null
          guest_access_token_hash?: string | null
          guest_email?: string
          guest_name?: string
          guest_phone?: string
          guest_user_id?: string | null
          host_notes?: string | null
          id?: string
          property_id?: string
          room_unit_id?: string
          special_requests?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_requests_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_requests_room_unit_id_fkey"
            columns: ["room_unit_id"]
            isOneToOne: false
            referencedRelation: "room_units"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          agreement_id: string | null
          booking_mode: string
          booking_reference: string
          check_in: string
          check_out: string
          commission_amount_snapshot: number | null
          commission_percent_snapshot: number | null
          created_at: string
          guest_count: number
          guest_email: string | null
          guest_name: string
          guest_notes: string | null
          guest_phone: string
          id: string
          payment_method: string
          property_id: string
          room_unit_id: string
          status: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          agreement_id?: string | null
          booking_mode: string
          booking_reference: string
          check_in: string
          check_out: string
          commission_amount_snapshot?: number | null
          commission_percent_snapshot?: number | null
          created_at?: string
          guest_count?: number
          guest_email?: string | null
          guest_name: string
          guest_notes?: string | null
          guest_phone: string
          id?: string
          payment_method?: string
          property_id: string
          room_unit_id: string
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          agreement_id?: string | null
          booking_mode?: string
          booking_reference?: string
          check_in?: string
          check_out?: string
          commission_amount_snapshot?: number | null
          commission_percent_snapshot?: number | null
          created_at?: string
          guest_count?: number
          guest_email?: string | null
          guest_name?: string
          guest_notes?: string | null
          guest_phone?: string
          id?: string
          payment_method?: string
          property_id?: string
          room_unit_id?: string
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_agreement_id_fkey"
            columns: ["agreement_id"]
            isOneToOne: false
            referencedRelation: "host_agreements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_room_unit_id_fkey"
            columns: ["room_unit_id"]
            isOneToOne: false
            referencedRelation: "room_units"
            referencedColumns: ["id"]
          },
        ]
      }
      host_agreements: {
        Row: {
          accepted_at: string | null
          agreement_end: string | null
          agreement_start: string
          agreement_status: string
          commission_percent: number
          created_at: string
          host_contact: string | null
          host_name: string
          host_user_id: string | null
          id: string
          intro_commission_percent: number
          intro_period_months: number
          notes: string | null
          property_id: string
          standard_commission_percent: number
          terms_version: string | null
        }
        Insert: {
          accepted_at?: string | null
          agreement_end?: string | null
          agreement_start: string
          agreement_status?: string
          commission_percent?: number
          created_at?: string
          host_contact?: string | null
          host_name: string
          host_user_id?: string | null
          id?: string
          intro_commission_percent?: number
          intro_period_months?: number
          notes?: string | null
          property_id: string
          standard_commission_percent?: number
          terms_version?: string | null
        }
        Update: {
          accepted_at?: string | null
          agreement_end?: string | null
          agreement_start?: string
          agreement_status?: string
          commission_percent?: number
          created_at?: string
          host_contact?: string | null
          host_name?: string
          host_user_id?: string | null
          id?: string
          intro_commission_percent?: number
          intro_period_months?: number
          notes?: string | null
          property_id?: string
          standard_commission_percent?: number
          terms_version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "host_agreements_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_admins: {
        Row: {
          created_at: string
          email: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      properties: {
        Row: {
          address: string | null
          amenities: Json
          booking_mode: string
          created_at: string
          description: string | null
          district: string | null
          host_id: string | null
          id: string
          latitude: number | null
          longitude: number | null
          moderation_notes: string | null
          moderation_status: string
          name: string
          photos: Json
          property_type: string
          published: boolean
          reviewed_at: string | null
          reviewed_by: string | null
          slug: string
          state: string | null
          updated_at: string
          village: string | null
        }
        Insert: {
          address?: string | null
          amenities?: Json
          booking_mode?: string
          created_at?: string
          description?: string | null
          district?: string | null
          host_id?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          moderation_notes?: string | null
          moderation_status?: string
          name: string
          photos?: Json
          property_type?: string
          published?: boolean
          reviewed_at?: string | null
          reviewed_by?: string | null
          slug: string
          state?: string | null
          updated_at?: string
          village?: string | null
        }
        Update: {
          address?: string | null
          amenities?: Json
          booking_mode?: string
          created_at?: string
          description?: string | null
          district?: string | null
          host_id?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          moderation_notes?: string | null
          moderation_status?: string
          name?: string
          photos?: Json
          property_type?: string
          published?: boolean
          reviewed_at?: string | null
          reviewed_by?: string | null
          slug?: string
          state?: string | null
          updated_at?: string
          village?: string | null
        }
        Relationships: []
      }
      property_hosts: {
        Row: {
          created_at: string
          id: string
          property_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          property_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          property_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_hosts_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      room_availability_blocks: {
        Row: {
          blocked_from: string
          blocked_until: string
          created_at: string
          created_by: string | null
          id: string
          reason: string | null
          room_unit_id: string
        }
        Insert: {
          blocked_from: string
          blocked_until: string
          created_at?: string
          created_by?: string | null
          id?: string
          reason?: string | null
          room_unit_id: string
        }
        Update: {
          blocked_from?: string
          blocked_until?: string
          created_at?: string
          created_by?: string | null
          id?: string
          reason?: string | null
          room_unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_availability_blocks_room_unit_id_fkey"
            columns: ["room_unit_id"]
            isOneToOne: false
            referencedRelation: "room_units"
            referencedColumns: ["id"]
          },
        ]
      }
      room_units: {
        Row: {
          active: boolean
          base_price: number
          created_at: string
          description: string | null
          id: string
          max_guests: number
          property_id: string
          room_name: string
        }
        Insert: {
          active?: boolean
          base_price?: number
          created_at?: string
          description?: string | null
          id?: string
          max_guests?: number
          property_id: string
          room_name: string
        }
        Update: {
          active?: boolean
          base_price?: number
          created_at?: string
          description?: string | null
          id?: string
          max_guests?: number
          property_id?: string
          room_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_units_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      stay_bookings: {
        Row: {
          adults: number
          agreement_id: string | null
          booking_reference: string
          check_in: string
          check_out: string
          children: number
          commission_amount_snapshot: number | null
          commission_percent_snapshot: number | null
          created_at: string
          guest_access_token_hash: string | null
          guest_email: string
          guest_name: string
          guest_phone: string
          guest_user_id: string | null
          host_notes: string | null
          id: string
          property_id: string
          room_unit_id: string
          rooms_count: number
          special_requests: string | null
          status: string
          total_estimate: number | null
          updated_at: string
        }
        Insert: {
          adults?: number
          agreement_id?: string | null
          booking_reference: string
          check_in: string
          check_out: string
          children?: number
          commission_amount_snapshot?: number | null
          commission_percent_snapshot?: number | null
          created_at?: string
          guest_access_token_hash?: string | null
          guest_email: string
          guest_name: string
          guest_phone: string
          guest_user_id?: string | null
          host_notes?: string | null
          id?: string
          property_id: string
          room_unit_id: string
          rooms_count?: number
          special_requests?: string | null
          status?: string
          total_estimate?: number | null
          updated_at?: string
        }
        Update: {
          adults?: number
          agreement_id?: string | null
          booking_reference?: string
          check_in?: string
          check_out?: string
          children?: number
          commission_amount_snapshot?: number | null
          commission_percent_snapshot?: number | null
          created_at?: string
          guest_access_token_hash?: string | null
          guest_email?: string
          guest_name?: string
          guest_phone?: string
          guest_user_id?: string | null
          host_notes?: string | null
          id?: string
          property_id?: string
          room_unit_id?: string
          rooms_count?: number
          special_requests?: string | null
          status?: string
          total_estimate?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stay_bookings_agreement_id_fkey"
            columns: ["agreement_id"]
            isOneToOne: false
            referencedRelation: "host_agreements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stay_bookings_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stay_bookings_room_unit_id_fkey"
            columns: ["room_unit_id"]
            isOneToOne: false
            referencedRelation: "room_units"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cancel_guest_booking: {
        Args: { p_booking_reference: string; p_guest_token_hash: string }
        Returns: Json
      }
      create_guest_booking_request: {
        Args: {
          p_adults: number
          p_booking_reference: string
          p_check_in: string
          p_check_out: string
          p_children: number
          p_guest_access_token_hash: string
          p_guest_email: string
          p_guest_name: string
          p_guest_phone: string
          p_room_unit_id: string
          p_special_requests?: string
        }
        Returns: Json
      }
      is_platform_admin: { Args: never; Returns: boolean }
      respond_to_booking_request:
        | {
            Args: {
              p_action: string
              p_actor_user_id?: string
              p_booking_request_id: string
              p_host_notes?: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_action: string
              p_actor_is_admin: boolean
              p_actor_user_id: string
              p_booking_request_id: string
              p_host_notes: string
            }
            Returns: Json
          }
      respond_to_stay_booking: {
        Args: {
          p_action: string
          p_actor_user_id: string
          p_host_notes?: string
          p_stay_booking_id: string
        }
        Returns: Json
      }
      try_consume_booking_rate_limit: {
        Args: {
          p_ip_hash: string
          p_max_requests: number
          p_window_seconds: number
        }
        Returns: boolean
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
