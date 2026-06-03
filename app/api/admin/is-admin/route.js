import authAdmin from "@/middlewares/authAdmin"
import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server" // ✅ Added import for App Router auth

// Auth admin
export async function GET(request) {
    try {
        // ✅ FIX: Use await auth() instead of getAuth(request)
        const { userId } = await auth() 
        
        const isAdmin = await authAdmin(userId)

        if (!isAdmin) {
            return NextResponse.json({ error: 'not authorized' }, { status: 401 })
        }

        return NextResponse.json({ isAdmin })

    } catch (error) {
        console.error("Auth Admin Error:", error)
        
        // ✅ FIX: Changed status from 400 to 500 for unexpected server/DB errors
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
    }
}