import { clerkClient } from "@clerk/nextjs/server"

const authAdmin = async (userId) => {
    try {
        if (!userId) return false

        const client = await clerkClient()
        const user = await client.users.getUser(userId)

        // 1. FIX: Safely get the list of admin emails, and make them lowercase
        const adminEmails = process.env.ADMIN_EMAIL 
            ? process.env.ADMIN_EMAIL.split(',').map(email => email.trim().toLowerCase()) 
            : [];

        // 2. FIX: Safely get the user's primary email using optional chaining (?.)
        const userEmail = user.emailAddresses[0]?.emailAddress?.toLowerCase();

        // 3. FIX: Only check if the user actually has an email
        return userEmail ? adminEmails.includes(userEmail) : false;

    } catch (error) {
       console.error("Auth Admin Error:", error)
       return false
    }
}

export default authAdmin