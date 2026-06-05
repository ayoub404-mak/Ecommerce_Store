import prisma from "@/lib/prisma";
// ✅ FIX: Changed getAuth to auth for App Router
import { auth } from "@clerk/nextjs/server"; 
import { NextResponse } from "next/server";

// Add new rating
export async function POST(request) {
    try {
        // ✅ FIX: Use await auth()
        const { userId } = await auth(); 
        
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { orderId, productId, rating, review } = await request.json();

        // Basic validation
        if (!orderId || !productId || !rating) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // ✅ FIX: Changed findUnique to findFirst. 
        // findUnique ONLY accepts the primary key (id). Passing userId will crash Prisma.
        const order = await prisma.order.findFirst({
            where: {
                id: orderId,
                userId
            }
        });

        if (!order) {
            return NextResponse.json({ error: "Order not found or unauthorized" }, { status: 404 });
        }

        const isAlreadyRated = await prisma.rating.findFirst({
            where: {
                productId,
                orderId,
                userId // ✅ Added userId for extra security
            }
        });

        if (isAlreadyRated) {
            return NextResponse.json({ error: "You have already rated this product in this order" }, { status: 400 });
        }

        const response = await prisma.rating.create({
            data: { userId, productId, rating, review, orderId }
        });
        
        // ✅ FIX: Changed 'error' key to 'message' for success response
        return NextResponse.json({ message: "Rating added successfully", rating: response });

    } catch (error) {
        console.error("Add rating error:", error);
        // ✅ FIX: Changed status to 500 for server errors
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}

// Get all ratings for user 
export async function GET(request) {
    try {
        // ✅ FIX: Use await auth()
        const { userId } = await auth(); 
        
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const ratings = await prisma.rating.findMany({
            where: { userId },
            // ✅ PRO-TIP: Include the product so the frontend knows what was rated!
            include: {
                product: true 
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return NextResponse.json({ ratings });

    } catch (error) {
        console.error("Get user ratings error:", error);
        // ✅ FIX: Changed status to 500 for server errors
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}