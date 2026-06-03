import authAdmin from "@/middlewares/authAdmin";
import { auth } from "@clerk/nextjs/server"; // ✅ FIX: Changed from getAuth for App Router
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma"; // ✅ FIX: Added missing prisma import


//get all aproved stores
export async function GET(request) {
    try {
        // ✅ FIX: Use await auth() for App Router
        const { userId } = await auth(); 
        
        const isAdmin = await authAdmin(userId);

        if (!isAdmin) {
            return NextResponse.json({ error: 'not authorized' }, { status: 401 });
        }

        const stores = await prisma.store.findMany({
            where: { status: 'approved'},
            include: { user: true }
        });
        
        return NextResponse.json({ stores });

    } catch (error) {
        console.error("Get pending stores error:", error);
        
        // ✅ FIX: Changed status from 400 to 500 for unexpected server/DB errors
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}