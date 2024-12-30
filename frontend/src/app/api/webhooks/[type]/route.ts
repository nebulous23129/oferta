import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(
  request: NextRequest,
  { params }: { params: { type: string } }
) {
  try {
    const webhookType = params.type
    const payload = await request.json()

    console.log(`[Webhook ${webhookType}] Received payload:`, payload)

    // Log the webhook event
    const { error } = await supabase
      .from('webhook_logs')
      .insert({
        webhook_type: webhookType,
        payload: payload,
        status: 'success'
      })

    if (error) {
      console.error(`[Webhook ${webhookType}] Error logging webhook:`, error)
      return NextResponse.json(
        { error: 'Error processing webhook' },
        { status: 500 }
      )
    }

    // Process webhook based on type
    switch (webhookType) {
      case 'email':
        // Handle email webhook
        console.log('[Email Webhook] Processing email notification')
        break
      case 'customer':
        // Handle customer data webhook
        console.log('[Customer Webhook] Processing customer data')
        break
      case 'address':
        // Handle address webhook
        console.log('[Address Webhook] Processing address data')
        break
      case 'payment':
        // Handle payment webhook
        console.log('[Payment Webhook] Processing payment data')
        break
      default:
        return NextResponse.json(
          { error: 'Invalid webhook type' },
          { status: 400 }
        )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(`[Webhook Error] ${error}`)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
