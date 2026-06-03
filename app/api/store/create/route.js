import { auth } from "@clerk/nextjs/server"; // ✅ Changed from getAuth for App Router
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma"; // ✅ ADDED: Import Prisma
import imagekit from "@/configs/imageKit"; // ✅ ADDED: Import ImageKit

// Create the store
export async function POST(request) {
    try {
        // ✅ Use await auth() for Next.js App Router
        const { userId } = await auth(); 

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get the data from the form
        const formData = await request.formData();

        const name = formData.get("name");
        const username = formData.get("username");
        const description = formData.get("description");
        const email = formData.get("email");
        const contact = formData.get("contact");
        const address = formData.get("address");
        const image = formData.get("image");

        if (!name || !username || !description || !email || !contact || !address || !image) {
            return NextResponse.json({ error: "missing store info" }, { status: 400 });
        }

        // Check if user has already registered a store
        const store = await prisma.store.findFirst({
            where: { userId: userId }
        });

        // If store is already registered then send status of store
        if (store) {
            return NextResponse.json({
                status: store.status
            });
        }

        // Check if username is already taken
        const isUsernameTaken = await prisma.store.findFirst({
            where: { username: username.toLowerCase() }
        });

        if (isUsernameTaken) {
            return NextResponse.json({ error: "username already taken" }, { status: 400 });
        }

        // Image upload to ImageKit 
        const buffer = Buffer.from(await image.arrayBuffer());
        const response = await imagekit.upload({
            file: buffer,
            fileName: image.name,
            folder: "/logos" // ✅ ADDED leading slash for ImageKit
        });
        
        const optimizedImage = imagekit.url({
            path: response.filePath,
            transformation: [
                { quality: 'auto' },
                { format: 'webp' },
                { width: '512' }
            ]
        });

        // ✅ REMOVED the rogue '#' character here
        const newStore = await prisma.store.create({
            data: {
                userId,
                name,
                description,
                username: username.toLowerCase(),
                email,
                contact,
                address,
                logo: optimizedImage
            }
        });

        // Link store to user
        await prisma.user.update({
            where: { id: userId },
            data: { store: { connect: { id: newStore.id } } }
        });

        return NextResponse.json({
            message: "applied waiting for approval"
        }, { status: 201 });

    } catch (error) {
        console.error("Store creation error:", error);
        
        // ✅ Return 500 for unexpected server/DB errors, not 400
        return NextResponse.json(
            { error: error.message || "Internal Server Error" }, 
            { status: 500 }
        );
    }
} 

//check is user have already registed a store if yes then send status of store

export async function GET(request) {
    try{
    const { userId } = await auth(); 

     // Check if user has already registered a store
        const store = await prisma.store.findFirst({
            where: { userId: userId }
        });

        // If store is already registered then send status of store
        if (store) {
            return NextResponse.json({
                status: store.status
            });
        }

        return NextResponse.json({status: "not registered"})
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error.code || error.message}, {status: 400})
    }
}