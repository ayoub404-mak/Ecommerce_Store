import { Param } from '@prisma/client/runtime/client'
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

//ingesste function to delete coupone on expiry

// Inngest function to automatically delete expired coupons
export const deleteCouponOnExpiry = inngest.createFunction(
    { 
        id: "delete-coupon-on-expiry",
        triggers: { event: "app/coupon.expired" } // ✅ FIX: Moved triggers into the first argument for Inngest v4
    },
    async ({ event, step }) => {
        const { code, expires_at } = event.data;

        // 1. Pause this job until the coupon's expiration date
        await step.sleepUntil("wait-for-expiration", new Date(expires_at));

        // 2. Delete the coupon from the database
        await step.run("delete-coupon", async () => {
            // Using deleteMany prevents crashes if the admin already manually deleted it
            await prisma.coupon.deleteMany({
                where: { code }
            });
        });
    }
)