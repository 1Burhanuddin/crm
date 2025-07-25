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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      bills: {
        Row: {
          bill_date: string
          created_at: string
          customer_name: string
          customer_phone: string | null
          id: string
          items: Json
          total: number
          user_id: string | null
        }
        Insert: {
          bill_date?: string
          created_at?: string
          customer_name: string
          customer_phone?: string | null
          id?: string
          items: Json
          total: number
          user_id?: string | null
        }
        Update: {
          bill_date?: string
          created_at?: string
          customer_name?: string
          customer_phone?: string | null
          id?: string
          items?: Json
          total?: number
          user_id?: string | null
        }
        Relationships: []
      }
      collections: {
        Row: {
          amount: number
          collected_at: string | null
          collection_date: string | null
          customer_id: string
          id: string
          order_id: string | null
          remarks: string | null
          transaction_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          collected_at?: string | null
          collection_date?: string | null
          customer_id: string
          id?: string
          order_id?: string | null
          remarks?: string | null
          transaction_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          collected_at?: string | null
          collection_date?: string | null
          customer_id?: string
          id?: string
          order_id?: string | null
          remarks?: string | null
          transaction_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_collections_customer"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_collection_preferences: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          preferred_collection_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          preferred_collection_date: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          preferred_collection_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          created_at: string | null
          id: string
          name: string
          phone: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          phone: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          phone?: string
          user_id?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          advance_amount: number
          assigned_to: string | null
          created_at: string
          customer_id: string
          id: string
          job_date: string
          photo_url: string | null
          products: Json
          remarks: string | null
          site_address: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          advance_amount?: number
          assigned_to?: string | null
          created_at?: string
          customer_id: string
          id?: string
          job_date?: string
          photo_url?: string | null
          products?: Json
          remarks?: string | null
          site_address?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          advance_amount?: number
          assigned_to?: string | null
          created_at?: string
          customer_id?: string
          id?: string
          job_date?: string
          photo_url?: string | null
          products?: Json
          remarks?: string | null
          site_address?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          created_at: string
          id: string
          name: string
          price: number
          unit: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          price: number
          unit: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          price?: number
          unit?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string | null
          pin_hash: string | null
          profile_image_url: string | null
          shop_name: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          name?: string | null
          pin_hash?: string | null
          profile_image_url?: string | null
          shop_name?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string | null
          pin_hash?: string | null
          profile_image_url?: string | null
          shop_name?: string | null
        }
        Relationships: []
      }
      quotations: {
        Row: {
          assigned_to: string
          converted_to_order: boolean
          created_at: string
          customer_id: string
          id: string
          job_date: string
          product_id: string
          qty: number
          remarks: string | null
          site_address: string | null
          status: string
          terms: string | null
          updated_at: string
          user_id: string
          valid_until: string | null
        }
        Insert: {
          assigned_to: string
          converted_to_order?: boolean
          created_at?: string
          customer_id: string
          id?: string
          job_date: string
          product_id: string
          qty: number
          remarks?: string | null
          site_address?: string | null
          status?: string
          terms?: string | null
          updated_at?: string
          user_id: string
          valid_until?: string | null
        }
        Update: {
          assigned_to?: string
          converted_to_order?: boolean
          created_at?: string
          customer_id?: string
          id?: string
          job_date?: string
          product_id?: string
          qty?: number
          remarks?: string | null
          site_address?: string | null
          status?: string
          terms?: string | null
          updated_at?: string
          user_id?: string
          valid_until?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          collection_id: string | null
          created_at: string | null
          customer_id: string
          date: string
          id: string
          note: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          collection_id?: string | null
          created_at?: string | null
          customer_id: string
          date?: string
          id?: string
          note?: string | null
          type: string
          user_id?: string
        }
        Update: {
          amount?: number
          collection_id?: string | null
          created_at?: string | null
          customer_id?: string
          date?: string
          id?: string
          note?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_user_permanently: {
        Args: { user_id_to_delete: string }
        Returns: boolean
      }
      get_all_users: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          email: string
          created_at: string
          last_sign_in_at: string
          email_confirmed_at: string
        }[]
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
