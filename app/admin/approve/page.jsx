'use client'
// ✅ REMOVED: Unused import (storesDummyData)
import StoreInfo from "@/components/admin/StoreInfo"
import Loading from "@/components/Loading"
import { useAuth, useUser } from "@clerk/nextjs"
import axios from "axios"
import { useEffect, useState } from "react"
import toast from "react-hot-toast"

export default function AdminApprove() {

    // ✅ FIX: Added isLoaded to prevent flashing errors before Clerk finishes loading
    const { user, isLoaded } = useUser()
    const { getToken } = useAuth()
    
    const [stores, setStores] = useState([])
    const [loading, setLoading] = useState(true)

    const fetchStores = async () => {
        try {
            const token = await getToken()
            const { data } = await axios.get('/api/admin/approve-store', {
                headers: { Authorization: `Bearer ${token}` }
            })
            setStores(data.stores)
        } catch (error) {
            toast.error(error?.response?.data?.error || error.message)
        } finally {
            // ✅ FIX: Moved to finally block to guarantee loading stops
            setLoading(false)
        }
    }

    const handleApprove = async ({ storeId, status }) => {
        try {
            const token = await getToken()
            const { data } = await axios.post('/api/admin/approve-store', {
                storeId, status
            }, {
                headers: { Authorization: `Bearer ${token}` }
            })
            toast.success(data.message)
            await fetchStores()
        } catch (error) {
            toast.error(error?.response?.data?.error || error.message)
        }
    }

    useEffect(() => {
        // ✅ FIX: Wait for Clerk to finish loading
        if (isLoaded) {
            if (user) {
                fetchStores()
            } else {
                setLoading(false)
            }
        }
    }, [isLoaded, user])

    return !loading ? (
        <div className="text-slate-500 mb-28">
            <h1 className="text-2xl">Approve <span className="text-slate-800 font-medium">Stores</span></h1>

            {stores.length ? (
                <div className="flex flex-col gap-4 mt-4">
                    {stores.map((store) => (
                        <div key={store.id} className="bg-white border rounded-lg shadow-sm p-6 flex max-md:flex-col gap-4 md:items-end max-w-4xl" >
                            {/* Store Info */}
                            <StoreInfo store={store} />

                            {/* Actions */}
                            <div className="flex gap-3 pt-2 flex-wrap">
                                {/* ✅ FIX: Removed toast.promise to prevent double popups */}
                                <button 
                                    onClick={() => handleApprove({ storeId: store.id, status: 'approved' })} 
                                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                                >
                                    Approve
                                </button>
                                <button 
                                    onClick={() => handleApprove({ storeId: store.id, status: 'rejected' })} 
                                    className="px-4 py-2 bg-slate-500 text-white rounded hover:bg-slate-600 text-sm"
                                >
                                    Reject
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex items-center justify-center h-80">
                    <h1 className="text-3xl text-slate-400 font-medium">No Application Pending</h1>
                </div>
            )}
        </div>
    ) : <Loading />
}