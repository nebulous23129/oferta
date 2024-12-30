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
      coupons: {
        Row: {
          id: string
          code: string
          discount: number
          created_at: string
          updated_at: string
          active: boolean
        }
        Insert: {
          id?: string
          code: string
          discount: number
          created_at?: string
          updated_at?: string
          active?: boolean
        }
        Update: {
          id?: string
          code?: string
          discount?: number
          created_at?: string
          updated_at?: string
          active?: boolean
        }
      }
      products: {
        Row: {
          id: number
          product_id: string
          name: string
          display_name: string
          description: string | null
          price: number
          promotional_price: number | null
          status: 'active' | 'inactive' | 'draft'
          page_link: string
          checkout_id: string
          created_at: string
          image_url: string | null
        }
        Insert: {
          id?: number
          product_id: string
          name: string
          display_name: string
          description?: string | null
          price: number
          promotional_price?: number | null
          status?: 'active' | 'inactive' | 'draft'
          page_link: string
          checkout_id: string
          created_at?: string
          image_url?: string | null
        }
        Update: {
          id?: number
          product_id?: string
          name?: string
          display_name?: string
          description?: string | null
          price?: number
          promotional_price?: number | null
          status?: 'active' | 'inactive' | 'draft'
          page_link?: string
          checkout_id?: string
          created_at?: string
          image_url?: string | null
        }
      }
    }
  }
}
