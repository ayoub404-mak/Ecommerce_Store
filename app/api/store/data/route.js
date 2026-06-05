import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Get store info & store 
export async function GET(request) {
    try {
        // get store username from query params
        const { searchParams } = new URL(request.url);
        
        // ✅ FIX: Safely get the username first to prevent the .toLowerCase() crash
        const usernameParam = searchParams.get('username');
        
        if (!usernameParam) {
            return NextResponse.json({ error: "missing username" }, { status: 400 });
        }
        
        const username = usernameParam.toLowerCase();

        // ✅ FIX: Changed findUnique to findFirst. 
        // findUnique will crash if you pass non-unique fields like 'isActive'.
        const store = await prisma.store.findFirst({
            where: { username, isActive: true },
            
            // ⚠️ IMPORTANT: Verify these names match your schema.prisma exactly!
            // Usually, Prisma relations are lowercase plural (products) and singular (ratings).
            include: { 
                Product: { 
                    include: { 
                        rating: true 
                    } 
                } 
            }
        });

        if (!store) {
            // ✅ FIX: Changed status from 400 to 404 (Not Found)
            return NextResponse.json({ error: "store not found" }, { status: 404 });
        }

        return NextResponse.json({ store });

    } catch (error) {
        console.error("Get store info error:", error);
        
        // ✅ FIX: Changed status from 400 to 500 for unexpected server/DB errors
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}