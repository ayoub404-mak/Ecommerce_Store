import prisma from "@/lib/prisma";
// ✅ FIX: Removed useAuth (client-side) and getAuth. 
// Added auth and clerkClient for App Router server actions.
import { auth, clerkClient } from "@clerk/nextjs/server"; 
import { NextResponse } from "next/server";

// Verify coupon 
export async function POST(request) {
    try {
        // ✅ FIX: Use await auth() for App Router
        const { userId } = await auth();

        // ✅ FIX: Ensure user is logged in before checking their order history
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized. Please log in to apply a coupon." }, { status: 401 });
        }

        const { code } = await request.json();

        if (!code) {
            return NextResponse.json({ error: "Missing coupon code" }, { status: 400 });
        }

        const coupon = await prisma.coupon.findUnique({
            where: { 
                code: code.toUpperCase(),
                expiresAt: { gt: new Date() } // Checks if the coupon hasn't expired yet
            }
        });

        if (!coupon) {
            return NextResponse.json({ error: "Coupon not found or expired" }, { status: 404 });
        }

        // Check if coupon is restricted to new users
        if (coupon.forNewUser) {
            const userOrders = await prisma.order.findMany({
                where: { userId }
            });
        
            if (userOrders.length > 0) {
               // ✅ FIX: Typo "valide" -> "valid", and changed status to 403 (Forbidden)
               return NextResponse.json({ error: "Coupon valid for new users only" }, { status: 403 });
            }
        }

        // Check if coupon is restricted to Plus members
        if (coupon.forMember) {
            // ✅ FIX: `has()` does not check publicMetadata in Clerk v5. 
            // We must fetch the user and check their metadata directly.
            const client = await clerkClient();
            const user = await client.users.getUser(userId);
            const hasPlusPlan = user.publicMetadata?.plan === 'plus';

            if (!hasPlusPlan) {
                // ✅ FIX: Typo "memebers" -> "members", and changed status to 403 (Forbidden)
                return NextResponse.json({ error: "Coupon valid for members only" }, { status: 403 });
            }
        }
            
        return NextResponse.json({ coupon });

    } catch (error) {
        console.error("Verify coupon error:", error);
        
        // ✅ FIX: Changed status from 400 to 500 for unexpected server/DB errors
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}