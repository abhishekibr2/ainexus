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
      Workspaces: {
        Row: {
          id: number
          created_at: string
          name: string
          description: string | null
          members: string[] // UUID array
          owner: string // UUID of creator
        }
        Insert: {
          id?: number
          created_at?: string
          name: string
          description?: string | null
          members?: string[]
          owner: string
        }
        Update: {
          id?: number
          created_at?: string
          name?: string
          description?: string | null
          members?: string[]
          owner?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 