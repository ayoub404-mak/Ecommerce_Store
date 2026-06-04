import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";



//get the products data
export async function GET(request) {
    try {
        const products = await prisma.product.findMany({
            where: { 
                inStock: true,
                // ✅ FIX: Filter by active store directly in the database query.
                // This completely removes the need for the JavaScript .filter() below!
                store: { 
                    isActive: true 
                }
            },
            include: {
                // ⚠️ Note: Check your schema.prisma. If the relation is plural, ensure this is 'ratings'
                rating: { 
                    select: {
                        createdAt: true, 
                        rating: true,
                        review: true,
                        user: { select: { name: true, image: true } }
                    }
                },
                store: true,
            },
            // ✅ FIX: Moved orderBy out of the include block and to the root level
            orderBy: { 
                createdAt: 'desc' 
            }
        });

        // ✅ REMOVED: The JavaScript .filter() is no longer needed because Prisma handles it!
        // products = products.filter(product => product.store.isActive)
        return NextResponse.json({ products });

    } catch (error) {
        console.error("Get all products error:", error);
        return NextResponse.json({ error: "An internal server error occurred" }, { status: 500 });
    }
}