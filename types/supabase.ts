export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          role: 'explorer' | 'merchant' | null
          trial_end_date: string | null
          is_premium: boolean | null
        }
        Insert: {
          id: string
          full_name?: string | null
          role?: 'explorer' | 'merchant' | null
          trial_end_date?: string | null
          is_premium?: boolean | null
        }
        Update: {
          id?: string
          full_name?: string | null
          role?: 'explorer' | 'merchant' | null
          trial_end_date?: string | null
          is_premium?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      locations: {
        Row: {
          id: string
          owner_id: string | null
          title: string | null
          description: string | null
          category: string | null
          address: string | null
          cities: string[] | null
          location_point: unknown | null // Depending on PostGIS structure, often queried as GeoJSON or WKT
          images_urls: string[] | null
          is_published: boolean | null
          views_count: number | null
          likes_count: number | null
          created_at: string | null
          phone: string | null
          website: string | null
          instagram: string | null
          facebook: string | null
        }
        Insert: {
          id?: string
          owner_id?: string | null
          title?: string | null
          description?: string | null
          category?: string | null
          address?: string | null
          cities?: string[] | null
          location_point?: unknown | null
          images_urls?: string[] | null
          is_published?: boolean | null
          views_count?: number | null
          likes_count?: number | null
          created_at?: string | null
          phone?: string | null
          website?: string | null
          instagram?: string | null
          facebook?: string | null
        }
        Update: {
          id?: string
          owner_id?: string | null
          title?: string | null
          description?: string | null
          category?: string | null
          address?: string | null
          cities?: string[] | null
          location_point?: unknown | null
          images_urls?: string[] | null
          is_published?: boolean | null
          views_count?: number | null
          likes_count?: number | null
          created_at?: string | null
          phone?: string | null
          website?: string | null
          instagram?: string | null
          facebook?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "locations_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      planner_items: {
        Row: {
          id: string
          user_id: string | null
          location_id: string | null
          visit_order: number | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          location_id?: string | null
          visit_order?: number | null
        }
        Update: {
          id?: string
          user_id?: string | null
          location_id?: string | null
          visit_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "planner_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planner_items_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_views: {
        Args: {
          location_id: string
        }
        Returns: undefined
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
