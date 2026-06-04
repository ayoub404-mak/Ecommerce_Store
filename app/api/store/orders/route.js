import prisma from "@/lib/prisma";
import authSeller from "@/middlewares/authSeller";
import { auth } from "@clerk/nextjs/server"; // ✅ FIX: Changed to auth for App Router
import { NextResponse } from "next/server";

// Update seller order status
export async function POST(request) {
    try {
        // ✅ FIX: Use await auth() for App Router
        const { userId } = await auth(); 
        const storeId = await authSeller(userId);

        // ✅ FIX: Typo "satuts" -> "status"
        if (!storeId) {
            return NextResponse.json({ error: 'not authorized' }, { status: 401 });
        }

        const { orderId, status } = await request.json();

        // ✅ FIX: Added validation to prevent crashes if data is missing
        if (!orderId || !status) {
            return NextResponse.json({ error: "Missing orderId or status" }, { status: 400 });
        }

        // ✅ FIX: Changed update to updateMany. 
        // Using standard update with { id, storeId } will crash Prisma.
        // updateMany safely ensures the order belongs to this store without crashing.
        const updatedOrder = await prisma.order.updateMany({
            where: { id: orderId, storeId },
            data: { status }
        });

        // If updateMany affects 0 rows, it means the order doesn't exist or doesn't belong to this store
        if (updatedOrder.count === 0) {
            return NextResponse.json({ error: "Order not found or unauthorized" }, { status: 404 });
        }

        return NextResponse.json({ message: "Order Status updated successfully" });

    } catch (error) {
        console.error("Update order status error:", error);
        
        // ✅ FIX: Changed status from 400 to 500 for unexpected server/DB errors
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}

// Get all orders for a seller 
export async function GET(request) {
    try {
        // ✅ FIX: Use await auth() for App Router
        const { userId } = await auth(); 
        const storeId = await authSeller(userId);

        // ✅ FIX: Typo "satuts" -> "status"
        if (!storeId) {
            return NextResponse.json({ error: 'not authorized' }, { status: 401 });
        }

        const orders = await prisma.order.findMany({
            where: { storeId },
            include: {
                user: true, 
                address: true, 
                orderItems: {
                    include: {
                        product: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        
        return NextResponse.json({ orders });

    } catch (error) {
        console.error("Get seller orders error:", error);
        
        // ✅ FIX: Changed status from 400 to 500 for unexpected server/DB errors
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}