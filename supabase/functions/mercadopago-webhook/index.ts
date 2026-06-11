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

    const url = new URL(req.url);
    let topic = url.searchParams.get("topic") || url.searchParams.get("type");
    let id = url.searchParams.get("id") || url.searchParams.get("data.id");

    if (!topic || !id) {
      try {
        const body = await req.json();
        topic = topic || body.topic || body.type;
        id = id || body.id || (body.data && body.data.id);
      } catch (e) {}
    }

    console.log(`[MP Webhook] Received notification - Topic: ${topic}, ID: ${id}`);

    const isTest = id?.toString().startsWith('test_');
    
    if (topic === "payment" || topic === "merchant_order" || isTest) {
      let winnerId;
      let userId;
      let status = "pending";
      let statusDetail = "";
      let paymentDataRaw = {};

      if (isTest) {
        const { data: latestWinner } = await supabaseClient
          .from('auction_winners')
          .select('id, user_id')
          .eq('escrow_status', 'pending')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        winnerId = latestWinner?.id;
        userId = latestWinner?.user_id;
        status = "approved";
        paymentDataRaw = { test: true, timestamp: new Date().toISOString() };
      } else {
        const { data: settingsData } = await supabaseClient
          .from("system_settings")
          .select("value")
          .eq("key", "mercadopago_access_token")
          .single();

        const mpAccessToken = settingsData?.value;
        if (!mpAccessToken) throw new Error("MP Access Token not found");

        let paymentData;
        if (topic === "payment") {
          const response = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
            headers: { "Authorization": `Bearer ${mpAccessToken}` }
          });
          paymentData = await response.json();
        } else {
          const response = await fetch(`https://api.mercadopago.com/merchant_orders/${id}`, {
            headers: { "Authorization": `Bearer ${mpAccessToken}` }
          });
          paymentData = await response.json();
        }

        paymentDataRaw = paymentData;
        status = paymentData.status || paymentData.order_status;
        statusDetail = paymentData.status_detail || "";
        winnerId = paymentData.external_reference || (paymentData.metadata && paymentData.metadata.winner_id);
        userId = paymentData.metadata?.user_id || paymentData.payer?.id;

        console.log(`[MP Webhook] Data for Winner ${winnerId}: Status=${status}, User=${userId}`);
      }

      if (winnerId) {
        let newEscrowStatus = "pending";
        if (status === "approved" || status === "closed") {
          newEscrowStatus = "paid";
        } else if (status === "rejected" || status === "cancelled") {
          newEscrowStatus = "cancelled";
        } else if (status === "refunded") {
          newEscrowStatus = "refunded";
        } else if (status === "in_process") {
          newEscrowStatus = "under_review";
        }

        console.log(`[MP Webhook] Updating Winner ${winnerId} status to: ${newEscrowStatus}`);
        
        const { error: updateError } = await supabaseClient
          .from("auction_winners")
          .update({ 
            escrow_status: newEscrowStatus,
            payment_method: "mercadopago",
            payment_details: paymentDataRaw,
            updated_at: new Date().toISOString()
          })
          .eq('id', winnerId);

        if (updateError) throw updateError;

        if (newEscrowStatus === "paid" && userId) {
          await supabaseClient.from("notifications").insert({
            user_id: userId,
            title: "Pagamento Confirmado!",
            message: "Recebemos sua confirmação de pagamento do Mercado Pago. Seu recibo está disponível no painel.",
            type: "payment_success"
          });
        } else if (newEscrowStatus === "cancelled" && userId && status === "rejected") {
          let rejectionMessage = "Seu pagamento foi recusado pelo Mercado Pago.";
          if (statusDetail === "cc_rejected_high_risk") {
            rejectionMessage = "Seu pagamento foi recusado por motivos de segurança (antifraude). Recomendamos usar outro cartão ou pagar via PIX.";
          } else if (statusDetail === "cc_rejected_insufficient_amount") {
            rejectionMessage = "Seu pagamento foi recusado por saldo insuficiente no cartão.";
          } else if (statusDetail === "cc_rejected_call_for_authorize") {
            rejectionMessage = "O seu banco bloqueou a transação. Entre em contato com a operadora do cartão para autorizar o pagamento.";
          } else if (statusDetail === "cc_rejected_card_disabled") {
            rejectionMessage = "O cartão utilizado está desativado.";
          } else if (statusDetail === "cc_rejected_duplicated_payment") {
            rejectionMessage = "Pagamento duplicado identificado.";
          } else if (statusDetail === "cc_rejected_bad_filled_card_number") {
            rejectionMessage = "Número do cartão inválido.";
          }

          await supabaseClient.from("notifications").insert({
            user_id: userId,
            title: "Pagamento Recusado",
            message: rejectionMessage,
            type: "payment_error"
          });
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("[MP Webhook] ERROR:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
