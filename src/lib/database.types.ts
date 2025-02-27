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
          email: string
          name: string | null
          created_at: string
        }
        Insert: {
          id: string
          email: string
          name?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          created_at?: string
        }
      }
      clients: {
        Row: {
          id: string
          name: string
          phone: string | null
          created_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          name: string
          phone?: string | null
          created_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          name?: string
          phone?: string | null
          created_at?: string
          created_by?: string | null
        }
      }
      services: {
        Row: {
          id: string
          name: string
          price: number
          duration: number
          created_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          name: string
          price: number
          duration: number
          created_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          name?: string
          price?: number
          duration?: number
          created_at?: string
          created_by?: string | null
        }
      }
      appointments: {
        Row: {
          id: string
          client_id: string
          start_time: string
          end_time: string
          status: string
          notes: string | null
          created_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          client_id: string
          start_time: string
          end_time: string
          status?: string
          notes?: string | null
          created_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          client_id?: string
          start_time?: string
          end_time?: string
          status?: string
          notes?: string | null
          created_at?: string
          created_by?: string | null
        }
      }
      appointment_services: {
        Row: {
          id: string
          appointment_id: string
          service_id: string
          price: number
        }
        Insert: {
          id?: string
          appointment_id: string
          service_id: string
          price: number
        }
        Update: {
          id?: string
          appointment_id?: string
          service_id?: string
          price?: number
        }
      }
    }
  }
}