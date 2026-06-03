import authAdmin from "@/middlewares/authAdmin";
import { auth } from "@clerk/nextjs/server"; 
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma"; 

// Toggle store isActive
export async function POST(request) {
    try {
        const { userId } = await auth(); 
        
        const isAdmin = await authAdmin(userId);

        if (!isAdmin) {
            return NextResponse.json({ error: 'not authorized' }, { status: 401 });
        }

        const { storeId } = await request.json();

        if (!storeId) {
            return NextResponse.json({ error: "missing storeId" }, { status: 400 });
        }
        
        // Find the store
        const store = await prisma.store.findUnique({
            where: { id: storeId }
        });

        if (!store) {
            // ✅ FIX: Changed status from 400 to 404 (Not Found)
            return NextResponse.json({ error: "store not found" }, { status: 404 });
        }

        await prisma.store.update({
            where: { id: storeId },
            data: { isActive: !store.isActive }
        });

        // ✅ FIX: Changed 'error' to 'message', fixed typo, and changed status to 200 (OK)
        return NextResponse.json({ message: "store updated successfully" }, { status: 200 });

    } catch (error) {
        console.error("Toggle store isActive error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}