import prisma from "@/lib/prisma";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { PaymentMethod } from "@prisma/client";
import { NextResponse } from "next/server";
import Stripe from "stripe";
// ✅ ADDED: Import headers from next/headers to safely get the origin URL
import { headers } from "next/headers"; 
// ✅ REMOVED: Invalid imports (metadata, Currency)

// Place Order
export async function POST(request) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: "Not authorized" }, { status: 401 });
        }

        const { addressId, items, couponCode, paymentMethod } = await request.json();

        if (!addressId || !paymentMethod || !items || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json({ error: "Missing order details" }, { status: 400 });
        }

        let coupon = null;

        if (couponCode) {
            coupon = await prisma.coupon.findUnique({
                where: { code: couponCode.toUpperCase() }
            });
            if (!coupon) {
                return NextResponse.json({ error: "Coupon not found or expired" }, { status: 400 });
            }
        }

        const client = await clerkClient();
        const clerkUser = await client.users.getUser(userId);
        const isPlusMember = clerkUser.publicMetadata?.plan === 'plus';

        if (couponCode && coupon.forNewUser) {
            const userOrders = await prisma.order.findMany({ where: { userId } });
            if (userOrders.length > 0) {
               return NextResponse.json({ error: "Coupon valid for new users only" }, { status: 403 });
            }
        }

        if (coupon && coupon.forMember) {
            if (!isPlusMember) {
                return NextResponse.json({ error: "Coupon valid for members only" }, { status: 403 });
            }
        }

        const ordersByStore = new Map();

        for (const item of items) {
            const product = await prisma.product.findUnique({ where: { id: item.id } });
            
            if (!product) {
                return NextResponse.json({ error: `Product not found: ${item.id}` }, { status: 400 });
            }

            const storeId = product.storeId;
            if (!ordersByStore.has(storeId)) {
                ordersByStore.set(storeId, []);
            }
            ordersByStore.get(storeId).push({ ...item, price: product.price, productId: product.id });
        }

        let orderIds = [];
        let fullAmount = 0;
        let isShippingFeeAdded = false;

        for (const [storeId, sellerItems] of ordersByStore.entries()) {
            let total = sellerItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

            if (couponCode && coupon) {
                total -= (total * coupon.discount) / 100;
            }

            if (!isPlusMember && !isShippingFeeAdded) {
                total += 5;
                isShippingFeeAdded = true;
            }

            total = parseFloat(total.toFixed(2));
            fullAmount += total;

            const order = await prisma.order.create({
                data: {
                    userId,
                    storeId,
                    addressId,
                    total,
                    paymentMethod,
                    isCouponUsed: coupon ? true : false,
                    coupon: coupon ? coupon : {}, 
                    orderItems: {
                        create: sellerItems.map(item => ({
                            productId: item.productId || item.id,
                            quantity: item.quantity,
                            price: item.price
                        }))
                    }
                }
            });
            orderIds.push(order.id);
        }

        // ✅ CRITICAL FIX: Moved cart clearing HERE, BEFORE the Stripe check.
        // Previously, it was placed after the Stripe 'return' statement, meaning 
        // Stripe users never got their cart cleared in the database!
        await prisma.user.upsert({
            where: { id: userId },
            update: { cart: {} },
            create: {
                id: userId,
                email: clerkUser.emailAddresses[0]?.emailAddress || "",
                name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || "New User",
                image: clerkUser.imageUrl || "",
                cart: {}
            }
        });

        if (paymentMethod === 'STRIPE') {
            // ✅ FIX: Added 'new' keyword for Stripe initialization
            const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
            
            // ✅ FIX: Use next/headers to safely get the origin URL
            const headersList = await headers();
            const origin = headersList.get('origin');

            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: [{
                    price_data: {
                        currency: 'usd',
                        product_data: { name: 'GoCart Order' },
                        unit_amount: Math.round(fullAmount * 100)
                    },
                    quantity: 1
                }],
                // ✅ FIX: Removed expires_at. 30 mins is the exact minimum and can cause boundary errors.
                // It now defaults to 24 hours, which is much safer.
                mode: 'payment', 
                success_url: `${origin}/loading?nextUrl=orders`,
                cancel_url: `${origin}/cart`,
                metadata: {
                    orderIds: orderIds.join(','),
                    userId,
                    appId: 'gocart'
                }
            });
            return NextResponse.json({ session });
        }

        return NextResponse.json({ message: 'Orders Placed Successfully', orderIds });

    } catch (error) {
        console.error("Place order error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}

// Get all orders for user 
export async function GET(request) {
    try {
        const { userId } = await auth();
        
        if (!userId) {
            return NextResponse.json({ error: "Not authorized" }, { status: 401 });
        }

        const orders = await prisma.order.findMany({
            where: {
                userId,
                OR: [
                    { paymentMethod: PaymentMethod.COD },
                    { 
                        AND: [
                            { paymentMethod: PaymentMethod.STRIPE },
                            { isPaid: true }
                        ]
                    }
                ]
            },
            include: {
                address: true, 
                user: true,
                orderItems: { 
                    include: { product: true }
                }
            },
            orderBy: { 
                createdAt: 'desc' 
            }
        });

        return NextResponse.json({ orders });
        
    } catch (error) {
        console.error("Get user orders error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}