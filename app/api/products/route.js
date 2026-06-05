// app/api/products/route.js

import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const storeId = searchParams.get("storeId");

        const products = await prisma.product.findMany({
            where: { 
                inStock: true,
                store: { isActive: true },
                ...(storeId && { storeId }) // Optional: filter by store if provided
            },
            include: {
                // ✅ CRITICAL: Make sure this is here!
                rating: { 
                    select: {
                        rating: true,
                        review: true,
                        createdAt: true,
                        user: { select: { name: true, image: true } }
                    }
                },
                store: true,
            },
            orderBy: { 
                createdAt: 'desc' 
            }
        });

        return NextResponse.json({ products });

    } catch (error) {
        console.error("Get products error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}