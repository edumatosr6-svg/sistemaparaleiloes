import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Basic request validation
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { record, type } = await req.json()
    
    // 2. Validate that this is a legitimate trigger request
    // In production, you should verify a secret token passed in a custom header
    // e.g., if (req.headers.get('x-webhook-secret') !== Deno.env.get('WEBHOOK_SECRET')) throw new Error('Unauthorized');
    
    if (!record || !record.id) {
      throw new Error('Invalid payload: record.id is missing');
    }
    
    // Fetch user and lot details
    const { data: winner, error: winnerError } = await supabase
      .from('auction_winners')
      .select(`
        *,
        lot:lots(title, lot_order),
        profile:profiles(full_name)
      `)
      .eq('id', record.id)
      .single()

    if (winnerError || !winner) throw winnerError || new Error('Winner not found')

    const userEmail = winner.user_id // We should probably fetch the email from auth.users or profiles if stored there
    
    // Since we don't have a verified email domain yet, we'll log this.
    // In a real scenario, we'd use a provider like Resend or Lovable Emails.
    console.log(`[NOTIFY] Winner ${winner.profile?.full_name} for lot ${winner.lot?.title} should be notified.`)
    console.log(`Details: Final Amount R$ ${winner.final_amount}`)

    // If you have a Resend key, you can uncomment this:
    /*
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
      },
      body: JSON.stringify({
        from: 'Leilões <no-reply@seu-dominio.com>',
        to: [winner.user_email],
        subject: 'Parabéns! Você arrematou um lote!',
        html: `<h1>Parabéns!</h1><p>Você venceu o leilão do lote ${winner.lot.title}.</p>`,
      }),
    })
    */

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
