import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { clerkClient } from '@clerk/nextjs/server';

export async function POST(req) {
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

    if (!webhookSecret) {
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
        console.error('Error verifying webhook:', err);
        return new Response('Error occurred', { status: 400 });
    }

    const eventType = evt.type;
    const { data } = evt;

    // ✅ GRANT "plus" status when subscription is active/created/updated
    if (
        eventType === 'subscription.active' || 
        eventType === 'subscription.created' || 
        eventType === 'subscription.updated'
    ) {
        if (data.status === 'active' || data.status === 'trialing') {
            await clerkClient.users.updateUserMetadata(data.userId, {
                publicMetadata: {
                    plan: 'plus', // This triggers your green badge!
                },
            });
            console.log(`✅ User ${data.userId} upgraded to PLUS plan`);
        }
    }

    // ✅ REVOKE "plus" status when subscription is past due (payment failed)
    if (eventType === 'subscription.pastDue') {
        await clerkClient.users.updateUserMetadata(data.userId, {
            publicMetadata: {
                plan: 'free', // Reverts them back to standard
            },
        });
        console.log(`⚠️ User ${data.userId} subscription past due - downgraded to FREE`);
    }

    return new Response('Webhook received successfully', { status: 200 });
}