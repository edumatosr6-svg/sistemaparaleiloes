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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      affiliates: {
        Row: {
          affiliate_code: string
          commission_rate: number | null
          created_at: string | null
          id: string
          total_earnings: number | null
          user_id: string
        }
        Insert: {
          affiliate_code: string
          commission_rate?: number | null
          created_at?: string | null
          id?: string
          total_earnings?: number | null
          user_id: string
        }
        Update: {
          affiliate_code?: string
          commission_rate?: number | null
          created_at?: string | null
          id?: string
          total_earnings?: number | null
          user_id?: string
        }
        Relationships: []
      }
      auction_winners: {
        Row: {
          administrative_amount: number | null
          bid_amount: number | null
          commission_amount: number | null
          created_at: string
          digital_signature_url: string | null
          digitally_signed_at: string | null
          escrow_status: string | null
          final_amount: number
          id: string
          lot_id: string
          manual_bidder_document: string | null
          manual_bidder_name: string | null
          manual_bidder_phone: string | null
          payment_details: Json | null
          payment_method: string | null
          payment_proof_url: string | null
          sales_note_url: string | null
          signature_ip: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          administrative_amount?: number | null
          bid_amount?: number | null
          commission_amount?: number | null
          created_at?: string
          digital_signature_url?: string | null
          digitally_signed_at?: string | null
          escrow_status?: string | null
          final_amount: number
          id?: string
          lot_id: string
          manual_bidder_document?: string | null
          manual_bidder_name?: string | null
          manual_bidder_phone?: string | null
          payment_details?: Json | null
          payment_method?: string | null
          payment_proof_url?: string | null
          sales_note_url?: string | null
          signature_ip?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          administrative_amount?: number | null
          bid_amount?: number | null
          commission_amount?: number | null
          created_at?: string
          digital_signature_url?: string | null
          digitally_signed_at?: string | null
          escrow_status?: string | null
          final_amount?: number
          id?: string
          lot_id?: string
          manual_bidder_document?: string | null
          manual_bidder_name?: string | null
          manual_bidder_phone?: string | null
          payment_details?: Json | null
          payment_method?: string | null
          payment_proof_url?: string | null
          sales_note_url?: string | null
          signature_ip?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "auction_winners_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: true
            referencedRelation: "lots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_auction_winners_lot"
            columns: ["lot_id"]
            isOneToOne: true
            referencedRelation: "lots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_auction_winners_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      auctions: {
        Row: {
          administrative_fee: number | null
          anti_sniper_enabled: boolean | null
          anti_sniper_seconds: number | null
          commission_rate: number | null
          created_at: string
          created_by: string
          deposit_amount: number | null
          description: string | null
          ends_at: string | null
          extension_seconds: number | null
          id: string
          image_url: string | null
          is_highlight: boolean | null
          location: string | null
          require_deposit: boolean | null
          starts_at: string
          status: Database["public"]["Enums"]["auction_status"]
          streaming_active: boolean | null
          streaming_playing: boolean | null
          streaming_url: string | null
          title: string
          type: Database["public"]["Enums"]["auction_type"]
          updated_at: string
        }
        Insert: {
          administrative_fee?: number | null
          anti_sniper_enabled?: boolean | null
          anti_sniper_seconds?: number | null
          commission_rate?: number | null
          created_at?: string
          created_by: string
          deposit_amount?: number | null
          description?: string | null
          ends_at?: string | null
          extension_seconds?: number | null
          id?: string
          image_url?: string | null
          is_highlight?: boolean | null
          location?: string | null
          require_deposit?: boolean | null
          starts_at: string
          status?: Database["public"]["Enums"]["auction_status"]
          streaming_active?: boolean | null
          streaming_playing?: boolean | null
          streaming_url?: string | null
          title: string
          type: Database["public"]["Enums"]["auction_type"]
          updated_at?: string
        }
        Update: {
          administrative_fee?: number | null
          anti_sniper_enabled?: boolean | null
          anti_sniper_seconds?: number | null
          commission_rate?: number | null
          created_at?: string
          created_by?: string
          deposit_amount?: number | null
          description?: string | null
          ends_at?: string | null
          extension_seconds?: number | null
          id?: string
          image_url?: string | null
          is_highlight?: boolean | null
          location?: string | null
          require_deposit?: boolean | null
          starts_at?: string
          status?: Database["public"]["Enums"]["auction_status"]
          streaming_active?: boolean | null
          streaming_playing?: boolean | null
          streaming_url?: string | null
          title?: string
          type?: Database["public"]["Enums"]["auction_type"]
          updated_at?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      auto_bids: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          lot_id: string
          max_amount: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          lot_id: string
          max_amount: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          lot_id?: string
          max_amount?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "auto_bids_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "lots"
            referencedColumns: ["id"]
          },
        ]
      }
      banners: {
        Row: {
          created_at: string
          display_order: number | null
          id: string
          image_url: string
          is_active: boolean | null
          link_url: string | null
          title: string | null
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          id?: string
          image_url: string
          is_active?: boolean | null
          link_url?: string | null
          title?: string | null
        }
        Update: {
          created_at?: string
          display_order?: number | null
          id?: string
          image_url?: string
          is_active?: boolean | null
          link_url?: string | null
          title?: string | null
        }
        Relationships: []
      }
      bid_history: {
        Row: {
          amount: number
          id: string
          lot_id: string
          timestamp: string
          user_id: string
        }
        Insert: {
          amount: number
          id?: string
          lot_id: string
          timestamp?: string
          user_id: string
        }
        Update: {
          amount?: number
          id?: string
          lot_id?: string
          timestamp?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bid_history_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "lots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bid_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bids: {
        Row: {
          amount: number
          bid_source: string | null
          created_at: string
          id: string
          is_automatic: boolean | null
          lot_id: string
          manual_bidder_name: string | null
          manual_bidder_phone: string | null
          user_id: string
        }
        Insert: {
          amount: number
          bid_source?: string | null
          created_at?: string
          id?: string
          is_automatic?: boolean | null
          lot_id: string
          manual_bidder_name?: string | null
          manual_bidder_phone?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          bid_source?: string | null
          created_at?: string
          id?: string
          is_automatic?: boolean | null
          lot_id?: string
          manual_bidder_name?: string | null
          manual_bidder_phone?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bids_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "lots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bids_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          display_order: number | null
          icon: string | null
          id: string
          image_url: string | null
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          icon?: string | null
          id?: string
          image_url?: string | null
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          display_order?: number | null
          icon?: string | null
          id?: string
          image_url?: string | null
          name?: string
          slug?: string
        }
        Relationships: []
      }
      caucao: {
        Row: {
          amount: number
          auction_id: string | null
          confirmed_at: string | null
          created_at: string
          id: string
          is_manual_approval: boolean | null
          is_refunded: boolean | null
          mercadopago_payment_id: string | null
          mercadopago_preference_id: string | null
          proof_url: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          auction_id?: string | null
          confirmed_at?: string | null
          created_at?: string
          id?: string
          is_manual_approval?: boolean | null
          is_refunded?: boolean | null
          mercadopago_payment_id?: string | null
          mercadopago_preference_id?: string | null
          proof_url?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          auction_id?: string | null
          confirmed_at?: string | null
          created_at?: string
          id?: string
          is_manual_approval?: boolean | null
          is_refunded?: boolean | null
          mercadopago_payment_id?: string | null
          mercadopago_preference_id?: string | null
          proof_url?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "caucao_auction_id_fkey"
            columns: ["auction_id"]
            isOneToOne: false
            referencedRelation: "auctions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "caucao_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          auction_id: string | null
          created_at: string
          id: string
          message: string
          recipient_id: string | null
          user_id: string
        }
        Insert: {
          auction_id?: string | null
          created_at?: string
          id?: string
          message: string
          recipient_id?: string | null
          user_id: string
        }
        Update: {
          auction_id?: string | null
          created_at?: string
          id?: string
          message?: string
          recipient_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_auction_id_fkey"
            columns: ["auction_id"]
            isOneToOne: false
            referencedRelation: "auctions"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          contract_url: string | null
          created_at: string
          id: string
          status: string
          updated_at: string
          winner_id: string
        }
        Insert: {
          contract_url?: string | null
          created_at?: string
          id?: string
          status?: string
          updated_at?: string
          winner_id: string
        }
        Update: {
          contract_url?: string | null
          created_at?: string
          id?: string
          status?: string
          updated_at?: string
          winner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: true
            referencedRelation: "auction_winners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: true
            referencedRelation: "winners_public"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          code: string
          created_at: string | null
          discount_percentage: number
          expires_at: string | null
          id: string
          usage_count: number | null
          usage_limit: number | null
        }
        Insert: {
          code: string
          created_at?: string | null
          discount_percentage: number
          expires_at?: string | null
          id?: string
          usage_count?: number | null
          usage_limit?: number | null
        }
        Update: {
          code?: string
          created_at?: string | null
          discount_percentage?: number
          expires_at?: string | null
          id?: string
          usage_count?: number | null
          usage_limit?: number | null
        }
        Relationships: []
      }
      favorites: {
        Row: {
          auction_id: string | null
          created_at: string | null
          id: string
          lot_id: string | null
          user_id: string
        }
        Insert: {
          auction_id?: string | null
          created_at?: string | null
          id?: string
          lot_id?: string | null
          user_id: string
        }
        Update: {
          auction_id?: string | null
          created_at?: string | null
          id?: string
          lot_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_auction_id_fkey"
            columns: ["auction_id"]
            isOneToOne: false
            referencedRelation: "auctions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "lots"
            referencedColumns: ["id"]
          },
        ]
      }
      generated_pdfs: {
        Row: {
          created_at: string
          id: string
          name: string
          type: string
          url: string
          user_id: string
          winner_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          type: string
          url: string
          user_id: string
          winner_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          type?: string
          url?: string
          user_id?: string
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "generated_pdfs_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "auction_winners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_pdfs_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "winners_public"
            referencedColumns: ["id"]
          },
        ]
      }
      home_sections: {
        Row: {
          content: Json | null
          created_at: string | null
          display_order: number
          id: string
          is_active: boolean
          key: string
          name: string
          updated_at: string | null
        }
        Insert: {
          content?: Json | null
          created_at?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          key: string
          name: string
          updated_at?: string | null
        }
        Update: {
          content?: Json | null
          created_at?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          key?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      live_auction_control: {
        Row: {
          auction_id: string
          auctioneer_status: string | null
          auto_restart_timer: boolean | null
          created_at: string
          current_lot_id: string | null
          current_lot_started_at: string | null
          id: string
          is_running: boolean | null
          lot_time_limit_seconds: number | null
          seconds_added_per_bid: number | null
          started_at: string | null
          transition_message: string | null
          updated_at: string
        }
        Insert: {
          auction_id: string
          auctioneer_status?: string | null
          auto_restart_timer?: boolean | null
          created_at?: string
          current_lot_id?: string | null
          current_lot_started_at?: string | null
          id?: string
          is_running?: boolean | null
          lot_time_limit_seconds?: number | null
          seconds_added_per_bid?: number | null
          started_at?: string | null
          transition_message?: string | null
          updated_at?: string
        }
        Update: {
          auction_id?: string
          auctioneer_status?: string | null
          auto_restart_timer?: boolean | null
          created_at?: string
          current_lot_id?: string | null
          current_lot_started_at?: string | null
          id?: string
          is_running?: boolean | null
          lot_time_limit_seconds?: number | null
          seconds_added_per_bid?: number | null
          started_at?: string | null
          transition_message?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_auction_control_auction_id_fkey"
            columns: ["auction_id"]
            isOneToOne: true
            referencedRelation: "auctions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_auction_control_current_lot_id_fkey"
            columns: ["current_lot_id"]
            isOneToOne: false
            referencedRelation: "lots"
            referencedColumns: ["id"]
          },
        ]
      }
      lots: {
        Row: {
          active_until: string | null
          auction_id: string | null
          buyout_enabled: boolean | null
          buyout_price: number | null
          category_id: string | null
          created_at: string
          current_highest_bid: number | null
          description: string | null
          gallery_urls: string[] | null
          hammer_enabled: boolean | null
          id: string
          image_url: string | null
          is_highlight: boolean | null
          lot_order: number | null
          min_increment: number | null
          starting_price: number
          status: Database["public"]["Enums"]["lot_status"]
          title: string
          updated_at: string
        }
        Insert: {
          active_until?: string | null
          auction_id?: string | null
          buyout_enabled?: boolean | null
          buyout_price?: number | null
          category_id?: string | null
          created_at?: string
          current_highest_bid?: number | null
          description?: string | null
          gallery_urls?: string[] | null
          hammer_enabled?: boolean | null
          id?: string
          image_url?: string | null
          is_highlight?: boolean | null
          lot_order?: number | null
          min_increment?: number | null
          starting_price: number
          status?: Database["public"]["Enums"]["lot_status"]
          title: string
          updated_at?: string
        }
        Update: {
          active_until?: string | null
          auction_id?: string | null
          buyout_enabled?: boolean | null
          buyout_price?: number | null
          category_id?: string | null
          created_at?: string
          current_highest_bid?: number | null
          description?: string | null
          gallery_urls?: string[] | null
          hammer_enabled?: boolean | null
          id?: string
          image_url?: string | null
          is_highlight?: boolean | null
          lot_order?: number | null
          min_increment?: number | null
          starting_price?: number
          status?: Database["public"]["Enums"]["lot_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lots_auction_id_fkey"
            columns: ["auction_id"]
            isOneToOne: false
            referencedRelation: "auctions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lots_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          link: string | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          address_number: string | null
          avatar_url: string | null
          cep: string | null
          city: string | null
          complement: string | null
          corporate_name: string | null
          created_at: string
          document: string | null
          full_name: string | null
          id: string
          is_approved: boolean
          is_blocked: boolean
          is_vip: boolean | null
          level: number | null
          neighborhood: string | null
          person_type: string | null
          phone: string | null
          points: number | null
          role: Database["public"]["Enums"]["user_role"]
          state: string | null
          trade_name: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          address_number?: string | null
          avatar_url?: string | null
          cep?: string | null
          city?: string | null
          complement?: string | null
          corporate_name?: string | null
          created_at?: string
          document?: string | null
          full_name?: string | null
          id: string
          is_approved?: boolean
          is_blocked?: boolean
          is_vip?: boolean | null
          level?: number | null
          neighborhood?: string | null
          person_type?: string | null
          phone?: string | null
          points?: number | null
          role?: Database["public"]["Enums"]["user_role"]
          state?: string | null
          trade_name?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          address_number?: string | null
          avatar_url?: string | null
          cep?: string | null
          city?: string | null
          complement?: string | null
          corporate_name?: string | null
          created_at?: string
          document?: string | null
          full_name?: string | null
          id?: string
          is_approved?: boolean
          is_blocked?: boolean
          is_vip?: boolean | null
          level?: number | null
          neighborhood?: string | null
          person_type?: string | null
          phone?: string | null
          points?: number | null
          role?: Database["public"]["Enums"]["user_role"]
          state?: string | null
          trade_name?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      profiles_private: {
        Row: {
          address: string | null
          cashback_balance: number | null
          caucao_balance: number
          cpf_cnpj: string | null
          created_at: string
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          cashback_balance?: number | null
          caucao_balance?: number
          cpf_cnpj?: string | null
          created_at?: string
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          cashback_balance?: number | null
          caucao_balance?: number
          cpf_cnpj?: string | null
          created_at?: string
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_private_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reconciliation_logs: {
        Row: {
          action_taken: string | null
          actual_value: number | null
          auction_id: string | null
          created_by: string | null
          expected_value: number | null
          id: string
          lot_id: string | null
          resolved_at: string | null
        }
        Insert: {
          action_taken?: string | null
          actual_value?: number | null
          auction_id?: string | null
          created_by?: string | null
          expected_value?: number | null
          id?: string
          lot_id?: string | null
          resolved_at?: string | null
        }
        Update: {
          action_taken?: string | null
          actual_value?: number | null
          auction_id?: string | null
          created_by?: string | null
          expected_value?: number | null
          id?: string
          lot_id?: string | null
          resolved_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reconciliation_logs_auction_id_fkey"
            columns: ["auction_id"]
            isOneToOne: false
            referencedRelation: "auctions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reconciliation_logs_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "lots"
            referencedColumns: ["id"]
          },
        ]
      }
      system_logs: {
        Row: {
          context: Json | null
          created_at: string | null
          id: string
          level: string
          message: string
        }
        Insert: {
          context?: Json | null
          created_at?: string | null
          id?: string
          level: string
          message: string
        }
        Update: {
          context?: Json | null
          created_at?: string | null
          id?: string
          level?: string
          message?: string
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          description: string | null
          key: string
          updated_at: string | null
          value: Json | null
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string | null
          value?: Json | null
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string | null
          value?: Json | null
        }
        Relationships: []
      }
      user_documents: {
        Row: {
          created_at: string | null
          id: string
          rejection_reason: string | null
          status: string
          type: string
          updated_at: string | null
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          rejection_reason?: string | null
          status?: string
          type: string
          updated_at?: string | null
          url: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          rejection_reason?: string | null
          status?: string
          type?: string
          updated_at?: string | null
          url?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      profiles_public: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          full_name: string | null
          id: string | null
          is_vip: boolean | null
          level: number | null
          points: number | null
        }
        Relationships: []
      }
      security_health_status: {
        Row: {
          policy_count: number | null
          rls_enabled: boolean | null
          schemaname: unknown
          tablename: unknown
        }
        Relationships: []
      }
      winners_public: {
        Row: {
          created_at: string | null
          final_amount: number | null
          id: string | null
          lot_id: string | null
          lot_image_url: string | null
          lot_title: string | null
          manual_bidder_name: string | null
          user_id: string | null
          winner_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "auction_winners_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: true
            referencedRelation: "lots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_auction_winners_lot"
            columns: ["lot_id"]
            isOneToOne: true
            referencedRelation: "lots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_auction_winners_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      approve_caucao: { Args: { p_caucao_id: string }; Returns: undefined }
      confirm_winner_payment: {
        Args: { p_winner_id: string }
        Returns: undefined
      }
      generate_sales_note: { Args: { p_winner_id: string }; Returns: undefined }
      get_public_profile_data: {
        Args: never
        Returns: {
          avatar_url: string
          created_at: string
          full_name: string
          id: string
          is_vip: boolean
          level: number
          points: number
        }[]
      }
      hammer_lot: { Args: { p_lot_id: string }; Returns: undefined }
      is_admin: { Args: never; Returns: boolean }
      process_auction_winners_v2: {
        Args: { p_auction_id: string }
        Returns: undefined
      }
      process_finished_lots: { Args: never; Returns: undefined }
      reconcile_auction_bids: { Args: { p_auction_id: string }; Returns: Json }
      refund_caucao: {
        Args: { p_lot_id: string; p_user_id: string }
        Returns: undefined
      }
      refund_caucao_v2: { Args: { p_caucao_id: string }; Returns: undefined }
    }
    Enums: {
      auction_status: "draft" | "active" | "closed"
      auction_type: "live" | "simultaneous"
      bid_source_type: "web" | "phone" | "in_person" | "automatic"
      lot_status: "pending" | "active" | "sold" | "unsold" | "cancelled"
      user_role: "admin" | "operator" | "user"
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
      auction_status: ["draft", "active", "closed"],
      auction_type: ["live", "simultaneous"],
      bid_source_type: ["web", "phone", "in_person", "automatic"],
      lot_status: ["pending", "active", "sold", "unsold", "cancelled"],
      user_role: ["admin", "operator", "user"],
    },
  },
} as const
