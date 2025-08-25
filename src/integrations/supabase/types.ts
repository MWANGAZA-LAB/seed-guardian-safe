export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          user_id: string
          full_name: string | null
          phone_number: string | null
          emergency_contact_email: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          full_name?: string | null
          phone_number?: string | null
          emergency_contact_email?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          full_name?: string | null
          phone_number?: string | null
          emergency_contact_email?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      wallets: {
        Row: {
          id: string
          owner_id: string
          name: string
          encrypted_master_seed: string
          derivation_path: string
          threshold_requirement: number
          total_guardians: number
          wallet_type: 'inheritance' | 'recovery'
          status: 'active' | 'locked' | 'recovering' | 'recovered'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          name: string
          encrypted_master_seed: string
          derivation_path?: string
          threshold_requirement: number
          total_guardians: number
          wallet_type?: 'inheritance' | 'recovery'
          status?: 'active' | 'locked' | 'recovering' | 'recovered'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          name?: string
          encrypted_master_seed?: string
          derivation_path?: string
          threshold_requirement?: number
          total_guardians?: number
          wallet_type?: 'inheritance' | 'recovery'
          status?: 'active' | 'locked' | 'recovering' | 'recovered'
          created_at?: string
          updated_at?: string
        }
      }
      guardians: {
        Row: {
          id: string
          wallet_id: string
          email: string
          full_name: string | null
          phone_number: string | null
          encrypted_secret_share: string
          share_index: number
          public_key: string
          status: 'invited' | 'accepted' | 'declined' | 'revoked'
          invitation_token: string | null
          invitation_expires_at: string | null
          accepted_at: string | null
          last_activity_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          wallet_id: string
          email: string
          full_name?: string | null
          phone_number?: string | null
          encrypted_secret_share: string
          share_index: number
          public_key: string
          status?: 'invited' | 'accepted' | 'declined' | 'revoked'
          invitation_token?: string | null
          invitation_expires_at?: string | null
          accepted_at?: string | null
          last_activity_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          wallet_id?: string
          email?: string
          full_name?: string | null
          phone_number?: string | null
          encrypted_secret_share?: string
          share_index?: number
          public_key?: string
          status?: 'invited' | 'accepted' | 'declined' | 'revoked'
          invitation_token?: string | null
          invitation_expires_at?: string | null
          accepted_at?: string | null
          last_activity_at?: string | null
          created_at?: string
        }
      }
      recovery_attempts: {
        Row: {
          id: string
          wallet_id: string
          initiated_by_guardian_id: string | null
          recovery_reason: string
          required_signatures: number
          current_signatures: number
          status: 'pending' | 'collecting' | 'completed' | 'failed' | 'expired'
          expires_at: string
          completed_at: string | null
          new_owner_email: string | null
          recovery_data: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          wallet_id: string
          initiated_by_guardian_id?: string | null
          recovery_reason: string
          required_signatures: number
          current_signatures?: number
          status?: 'pending' | 'collecting' | 'completed' | 'failed' | 'expired'
          expires_at: string
          completed_at?: string | null
          new_owner_email?: string | null
          recovery_data?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          wallet_id?: string
          initiated_by_guardian_id?: string | null
          recovery_reason?: string
          required_signatures?: number
          current_signatures?: number
          status?: 'pending' | 'collecting' | 'completed' | 'failed' | 'expired'
          expires_at?: string
          completed_at?: string | null
          new_owner_email?: string | null
          recovery_data?: Json | null
          created_at?: string
        }
      }
      recovery_signatures: {
        Row: {
          id: string
          recovery_attempt_id: string
          guardian_id: string
          signature_data: string
          signed_message_hash: string
          signed_at: string
        }
        Insert: {
          id?: string
          recovery_attempt_id: string
          guardian_id: string
          signature_data: string
          signed_message_hash: string
          signed_at?: string
        }
        Update: {
          id?: string
          recovery_attempt_id?: string
          guardian_id?: string
          signature_data?: string
          signed_message_hash?: string
          signed_at?: string
        }
      }
      proof_of_life: {
        Row: {
          id: string
          wallet_id: string
          proof_type: 'manual' | 'biometric' | 'transaction' | 'login'
          proof_data: Json | null
          ip_address: string | null
          user_agent: string | null
          verified_at: string
        }
        Insert: {
          id?: string
          wallet_id: string
          proof_type: 'manual' | 'biometric' | 'transaction' | 'login'
          proof_data?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          verified_at?: string
        }
        Update: {
          id?: string
          wallet_id?: string
          proof_type?: 'manual' | 'biometric' | 'transaction' | 'login'
          proof_data?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          verified_at?: string
        }
      }
      wallet_addresses: {
        Row: {
          id: string
          wallet_id: string
          address: string
          derivation_path: string
          address_type: 'legacy' | 'segwit' | 'native_segwit' | null
          is_change: boolean
          address_index: number
          balance_satoshis: number
          created_at: string
        }
        Insert: {
          id?: string
          wallet_id: string
          address: string
          derivation_path: string
          address_type?: 'legacy' | 'segwit' | 'native_segwit' | null
          is_change?: boolean
          address_index: number
          balance_satoshis?: number
          created_at?: string
        }
        Update: {
          id?: string
          wallet_id?: string
          address?: string
          derivation_path?: string
          address_type?: 'legacy' | 'segwit' | 'native_segwit' | null
          is_change?: boolean
          address_index?: number
          balance_satoshis?: number
          created_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          wallet_id: string
          txid: string
          amount_satoshis: number
          fee_satoshis: number | null
          transaction_type: 'send' | 'receive' | 'recovery' | null
          status: 'pending' | 'confirmed' | 'failed'
          block_height: number | null
          confirmation_count: number
          raw_transaction: string | null
          created_at: string
        }
        Insert: {
          id?: string
          wallet_id: string
          txid: string
          amount_satoshis: number
          fee_satoshis?: number | null
          transaction_type?: 'send' | 'receive' | 'recovery' | null
          status?: 'pending' | 'confirmed' | 'failed'
          block_height?: number | null
          confirmation_count?: number
          raw_transaction?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          wallet_id?: string
          txid?: string
          amount_satoshis?: number
          fee_satoshis?: number | null
          transaction_type?: 'send' | 'receive' | 'recovery' | null
          status?: 'pending' | 'confirmed' | 'failed'
          block_height?: number | null
          confirmation_count?: number
          raw_transaction?: string | null
          created_at?: string
        }
      }
      audit_logs: {
        Row: {
          id: string
          user_id: string | null
          wallet_id: string | null
          action: string
          resource_type: string
          resource_id: string | null
          old_values: Json | null
          new_values: Json | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          wallet_id?: string | null
          action: string
          resource_type: string
          resource_id?: string | null
          old_values?: Json | null
          new_values?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          wallet_id?: string | null
          action?: string
          resource_type?: string
          resource_id?: string | null
          old_values?: Json | null
          new_values?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_recovery_threshold: {
        Args: { recovery_id: string }
        Returns: boolean
      }
      create_audit_log: {
        Args: {
          p_user_id?: string
          p_wallet_id?: string
          p_action: string
          p_resource_type: string
          p_resource_id?: string
          p_old_values?: Json
          p_new_values?: Json
          p_ip_address?: string
          p_user_agent?: string
        }
        Returns: string
      }
      get_wallet_balance: {
        Args: { p_wallet_id: string }
        Returns: number
      }
      hash_sensitive_data: {
        Args: { input_text: string }
        Returns: string
      }
      is_recovery_expired: {
        Args: { p_recovery_id: string }
        Returns: boolean
      }
      update_updated_at_column: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      validate_guardian_threshold: {
        Args: {
          p_wallet_id: string
          p_threshold: number
          p_total_guardians: number
        }
        Returns: boolean
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
