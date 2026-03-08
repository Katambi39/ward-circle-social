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
      comments: {
        Row: {
          content: string
          created_at: string
          id: string
          is_anonymous: boolean
          parent_id: string | null
          post_id: string
          updated_at: string
          upvotes: number
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_anonymous?: boolean
          parent_id?: string | null
          post_id: string
          updated_at?: string
          upvotes?: number
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_anonymous?: boolean
          parent_id?: string | null
          post_id?: string
          updated_at?: string
          upvotes?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      connections: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          last_message_at: string
          page_id: string | null
          participant_one: string
          participant_two: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string
          page_id?: string | null
          participant_one: string
          participant_two: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string
          page_id?: string | null
          participant_one?: string
          participant_two?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
      direct_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          is_read: boolean
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "direct_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      event_rsvps: {
        Row: {
          created_at: string
          event_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_rsvps_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "page_events"
            referencedColumns: ["id"]
          },
        ]
      }
      group_members: {
        Row: {
          group_id: string
          id: string
          joined_at: string
          role: Database["public"]["Enums"]["group_member_role"]
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string
          role?: Database["public"]["Enums"]["group_member_role"]
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string
          role?: Database["public"]["Enums"]["group_member_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          avatar_url: string | null
          banner_url: string | null
          county: string | null
          created_at: string
          created_by: string
          description: string | null
          group_type: Database["public"]["Enums"]["group_type"]
          id: string
          is_locality_restricted: boolean
          is_verified: boolean
          location: string | null
          member_count: number
          name: string
          slug: string
          updated_at: string
          ward: string | null
        }
        Insert: {
          avatar_url?: string | null
          banner_url?: string | null
          county?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          group_type?: Database["public"]["Enums"]["group_type"]
          id?: string
          is_locality_restricted?: boolean
          is_verified?: boolean
          location?: string | null
          member_count?: number
          name: string
          slug: string
          updated_at?: string
          ward?: string | null
        }
        Update: {
          avatar_url?: string | null
          banner_url?: string | null
          county?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          group_type?: Database["public"]["Enums"]["group_type"]
          id?: string
          is_locality_restricted?: boolean
          is_verified?: boolean
          location?: string | null
          member_count?: number
          name?: string
          slug?: string
          updated_at?: string
          ward?: string | null
        }
        Relationships: []
      }
      listing_favorites: {
        Row: {
          created_at: string
          id: string
          listing_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_favorites_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_reviews: {
        Row: {
          buyer_id: string
          content: string | null
          created_at: string
          id: string
          listing_id: string
          rating: number
          seller_id: string
        }
        Insert: {
          buyer_id: string
          content?: string | null
          created_at?: string
          id?: string
          listing_id: string
          rating?: number
          seller_id: string
        }
        Update: {
          buyer_id?: string
          content?: string | null
          created_at?: string
          id?: string
          listing_id?: string
          rating?: number
          seller_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_reviews_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          category: Database["public"]["Enums"]["listing_category"]
          condition: string | null
          constituency: string | null
          county: string | null
          created_at: string
          currency: string
          description: string | null
          id: string
          images: string[] | null
          is_negotiable: boolean
          location: string | null
          price: number
          seller_id: string
          status: Database["public"]["Enums"]["listing_status"]
          title: string
          updated_at: string
          view_count: number
        }
        Insert: {
          category?: Database["public"]["Enums"]["listing_category"]
          condition?: string | null
          constituency?: string | null
          county?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          images?: string[] | null
          is_negotiable?: boolean
          location?: string | null
          price?: number
          seller_id: string
          status?: Database["public"]["Enums"]["listing_status"]
          title: string
          updated_at?: string
          view_count?: number
        }
        Update: {
          category?: Database["public"]["Enums"]["listing_category"]
          condition?: string | null
          constituency?: string | null
          county?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          images?: string[] | null
          is_negotiable?: boolean
          location?: string | null
          price?: number
          seller_id?: string
          status?: Database["public"]["Enums"]["listing_status"]
          title?: string
          updated_at?: string
          view_count?: number
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          metadata: Json | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          metadata?: Json | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          metadata?: Json | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      page_events: {
        Row: {
          created_at: string
          description: string | null
          event_date: string
          id: string
          is_virtual: boolean
          location: string | null
          page_id: string
          rsvp_count: number
          title: string
          virtual_link: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_date: string
          id?: string
          is_virtual?: boolean
          location?: string | null
          page_id: string
          rsvp_count?: number
          title: string
          virtual_link?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          event_date?: string
          id?: string
          is_virtual?: boolean
          location?: string | null
          page_id?: string
          rsvp_count?: number
          title?: string
          virtual_link?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "page_events_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
      page_followers: {
        Row: {
          created_at: string
          id: string
          page_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          page_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          page_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "page_followers_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
      page_polls: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          options: Json
          page_id: string
          question: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          options?: Json
          page_id: string
          question: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          options?: Json
          page_id?: string
          question?: string
        }
        Relationships: [
          {
            foreignKeyName: "page_polls_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
      page_reviews: {
        Row: {
          content: string | null
          created_at: string
          id: string
          page_id: string
          rating: number
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          page_id: string
          rating?: number
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          page_id?: string
          rating?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "page_reviews_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
      page_views: {
        Row: {
          id: string
          page_id: string
          referrer: string | null
          viewed_at: string
          viewer_id: string | null
        }
        Insert: {
          id?: string
          page_id: string
          referrer?: string | null
          viewed_at?: string
          viewer_id?: string | null
        }
        Update: {
          id?: string
          page_id?: string
          referrer?: string | null
          viewed_at?: string
          viewer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "page_views_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
      pages: {
        Row: {
          avatar_url: string | null
          category: string
          constituency: string | null
          county: string | null
          cover_url: string | null
          created_at: string
          description: string | null
          follower_count: number
          id: string
          is_verified: boolean
          name: string
          owner_id: string
          phone: string | null
          slug: string
          updated_at: string
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          category?: string
          constituency?: string | null
          county?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          follower_count?: number
          id?: string
          is_verified?: boolean
          name: string
          owner_id: string
          phone?: string | null
          slug: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          category?: string
          constituency?: string | null
          county?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          follower_count?: number
          id?: string
          is_verified?: boolean
          name?: string
          owner_id?: string
          phone?: string | null
          slug?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      poll_votes: {
        Row: {
          created_at: string
          id: string
          option_index: number
          poll_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          option_index: number
          poll_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          option_index?: number
          poll_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "poll_votes_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "page_polls"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          comment_count: number
          content: string | null
          created_at: string
          downvotes: number
          group_id: string | null
          id: string
          image_url: string | null
          is_anonymous: boolean
          link_url: string | null
          share_count: number
          title: string
          updated_at: string
          upvotes: number
          user_id: string
        }
        Insert: {
          comment_count?: number
          content?: string | null
          created_at?: string
          downvotes?: number
          group_id?: string | null
          id?: string
          image_url?: string | null
          is_anonymous?: boolean
          link_url?: string | null
          share_count?: number
          title: string
          updated_at?: string
          upvotes?: number
          user_id: string
        }
        Update: {
          comment_count?: number
          content?: string | null
          created_at?: string
          downvotes?: number
          group_id?: string | null
          id?: string
          image_url?: string | null
          is_anonymous?: boolean
          link_url?: string | null
          share_count?: number
          title?: string
          updated_at?: string
          upvotes?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          county: string | null
          cover_url: string | null
          created_at: string
          display_name: string
          id: string
          is_anonymous_account: boolean
          location: string | null
          national_id_hash: string | null
          phone_number: string | null
          updated_at: string
          user_id: string
          username: string
          verification_status: Database["public"]["Enums"]["verification_status"]
          ward: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          county?: string | null
          cover_url?: string | null
          created_at?: string
          display_name: string
          id?: string
          is_anonymous_account?: boolean
          location?: string | null
          national_id_hash?: string | null
          phone_number?: string | null
          updated_at?: string
          user_id: string
          username: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
          ward?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          county?: string | null
          cover_url?: string | null
          created_at?: string
          display_name?: string
          id?: string
          is_anonymous_account?: boolean
          location?: string | null
          national_id_hash?: string | null
          phone_number?: string | null
          updated_at?: string
          user_id?: string
          username?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
          ward?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          counterparty_id: string | null
          created_at: string
          description: string | null
          id: string
          listing_id: string | null
          status: Database["public"]["Enums"]["transaction_status"]
          type: Database["public"]["Enums"]["transaction_type"]
          user_id: string
        }
        Insert: {
          amount: number
          counterparty_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          listing_id?: string | null
          status?: Database["public"]["Enums"]["transaction_status"]
          type: Database["public"]["Enums"]["transaction_type"]
          user_id: string
        }
        Update: {
          amount?: number
          counterparty_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          listing_id?: string | null
          status?: Database["public"]["Enums"]["transaction_status"]
          type?: Database["public"]["Enums"]["transaction_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          id: string
          settings: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          settings?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          settings?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      votes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
          vote_type: number
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
          vote_type: number
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
          vote_type?: number
        }
        Relationships: [
          {
            foreignKeyName: "votes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      wallets: {
        Row: {
          balance: number
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_conversation_participant: {
        Args: { _conversation_id: string; _user_id: string }
        Returns: boolean
      }
      process_purchase: {
        Args: {
          _amount: number
          _buyer_id: string
          _listing_id: string
          _seller_id: string
        }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      group_member_role: "member" | "moderator" | "admin"
      group_type:
        | "ward"
        | "location"
        | "county"
        | "community"
        | "interest"
        | "page"
      listing_category: "products" | "services" | "digital" | "property"
      listing_status: "active" | "sold" | "paused" | "removed"
      transaction_status: "pending" | "completed" | "failed" | "refunded"
      transaction_type:
        | "deposit"
        | "withdrawal"
        | "purchase"
        | "sale"
        | "refund"
      verification_status: "unverified" | "pending" | "verified" | "rejected"
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
      app_role: ["admin", "moderator", "user"],
      group_member_role: ["member", "moderator", "admin"],
      group_type: [
        "ward",
        "location",
        "county",
        "community",
        "interest",
        "page",
      ],
      listing_category: ["products", "services", "digital", "property"],
      listing_status: ["active", "sold", "paused", "removed"],
      transaction_status: ["pending", "completed", "failed", "refunded"],
      transaction_type: ["deposit", "withdrawal", "purchase", "sale", "refund"],
      verification_status: ["unverified", "pending", "verified", "rejected"],
    },
  },
} as const
