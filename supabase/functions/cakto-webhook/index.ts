import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const payload = await req.json()
        console.log('WEBHOOK RECEIVED:', JSON.stringify(payload, null, 2))

        const d = payload.data || {}

        // Log all plan-related fields for debugging
        console.log('DIAGNOSTIC FIELDS:')
        console.log('event:', payload.event)
        console.log('status root:', payload.status)
        console.log('data.status:', d.status)
        console.log('data.offer.name:', d.offer ? d.offer.name : 'N/A')
        console.log('data.offer.periodicity:', d.offer ? d.offer.periodicity : 'N/A')
        console.log('data.plan.name:', d.plan ? d.plan.name : 'N/A')
        console.log('data.plan.periodicity:', d.plan ? d.plan.periodicity : 'N/A')
        console.log('data.plan.interval:', d.plan ? d.plan.interval : 'N/A')
        console.log('data.plan.interval_count:', d.plan ? d.plan.interval_count : 'N/A')
        console.log('data.product.name:', d.product ? d.product.name : 'N/A')
        console.log('data.product_name:', d.product_name)
        console.log('data.description:', d.description)
        console.log('data.subscription.plan.name:', d.subscription && d.subscription.plan ? d.subscription.plan.name : 'N/A')
        console.log('data.customer.email:', d.customer ? d.customer.email : 'N/A')

        // Extract email
        const email =
            (d.customer && d.customer.email) ||
            (d.payer && d.payer.email) ||
            (payload.customer && payload.customer.email) ||
            (payload.payer && payload.payer.email) ||
            payload.email

        if (!email) {
            console.error('Email not found in payload')
            return new Response(JSON.stringify({ error: 'Email not found' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            })
        }

        // Extract payment status
        const status =
            d.status ||
            payload.status ||
            payload.state ||
            payload.current_status

        console.log('Processing payment for email:', email, 'status:', status)

        const isPaid = ['paid', 'approved', 'completed', 'authorized', 'succeeded']
            .includes(String(status).toLowerCase())

        if (!isPaid) {
            console.log('Status not paid, ignoring:', status)
            return new Response(JSON.stringify({ message: 'Status ignored: ' + status }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            })
        }

        // Find user by email
        const { data: { users }, error: userError } = await supabase.auth.admin.listUsers({
            per_page: 1000
        })

        if (userError) throw userError

        const user = users.find((u) => u.email && u.email.toLowerCase() === email.toLowerCase())

        if (!user) {
            console.error('User not found for email:', email)
            return new Response(JSON.stringify({ error: 'User not found in system' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            })
        }

        console.log('User found:', user.id)

        // Detect plan type from all possible Cakto payload fields
        const planParts = [
            d.offer && d.offer.name,
            d.offer && d.offer.periodicity,
            d.plan && d.plan.name,
            d.plan && d.plan.periodicity,
            d.plan && d.plan.interval,
            d.subscription && d.subscription.plan && d.subscription.plan.name,
            d.subscription && d.subscription.plan && d.subscription.plan.periodicity,
            d.subscription && d.subscription.offer && d.subscription.offer.name,
            d.product && d.product.name,
            d.product_name,
            d.description,
            payload.product_name,
            payload.description,
            payload.plan_name,
        ]

        const planStr = planParts.filter(Boolean).join(' ').toLowerCase()
        console.log('Plan detection string:', planStr)

        let planType = 'monthly'
        let daysToAdd = 30

        if (
            planStr.includes('trimestral') ||
            planStr.includes('trimensal') ||
            planStr.includes('quarterly') ||
            planStr.includes('quarter') ||
            planStr.includes('3 meses') ||
            planStr.includes('3mes') ||
            (d.plan && d.plan.interval_count === 3)
        ) {
            planType = 'quarterly'
            daysToAdd = 90
        } else if (
            planStr.includes('anual') ||
            planStr.includes('yearly') ||
            planStr.includes('annual') ||
            planStr.includes('year') ||
            planStr.includes('12 meses') ||
            planStr.includes('um ano') ||
            (d.plan && d.plan.interval_count === 12)
        ) {
            planType = 'yearly'
            daysToAdd = 365
        }

        console.log('Plan detected:', planType, '| Days:', daysToAdd)

        // Calculate expiry and save
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
            console.error('Error saving subscription:', upsertError)
            throw upsertError
        }

        console.log('Subscription saved | user:', user.id, '| plan:', planType, '| expires:', expiresAt.toISOString())

        return new Response(JSON.stringify({
            success: true,
            plan_type: planType,
            expires_at: expiresAt.toISOString()
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error) {
        const err = error
        console.error('Webhook error:', err)
        return new Response(JSON.stringify({ error: err.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        })
    }
})
