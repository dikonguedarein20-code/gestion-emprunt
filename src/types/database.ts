export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      employees: {
        Row: {
          id: string;
          code: string;
          first_name: string;
          last_name: string;
          email: string;
          phone: string;
          user_id: string | null;
          is_admin: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          first_name: string;
          last_name: string;
          email: string;
          phone: string;
          user_id?: string | null;
          is_admin?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          first_name?: string;
          last_name?: string;
          email?: string;
          phone?: string;
          user_id?: string | null;
          is_admin?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      materials: {
        Row: {
          id: string;
          code: string;
          serial_number: string;
          name: string;
          description: string | null;
          quantity: number;
          available_quantity: number;
          acquisition_date: string;
          status: 'available' | 'borrowed' | 'broken';
          image_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          serial_number: string;
          name: string;
          description?: string | null;
          quantity?: number;
          available_quantity?: number;
          acquisition_date?: string;
          status?: 'available' | 'borrowed' | 'broken';
          image_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          serial_number?: string;
          name?: string;
          description?: string | null;
          quantity?: number;
          available_quantity?: number;
          acquisition_date?: string;
          status?: 'available' | 'borrowed' | 'broken';
          image_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      loans: {
        Row: {
          id: string;
          material_id: string;
          employee_id: string;
          quantity: number;
          borrow_date: string;
          return_date: string | null;
          status: 'pending' | 'approved' | 'rejected' | 'returned';
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          material_id: string;
          employee_id: string;
          quantity?: number;
          borrow_date?: string;
          return_date?: string | null;
          status?: 'pending' | 'approved' | 'rejected' | 'returned';
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          material_id?: string;
          employee_id?: string;
          quantity?: number;
          borrow_date?: string;
          return_date?: string | null;
          status?: 'approved' | 'rejected' | 'returned' | 'pending';
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      breakdowns: {
        Row: {
          id: string;
          material_id: string;
          description: string;
          reported_by: string;
          status: 'reported' | 'in_progress' | 'resolved';
          resolved_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          material_id: string;
          description: string;
          reported_by: string;
          status?: 'reported' | 'in_progress' | 'resolved';
          resolved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          material_id?: string;
          description?: string;
          reported_by?: string;
          status?: 'reported' | 'in_progress' | 'resolved';
          resolved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Enums: {
      material_status: 'available' | 'borrowed' | 'broken';
      loan_status: 'pending' | 'available' | 'rejected' | 'returned';
      breakdown_status: 'reported' | 'in_progress' | 'resolved';
    };
  };
};

export type Employee = Database['public']['Tables']['employees']['Row'];
export type Material = Database['public']['Tables']['materials']['Row'];
export type Loan = Database['public']['Tables']['loans']['Row'];
export type Breakdown = Database['public']['Tables']['breakdowns']['Row'];
