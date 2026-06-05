import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request) {
    try {
        const body = await request.text();
        
        // ✅ FIX: App Router uses request.headers.get() instead of request.get()
        const sig = request.headers.get('stripe-signature');

        const event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);

        const handlePaymentIntent = async (paymentIntentId, isPaid) => {
            const sessions = await stripe.checkout.sessions.list({
                payment_intent: paymentIntentId
            });

            // ✅ FIX: Safety check to ensure a session was actually found
            if (!sessions.data || sessions.data.length === 0) {
                console.error("No checkout session found for payment intent:", paymentIntentId);
                return;
            }

            const { orderIds, userId, appId } = sessions.data[0].metadata;

            // ✅ FIX: Just return from the inner function, don't return a NextResponse
            if (appId !== 'gocart') {
                console.log("Invalid app id for webhook");
                return; 
            }

            // ✅ FIX: Safety check to ensure metadata exists
            if (!orderIds || !userId) {
                console.error("Missing orderIds or userId in session metadata");
                return;
            }

            const orderIdsArray = orderIds.split(',');

            if (isPaid) {
                // Mark orders as paid
                await Promise.all(orderIdsArray.map(async (orderId) => {
                    await prisma.order.update({
                        where: { id: orderId },
                        data: { isPaid: true }
                    });
                }));
                
                // ✅ FIX: Use upsert to prevent P2025 crashes if the user doesn't exist
                await prisma.user.upsert({
                    where: { id: userId },
                    update: { cart: {} },
                    create: { id: userId, email: "", name: "User", image: "", cart: {} }
                });
            } else {
                // Delete orders from DB if payment failed/was canceled
                await Promise.all(orderIdsArray.map(async (orderId) => {
                    await prisma.order.delete({
                        where: { id: orderId }
                    });
                }));
            }
        }

        // ✅ FIX: Changed 'key' to 'event.type' so the switch statement actually works!
        switch (event.type) {
            case 'payment_intent.succeeded': {
                await handlePaymentIntent(event.data.object.id, true);
                break;
            }
            // ✅ FIX: Fixed typo 'canceld' -> 'canceled'
            case 'payment_intent.canceled': {
                await handlePaymentIntent(event.data.object.id, false);
                break;
            }
            default:
                console.log(`Unhandled event type: ${event.type}`);
                break;
        }

        // Always return 200 OK to Stripe so they know we received it
        return NextResponse.json({ received: true });
     
    } catch (error) {
        console.error("Stripe Webhook Error:", error);
        // Return 400 so Stripe knows the webhook failed and will retry later
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}

export const config = { api: {bodyparser: false} }
// This is for the Pages Router. In the App Router, request.text() already gives the raw body.