import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server"; // ✅ Changed for App Router
import authSeller from "@/middlewares/authSeller";
import prisma from '@/lib/prisma'

// Get dashboard data for seller (total orders, total earnings, total products)
export async function GET(request) {
    try {
        // ✅ Use await auth() for Next.js App Router
        const { userId } = await auth(); 
        
        const storeId = await authSeller(userId);

        // ✅ FIX: Added authorization check. If they aren't an approved seller, stop here.
        if (!storeId) {
            return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
        }

        // Get all orders for seller
        const orders = await prisma.order.findMany({ where: { storeId } });

        // Get all products for seller
        const products = await prisma.product.findMany({ where: { storeId } });

        // ✅ FIX: Only fetch ratings if there are actually products.
        // This prevents Prisma errors when querying `in: []` for new sellers with 0 products.
        let ratings = [];
        if (products.length > 0) {
            ratings = await prisma.rating.findMany({
                where: { 
                    productId: { in: products.map(product => product.id) } 
                },
                include: { user: true, product: true }
            });
        }

        const dashboardData = {
            ratings,
            totalOrders: orders.length,
            // ✅ FIX: Added (order.total || 0) to prevent NaN if a database value is null
            totalEarnings: Math.round(orders.reduce((acc, order) => acc + (order.total || 0), 0)), 
            totalProducts: products.length
        };
        
        return NextResponse.json({ dashboardData });

    } catch (error) {
        console.error("Dashboard data error:", error);
        
        // ✅ FIX: Changed status from 400 to 500 for unexpected server/DB errors
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}