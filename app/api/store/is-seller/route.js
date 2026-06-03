import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server"; // ✅ Fixed typo (@cleark -> @clerk) and changed to auth for App Router
import prisma from "@/lib/prisma";
import authSeller from "@/middlewares/authSeller"; // ✅ Added import

// Auth Seller
export async function GET(request) {
    try {
        // ✅ Use await auth() for Next.js App Router
        const { userId } = await auth(); 
        
        const isSeller = await authSeller(userId);

        if (!isSeller) {
            return NextResponse.json({ error: 'not authorized' }, { status: 401 });
        }

        // ✅ Changed findUnique to findFirst to match your store creation logic 
        // and prevent crashes if userId isn't marked @unique in schema.prisma
        const storeInfo = await prisma.store.findFirst({
            where: { userId }
        });

        return NextResponse.json({ isSeller, storeInfo });

    } catch (error) {
        console.error("Auth Seller GET error:", error);
        
        // ✅ Changed status from 400 to 500 for unexpected server/DB errors
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 }); 
    }
}