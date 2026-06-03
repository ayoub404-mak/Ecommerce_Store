import { inngest } from "@/inngest/client"
import prisma from "@/lib/prisma"
import authAdmin from "@/middlewares/authAdmin"
import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

// Add new coupon 
export async function POST(request) {
    try {
        const { userId } = await auth()
        const isAdmin = await authAdmin(userId)

        if (!isAdmin) {
            return NextResponse.json({ error: "not authorized" }, { status: 401 })
        }

        const { coupon } = await request.json()

        if (!coupon || !coupon.code) {
            return NextResponse.json({ error: "Missing coupon data or code" }, { status: 400 })
        }

        coupon.code = coupon.code.toUpperCase()

        // ✅ FIX: Replaced .then() with a clean await
        const createdCoupon = await prisma.coupon.create({ data: coupon })

        // Run inngest scheduler function to delete coupon on expire
        await inngest.send({
            name: "app/coupon.expired",
            data: {
                code: createdCoupon.code,
                expires_at: createdCoupon.expiresAt,
            }
        })

        return NextResponse.json({ message: "Coupon added successfully" })
    } catch (error) {
        console.error("Add coupon error:", error)
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
    }
}

// Delete coupon /api/coupon?code=couponCode
export async function DELETE(request) {
    try {
        const { userId } = await auth()
        const isAdmin = await authAdmin(userId)

        if (!isAdmin) {
            return NextResponse.json({ error: "not authorized" }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const code = searchParams.get('code')

        if (!code) {
            return NextResponse.json({ error: "Missing coupon code" }, { status: 400 })
        }

        await prisma.coupon.delete({ where: { code } })
        
        return NextResponse.json({ message: 'Coupon deleted successfully' })
    } catch (error) {
        console.error("Delete coupon error:", error)
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
    }
}

// Get all coupons
export async function GET(request) {
    try {
        const { userId } = await auth()
        const isAdmin = await authAdmin(userId)
        
        if (!isAdmin) {
            return NextResponse.json({ error: "not authorized" }, { status: 401 })
        }

        const coupons = await prisma.coupon.findMany({})
        return NextResponse.json({ coupons })
    } catch (error) {
        console.error("Get coupons error:", error)
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
    }
}