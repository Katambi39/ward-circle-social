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
      ai_conversations: {
        Row: {
          created_at: string
          id: string
          mode: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          mode?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          mode?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          file_name: string | null
          file_type: string | null
          file_url: string | null
          id: string
          role: string
          verification: Json | null
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          file_name?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          role?: string
          verification?: Json | null
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          file_name?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          role?: string
          verification?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      badges: {
        Row: {
          category: string
          criteria: Json
          description: string | null
          icon: string
          id: string
          name: string
        }
        Insert: {
          category?: string
          criteria?: Json
          description?: string | null
          icon?: string
          id?: string
          name: string
        }
        Update: {
          category?: string
          criteria?: Json
          description?: string | null
          icon?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      bookmarks: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookmarks_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
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
          media_url: string | null
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          media_url?: string | null
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          media_url?: string | null
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
      duplicate_id_flags: {
        Row: {
          attempted_user_id: string
          created_at: string
          existing_user_id: string
          id: string
          national_id_hash: string
          notes: string | null
          resolved: boolean
          resolved_at: string | null
          resolved_by: string | null
        }
        Insert: {
          attempted_user_id: string
          created_at?: string
          existing_user_id: string
          id?: string
          national_id_hash: string
          notes?: string | null
          resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
        }
        Update: {
          attempted_user_id?: string
          created_at?: string
          existing_user_id?: string
          id?: string
          national_id_hash?: string
          notes?: string | null
          resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
        }
        Relationships: []
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
      kyc_submissions: {
        Row: {
          id: string
          id_photo_path: string
          national_id_hash: string
          reviewed_at: string | null
          reviewer_id: string | null
          reviewer_notes: string | null
          selfie_path: string
          status: string
          submitted_at: string
          user_id: string
        }
        Insert: {
          id?: string
          id_photo_path: string
          national_id_hash: string
          reviewed_at?: string | null
          reviewer_id?: string | null
          reviewer_notes?: string | null
          selfie_path: string
          status?: string
          submitted_at?: string
          user_id: string
        }
        Update: {
          id?: string
          id_photo_path?: string
          national_id_hash?: string
          reviewed_at?: string | null
          reviewer_id?: string | null
          reviewer_notes?: string | null
          selfie_path?: string
          status?: string
          submitted_at?: string
          user_id?: string
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
      moderation_flags: {
        Row: {
          ai_confidence: number | null
          content_id: string
          content_type: string
          created_at: string
          flagged_text: string | null
          id: string
          reason: string
          reviewed_at: string | null
          reviewed_by: string | null
          severity: string
          status: string
          user_id: string
        }
        Insert: {
          ai_confidence?: number | null
          content_id: string
          content_type: string
          created_at?: string
          flagged_text?: string | null
          id?: string
          reason: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          severity?: string
          status?: string
          user_id: string
        }
        Update: {
          ai_confidence?: number | null
          content_id?: string
          content_type?: string
          created_at?: string
          flagged_text?: string | null
          id?: string
          reason?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          severity?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      music_tracks: {
        Row: {
          artist: string
          audio_url: string
          cover_url: string | null
          created_at: string
          duration_seconds: number
          genre: string
          id: string
          lyrics: Json | null
          title: string
        }
        Insert: {
          artist: string
          audio_url: string
          cover_url?: string | null
          created_at?: string
          duration_seconds?: number
          genre?: string
          id?: string
          lyrics?: Json | null
          title: string
        }
        Update: {
          artist?: string
          audio_url?: string
          cover_url?: string | null
          created_at?: string
          duration_seconds?: number
          genre?: string
          id?: string
          lyrics?: Json | null
          title?: string
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
      post_poll_votes: {
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
            foreignKeyName: "post_poll_votes_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "post_polls"
            referencedColumns: ["id"]
          },
        ]
      }
      post_polls: {
        Row: {
          created_at: string
          id: string
          options: Json
          post_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          options?: Json
          post_id: string
        }
        Update: {
          created_at?: string
          id?: string
          options?: Json
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_polls_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: true
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_reactions: {
        Row: {
          created_at: string
          id: string
          post_id: string
          reaction: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          reaction: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          reaction?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
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
          feeling: string | null
          group_id: string | null
          id: string
          image_url: string | null
          is_anonymous: boolean
          is_pinned: boolean
          link_url: string | null
          moderation_reason: string | null
          moderation_status: string
          page_id: string | null
          repost_comment: string | null
          repost_of: string | null
          share_count: number
          title: string
          updated_at: string
          upvotes: number
          user_id: string
          video_url: string | null
        }
        Insert: {
          comment_count?: number
          content?: string | null
          created_at?: string
          downvotes?: number
          feeling?: string | null
          group_id?: string | null
          id?: string
          image_url?: string | null
          is_anonymous?: boolean
          is_pinned?: boolean
          link_url?: string | null
          moderation_reason?: string | null
          moderation_status?: string
          page_id?: string | null
          repost_comment?: string | null
          repost_of?: string | null
          share_count?: number
          title: string
          updated_at?: string
          upvotes?: number
          user_id: string
          video_url?: string | null
        }
        Update: {
          comment_count?: number
          content?: string | null
          created_at?: string
          downvotes?: number
          feeling?: string | null
          group_id?: string | null
          id?: string
          image_url?: string | null
          is_anonymous?: boolean
          is_pinned?: boolean
          link_url?: string | null
          moderation_reason?: string | null
          moderation_status?: string
          page_id?: string | null
          repost_comment?: string | null
          repost_of?: string | null
          share_count?: number
          title?: string
          updated_at?: string
          upvotes?: number
          user_id?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_repost_of_fkey"
            columns: ["repost_of"]
            isOneToOne: false
            referencedRelation: "posts"
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
      recovery_codes: {
        Row: {
          code: string
          created_at: string
          id: string
          is_used: boolean
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_used?: boolean
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_used?: boolean
          user_id?: string
        }
        Relationships: []
      }
      stories: {
        Row: {
          caption: string | null
          created_at: string
          expires_at: string
          id: string
          lyrics_offset: number | null
          media_type: string
          media_url: string
          music_start_time: number | null
          music_track_id: string | null
          user_id: string
          view_count: number
          visibility: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          lyrics_offset?: number | null
          media_type?: string
          media_url: string
          music_start_time?: number | null
          music_track_id?: string | null
          user_id: string
          view_count?: number
          visibility?: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          lyrics_offset?: number | null
          media_type?: string
          media_url?: string
          music_start_time?: number | null
          music_track_id?: string | null
          user_id?: string
          view_count?: number
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "stories_music_track_id_fkey"
            columns: ["music_track_id"]
            isOneToOne: false
            referencedRelation: "music_tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      story_replies: {
        Row: {
          content: string | null
          created_at: string
          id: string
          reply_type: string
          sender_id: string
          story_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          reply_type?: string
          sender_id: string
          story_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          reply_type?: string
          sender_id?: string
          story_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_replies_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      story_views: {
        Row: {
          id: string
          story_id: string
          viewed_at: string
          viewer_id: string
        }
        Insert: {
          id?: string
          story_id: string
          viewed_at?: string
          viewer_id: string
        }
        Update: {
          id?: string
          story_id?: string
          viewed_at?: string
          viewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_views_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
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
      user_2fa: {
        Row: {
          created_at: string
          id: string
          is_enabled: boolean
          method: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_enabled?: boolean
          method?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_enabled?: boolean
          method?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_id: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
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
      webauthn_credentials: {
        Row: {
          counter: number
          created_at: string
          credential_id: string
          device_name: string | null
          id: string
          public_key: string
          transports: string[] | null
          user_id: string
        }
        Insert: {
          counter?: number
          created_at?: string
          credential_id: string
          device_name?: string | null
          id?: string
          public_key: string
          transports?: string[] | null
          user_id: string
        }
        Update: {
          counter?: number
          created_at?: string
          credential_id?: string
          device_name?: string | null
          id?: string
          public_key?: string
          transports?: string[] | null
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
      is_verified: { Args: { _user_id: string }; Returns: boolean }
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
