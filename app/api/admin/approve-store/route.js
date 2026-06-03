import authAdmin from "@/middlewares/authAdmin";
import { auth } from "@clerk/nextjs/server"; // ✅ FIX: Changed from getAuth for App Router
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma"; // ✅ FIX: Added missing prisma import

// Approve seller
export async function POST(request) {
    try {
        // ✅ FIX: Use await auth() for App Router
        const { userId } = await auth(); 
        
        const isAdmin = await authAdmin(userId);

        // ✅ FIX: Changed isadmin to isAdmin (capital 'A')
        if (!isAdmin) {
            return NextResponse.json({ error: 'not authorized' }, { status: 401 });
        }

        const { storeId, status } = await request.json();

        // ✅ FIX: Added validation to prevent Prisma crashes if data is missing
        if (!storeId || !status) {
            return NextResponse.json({ error: "Missing storeId or status" }, { status: 400 });
        }

        if (status === 'approved') {
            await prisma.store.update({
                where: { id: storeId },
                data: { status: "approved", isActive: true }
            });
        } else if (status === 'rejected') {
            await prisma.store.update({
                where: { id: storeId },
                data: { status: "rejected" }
            });
        } else {
            return NextResponse.json({ error: "Invalid status" }, { status: 400 });
        }

        return NextResponse.json({ message: status + ' successfully' });

    } catch (error) {
        console.error("Approve seller error:", error);
        
        // ✅ FIX: Changed status from 400 to 500 for unexpected server/DB errors
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}

// Get all pending and rejected stores
export async function GET(request) {
    try {
        // ✅ FIX: Use await auth() for App Router
        const { userId } = await auth(); 
        
        const isAdmin = await authAdmin(userId);

        if (!isAdmin) {
            return NextResponse.json({ error: 'not authorized' }, { status: 401 });
        }

        const stores = await prisma.store.findMany({
            where: {
                status: {
                    in: ["pending", "rejected"]
                }
            },
            include: { user: true }
        });
        
        return NextResponse.json({ stores });

    } catch (error) {
        console.error("Get pending stores error:", error);
        
        // ✅ FIX: Changed status from 400 to 500 for unexpected server/DB errors
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}