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
      community_initiatives: {
        Row: {
          category: string
          cohort_schedule: string | null
          created_at: string
          description: string
          id: string
          location: string
          objectives: string[]
          outcomes: string[]
          slug: string
          status: string
          tagline: string
          title: string
          updated_at: string
          valley: string
        }
        Insert: {
          category: string
          cohort_schedule?: string | null
          created_at?: string
          description: string
          id?: string
          location: string
          objectives?: string[]
          outcomes?: string[]
          slug: string
          status?: string
          tagline: string
          title: string
          updated_at?: string
          valley: string
        }
        Update: {
          category?: string
          cohort_schedule?: string | null
          created_at?: string
          description?: string
          id?: string
          location?: string
          objectives?: string[]
          outcomes?: string[]
          slug?: string
          status?: string
          tagline?: string
          title?: string
          updated_at?: string
          valley?: string
        }
        Relationships: []
      }
      community_participations: {
        Row: {
          admin_notes: string | null
          created_at: string
          duration: string
          email: string
          full_name: string
          id: string
          initiative_slug: string
          motivation: string
          phone: string | null
          skills: string
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          duration: string
          email: string
          full_name: string
          id?: string
          initiative_slug: string
          motivation: string
          phone?: string | null
          skills: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          duration?: string
          email?: string
          full_name?: string
          id?: string
          initiative_slug?: string
          motivation?: string
          phone?: string | null
          skills?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      community_stories: {
        Row: {
          author_name: string
          author_role: string
          consent_given: boolean
          content: string
          created_at: string
          excerpt: string
          id: string
          published_at: string | null
          status: string
          title: string
          updated_at: string
          user_id: string | null
          valley: string
          village: string
        }
        Insert: {
          author_name: string
          author_role: string
          consent_given?: boolean
          content: string
          created_at?: string
          excerpt: string
          id?: string
          published_at?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id?: string | null
          valley: string
          village: string
        }
        Update: {
          author_name?: string
          author_role?: string
          consent_given?: boolean
          content?: string
          created_at?: string
          excerpt?: string
          id?: string
          published_at?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string | null
          valley?: string
          village?: string
        }
        Relationships: []
      }
      destinations: {
        Row: {
          active: boolean | null
          created_at: string | null
          description: string | null
          featured: boolean | null
          id: string
          match_terms: string[] | null
          name: string
          region: string
          slug: string
          sort_order: number | null
          tagline: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          featured?: boolean | null
          id: string
          match_terms?: string[] | null
          name: string
          region: string
          slug: string
          sort_order?: number | null
          tagline?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          featured?: boolean | null
          id?: string
          match_terms?: string[] | null
          name?: string
          region?: string
          slug?: string
          sort_order?: number | null
          tagline?: string | null
        }
        Relationships: []
      }
      filmmaker_profiles: {
        Row: {
          admin_notes: string | null
          bio: string
          collaboration_interests: string[]
          created_at: string
          creative_role: string
          email: string
          full_name: string
          id: string
          location: string
          phone: string | null
          portfolio_url: string | null
          skills: string[]
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          bio: string
          collaboration_interests?: string[]
          created_at?: string
          creative_role: string
          email: string
          full_name: string
          id?: string
          location: string
          phone?: string | null
          portfolio_url?: string | null
          skills?: string[]
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          bio?: string
          collaboration_interests?: string[]
          created_at?: string
          creative_role?: string
          email?: string
          full_name?: string
          id?: string
          location?: string
          phone?: string | null
          portfolio_url?: string | null
          skills?: string[]
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
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
          terminated_at: string | null
          terminated_by: string | null
          termination_reason: string | null
          terms_digest: string | null
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
          terminated_at?: string | null
          terminated_by?: string | null
          termination_reason?: string | null
          terms_digest?: string | null
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
          terminated_at?: string | null
          terminated_by?: string | null
          termination_reason?: string | null
          terms_digest?: string | null
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
      legal_terms_documents: {
        Row: {
          content: string
          created_at: string
          document_hash: string
          effective_date: string
          title: string
          version: string
        }
        Insert: {
          content: string
          created_at?: string
          document_hash: string
          effective_date: string
          title: string
          version: string
        }
        Update: {
          content?: string
          created_at?: string
          document_hash?: string
          effective_date?: string
          title?: string
          version?: string
        }
        Relationships: []
      }
      marketplace_category_requirements: {
        Row: {
          category_code: string
          optional_documents: string[]
          regulatory_notes: string
          required_documents: string[]
          title: string
          updated_at: string
        }
        Insert: {
          category_code: string
          optional_documents?: string[]
          regulatory_notes: string
          required_documents?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          category_code?: string
          optional_documents?: string[]
          regulatory_notes?: string
          required_documents?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: []
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
      product_interests: {
        Row: {
          category: string | null
          created_at: string
          guest_email: string
          guest_name: string
          id: string
          notes: string | null
          product_id: string | null
          user_id: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          guest_email: string
          guest_name: string
          id?: string
          notes?: string | null
          product_id?: string | null
          user_id?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          guest_email?: string
          guest_name?: string
          id?: string
          notes?: string | null
          product_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_interests_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      production_proposals: {
        Row: {
          admin_notes: string | null
          category: string
          concept: string
          created_at: string
          cultural_relevance: string
          estimated_budget: number | null
          filmmaker_id: string | null
          id: string
          portfolio_links: string[]
          proposed_location: string
          status: string
          support_needed: string[]
          synopsis: string
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          category: string
          concept: string
          created_at?: string
          cultural_relevance: string
          estimated_budget?: number | null
          filmmaker_id?: string | null
          id?: string
          portfolio_links?: string[]
          proposed_location: string
          status?: string
          support_needed?: string[]
          synopsis: string
          title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          category?: string
          concept?: string
          created_at?: string
          cultural_relevance?: string
          estimated_budget?: number | null
          filmmaker_id?: string | null
          id?: string
          portfolio_links?: string[]
          proposed_location?: string
          status?: string
          support_needed?: string[]
          synopsis?: string
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "production_proposals_filmmaker_id_fkey"
            columns: ["filmmaker_id"]
            isOneToOne: false
            referencedRelation: "filmmaker_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: string
          craft_type: string
          created_at: string
          description: string | null
          id: string
          inventory_status: string
          maker_name: string
          materials: string
          moderation_status: string
          origin_state: string
          origin_valley: string
          photos: string[]
          price_estimate: number | null
          seller_id: string
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          craft_type: string
          created_at?: string
          description?: string | null
          id?: string
          inventory_status?: string
          maker_name: string
          materials: string
          moderation_status?: string
          origin_state?: string
          origin_valley: string
          photos?: string[]
          price_estimate?: number | null
          seller_id: string
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          craft_type?: string
          created_at?: string
          description?: string | null
          id?: string
          inventory_status?: string
          maker_name?: string
          materials?: string
          moderation_status?: string
          origin_state?: string
          origin_valley?: string
          photos?: string[]
          price_estimate?: number | null
          seller_id?: string
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["user_id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          bio: string | null
          city: string | null
          contact_verified: boolean
          country: string
          created_at: string
          email: string | null
          full_name: string
          id: string
          interests: string[]
          location: string | null
          mountain_interests: string[]
          phone: string | null
          preferred_name: string | null
          state: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          contact_verified?: boolean
          country?: string
          created_at?: string
          email?: string | null
          full_name?: string
          id: string
          interests?: string[]
          location?: string | null
          mountain_interests?: string[]
          phone?: string | null
          preferred_name?: string | null
          state?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          contact_verified?: boolean
          country?: string
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          interests?: string[]
          location?: string | null
          mountain_interests?: string[]
          phone?: string | null
          preferred_name?: string | null
          state?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      properties: {
        Row: {
          address: string | null
          amenities: Json
          booking_mode: string
          check_in_time: string | null
          check_out_time: string | null
          contact_email: string | null
          contact_phone: string | null
          contact_whatsapp: string | null
          cover_photo: string | null
          created_at: string
          description: string | null
          district: string | null
          host_id: string | null
          house_rules: string | null
          id: string
          moderation_notes: string | null
          moderation_status: string
          name: string
          notify_email: boolean
          notify_whatsapp: boolean
          pending_changes: Json | null
          pending_changes_submitted_at: string | null
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
          check_in_time?: string | null
          check_out_time?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          contact_whatsapp?: string | null
          cover_photo?: string | null
          created_at?: string
          description?: string | null
          district?: string | null
          host_id?: string | null
          house_rules?: string | null
          id?: string
          moderation_notes?: string | null
          moderation_status?: string
          name: string
          notify_email?: boolean
          notify_whatsapp?: boolean
          pending_changes?: Json | null
          pending_changes_submitted_at?: string | null
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
          check_in_time?: string | null
          check_out_time?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          contact_whatsapp?: string | null
          cover_photo?: string | null
          created_at?: string
          description?: string | null
          district?: string | null
          host_id?: string | null
          house_rules?: string | null
          id?: string
          moderation_notes?: string | null
          moderation_status?: string
          name?: string
          notify_email?: boolean
          notify_whatsapp?: boolean
          pending_changes?: Json | null
          pending_changes_submitted_at?: string | null
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
      property_private_locations: {
        Row: {
          created_at: string
          exact_address: string
          google_maps_url: string | null
          location_confirmed: boolean
          pending_exact_address: string | null
          pending_google_maps_url: string | null
          property_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          exact_address?: string
          google_maps_url?: string | null
          location_confirmed?: boolean
          pending_exact_address?: string | null
          pending_google_maps_url?: string | null
          property_id: string
          updated_at?: string
        }
        Insert_Relationships: []
        Update: {
          created_at?: string
          exact_address?: string
          google_maps_url?: string | null
          location_confirmed?: boolean
          pending_exact_address?: string | null
          pending_google_maps_url?: string | null
          property_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_private_locations_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: true
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_hosts: {
        Row: {
          created_at: string
          id: string
          property_id: string
          role: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          property_id: string
          role?: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          property_id?: string
          role?: string
          status?: string
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
      rate_limits: {
        Row: {
          key: string
          last_request_at: string
          reset_at: string
          tokens: number
        }
        Insert: {
          key: string
          last_request_at?: string
          reset_at: string
          tokens?: number
        }
        Update: {
          key?: string
          last_request_at?: string
          reset_at?: string
          tokens?: number
        }
        Relationships: []
      }
      reviews: {
        Row: {
          booking_id: string | null
          comment: string
          created_at: string
          id: string
          moderated_at: string | null
          moderated_by: string | null
          moderation_status: string
          property_id: string
          rating: number
          reviewer_name: string
          reviewer_user_id: string | null
        }
        Insert: {
          booking_id?: string | null
          comment: string
          created_at?: string
          id?: string
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_status?: string
          property_id: string
          rating: number
          reviewer_name: string
          reviewer_user_id?: string | null
        }
        Update: {
          booking_id?: string | null
          comment?: string
          created_at?: string
          id?: string
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_status?: string
          property_id?: string
          rating?: number
          reviewer_name?: string
          reviewer_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "stay_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_property_id_fkey"
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
          attached_washroom: boolean
          base_price: number
          bed_type: string | null
          created_at: string
          description: string | null
          features: Json
          id: string
          max_guests: number
          photos: Json
          property_id: string
          room_name: string
          sort_order: number
          view_type: string
        }
        Insert: {
          active?: boolean
          attached_washroom?: boolean
          base_price?: number
          bed_type?: string | null
          created_at?: string
          description?: string | null
          features?: Json
          id?: string
          max_guests?: number
          photos?: Json
          property_id: string
          room_name: string
          sort_order?: number
          view_type?: string
        }
        Update: {
          active?: boolean
          attached_washroom?: boolean
          base_price?: number
          bed_type?: string | null
          created_at?: string
          description?: string | null
          features?: Json
          id?: string
          max_guests?: number
          photos?: Json
          property_id?: string
          room_name?: string
          sort_order?: number
          view_type?: string
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
      seller_verification_checks: {
        Row: {
          check_type: string
          checked_by_staff_id: string | null
          created_at: string
          gstin: string | null
          id: string
          legal_name_returned: string | null
          name_matches_applicant: boolean
          notes: string | null
          pan_embedded: string | null
          portal_legal_name: string | null
          portal_status: string | null
          portal_trade_name: string | null
          registration_status: string | null
          reviewed_by: string | null
          reviewer_user_id: string | null
          seller_user_id: string
          state_code: string | null
          supporting_evidence_ref: string | null
          trade_name_returned: string | null
          verification_date: string
          verification_result: string | null
        }
        Insert: {
          check_type?: string
          checked_by_staff_id?: string | null
          created_at?: string
          gstin?: string | null
          id?: string
          legal_name_returned?: string | null
          name_matches_applicant?: boolean
          notes?: string | null
          pan_embedded?: string | null
          portal_legal_name?: string | null
          portal_status?: string | null
          portal_trade_name?: string | null
          registration_status?: string | null
          reviewed_by?: string | null
          reviewer_user_id?: string | null
          seller_user_id: string
          state_code?: string | null
          supporting_evidence_ref?: string | null
          trade_name_returned?: string | null
          verification_date?: string
          verification_result?: string | null
        }
        Update: {
          check_type?: string
          checked_by_staff_id?: string | null
          created_at?: string
          gstin?: string | null
          id?: string
          legal_name_returned?: string | null
          name_matches_applicant?: boolean
          notes?: string | null
          pan_embedded?: string | null
          portal_legal_name?: string | null
          portal_status?: string | null
          portal_trade_name?: string | null
          registration_status?: string | null
          reviewed_by?: string | null
          reviewer_user_id?: string | null
          seller_user_id?: string
          state_code?: string | null
          supporting_evidence_ref?: string | null
          trade_name_returned?: string | null
          verification_date?: string
          verification_result?: string | null
        }
        Relationships: []
      }
      seller_verification_documents: {
        Row: {
          created_at: string
          document_reference_number: string | null
          document_title: string | null
          document_type: string
          expires_at: string | null
          expiry_date: string | null
          file_size_bytes: number | null
          id: string
          mime_type: string
          reference_number: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          reviewer_notes: string | null
          seller_user_id: string
          size_bytes: number | null
          storage_bucket: string
          storage_path: string
          uploaded_at: string
          verification_status: string
          verified_by_staff_id: string | null
        }
        Insert: {
          created_at?: string
          document_reference_number?: string | null
          document_title?: string | null
          document_type: string
          expires_at?: string | null
          expiry_date?: string | null
          file_size_bytes?: number | null
          id?: string
          mime_type: string
          reference_number?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          seller_user_id: string
          size_bytes?: number | null
          storage_bucket?: string
          storage_path: string
          uploaded_at?: string
          verification_status?: string
          verified_by_staff_id?: string | null
        }
        Update: {
          created_at?: string
          document_reference_number?: string | null
          document_title?: string | null
          document_type?: string
          expires_at?: string | null
          expiry_date?: string | null
          file_size_bytes?: number | null
          id?: string
          mime_type?: string
          reference_number?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          seller_user_id?: string
          size_bytes?: number | null
          storage_bucket?: string
          storage_path?: string
          uploaded_at?: string
          verification_status?: string
          verified_by_staff_id?: string | null
        }
        Relationships: []
      }
      sellers: {
        Row: {
          authorized_representative_name: string | null
          authorized_representative_role: string | null
          ayush_licence_number: string | null
          bio: string | null
          bis_certificate_number: string | null
          business_constitution: string | null
          business_contact_name: string | null
          business_contact_phone: string | null
          business_name: string
          constitution: string | null
          contact_email: string
          contact_phone: string | null
          craft_gi_number: string | null
          craft_type: string
          created_at: string
          dispatch_address: string | null
          fssai_licence_number: string | null
          gstin: string | null
          gstin_status: string | null
          handloom_mark_number: string | null
          legal_business_name: string | null
          legal_metrology_number: string | null
          maker_name: string
          materials: string | null
          organic_npop_pgs_number: string | null
          pan: string | null
          primary_category: string | null
          registered_address: string | null
          registration_number: string | null
          secondary_categories: string[] | null
          social_links: Json | null
          state: string
          status: string
          tax_registration_status: string | null
          trade_name: string | null
          trademark_registration_number: string | null
          updated_at: string
          user_id: string
          valley: string
          verification_notes: string | null
          verification_status: string | null
          verified_at: string | null
          verified_by_staff_id: string | null
          website_url: string | null
        }
        Insert: {
          authorized_representative_name?: string | null
          authorized_representative_role?: string | null
          ayush_licence_number?: string | null
          bio?: string | null
          bis_certificate_number?: string | null
          business_constitution?: string | null
          business_contact_name?: string | null
          business_contact_phone?: string | null
          business_name: string
          constitution?: string | null
          contact_email: string
          contact_phone?: string | null
          craft_gi_number?: string | null
          craft_type: string
          created_at?: string
          dispatch_address?: string | null
          fssai_licence_number?: string | null
          gstin?: string | null
          gstin_status?: string | null
          handloom_mark_number?: string | null
          legal_business_name?: string | null
          legal_metrology_number?: string | null
          maker_name: string
          materials?: string | null
          organic_npop_pgs_number?: string | null
          pan?: string | null
          primary_category?: string | null
          registered_address?: string | null
          registration_number?: string | null
          secondary_categories?: string[] | null
          social_links?: Json | null
          state?: string
          status?: string
          tax_registration_status?: string | null
          trade_name?: string | null
          trademark_registration_number?: string | null
          updated_at?: string
          user_id: string
          valley: string
          verification_notes?: string | null
          verification_status?: string | null
          verified_at?: string | null
          verified_by_staff_id?: string | null
          website_url?: string | null
        }
        Update: {
          authorized_representative_name?: string | null
          authorized_representative_role?: string | null
          ayush_licence_number?: string | null
          bio?: string | null
          bis_certificate_number?: string | null
          business_constitution?: string | null
          business_contact_name?: string | null
          business_contact_phone?: string | null
          business_name?: string
          constitution?: string | null
          contact_email?: string
          contact_phone?: string | null
          craft_gi_number?: string | null
          craft_type?: string
          created_at?: string
          dispatch_address?: string | null
          fssai_licence_number?: string | null
          gstin?: string | null
          gstin_status?: string | null
          handloom_mark_number?: string | null
          legal_business_name?: string | null
          legal_metrology_number?: string | null
          maker_name?: string
          materials?: string | null
          organic_npop_pgs_number?: string | null
          pan?: string | null
          primary_category?: string | null
          registered_address?: string | null
          registration_number?: string | null
          secondary_categories?: string[] | null
          social_links?: Json | null
          state?: string
          status?: string
          tax_registration_status?: string | null
          trade_name?: string | null
          trademark_registration_number?: string | null
          updated_at?: string
          user_id?: string
          valley?: string
          verification_notes?: string | null
          verification_status?: string | null
          verified_at?: string | null
          verified_by_staff_id?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      staff_agreement_acceptances: {
        Row: {
          accepted: boolean
          accepted_at: string
          accepted_ip: string | null
          agreement_code: string
          agreement_title: string | null
          agreement_type: string | null
          agreement_version: string | null
          approval_status: string
          document_hash: string
          id: string
          ip_address: string | null
          signed_document_ref: string | null
          staff_profile_id: string | null
          staff_user_id: string | null
          user_agent: string | null
          user_id: string
          version: string
        }
        Insert: {
          accepted?: boolean
          accepted_at?: string
          accepted_ip?: string | null
          agreement_code: string
          agreement_title?: string | null
          agreement_type?: string | null
          agreement_version?: string | null
          approval_status?: string
          document_hash: string
          id?: string
          ip_address?: string | null
          signed_document_ref?: string | null
          staff_profile_id?: string | null
          staff_user_id?: string | null
          user_agent?: string | null
          user_id: string
          version?: string
        }
        Update: {
          accepted?: boolean
          accepted_at?: string
          accepted_ip?: string | null
          agreement_code?: string
          agreement_title?: string | null
          agreement_type?: string | null
          agreement_version?: string | null
          approval_status?: string
          document_hash?: string
          id?: string
          ip_address?: string | null
          signed_document_ref?: string | null
          staff_profile_id?: string | null
          staff_user_id?: string | null
          user_agent?: string | null
          user_id?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_agreement_acceptances_staff_profile_id_fkey"
            columns: ["staff_profile_id"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_agreements: {
        Row: {
          agreement_code: string
          created_at: string
          document_hash: string
          title: string
          version: string
        }
        Insert: {
          agreement_code: string
          created_at?: string
          document_hash: string
          title: string
          version: string
        }
        Update: {
          agreement_code?: string
          created_at?: string
          document_hash?: string
          title?: string
          version?: string
        }
        Relationships: []
      }
      staff_audit_log: {
        Row: {
          action: string
          actor_email: string | null
          actor_role: string | null
          actor_staff_id: string | null
          actor_user_id: string | null
          after_state: Json | null
          before_state: Json | null
          created_at: string
          id: string
          ip_address: string | null
          payload: Json
          reason: string | null
          result: string
          target_id: string | null
          target_staff_id: string | null
          target_type: string
          target_user_id: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_role?: string | null
          actor_staff_id?: string | null
          actor_user_id?: string | null
          after_state?: Json | null
          before_state?: Json | null
          created_at?: string
          id?: string
          ip_address?: string | null
          payload?: Json
          reason?: string | null
          result?: string
          target_id?: string | null
          target_staff_id?: string | null
          target_type: string
          target_user_id?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_role?: string | null
          actor_staff_id?: string | null
          actor_user_id?: string | null
          after_state?: Json | null
          before_state?: Json | null
          created_at?: string
          id?: string
          ip_address?: string | null
          payload?: Json
          reason?: string | null
          result?: string
          target_id?: string | null
          target_staff_id?: string | null
          target_type?: string
          target_user_id?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      staff_documents: {
        Row: {
          created_at: string
          document_title: string | null
          document_type: string
          file_size_bytes: number | null
          id: string
          mime_type: string
          size_bytes: number | null
          staff_profile_id: string | null
          storage_bucket: string
          storage_path: string
          uploaded_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          document_title?: string | null
          document_type: string
          file_size_bytes?: number | null
          id?: string
          mime_type: string
          size_bytes?: number | null
          staff_profile_id?: string | null
          storage_bucket?: string
          storage_path: string
          uploaded_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          document_title?: string | null
          document_type?: string
          file_size_bytes?: number | null
          id?: string
          mime_type?: string
          size_bytes?: number | null
          staff_profile_id?: string | null
          storage_bucket?: string
          storage_path?: string
          uploaded_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_documents_staff_profile_id_fkey"
            columns: ["staff_profile_id"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_dual_approvals: {
        Row: {
          action_type: string
          approved_at: string | null
          approved_by: string | null
          approved_by_user_id: string | null
          created_at: string
          decided_at: string | null
          decision_notes: string | null
          id: string
          justification: string | null
          payload: Json
          reason: string
          requested_by: string
          requested_by_email: string | null
          requested_by_staff_id: string | null
          requested_by_user_id: string | null
          reviewer_notes: string | null
          second_approver_id: string | null
          second_approver_staff_id: string | null
          status: string
          target_id: string
          target_type: string
        }
        Insert: {
          action_type: string
          approved_at?: string | null
          approved_by?: string | null
          approved_by_user_id?: string | null
          created_at?: string
          decided_at?: string | null
          decision_notes?: string | null
          id?: string
          justification?: string | null
          payload?: Json
          reason: string
          requested_by: string
          requested_by_email?: string | null
          requested_by_staff_id?: string | null
          requested_by_user_id?: string | null
          reviewer_notes?: string | null
          second_approver_id?: string | null
          second_approver_staff_id?: string | null
          status?: string
          target_id: string
          target_type: string
        }
        Update: {
          action_type?: string
          approved_at?: string | null
          approved_by?: string | null
          approved_by_user_id?: string | null
          created_at?: string
          decided_at?: string | null
          decision_notes?: string | null
          id?: string
          justification?: string | null
          payload?: Json
          reason?: string
          requested_by?: string
          requested_by_email?: string | null
          requested_by_staff_id?: string | null
          requested_by_user_id?: string | null
          reviewer_notes?: string | null
          second_approver_id?: string | null
          second_approver_staff_id?: string | null
          status?: string
          target_id?: string
          target_type?: string
        }
        Relationships: []
      }
      staff_employment_history: {
        Row: {
          actor_staff_id: string | null
          actor_user_id: string
          created_at: string
          event_type: string
          id: string
          metadata: Json
          new_status: string
          previous_status: string | null
          reason: string
          staff_profile_id: string
        }
        Insert: {
          actor_staff_id?: string | null
          actor_user_id: string
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json
          new_status: string
          previous_status?: string | null
          reason: string
          staff_profile_id: string
        }
        Update: {
          actor_staff_id?: string | null
          actor_user_id?: string
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json
          new_status?: string
          previous_status?: string | null
          reason?: string
          staff_profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_employment_history_staff_profile_id_fkey"
            columns: ["staff_profile_id"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_invitations: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          cancel_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          created_at: string
          department: string
          designation: string | null
          employment_category: string
          expires_at: string
          id: string
          initial_permissions: string[]
          invited_by: string | null
          invited_by_email: string | null
          invited_by_user_id: string | null
          official_email: string
          proposed_designation: string
          role_code: string | null
          role_slug: string
          status: string
          token_hash: string
          used_at: string | null
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          cancel_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string
          department: string
          designation?: string | null
          employment_category?: string
          expires_at: string
          id?: string
          initial_permissions?: string[]
          invited_by?: string | null
          invited_by_email?: string | null
          invited_by_user_id?: string | null
          official_email: string
          proposed_designation: string
          role_code?: string | null
          role_slug: string
          status?: string
          token_hash: string
          used_at?: string | null
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          cancel_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string
          department?: string
          designation?: string | null
          employment_category?: string
          expires_at?: string
          id?: string
          initial_permissions?: string[]
          invited_by?: string | null
          invited_by_email?: string | null
          invited_by_user_id?: string | null
          official_email?: string
          proposed_designation?: string
          role_code?: string | null
          role_slug?: string
          status?: string
          token_hash?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_invitations_role_slug_fkey"
            columns: ["role_slug"]
            isOneToOne: false
            referencedRelation: "staff_roles"
            referencedColumns: ["role_slug"]
          },
        ]
      }
      staff_permission_assignments: {
        Row: {
          expires_at: string | null
          grant_type: string
          granted_at: string
          granted_by: string | null
          id: string
          is_active: boolean
          permission_code: string | null
          permission_key: string
          reason: string | null
          revoked_at: string | null
          staff_profile_id: string | null
          user_id: string | null
        }
        Insert: {
          expires_at?: string | null
          grant_type?: string
          granted_at?: string
          granted_by?: string | null
          id?: string
          is_active?: boolean
          permission_code?: string | null
          permission_key: string
          reason?: string | null
          revoked_at?: string | null
          staff_profile_id?: string | null
          user_id?: string | null
        }
        Update: {
          expires_at?: string | null
          grant_type?: string
          granted_at?: string
          granted_by?: string | null
          id?: string
          is_active?: boolean
          permission_code?: string | null
          permission_key?: string
          reason?: string | null
          revoked_at?: string | null
          staff_profile_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_permission_assignments_permission_key_fkey"
            columns: ["permission_key"]
            isOneToOne: false
            referencedRelation: "staff_permissions"
            referencedColumns: ["permission_key"]
          },
          {
            foreignKeyName: "staff_permission_assignments_staff_profile_id_fkey"
            columns: ["staff_profile_id"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_permissions: {
        Row: {
          created_at: string
          description: string
          permission_code: string | null
          permission_key: string
        }
        Insert: {
          created_at?: string
          description: string
          permission_code?: string | null
          permission_key: string
        }
        Update: {
          created_at?: string
          description?: string
          permission_code?: string | null
          permission_key?: string
        }
        Relationships: []
      }
      staff_profiles: {
        Row: {
          agreements_completed: boolean
          all_agreements_accepted: boolean
          approved_at: string | null
          approved_by: string | null
          assigned_responsibilities: string | null
          created_at: string
          current_address: string | null
          custom_permissions: string[]
          department: string
          designation: string
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          employment_category: string
          founder_approved: boolean
          founder_approved_at: string | null
          founder_approved_by: string | null
          full_legal_name: string
          id: string
          identity_document_number_masked: string | null
          identity_document_ref: string | null
          identity_document_reference: string | null
          identity_document_type: string | null
          invitation_id: string | null
          joining_date: string
          mfa_enrolled: boolean
          moderation_notes: string | null
          official_email: string
          onboarding_completed: boolean
          personal_email: string | null
          preferred_name: string | null
          previous_experience: string | null
          privacy_notice_accepted: boolean
          privacy_notice_accepted_at: string | null
          professional_qualifications: string | null
          region_scope: string[]
          rejection_reason: string | null
          reporting_manager: string | null
          resource_scope: string[]
          revoked_permissions: string[]
          role_code: string | null
          role_slug: string
          session_revoked_at: string | null
          staff_id: string | null
          status: string
          suspended_at: string | null
          suspended_by: string | null
          suspension_reason: string | null
          terminated_at: string | null
          terminated_by: string | null
          termination_reason: string | null
          updated_at: string
          user_id: string
          verified_mobile: string | null
        }
        Insert: {
          agreements_completed?: boolean
          all_agreements_accepted?: boolean
          approved_at?: string | null
          approved_by?: string | null
          assigned_responsibilities?: string | null
          created_at?: string
          current_address?: string | null
          custom_permissions?: string[]
          department: string
          designation: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          employment_category?: string
          founder_approved?: boolean
          founder_approved_at?: string | null
          founder_approved_by?: string | null
          full_legal_name: string
          id?: string
          identity_document_number_masked?: string | null
          identity_document_ref?: string | null
          identity_document_reference?: string | null
          identity_document_type?: string | null
          invitation_id?: string | null
          joining_date?: string
          mfa_enrolled?: boolean
          moderation_notes?: string | null
          official_email: string
          onboarding_completed?: boolean
          personal_email?: string | null
          preferred_name?: string | null
          previous_experience?: string | null
          privacy_notice_accepted?: boolean
          privacy_notice_accepted_at?: string | null
          professional_qualifications?: string | null
          region_scope?: string[]
          rejection_reason?: string | null
          reporting_manager?: string | null
          resource_scope?: string[]
          revoked_permissions?: string[]
          role_code?: string | null
          role_slug: string
          session_revoked_at?: string | null
          staff_id?: string | null
          status?: string
          suspended_at?: string | null
          suspended_by?: string | null
          suspension_reason?: string | null
          terminated_at?: string | null
          terminated_by?: string | null
          termination_reason?: string | null
          updated_at?: string
          user_id: string
          verified_mobile?: string | null
        }
        Update: {
          agreements_completed?: boolean
          all_agreements_accepted?: boolean
          approved_at?: string | null
          approved_by?: string | null
          assigned_responsibilities?: string | null
          created_at?: string
          current_address?: string | null
          custom_permissions?: string[]
          department?: string
          designation?: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          employment_category?: string
          founder_approved?: boolean
          founder_approved_at?: string | null
          founder_approved_by?: string | null
          full_legal_name?: string
          id?: string
          identity_document_number_masked?: string | null
          identity_document_ref?: string | null
          identity_document_reference?: string | null
          identity_document_type?: string | null
          invitation_id?: string | null
          joining_date?: string
          mfa_enrolled?: boolean
          moderation_notes?: string | null
          official_email?: string
          onboarding_completed?: boolean
          personal_email?: string | null
          preferred_name?: string | null
          previous_experience?: string | null
          privacy_notice_accepted?: boolean
          privacy_notice_accepted_at?: string | null
          professional_qualifications?: string | null
          region_scope?: string[]
          rejection_reason?: string | null
          reporting_manager?: string | null
          resource_scope?: string[]
          revoked_permissions?: string[]
          role_code?: string | null
          role_slug?: string
          session_revoked_at?: string | null
          staff_id?: string | null
          status?: string
          suspended_at?: string | null
          suspended_by?: string | null
          suspension_reason?: string | null
          terminated_at?: string | null
          terminated_by?: string | null
          termination_reason?: string | null
          updated_at?: string
          user_id?: string
          verified_mobile?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_profiles_invitation_id_fkey"
            columns: ["invitation_id"]
            isOneToOne: false
            referencedRelation: "staff_invitations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_profiles_role_slug_fkey"
            columns: ["role_slug"]
            isOneToOne: false
            referencedRelation: "staff_roles"
            referencedColumns: ["role_slug"]
          },
        ]
      }
      staff_role_permissions: {
        Row: {
          permission_key: string
          role_slug: string
        }
        Insert: {
          permission_key: string
          role_slug: string
        }
        Update: {
          permission_key?: string
          role_slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_role_permissions_permission_key_fkey"
            columns: ["permission_key"]
            isOneToOne: false
            referencedRelation: "staff_permissions"
            referencedColumns: ["permission_key"]
          },
          {
            foreignKeyName: "staff_role_permissions_role_slug_fkey"
            columns: ["role_slug"]
            isOneToOne: false
            referencedRelation: "staff_roles"
            referencedColumns: ["role_slug"]
          },
        ]
      }
      staff_roles: {
        Row: {
          allowed_modules: string[]
          created_at: string
          department: string
          description: string
          role_code: string | null
          role_slug: string
          title: string
        }
        Insert: {
          allowed_modules?: string[]
          created_at?: string
          department: string
          description: string
          role_code?: string | null
          role_slug: string
          title: string
        }
        Update: {
          allowed_modules?: string[]
          created_at?: string
          department?: string
          description?: string
          role_code?: string | null
          role_slug?: string
          title?: string
        }
        Relationships: []
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
      user_notifications: {
        Row: {
          action_url: string | null
          created_at: string
          id: string
          message: string
          pillar: string
          read: boolean
          title: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string
          id?: string
          message: string
          pillar: string
          read?: boolean
          title: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string
          id?: string
          message?: string
          pillar?: string
          read?: boolean
          title?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      public_member_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          city: string | null
          country: string | null
          created_at: string | null
          full_name: string | null
          id: string | null
          interests: string[] | null
          location: string | null
          mountain_interests: string[] | null
          preferred_name: string | null
          state: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string | null
          interests?: string[] | null
          location?: string | null
          mountain_interests?: string[] | null
          preferred_name?: string | null
          state?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string | null
          interests?: string[] | null
          location?: string | null
          mountain_interests?: string[] | null
          preferred_name?: string | null
          state?: string | null
        }
        Relationships: []
      }
      public_room_availability: {
        Row: {
          blocked_from: string | null
          blocked_until: string | null
          room_unit_id: string | null
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
    }
    Functions: {
      admin_review_property_changes: {
        Args: {
          p_action: string
          p_admin_notes?: string
          p_admin_user_id?: string
          p_property_id: string
        }
        Returns: Json
      }
      calculate_host_agreement_digest: {
        Args: {
          p_agreement_end: string
          p_agreement_id: string
          p_agreement_start: string
          p_commission_percent: number
          p_document_hash?: string
          p_intro_commission_percent: number
          p_intro_period_months: number
          p_property_id: string
          p_signatory_user_id: string
          p_standard_commission_percent: number
          p_terms_version: string
        }
        Returns: string
      }
      cancel_guest_booking: {
        Args: { p_booking_reference: string; p_guest_token_hash: string }
        Returns: Json
      }
      check_rate_limit: {
        Args: {
          p_key: string
          p_max_requests: number
          p_window_seconds: number
        }
        Returns: boolean
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
      current_session_is_aal2: { Args: never; Returns: boolean }
      delete_room_availability_block: {
        Args: { p_actor_user_id: string; p_block_id: string }
        Returns: Json
      }
      generate_uk_staff_id: { Args: never; Returns: string }
      get_public_room_availability: {
        Args: { p_property_id?: string }
        Returns: {
          blocked_from: string
          blocked_until: string
          room_unit_id: string
        }[]
      }
      get_public_room_occupancy: {
        Args: { p_from?: string; p_property_id: string; p_to?: string }
        Returns: {
          end_date: string
          kind: string
          room_unit_id: string
          start_date: string
        }[]
      }
      has_staff_permission_for_user: {
        Args: { p_perm: string; p_user_id: string }
        Returns: boolean
      }
      is_active_staff_for_user: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      is_platform_admin: { Args: never; Returns: boolean }
      is_platform_admin_for_user: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      is_property_host: {
        Args: { p_property_id: string; p_user_id?: string }
        Returns: boolean
      }
      provision_founder_account: {
        Args: {
          p_contact_phone?: string
          p_full_legal_name: string
          p_official_email: string
          p_user_id: string
        }
        Returns: {
          agreements_completed: boolean
          all_agreements_accepted: boolean
          approved_at: string | null
          approved_by: string | null
          assigned_responsibilities: string | null
          created_at: string
          current_address: string | null
          custom_permissions: string[]
          department: string
          designation: string
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          employment_category: string
          founder_approved: boolean
          founder_approved_at: string | null
          founder_approved_by: string | null
          full_legal_name: string
          id: string
          identity_document_number_masked: string | null
          identity_document_ref: string | null
          identity_document_reference: string | null
          identity_document_type: string | null
          invitation_id: string | null
          joining_date: string
          mfa_enrolled: boolean
          moderation_notes: string | null
          official_email: string
          onboarding_completed: boolean
          personal_email: string | null
          preferred_name: string | null
          previous_experience: string | null
          privacy_notice_accepted: boolean
          privacy_notice_accepted_at: string | null
          professional_qualifications: string | null
          region_scope: string[]
          rejection_reason: string | null
          reporting_manager: string | null
          resource_scope: string[]
          revoked_permissions: string[]
          role_code: string | null
          role_slug: string
          session_revoked_at: string | null
          staff_id: string | null
          status: string
          suspended_at: string | null
          suspended_by: string | null
          suspension_reason: string | null
          terminated_at: string | null
          terminated_by: string | null
          termination_reason: string | null
          updated_at: string
          user_id: string
          verified_mobile: string | null
        }
        SetofOptions: {
          from: "*"
          to: "staff_profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
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
      set_room_availability_block: {
        Args: {
          p_actor_user_id: string
          p_block_id?: string
          p_blocked_from: string
          p_blocked_until: string
          p_reason: string
          p_room_unit_id: string
        }
        Returns: Json
      }
      terminate_host_agreement: {
        Args: {
          p_actor_user_id: string
          p_agreement_id: string
          p_termination_reason: string
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
