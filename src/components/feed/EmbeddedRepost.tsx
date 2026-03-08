import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Shield, MapPin } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface EmbeddedRepostProps {
  originalPostId: string;
}

interface OriginalPostData {
  id: string;
  title: string;
  content: string | null;
  image_url: string | null;
  author_name: string;
  author_avatar: string | null;
  author_verified: boolean;
  group_name: string | null;
  group_location: string | null;
}

const EmbeddedRepost = ({ originalPostId }: EmbeddedRepostProps) => {
  const navigate = useNavigate();
  const [post, setPost] = useState<OriginalPostData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOriginal = async () => {
      const { data } = await supabase
        .from("posts")
        .select("id, title, content, image_url, user_id, is_anonymous, groups (name, location)")
        .eq("id", originalPostId)
        .single();

      if (data) {
        const p = data as any;
        let authorName = "Anonymous";
        let authorAvatar: string | null = null;
        let authorVerified = false;

        if (!p.is_anonymous) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("display_name, avatar_url, verification_status")
            .eq("user_id", p.user_id)
            .single();
          if (profile) {
            authorName = profile.display_name;
            authorAvatar = profile.avatar_url;
            authorVerified = profile.verification_status === "verified";
          }
        }

        setPost({
          id: p.id,
          title: p.title,
          content: p.content,
          image_url: p.image_url,
          author_name: authorName,
          author_avatar: authorAvatar,
          author_verified: authorVerified,
          group_name: p.groups?.name || null,
          group_location: p.groups?.location || null,
        });
      }
      setLoading(false);
    };
    fetchOriginal();
  }, [originalPostId]);

  if (loading) {
    return (
      <div className="border border-border rounded-lg p-3 mt-2">
        <Skeleton className="h-4 w-32 mb-2" />
        <Skeleton className="h-3 w-full" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="border border-border rounded-lg p-3 mt-2 bg-muted/30">
        <p className="text-xs text-muted-foreground italic">Original post was deleted</p>
      </div>
    );
  }

  return (
    <div
      className="border border-border rounded-lg p-3 mt-2 bg-muted/20 cursor-pointer hover:bg-muted/40 transition-colors"
      onClick={(e) => {
        e.stopPropagation();
        navigate(`/post/${post.id}`);
      }}
    >
      <div className="flex items-center gap-2 mb-1.5">
        {post.author_avatar ? (
          <img src={post.author_avatar} alt="" className="h-5 w-5 rounded-full object-cover" />
        ) : (
          <div className="h-5 w-5 rounded-full gradient-kenya flex items-center justify-center text-primary-foreground font-display font-bold text-[10px]">
            {post.author_name[0]}
          </div>
        )}
        <span className="font-display font-semibold text-xs text-foreground">{post.author_name}</span>
        {post.author_verified && <Shield className="h-3 w-3 text-primary fill-primary/20" />}
        {post.group_name && (
          <>
            <span className="text-xs text-muted-foreground">·</span>
            <span className="text-xs text-secondary font-medium">{post.group_name}</span>
          </>
        )}
      </div>
      <p className="text-xs text-muted-foreground line-clamp-3">
        {post.content || post.title}
      </p>
      {post.image_url && (
        <div className="rounded-md overflow-hidden mt-2 border border-border">
          <img src={post.image_url} alt="" className="w-full h-28 object-cover" />
        </div>
      )}
    </div>
  );
};

export default EmbeddedRepost;
