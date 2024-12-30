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
    }
  }
}
