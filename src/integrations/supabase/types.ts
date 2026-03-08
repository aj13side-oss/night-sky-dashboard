export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      astro_accessories: {
        Row: {
          aperture_mm: number | null
          brand: string
          category: string
          clear_aperture_mm: number | null
          compatible_telescopes: string[] | null
          created_at: string | null
          filter_size: string | null
          filter_slots: number | null
          focal_length_mm: number | null
          focuser_travel_mm: number | null
          id: number
          image_url: string | null
          input_connection: string | null
          is_motorized: boolean | null
          last_price_update: string | null
          magnification_factor: number | null
          model: string
          notes: string | null
          optical_length_mm: number | null
          output_connection: string | null
          price_agena: number | null
          price_amazon: number | null
          price_astronome_fr: number | null
          price_astroshop_de: number | null
          price_high_point_scientific: number | null
          price_optique_unterlinden: number | null
          price_pierro_astro: number | null
          price_univers_astro: number | null
          required_backfocus_mm: number | null
          updated_at: string | null
          url_agena: string | null
          url_amazon: string | null
          url_astronome_fr: string | null
          url_astroshop_de: string | null
          url_high_point_scientific: string | null
          url_manufacturer: string | null
          url_optique_unterlinden: string | null
          url_pierro_astro: string | null
          url_univers_astro: string | null
          weight_g: number | null
        }
        Insert: {
          aperture_mm?: number | null
          brand: string
          category: string
          clear_aperture_mm?: number | null
          compatible_telescopes?: string[] | null
          created_at?: string | null
          filter_size?: string | null
          filter_slots?: number | null
          focal_length_mm?: number | null
          focuser_travel_mm?: number | null
          id?: number
          image_url?: string | null
          input_connection?: string | null
          is_motorized?: boolean | null
          last_price_update?: string | null
          magnification_factor?: number | null
          model: string
          notes?: string | null
          optical_length_mm?: number | null
          output_connection?: string | null
          price_agena?: number | null
          price_amazon?: number | null
          price_astronome_fr?: number | null
          price_astroshop_de?: number | null
          price_high_point_scientific?: number | null
          price_optique_unterlinden?: number | null
          price_pierro_astro?: number | null
          price_univers_astro?: number | null
          required_backfocus_mm?: number | null
          updated_at?: string | null
          url_agena?: string | null
          url_amazon?: string | null
          url_astronome_fr?: string | null
          url_astroshop_de?: string | null
          url_high_point_scientific?: string | null
          url_manufacturer?: string | null
          url_optique_unterlinden?: string | null
          url_pierro_astro?: string | null
          url_univers_astro?: string | null
          weight_g?: number | null
        }
        Update: {
          aperture_mm?: number | null
          brand?: string
          category?: string
          clear_aperture_mm?: number | null
          compatible_telescopes?: string[] | null
          created_at?: string | null
          filter_size?: string | null
          filter_slots?: number | null
          focal_length_mm?: number | null
          focuser_travel_mm?: number | null
          id?: number
          image_url?: string | null
          input_connection?: string | null
          is_motorized?: boolean | null
          last_price_update?: string | null
          magnification_factor?: number | null
          model?: string
          notes?: string | null
          optical_length_mm?: number | null
          output_connection?: string | null
          price_agena?: number | null
          price_amazon?: number | null
          price_astronome_fr?: number | null
          price_astroshop_de?: number | null
          price_high_point_scientific?: number | null
          price_optique_unterlinden?: number | null
          price_pierro_astro?: number | null
          price_univers_astro?: number | null
          required_backfocus_mm?: number | null
          updated_at?: string | null
          url_agena?: string | null
          url_amazon?: string | null
          url_astronome_fr?: string | null
          url_astroshop_de?: string | null
          url_high_point_scientific?: string | null
          url_manufacturer?: string | null
          url_optique_unterlinden?: string | null
          url_pierro_astro?: string | null
          url_univers_astro?: string | null
          weight_g?: number | null
        }
        Relationships: []
      }
      astro_cameras: {
        Row: {
          adc_bits: number | null
          brand: string
          cooling_delta_c: number | null
          full_well_e: number | null
          id: string
          image_url: string | null
          interface_usb: string | null
          internal_backfocus_mm: number | null
          is_color: boolean | null
          last_price_update: string | null
          model: string
          pixel_size_um: number | null
          price_agena: number | null
          price_amazon: number | null
          price_astronome_fr: number | null
          price_astroshop_de: number | null
          price_high_point_scientific: number | null
          price_optique_unterlinden: number | null
          price_pierro_astro: number | null
          price_univers_astro: number | null
          qe_percent: number | null
          read_noise_e: number | null
          resolution_mp: number | null
          sensor_height_mm: number | null
          sensor_name: string | null
          sensor_width_mm: number | null
          url_agena: string | null
          url_amazon: string | null
          url_astronome_fr: string | null
          url_astroshop_de: string | null
          url_high_point_scientific: string | null
          url_manufacturer: string | null
          url_optique_unterlinden: string | null
          url_pierro_astro: string | null
          url_univers_astro: string | null
          weight_g: number | null
        }
        Insert: {
          adc_bits?: number | null
          brand: string
          cooling_delta_c?: number | null
          full_well_e?: number | null
          id?: string
          image_url?: string | null
          interface_usb?: string | null
          internal_backfocus_mm?: number | null
          is_color?: boolean | null
          last_price_update?: string | null
          model: string
          pixel_size_um?: number | null
          price_agena?: number | null
          price_amazon?: number | null
          price_astronome_fr?: number | null
          price_astroshop_de?: number | null
          price_high_point_scientific?: number | null
          price_optique_unterlinden?: number | null
          price_pierro_astro?: number | null
          price_univers_astro?: number | null
          qe_percent?: number | null
          read_noise_e?: number | null
          resolution_mp?: number | null
          sensor_height_mm?: number | null
          sensor_name?: string | null
          sensor_width_mm?: number | null
          url_agena?: string | null
          url_amazon?: string | null
          url_astronome_fr?: string | null
          url_astroshop_de?: string | null
          url_high_point_scientific?: string | null
          url_manufacturer?: string | null
          url_optique_unterlinden?: string | null
          url_pierro_astro?: string | null
          url_univers_astro?: string | null
          weight_g?: number | null
        }
        Update: {
          adc_bits?: number | null
          brand?: string
          cooling_delta_c?: number | null
          full_well_e?: number | null
          id?: string
          image_url?: string | null
          interface_usb?: string | null
          internal_backfocus_mm?: number | null
          is_color?: boolean | null
          last_price_update?: string | null
          model?: string
          pixel_size_um?: number | null
          price_agena?: number | null
          price_amazon?: number | null
          price_astronome_fr?: number | null
          price_astroshop_de?: number | null
          price_high_point_scientific?: number | null
          price_optique_unterlinden?: number | null
          price_pierro_astro?: number | null
          price_univers_astro?: number | null
          qe_percent?: number | null
          read_noise_e?: number | null
          resolution_mp?: number | null
          sensor_height_mm?: number | null
          sensor_name?: string | null
          sensor_width_mm?: number | null
          url_agena?: string | null
          url_amazon?: string | null
          url_astronome_fr?: string | null
          url_astroshop_de?: string | null
          url_high_point_scientific?: string | null
          url_manufacturer?: string | null
          url_optique_unterlinden?: string | null
          url_pierro_astro?: string | null
          url_univers_astro?: string | null
          weight_g?: number | null
        }
        Relationships: []
      }
      astro_filters: {
        Row: {
          bandwidth_nm: number | null
          brand: string
          id: string
          image_url: string | null
          last_price_update: string | null
          model: string
          price_agena: number | null
          price_amazon: number | null
          price_astronome_fr: number | null
          price_astroshop_de: number | null
          price_high_point_scientific: number | null
          price_optique_unterlinden: number | null
          price_pierro_astro: number | null
          price_univers_astro: number | null
          size: string | null
          target_sensor: string | null
          thickness_mm: number | null
          transmission_percent: number | null
          type: string | null
          url_agena: string | null
          url_amazon: string | null
          url_astronome_fr: string | null
          url_astroshop_de: string | null
          url_high_point_scientific: string | null
          url_manufacturer: string | null
          url_optique_unterlinden: string | null
          url_pierro_astro: string | null
          url_univers_astro: string | null
        }
        Insert: {
          bandwidth_nm?: number | null
          brand: string
          id?: string
          image_url?: string | null
          last_price_update?: string | null
          model: string
          price_agena?: number | null
          price_amazon?: number | null
          price_astronome_fr?: number | null
          price_astroshop_de?: number | null
          price_high_point_scientific?: number | null
          price_optique_unterlinden?: number | null
          price_pierro_astro?: number | null
          price_univers_astro?: number | null
          size?: string | null
          target_sensor?: string | null
          thickness_mm?: number | null
          transmission_percent?: number | null
          type?: string | null
          url_agena?: string | null
          url_amazon?: string | null
          url_astronome_fr?: string | null
          url_astroshop_de?: string | null
          url_high_point_scientific?: string | null
          url_manufacturer?: string | null
          url_optique_unterlinden?: string | null
          url_pierro_astro?: string | null
          url_univers_astro?: string | null
        }
        Update: {
          bandwidth_nm?: number | null
          brand?: string
          id?: string
          image_url?: string | null
          last_price_update?: string | null
          model?: string
          price_agena?: number | null
          price_amazon?: number | null
          price_astronome_fr?: number | null
          price_astroshop_de?: number | null
          price_high_point_scientific?: number | null
          price_optique_unterlinden?: number | null
          price_pierro_astro?: number | null
          price_univers_astro?: number | null
          size?: string | null
          target_sensor?: string | null
          thickness_mm?: number | null
          transmission_percent?: number | null
          type?: string | null
          url_agena?: string | null
          url_amazon?: string | null
          url_astronome_fr?: string | null
          url_astroshop_de?: string | null
          url_high_point_scientific?: string | null
          url_manufacturer?: string | null
          url_optique_unterlinden?: string | null
          url_pierro_astro?: string | null
          url_univers_astro?: string | null
        }
        Relationships: []
      }
      astro_mounts: {
        Row: {
          ascom_indi: boolean | null
          brand: string
          connectivity: string | null
          id: string
          image_url: string | null
          is_goto: boolean | null
          last_price_update: string | null
          model: string
          mount_type: string | null
          mount_weight_kg: number | null
          payload_kg: number | null
          periodic_error_arcsec: number | null
          power_required: string | null
          price_agena: number | null
          price_amazon: number | null
          price_astronome_fr: number | null
          price_astroshop_de: number | null
          price_high_point_scientific: number | null
          price_optique_unterlinden: number | null
          price_pierro_astro: number | null
          price_univers_astro: number | null
          url_agena: string | null
          url_amazon: string | null
          url_astronome_fr: string | null
          url_astroshop_de: string | null
          url_high_point_scientific: string | null
          url_manufacturer: string | null
          url_optique_unterlinden: string | null
          url_pierro_astro: string | null
          url_univers_astro: string | null
        }
        Insert: {
          ascom_indi?: boolean | null
          brand: string
          connectivity?: string | null
          id?: string
          image_url?: string | null
          is_goto?: boolean | null
          last_price_update?: string | null
          model: string
          mount_type?: string | null
          mount_weight_kg?: number | null
          payload_kg?: number | null
          periodic_error_arcsec?: number | null
          power_required?: string | null
          price_agena?: number | null
          price_amazon?: number | null
          price_astronome_fr?: number | null
          price_astroshop_de?: number | null
          price_high_point_scientific?: number | null
          price_optique_unterlinden?: number | null
          price_pierro_astro?: number | null
          price_univers_astro?: number | null
          url_agena?: string | null
          url_amazon?: string | null
          url_astronome_fr?: string | null
          url_astroshop_de?: string | null
          url_high_point_scientific?: string | null
          url_manufacturer?: string | null
          url_optique_unterlinden?: string | null
          url_pierro_astro?: string | null
          url_univers_astro?: string | null
        }
        Update: {
          ascom_indi?: boolean | null
          brand?: string
          connectivity?: string | null
          id?: string
          image_url?: string | null
          is_goto?: boolean | null
          last_price_update?: string | null
          model?: string
          mount_type?: string | null
          mount_weight_kg?: number | null
          payload_kg?: number | null
          periodic_error_arcsec?: number | null
          power_required?: string | null
          price_agena?: number | null
          price_amazon?: number | null
          price_astronome_fr?: number | null
          price_astroshop_de?: number | null
          price_high_point_scientific?: number | null
          price_optique_unterlinden?: number | null
          price_pierro_astro?: number | null
          price_univers_astro?: number | null
          url_agena?: string | null
          url_amazon?: string | null
          url_astronome_fr?: string | null
          url_astroshop_de?: string | null
          url_high_point_scientific?: string | null
          url_manufacturer?: string | null
          url_optique_unterlinden?: string | null
          url_pierro_astro?: string | null
          url_univers_astro?: string | null
        }
        Relationships: []
      }
      astro_telescopes: {
        Row: {
          aperture_mm: number | null
          brand: string
          dovetail_type: string | null
          f_ratio: number | null
          focal_length_mm: number | null
          focuser_size_inch: number | null
          id: string
          image_circle_mm: number | null
          image_url: string | null
          last_price_update: string | null
          model: string
          output_thread: string | null
          price_agena: number | null
          price_amazon: number | null
          price_astronome_fr: number | null
          price_astroshop_de: number | null
          price_high_point_scientific: number | null
          price_optique_unterlinden: number | null
          price_pierro_astro: number | null
          price_univers_astro: number | null
          required_backfocus_mm: number | null
          type: string | null
          url_agena: string | null
          url_amazon: string | null
          url_astronome_fr: string | null
          url_astroshop_de: string | null
          url_high_point_scientific: string | null
          url_manufacturer: string | null
          url_optique_unterlinden: string | null
          url_pierro_astro: string | null
          url_univers_astro: string | null
          weight_kg: number | null
        }
        Insert: {
          aperture_mm?: number | null
          brand: string
          dovetail_type?: string | null
          f_ratio?: number | null
          focal_length_mm?: number | null
          focuser_size_inch?: number | null
          id?: string
          image_circle_mm?: number | null
          image_url?: string | null
          last_price_update?: string | null
          model: string
          output_thread?: string | null
          price_agena?: number | null
          price_amazon?: number | null
          price_astronome_fr?: number | null
          price_astroshop_de?: number | null
          price_high_point_scientific?: number | null
          price_optique_unterlinden?: number | null
          price_pierro_astro?: number | null
          price_univers_astro?: number | null
          required_backfocus_mm?: number | null
          type?: string | null
          url_agena?: string | null
          url_amazon?: string | null
          url_astronome_fr?: string | null
          url_astroshop_de?: string | null
          url_high_point_scientific?: string | null
          url_manufacturer?: string | null
          url_optique_unterlinden?: string | null
          url_pierro_astro?: string | null
          url_univers_astro?: string | null
          weight_kg?: number | null
        }
        Update: {
          aperture_mm?: number | null
          brand?: string
          dovetail_type?: string | null
          f_ratio?: number | null
          focal_length_mm?: number | null
          focuser_size_inch?: number | null
          id?: string
          image_circle_mm?: number | null
          image_url?: string | null
          last_price_update?: string | null
          model?: string
          output_thread?: string | null
          price_agena?: number | null
          price_amazon?: number | null
          price_astronome_fr?: number | null
          price_astroshop_de?: number | null
          price_high_point_scientific?: number | null
          price_optique_unterlinden?: number | null
          price_pierro_astro?: number | null
          price_univers_astro?: number | null
          required_backfocus_mm?: number | null
          type?: string | null
          url_agena?: string | null
          url_amazon?: string | null
          url_astronome_fr?: string | null
          url_astroshop_de?: string | null
          url_high_point_scientific?: string | null
          url_manufacturer?: string | null
          url_optique_unterlinden?: string | null
          url_pierro_astro?: string | null
          url_univers_astro?: string | null
          weight_kg?: number | null
        }
        Relationships: []
      }
      celestial_objects: {
        Row: {
          best_months: string | null
          catalog_id: string
          common_name: string | null
          constellation: string | null
          dec: number | null
          exposure_guide_deep: number | null
          exposure_guide_fast: number | null
          forced_image_url: string | null
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
          forced_image_url?: string | null
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
          forced_image_url?: string | null
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
      price_scrape_log: {
        Row: {
          completed_at: string | null
          details: Json | null
          id: number
          started_at: string | null
          status: string | null
          total_failed: number | null
          total_updated: number | null
          triggered_by: string | null
        }
        Insert: {
          completed_at?: string | null
          details?: Json | null
          id?: number
          started_at?: string | null
          status?: string | null
          total_failed?: number | null
          total_updated?: number | null
          triggered_by?: string | null
        }
        Update: {
          completed_at?: string | null
          details?: Json | null
          id?: number
          started_at?: string | null
          status?: string | null
          total_failed?: number | null
          total_updated?: number | null
          triggered_by?: string | null
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
      rig_compatibility_rules: {
        Row: {
          created_at: string | null
          description_fr: string | null
          id: number
          is_active: boolean | null
          max_value: number | null
          message_en: string
          message_fr: string
          min_value: number | null
          rule_category: string
          rule_key: string
          severity: string
          unit: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description_fr?: string | null
          id?: number
          is_active?: boolean | null
          max_value?: number | null
          message_en: string
          message_fr: string
          min_value?: number | null
          rule_category: string
          rule_key: string
          severity: string
          unit?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description_fr?: string | null
          id?: number
          is_active?: boolean | null
          max_value?: number | null
          message_en?: string
          message_fr?: string
          min_value?: number | null
          rule_category?: string
          rule_key?: string
          severity?: string
          unit?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      rig_presets: {
        Row: {
          accessory_ids: string[] | null
          budget_max_eur: number | null
          budget_min_eur: number | null
          camera_id: string | null
          created_at: string | null
          description_en: string | null
          description_fr: string
          difficulty_level: number | null
          id: string
          is_featured: boolean | null
          mount_id: string | null
          name: string
          slug: string
          sort_order: number | null
          telescope_id: string | null
          updated_at: string | null
          use_case: string
        }
        Insert: {
          accessory_ids?: string[] | null
          budget_max_eur?: number | null
          budget_min_eur?: number | null
          camera_id?: string | null
          created_at?: string | null
          description_en?: string | null
          description_fr: string
          difficulty_level?: number | null
          id?: string
          is_featured?: boolean | null
          mount_id?: string | null
          name: string
          slug: string
          sort_order?: number | null
          telescope_id?: string | null
          updated_at?: string | null
          use_case: string
        }
        Update: {
          accessory_ids?: string[] | null
          budget_max_eur?: number | null
          budget_min_eur?: number | null
          camera_id?: string | null
          created_at?: string | null
          description_en?: string | null
          description_fr?: string
          difficulty_level?: number | null
          id?: string
          is_featured?: boolean | null
          mount_id?: string | null
          name?: string
          slug?: string
          sort_order?: number | null
          telescope_id?: string | null
          updated_at?: string | null
          use_case?: string
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
        Relationships: []
      }
      user_rigs: {
        Row: {
          accessory_ids: string[] | null
          cached_calculations: Json | null
          camera_id: string | null
          created_at: string | null
          filter_ids: string[] | null
          id: string
          is_current: boolean | null
          mount_id: string | null
          name: string
          notes: string | null
          telescope_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          accessory_ids?: string[] | null
          cached_calculations?: Json | null
          camera_id?: string | null
          created_at?: string | null
          filter_ids?: string[] | null
          id?: string
          is_current?: boolean | null
          mount_id?: string | null
          name?: string
          notes?: string | null
          telescope_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          accessory_ids?: string[] | null
          cached_calculations?: Json | null
          camera_id?: string | null
          created_at?: string | null
          filter_ids?: string[] | null
          id?: string
          is_current?: boolean | null
          mount_id?: string | null
          name?: string
          notes?: string | null
          telescope_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      rig_camera_specs: {
        Row: {
          brand: string | null
          cooling_delta_c: number | null
          full_well_e: number | null
          id: string | null
          is_color: boolean | null
          model: string | null
          pixel_size_um: number | null
          qe_percent: number | null
          read_noise_e: number | null
          resolution_mp: number | null
          sensor_area_mm2: number | null
          sensor_diagonal_mm: number | null
          sensor_height_mm: number | null
          sensor_name: string | null
          sensor_width_mm: number | null
          weight_g: number | null
        }
        Relationships: []
      }
      rig_telescope_specs: {
        Row: {
          aperture_mm: number | null
          brand: string | null
          dawes_limit_arcsec: number | null
          f_ratio: number | null
          focal_length_mm: number | null
          id: string | null
          image_circle_mm: number | null
          model: string | null
          required_backfocus_mm: number | null
          type: string | null
          weight_kg: number | null
        }
        Relationships: []
      }
      top_photo_targets: {
        Row: {
          catalog_id: string | null
          common_name: string | null
          constellation: string | null
          magnitude: number | null
          obj_type: string | null
          photo_score: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_rig_compatibility: {
        Args: {
          p_accessory_ids?: string[]
          p_camera_id: string
          p_mount_id: string
          p_telescope_id: string
        }
        Returns: Json
      }
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
          forced_image_url: string | null
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
      }
      trigger_image_fetch: { Args: never; Returns: undefined }
      trigger_price_scrape: { Args: never; Returns: undefined }
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
