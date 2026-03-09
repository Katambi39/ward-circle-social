import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return new Response(
        JSON.stringify({ error: "Email and recovery code are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Look up user by email
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.listUsers();
    if (userError) throw userError;

    const user = userData.users.find((u) => u.email === email);
    if (!user) {
      return new Response(
        JSON.stringify({ error: "Invalid recovery code" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check for valid unused recovery code
    const normalizedCode = code.trim().toUpperCase();
    const { data: codes, error: codeError } = await supabaseAdmin
      .from("recovery_codes")
      .select("*")
      .eq("user_id", user.id)
      .eq("code", normalizedCode)
      .eq("is_used", false)
      .limit(1);

    if (codeError || !codes || codes.length === 0) {
      return new Response(
        JSON.stringify({ error: "Invalid or already used recovery code" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Mark code as used
    await supabaseAdmin
      .from("recovery_codes")
      .update({ is_used: true })
      .eq("id", codes[0].id);

    // Count remaining codes
    const { count } = await supabaseAdmin
      .from("recovery_codes")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_used", false);

    // Generate a magic link for sign-in
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email: user.email!,
    });

    if (linkError) throw linkError;

    return new Response(
      JSON.stringify({
        success: true,
        token_hash: linkData.properties?.hashed_token,
        remaining_codes: count ?? 0,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
