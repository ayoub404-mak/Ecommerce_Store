import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { clerkClient } from '@clerk/nextjs/server';

export async function POST(req) {
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

    if (!webhookSecret) {
        console.error('❌ CLERK_WEBHOOK_SECRET is missing!');
        return new Response('Webhook secret not configured', { status: 500 });
    }

    const payload = await req.text();
    const headersList = await headers();
    
    const svix_id = headersList.get('svix-id');
    const svix_timestamp = headersList.get('svix-timestamp');
    const svix_signature = headersList.get('svix-signature');

    if (!svix_id || !svix_timestamp || !svix_signature) {
        return new Response('Error occurred -- no svix headers', { status: 400 });
    }

    const wh = new Webhook(webhookSecret);
    let evt;

    try {
        evt = wh.verify(payload, {
            'svix-id': svix_id,
            'svix-timestamp': svix_timestamp,
            'svix-signature': svix_signature,
        });
    } catch (err) {
        console.error('❌ Error verifying webhook:', err);
        return new Response('Error occurred', { status: 400 });
    }

    const eventType = evt.type;
    const { data } = evt;

    // ✅ FIX: Extract the user ID from the correct location in the Clerk Billing payload
    const userId = data.payer?.user_id;

    if (!userId) {
        console.error('❌ Could not find user ID in webhook payload');
        return new Response('Missing user ID', { status: 400 });
    }

    // ✅ GRANT "plus" status
    if (
        eventType === 'subscription.active' || 
        eventType === 'subscription.created' || 
        eventType === 'subscription.updated'
    ) {
        if (data.status === 'active' || data.status === 'trialing') {
            console.log(`⬆️ Upgrading user ${userId} to PLUS plan...`);
            await clerkClient.users.updateUserMetadata(userId, {
                publicMetadata: {
                    plan: 'plus',
                },
            });
            console.log('✅ User upgraded successfully!');
        }
    }

    // ✅ REVOKE "plus" status
    if (
        eventType === 'subscription.pastDue' || 
        eventType === 'subscription.canceled' || 
        eventType === 'subscription.deleted'
    ) {
        console.log(`⬇️ Downgrading user ${userId} to FREE plan...`);
        await clerkClient.users.updateUserMetadata(userId, {
            publicMetadata: {
                plan: 'free',
            },
        });
        console.log('✅ User downgraded successfully!');
    }

    return new Response('Webhook received successfully', { status: 200 });
}