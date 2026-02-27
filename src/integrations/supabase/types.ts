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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      celestial_objects: {
        Row: {
          best_months: string | null
          catalog_id: string
          common_name: string | null
          constellation: string | null
          dec: number | null
          exposure_guide_deep: number | null
          exposure_guide_fast: number | null
          id: string
          ideal_resolution: string | null
          image_search_query: string | null
          magnitude: number | null
          moon_tolerance: number | null
          obj_type: string | null
          photo_score: number | null
          ra: number | null
          recommended_filter: string | null
          size_max: number | null
          surf_brightness: number | null
        }
        Insert: {
          best_months?: string | null
          catalog_id: string
          common_name?: string | null
          constellation?: string | null
          dec?: number | null
          exposure_guide_deep?: number | null
          exposure_guide_fast?: number | null
          id?: string
          ideal_resolution?: string | null
          image_search_query?: string | null
          magnitude?: number | null
          moon_tolerance?: number | null
          obj_type?: string | null
          photo_score?: number | null
          ra?: number | null
          recommended_filter?: string | null
          size_max?: number | null
          surf_brightness?: number | null
        }
        Update: {
          best_months?: string | null
          catalog_id?: string
          common_name?: string | null
          constellation?: string | null
          dec?: number | null
          exposure_guide_deep?: number | null
          exposure_guide_fast?: number | null
          id?: string
          ideal_resolution?: string | null
          image_search_query?: string | null
          magnitude?: number | null
          moon_tolerance?: number | null
          obj_type?: string | null
          photo_score?: number | null
          ra?: number | null
          recommended_filter?: string | null
          size_max?: number | null
          surf_brightness?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          equipment_focal_length: number | null
          experience_level: string | null
          id: string
          latitude: number | null
          longitude: number | null
          pixel_size: number | null
          sensor_height: number | null
          sensor_width: number | null
          username: string | null
        }
        Insert: {
          equipment_focal_length?: number | null
          experience_level?: string | null
          id: string
          latitude?: number | null
          longitude?: number | null
          pixel_size?: number | null
          sensor_height?: number | null
          sensor_width?: number | null
          username?: string | null
        }
        Update: {
          equipment_focal_length?: number | null
          experience_level?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          pixel_size?: number | null
          sensor_height?: number | null
          sensor_width?: number | null
          username?: string | null
        }
        Relationships: []
      }
      user_favorites: {
        Row: {
          created_at: string | null
          id: string
          notes: string | null
          object_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          notes?: string | null
          object_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          notes?: string | null
          object_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_favorites_object_id_fkey"
            columns: ["object_id"]
            isOneToOne: false
            referencedRelation: "celestial_objects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      top_photo_targets: {
        Row: {
          catalog_id: string | null
          common_name: string | null
          constellation: string | null
          magnitude: number | null
          obj_type: string | null
          photo_score: number | null
        }
        Insert: {
          catalog_id?: string | null
          common_name?: string | null
          constellation?: string | null
          magnitude?: number | null
          obj_type?: string | null
          photo_score?: number | null
        }
        Update: {
          catalog_id?: string | null
          common_name?: string | null
          constellation?: string | null
          magnitude?: number | null
          obj_type?: string | null
          photo_score?: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      fuzzy_search_celestial: {
        Args: { search_term: string; similarity_threshold?: number }
        Returns: {
          best_months: string | null
          catalog_id: string
          common_name: string | null
          constellation: string | null
          dec: number | null
          exposure_guide_deep: number | null
          exposure_guide_fast: number | null
          id: string
          ideal_resolution: string | null
          image_search_query: string | null
          magnitude: number | null
          moon_tolerance: number | null
          obj_type: string | null
          photo_score: number | null
          ra: number | null
          recommended_filter: string | null
          size_max: number | null
          surf_brightness: number | null
        }[]
        SetofOptions: {
          from: "*"
          to: "celestial_objects"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
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
  public: {
    Enums: {},
  },
} as const
