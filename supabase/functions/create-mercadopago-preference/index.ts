import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const body = await req.json();
    const { amount, userId, lotId, winnerId, payment_method_id } = body;

    if (!amount || !userId || !lotId || !winnerId) {
      throw new Error("Missing required parameters: amount, userId, lotId, or winnerId.");
    }

    if (isNaN(Number(amount)) || Number(amount) <= 0) {
      throw new Error("Invalid amount.");
    }

    if (user.id !== userId) {
      throw new Error("User ID mismatch.");
    }

    const { data: settingsData, error: settingsError } = await supabaseClient
      .from("system_settings")
      .select("value")
      .eq("key", "mercadopago_access_token")
      .single();

    if (settingsError || !settingsData?.value) {
      throw new Error("Mercado Pago Access Token not configured.");
    }

    const { data: profileData } = await supabaseClient
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    const { data: privateProfile } = await supabaseClient
      .from("profiles_private")
      .select("cpf_cnpj, phone, address")
      .eq("id", user.id)
      .maybeSingle();

    const mpAccessToken = settingsData.value;
    const payerName = profileData?.full_name || "Comprador";
    const [firstName, ...lastNameParts] = payerName.split(" ");
    const lastName = lastNameParts.join(" ") || "Leilão";

    const identification = privateProfile?.cpf_cnpj ? {
      type: privateProfile.cpf_cnpj.replace(/\D/g, "").length > 11 ? "CNPJ" : "CPF",
      number: privateProfile.cpf_cnpj.replace(/\D/g, "")
    } : undefined;

    const address = privateProfile?.address ? {
      street_name: privateProfile.address.substring(0, 50),
      zip_code: "", 
      street_number: 0
    } : undefined;

    const phone = privateProfile?.phone ? {
      area_code: privateProfile.phone.replace(/\D/g, "").substring(0, 2),
      number: privateProfile.phone.replace(/\D/g, "").substring(2)
    } : undefined;

    console.log(`Creating preference for Lot ${lotId}, Amount ${amount}, User ${user.id}, Priority: ${payment_method_id || 'all'}`);

    const preferenceBody: any = {
      items: [
        {
          title: `Pagamento Lote #${lotId}`,
          unit_price: Number(amount),
          quantity: 1,
          currency_id: "BRL",
        },
      ],
      payer: {
        name: firstName,
        surname: lastName,
        email: user.email,
        identification: identification,
        phone: phone,
        address: address,
      },
      statement_descriptor: "HOT TOYS LEILOES",
      external_reference: winnerId,
      metadata: {
        winner_id: winnerId,
        user_id: userId,
        lot_id: lotId,
      },
      notification_url: "https://urnnqxsnyvzbrlkqomrx.supabase.co/functions/v1/mercadopago-webhook",
      back_urls: {
        success: "https://sistemaparaleiloes.site/dashboard/financial",
        failure: "https://sistemaparaleiloes.site/dashboard/financial",
        pending: "https://sistemaparaleiloes.site/dashboard/financial",
      },
      auto_return: "approved",
      binary_mode: true,
      expires: false,
    };

    // If specific payment method is requested (like 'pix')
    if (payment_method_id === 'pix') {
      preferenceBody.payment_methods = {
        default_payment_method_id: 'pix',
        installments: 1
      };
    }

    const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${mpAccessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(preferenceBody),
    });

    const preference = await response.json();

    if (!response.ok) {
      console.error("MP Error:", JSON.stringify(preference));
      throw new Error(preference.message || "Error creating preference");
    }

    return new Response(
      JSON.stringify({ 
        init_url: preference.init_point,
        preference_id: preference.id
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Function error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
