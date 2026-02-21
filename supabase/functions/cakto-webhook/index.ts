import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const payload = await req.json()
        console.log('Webhook received:', JSON.stringify(payload, null, 2))

        // Tenta extrair email e status.
        // A Cakto pode enviar dentro de 'customer', 'payer' ou na raiz.
        let email = payload.customer?.email || payload.payer?.email || payload.email;

        // Se ainda não achou, tenta procurar recursivamente ou em campos comuns de outras plataformas (como fallback)
        if (!email && payload.data?.customer?.email) email = payload.data.customer.email;

        let status = payload.status || payload.state || payload.current_status;
        if (!status && payload.data?.status) status = payload.data.status;

        if (!email) {
            console.error('Email not found in payload');
            return new Response(JSON.stringify({ error: 'Email not found' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            })
        }

        console.log(`Processing payment for email: ${email}, status: ${status}`);

        // Status considerados como "PAGO"
        // paid, approved, completed, authorized (dependendo do gateway)
        const isPaid = ['paid', 'approved', 'completed', 'authorized', 'succeeded'].includes(String(status).toLowerCase());

        if (isPaid) {
            // Encontrar usuário pelo email usando a API de Admin do Supabase
            const { data: { users }, error: userError } = await supabase.auth.admin.listUsers({
                per_page: 1000
            });

            if (userError) {
                throw userError;
            }

            const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase());

            if (!user) {
                console.error('User not found for email:', email);
                return new Response(JSON.stringify({ error: 'User not found in system' }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 200,
                })
            }

            console.log(`User found: ${user.id}`);

            // Detectar tipo de plano pelo nome do produto
            const productName = (
                payload.product_name ||
                payload.description ||
                payload.plan_name ||
                payload.data?.product_name ||
                payload.data?.description ||
                ''
            ).toLowerCase();

            let planType = 'monthly';
            let daysToAdd = 30;

            if (
                productName.includes('trimestral') ||
                productName.includes('trimensal') ||
                productName.includes('quarterly') ||
                productName.includes('3 meses') ||
                productName.includes('três meses')
            ) {
                planType = 'quarterly';
                daysToAdd = 90;
            } else if (
                productName.includes('anual') ||
                productName.includes('yearly') ||
                productName.includes('annual') ||
                productName.includes('12 meses') ||
                productName.includes('um ano')
            ) {
                planType = 'yearly';
                daysToAdd = 365;
            }

            console.log(`Product: "${productName}" -> Plan: ${planType} (${daysToAdd} dias)`);

            // Calcular datas
            const now = new Date();
            const expiresAt = new Date();
            expiresAt.setDate(now.getDate() + daysToAdd);

            const { error: upsertError } = await supabase
                .from('user_subscriptions')
                .upsert({
                    user_id: user.id,
                    plan_type: planType,
                    status: 'active',
                    starts_at: now.toISOString(),
                    expires_at: expiresAt.toISOString(),
                    updated_at: now.toISOString()
                }, {
                    onConflict: 'user_id'
                })

            if (upsertError) {
                console.error('Error updating subscription:', upsertError);
                throw upsertError;
            }

            console.log(`Subscription updated for user ${user.id} -> Plan: ${planType} | Active until ${expiresAt.toISOString()}`);
        } else {
            console.log(`Payment status '${status}' is not considered paid. Ignoring.`);
        }

        return new Response(JSON.stringify({ message: 'Webhook processed' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })
    } catch (error) {
        console.error('Error processing webhook:', error)
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        })
    }
})
