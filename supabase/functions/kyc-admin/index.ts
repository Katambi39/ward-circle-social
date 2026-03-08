import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify the caller is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Check admin role
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden: Admin role required" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, submission_id, status, reviewer_notes } = await req.json();

    if (action === "list") {
      const { data, error } = await adminClient
        .from("kyc_submissions")
        .select("*")
        .order("submitted_at", { ascending: false });

      if (error) throw error;

      // Fetch profiles for each submission
      const userIds = data.map((s: any) => s.user_id);
      const { data: profiles } = await adminClient
        .from("profiles")
        .select("user_id, display_name, username, avatar_url, county, ward")
        .in("user_id", userIds);

      const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));

      // Generate signed URLs for documents
      const enriched = await Promise.all(data.map(async (sub: any) => {
        const { data: selfieUrl } = await adminClient.storage
          .from("kyc-documents")
          .createSignedUrl(sub.selfie_path, 3600);
        const { data: idUrl } = await adminClient.storage
          .from("kyc-documents")
          .createSignedUrl(sub.id_photo_path, 3600);

        return {
          ...sub,
          profile: profileMap.get(sub.user_id) || null,
          selfie_url: selfieUrl?.signedUrl || null,
          id_photo_url: idUrl?.signedUrl || null,
        };
      }));

      return new Response(JSON.stringify(enriched), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "review") {
      if (!submission_id || !status) {
        return new Response(JSON.stringify({ error: "submission_id and status required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Get submission to find user_id
      const { data: sub } = await adminClient
        .from("kyc_submissions")
        .select("user_id")
        .eq("id", submission_id)
        .single();

      if (!sub) {
        return new Response(JSON.stringify({ error: "Submission not found" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Update submission
      await adminClient.from("kyc_submissions").update({
        status,
        reviewer_id: user.id,
        reviewer_notes: reviewer_notes || null,
        reviewed_at: new Date().toISOString(),
      }).eq("id", submission_id);

      // Update profile verification_status
      const verificationStatus = status === "approved" ? "verified" : "rejected";
      await adminClient.from("profiles").update({
        verification_status: verificationStatus,
      }).eq("user_id", sub.user_id);

      // Send notification
      const title = status === "approved"
        ? "Identity Verified! ✅"
        : "Identity Verification Rejected";
      const body = status === "approved"
        ? "Your identity has been verified. You now have full access to all features."
        : `Your verification was rejected. ${reviewer_notes || "Please resubmit with clearer documents."}`;

      await adminClient.from("notifications").insert({
        user_id: sub.user_id,
        type: "verification",
        title,
        body,
        link: "/verify-identity",
      });

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("KYC admin error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
