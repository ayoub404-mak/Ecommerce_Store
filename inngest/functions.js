import { inngest } from './client'
import prisma from '@/lib/prisma'

// Inngest function to create user in db
export const syncUserCreation = inngest.createFunction(
    { 
        id: 'sync-user-create',
        triggers: { event: 'clerk/user.created' } // ✅ Moved trigger here for Inngest v4
    },
    async ({ event }) => {
        const { data } = event
        await prisma.user.create({
            data: {
                id: data.id,
                email: data.email_addresses[0].email_address, // ✅ Fixed typo: email_address (singular)
                name: `${data.first_name} ${data.last_name}`,
                image: data.image_url,
            }
        })
    }
)

// Inngest function to update user in db
export const syncUserUpdation = inngest.createFunction(
    { 
        id: 'sync-user-update',
        triggers: { event: 'clerk/user.updated' } // ✅ Moved trigger here
    },
    async ({ event }) => {
        const { data } = event
        await prisma.user.update({
            where: { id: data.id },
            data: {
                email: data.email_addresses[0].email_address, // ✅ Fixed typo
                name: `${data.first_name} ${data.last_name}`,
                image: data.image_url,
            }
        })
    }
)

// Inngest function to delete user from db
export const syncUserDeletion = inngest.createFunction(
    { 
        id: 'sync-user-delete',
        triggers: { event: 'clerk/user.deleted' } // ✅ Moved trigger here
    },
    async ({ event }) => {
        const { data } = event
        await prisma.user.delete({
            where: { id: data.id }
        })
    }
)