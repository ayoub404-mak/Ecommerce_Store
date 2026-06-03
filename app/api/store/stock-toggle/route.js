import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server"; // ✅ Changed for App Router
import prisma from "@/lib/prisma";
import authSeller from "@/lib/authSeller"; // ✅ ADDED: Make sure this path matches where you saved authSeller

// Toggle stock of a product
export async function POST(request) {
    try {
        // ✅ Use await auth() for Next.js App Router
        const { userId } = await auth(); 
        
        const { productId } = await request.json();

        if (!productId) {
            return NextResponse.json({ error: "missing details: productId" }, {
                status: 400
            });
        }

        const storeId = await authSeller(userId);

        if (!storeId) {
            return NextResponse.json({ error: 'not authorized' }, { status: 401 });
        }

        // Check if product exists AND belongs to this seller's store
        const product = await prisma.product.findFirst({
            where: { id: productId, storeId }
        });

        if (!product) {
            // ✅ Fixed typo: 'fount' -> 'found'
            return NextResponse.json({ error: 'no product found' }, { status: 404 });
        }

        // Toggle the inStock boolean
        await prisma.product.update({
            where: { id: productId },
            data: { inStock: !product.inStock }
        });

        // ✅ Fixed typo: 'succefully' -> 'successfully'
        return NextResponse.json({ message: "Product stock updated successfully" });

    } catch (error) {
        console.error("Toggle stock error:", error);
        
        // ✅ Changed status from 400 to 500 for unexpected server/DB errors
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 }); 
    }
}