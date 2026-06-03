import prisma from '@/lib/prisma'

const authSeller = async (userId) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { store: true },
        })

        // 1. FIX: Check if the user actually exists in the database
        if (!user) {
            return false
        }

        // 2. Check if they have a store AND its status is 'approved'
        if (user.store && user.store.status === 'approved') {
            return user.store.id
        }

        // 3. FIX: If they have no store, or it's pending/rejected, return false
        return false

    } catch (error) {
        console.error("Auth Seller Error:", error)
        return false
    }
}

export default authSeller;