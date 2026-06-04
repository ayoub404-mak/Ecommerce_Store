import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server"; // ✅ FIX: Changed to auth for App Router
import { NextResponse } from "next/server";

// Add new address
export async function POST(request) {
    try {
        // ✅ FIX: Use await auth() for App Router
        const { userId } = await auth();

        // ✅ FIX: Prevent crashes if user is not logged in
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { address } = await request.json();

        if (!address) {
            return NextResponse.json({ error: "Missing address data" }, { status: 400 });
        }

        address.userId = userId;

        const newAddress = await prisma.address.create({
            data: address
        });

        // ✅ FIX: Fixed typos ("Adress" -> "Address", "succfully" -> "successfully")
        return NextResponse.json({ newAddress, message: 'Address added successfully' });
    } catch (error) {
        console.error("Add address error:", error);
        
        // ✅ FIX: Changed status from 400 to 500 for unexpected server/DB errors
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}

// Get all addresses for user
export async function GET(request) {
    try {
        // ✅ FIX: Use await auth() for App Router
        const { userId } = await auth();

        // ✅ FIX: Prevent crashes if user is not logged in
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // ✅ FIX: REMOVED the rogue `address.userId = userId` line. 
        // `address` is not defined here and was causing a fatal crash!

        const addresses = await prisma.address.findMany({
            where: { userId }
        });

        return NextResponse.json({ addresses });
    } catch (error) {
        console.error("Get addresses error:", error);
        
        // ✅ FIX: Changed status from 400 to 500 for unexpected server/DB errors
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}