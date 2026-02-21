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
        console.log('=== WEBHOOK CAKTO RECEBIDO ===')
        console.log(JSON.stringify(payload, null, 2))

        // Objeto data aninhado (padrão Cakto)
        const d = payload.data || {}

        // ── DIAGNÓSTICO: Logar todos os campos de plano possíveis
        console.log('=== CAMPOS DE DIAGNÓSTICO ===')
        console.log('event:', payload.event)
        console.log('status (raiz):', payload.status)
        console.log('data.status:', d.status)
        console.log('data.offer?.name:', d.offer?.name)
        console.log('data.offer?.periodicity:', d.offer?.periodicity)
        console.log('data.plan?.name:', d.plan?.name)
        console.log('data.plan?.periodicity:', d.plan?.periodicity)
        console.log('data.plan?.interval:', d.plan?.interval)
        console.log('data.plan?.interval_count:', d.plan?.interval_count)
        console.log('data.product?.name:', d.product?.name)
        console.log('data.product_name:', d.product_name)
        console.log('data.description:', d.description)
        console.log('data.subscription?.plan?.name:', d.subscription?.plan?.name)
        console.log('data.subscription?.plan?.periodicity:', d.subscription?.plan?.periodicity)
        console.log('data.subscription?.offer?.name:', d.subscription?.offer?.name)
        console.log('data.customer?.email:', d.customer?.email)
        console.log('payload.customer?.email:', payload.customer?.email)
        console.log('=============================')

        // ── EXTRAIR EMAIL ──
        const email =
            d.customer?.email ||
            d.payer?.email ||
            payload.customer?.email ||
            payload.payer?.email ||
            payload.email

        if (!email) {
            console.error('Email not found in payload')
            return new Response(JSON.stringify({ error: 'Email not found' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            })
        }

        // ── EXTRAIR STATUS ──
        const status =
            d.status ||
            payload.status ||
            payload.state ||
            payload.current_status

        console.log(`Processando pagamento: email=${email}, status=${status}`)

        const isPaid = ['paid', 'approved', 'completed', 'authorized', 'succeeded']
            .includes(String(status).toLowerCase())

        if (!isPaid) {
            console.log(`Status '${status}' não é pago, ignorando.`)
            return new Response(JSON.stringify({ message: 'Status ignorado: ' + status }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            })
        }

        // ── ENCONTRAR USUÁRIO ──
        const { data: { users }, error: userError } = await supabase.auth.admin.listUsers({
            per_page: 1000
        })

        if (userError) throw userError

        const user = users.find((u: any) => u.email?.toLowerCase() === email.toLowerCase())

        if (!user) {
            console.error('Usuário não encontrado para o email:', email)
            return new Response(JSON.stringify({ error: 'User not found in system' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            })
        }

        console.log(`Usuário encontrado: ${user.id}`)

        // ── DETECTAR TIPO DE PLANO ──
        // A Cakto pode enviar o plano em vários campos. Agregamos tudo em uma string para buscar.
        const planFields = [
            d.offer?.name,
            d.offer?.periodicity,
            d.plan?.name,
            d.plan?.periodicity,
            d.plan?.interval,
            d.subscription?.plan?.name,
            d.subscription?.plan?.periodicity,
            d.subscription?.offer?.name,
            d.product?.name,
            d.product_name,
            d.description,
            payload.product_name,
            payload.description,
            payload.plan_name,
        ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()

        console.log(`Campos de plano agregados: "${planFields}"`)

        let planType = 'monthly'
        let daysToAdd = 30

        // Verificar trimestral PRIMEIRO (antes de anual para evitar conflito)
        if (
            planFields.includes('trimestral') ||
            planFields.includes('trimensal') ||
            planFields.includes('quarterly') ||
            planFields.includes('quarter') ||
            planFields.includes('3 meses') ||
            planFields.includes('três meses') ||
            planFields.includes('3mes') ||
            (planFields.includes('month') && d.plan?.interval_count === 3)
        ) {
            planType = 'quarterly'
            daysToAdd = 90
        } else if (
            planFields.includes('anual') ||
            planFields.includes('yearly') ||
            planFields.includes('annual') ||
            planFields.includes('year') ||
            planFields.includes('12 meses') ||
            planFields.includes('um ano') ||
            (planFields.includes('month') && d.plan?.interval_count === 12)
        ) {
            planType = 'yearly'
            daysToAdd = 365
        }

        console.log(`Plano detectado: ${planType} (${daysToAdd} dias) | Campos usados: "${planFields}"`)

        // ── CALCULAR DATAS E SALVAR ──
        const now = new Date()
        const expiresAt = new Date()
        expiresAt.setDate(now.getDate() + daysToAdd)

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
            console.error('Erro ao salvar assinatura:', upsertError)
            throw upsertError
        }

        console.log(`✅ Assinatura salva: user=${user.id} | plano=${planType} | expira=${expiresAt.toISOString()}`)

        return new Response(JSON.stringify({
            success: true,
            plan_type: planType,
            expires_at: expiresAt.toISOString()
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error: any) {
        console.error('Erro no webhook:', error)
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        })
    }
})
