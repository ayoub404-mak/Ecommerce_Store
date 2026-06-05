import prisma from "@/lib/prisma";
// ✅ ADDED: clerkClient to fetch user details if we need to create them
import { auth, clerkClient } from "@clerk/nextjs/server"; 
import { NextResponse } from "next/server";

// Update the cart data 
export async function POST(request) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { cart } = await request.json();

        if (!cart) {
            return NextResponse.json({ error: "Missing cart data" }, { status: 400 });
        }

        // ✅ FIX: Fetch user details from Clerk. 
        // We need this to create the user in the DB if the Inngest webhook hasn't done it yet.
        const client = await clerkClient();
        const clerkUser = await client.users.getUser(userId);
        
        const email = clerkUser.emailAddresses[0]?.emailAddress || "";
        const name = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || "New User";
        const image = clerkUser.imageUrl || "";

        // ✅ FIX: Use upsert instead of update!
        // This prevents the P2025 "Record not found" crash for brand new users.
        await prisma.user.upsert({
            where: { id: userId },
            update: { cart: cart }, // If user exists, just update their cart
            create: {               // If user DOESN'T exist, create them with this data
                id: userId,
                email: email,
                name: name,
                image: image,
                cart: cart
            }
        });

        return NextResponse.json({ message: 'Cart updated' });
    } catch (error) {
        console.error("Update cart error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}

// Get user cart 
export async function GET(request) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
       
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            // ✅ FIX: Return an empty object {} instead of an array []
            // This perfectly matches your Redux initial state (cartItems: {})
            return NextResponse.json({ cart: {} }); 
        }

        return NextResponse.json({ cart: user.cart || {} });
    } catch (error) {
        console.error("Get cart error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}