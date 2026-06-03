import authAdmin from "@/middlewares/authAdmin";
import { auth } from "@clerk/nextjs/server"; 
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma"; 

// Get dashboard data for admin (total orders, total stores, total products, total revenue)

// ✅ FIX: Changed GRT to GET so Next.js recognizes the route
export async function GET(request) {
    try {
        const { userId } = await auth(); 
        const isAdmin = await authAdmin(userId);
        
        if (!isAdmin) {
            return NextResponse.json({ error: 'not authorized' }, { status: 401 });
        }

        // Get total orders
        const orders = await prisma.order.count();
        
        // ✅ FIX: Changed prisma.order.count() to prisma.store.count()
        const stores = await prisma.store.count(); 
        
        // Get all orders to calculate total revenue
        const allOrders = await prisma.order.findMany({
            select: {
                createdAt: true,
                total: true,
            }
        });

        // ✅ FIX: Fixed variable name typo (totalREvenue -> totalRevenue)
        let totalRevenue = 0; 
        allOrders.forEach(order => {
            // ✅ FIX: Added (order.total || 0) to prevent NaN if a database value is null
            totalRevenue += (order.total || 0); 
        });

        const revenue = totalRevenue.toFixed(2);
        
        // Total products on app
        const products = await prisma.product.count();
        
        const dashboardData = {
            orders,
            stores,
            products,
            revenue,
            allOrders
        };

        return NextResponse.json({ dashboardData });
    
    } catch (error) {
        console.error("Admin dashboard error:", error);
        
        // ✅ FIX: Changed status from 400 to 500 for unexpected server/DB errors
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}