import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server"; // ✅ FIX: Changed to auth for App Router
import { NextResponse } from "next/server";

// Update the cart data 
export async function POST(request) {
    try {
        // ✅ FIX: Use await auth() for App Router
        const { userId } = await auth();

        // ✅ FIX: Added authorization check to prevent Prisma crashes
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { cart } = await request.json();

        if (!cart) {
            return NextResponse.json({ error: "Missing cart data" }, { status: 400 });
        }

        // Save the cart to the user object
        await prisma.user.update({
            where: { id: userId },
            data: { cart: cart }
        });

        return NextResponse.json({ message: 'Cart updated' });
    } catch (error) {
        console.error("Update cart error:", error);
        
        // ✅ FIX: Changed status from 400 to 500 for unexpected server/DB errors
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}

// Get user cart 
export async function GET(request) {
    try {
        // ✅ FIX: Use await auth() for App Router
        const { userId } = await auth();

        // ✅ FIX: Added authorization check
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
       
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        // ✅ FIX: Prevent crash if user doesn't exist in the database yet
        if (!user) {
            return NextResponse.json({ cart: [] }); 
        }

        // ✅ FIX: Fallback to empty array if cart is null
        return NextResponse.json({ cart: user.cart || [] });
    } catch (error) {
        console.error("Get cart error:", error);
        
        // ✅ FIX: Changed status from 400 to 500 for unexpected server/DB errors
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}