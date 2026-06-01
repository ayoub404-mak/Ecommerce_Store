import { Param } from '@prisma/client/runtime/client'
import {inngest} from './client'
import prisma from '@/lib/prisma'
import { Inngest } from 'inngest'

// Inngest funct to creat user from db


export const syncUserCreation = inngest.createFunction(
    {id: 'sync-user-create'},
    {event: 'clerk/user.created'},
    async ({ event }) => {
        const {data} = event
        await prisma.user.create({
            data: {
                id: data.id,
                email: data.email_addresses[0].email_addresses,
                name: `${data.first_name} ${data.last_name}`,
                image: data.image_url,
            }
        })
    }
)

// Inngest funct to update user from db

export const syncUserUpdation = inngest.createFunction(
    {id: 'sync-user-update'},
    {event: 'clerk/user.updated'},
    async({event}) => {
        const { data } = event
        await prisma.user.update({
            where: {id: data.id,},
             data: {
                email: data.email_addresses[0].email_addresses,
                name: `${data.first_name} ${data.last_name}`,
                image: data.image_url,
            }
        })
    }
)

// Inngest funct to delete user from db

export const syncUserDeletion = inngest.createFunction(
    {id: 'sync-user-delete'},
    {event: 'clerk/user.deleted'},
    async({event}) => {
        const { data } = event
        await prisma.user.delete({
            where: {id: data.id,}
        })
    }
)