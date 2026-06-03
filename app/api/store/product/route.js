import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server"; // ✅ Changed for App Router
import prisma from "@/lib/prisma";
import imagekit from "@/configs/imageKit";
import authSeller from "@/lib/authSeller"; // ✅ ADDED: Make sure this path matches where you saved authSeller

// Add new product
export async function POST(request) {
    try {
        const { userId } = await auth(); // ✅ Use await auth()
        const storeId = await authSeller(userId);

        if (!storeId) {
            return NextResponse.json({ error: 'Not authorized' }, { status: 401 }); // ✅ Fixed syntax
        }

        // Get data from the form 
        const formData = await request.formData();
        const name = formData.get("name");
        const description = formData.get("description");
        const mrp = Number(formData.get("mrp"));
        const price = Number(formData.get("price"));
        const category = formData.get("category");
        const images = formData.getAll("images");

        if (!name || !description || !mrp || !price || !category || images.length < 1) {
            return NextResponse.json({ error: 'Missing product info' }, { status: 400 }); // ✅ Fixed error message and status
        }

        // Uploading Images to ImageKit 
        const imagesUrl = await Promise.all(images.map(async (image) => {
            const buffer = Buffer.from(await image.arrayBuffer()); // ✅ Fixed typo: Buffer.from
            const response = await imagekit.upload({
                file: buffer,
                fileName: image.name,
                folder: "/products", // ✅ Added leading slash
            });
            
            const url = imagekit.url({
                path: response.filePath,
                transformation: [
                    { quality: 'auto' },
                    { format: 'webp' },
                    { width: '1024' }
                ]
            });
            return url;
        }));

        await prisma.product.create({
            data: {
                name,
                description,
                mrp,
                price,
                category,
                images: imagesUrl,
                storeId
            }
        });

        return NextResponse.json({ message: "Product added successfully" }, { status: 201 }); // ✅ Fixed typo, added 201 status

    } catch (error) {
        console.error("Product creation error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 }); // ✅ Changed to 500
    }
}

// Get all products for a seller
export async function GET(request) {
    try {
        const { userId } = await auth(); // ✅ Use await auth()
        const storeId = await authSeller(userId);

        if (!storeId) {
            return NextResponse.json({ error: 'Not authorized' }, { status: 401 }); // ✅ Fixed syntax
        }

        const products = await prisma.product.findMany({
            where: { storeId }
        });

        return NextResponse.json({ products });

    } catch (error) {
        console.error("Fetch products error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 }); // ✅ Changed to 500
    }
}