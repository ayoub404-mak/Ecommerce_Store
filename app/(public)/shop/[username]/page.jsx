'use client'
import ProductCard from "@/components/ProductCard"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { MailIcon, MapPinIcon } from "lucide-react"
import Loading from "@/components/Loading"
import Image from "next/image"
import axios from "axios"
import toast from "react-hot-toast" // ✅ ADDED: Missing import

export default function StoreShop() {

    const { username } = useParams()
    const [products, setProducts] = useState([])
    const [storeInfo, setStoreInfo] = useState(null)
    const [loading, setLoading] = useState(true)

    const fetchStoreData = async () => {
        setLoading(true) // Reset loading state when fetching a new store
        try {
            const { data } = await axios.get(`/api/store/data?username=${username}`)
            setStoreInfo(data.store)
            // ✅ Added fallback empty array just in case the store has no products
            setProducts(data.store.Product || []) 
        } catch (error) {
            // ✅ FIX: Removed the accidental space in optional chaining
            toast.error(error?.response?.data?.error || error.message)
        } finally {
            // ✅ FIX: Moved to finally block to guarantee it runs
            setLoading(false)
        }
    }

    useEffect(() => {
        // ✅ FIX: Only fetch if username actually exists
        if (username) {
            fetchStoreData()
        }
    // ✅ FIX: Added username to dependencies so it refetches if the URL changes
    }, [username])

    return !loading ? (
        <div className="min-h-[70vh] mx-6">

            {/* Store Info Banner */}
            {storeInfo && (
                <div className="max-w-7xl mx-auto bg-slate-50 rounded-xl p-6 md:p-10 mt-6 flex flex-col md:flex-row items-center gap-6 shadow-xs">
                    <Image
                        src={storeInfo.logo}
                        alt={storeInfo.name}
                        className="size-32 sm:size-38 object-cover border-2 border-slate-100 rounded-md"
                        width={200}
                        height={200}
                    />
                    <div className="text-center md:text-left">
                        <h1 className="text-3xl font-semibold text-slate-800">{storeInfo.name}</h1>
                        <p className="text-sm text-slate-600 mt-2 max-w-lg">{storeInfo.description}</p>
                        
                        <div className="space-y-2 text-sm text-slate-500 mt-4">
                            {storeInfo.address && (
                                <div className="flex items-center justify-center md:justify-start">
                                    <MapPinIcon className="w-4 h-4 text-gray-500 mr-2" />
                                    <span>{storeInfo.address}</span>
                                </div>
                            )}
                            {storeInfo.email && (
                                <div className="flex items-center justify-center md:justify-start">
                                    <MailIcon className="w-4 h-4 text-gray-500 mr-2" />
                                    <span>{storeInfo.email}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Products */}
            <div className="max-w-7xl mx-auto mb-40">
                <h1 className="text-2xl mt-12">Shop <span className="text-slate-800 font-medium">Products</span></h1>
                
                {/* ✅ FIX: Removed conflicting 'grid' and 'flex' classes. Used a proper responsive grid. */}
                <div className="mt-5 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 xl:gap-12 mx-auto">
                    {products.length > 0 ? (
                        products.map((product) => <ProductCard key={product.id} product={product} />)
                    ) : (
                        <p className="text-slate-500 col-span-full text-center py-10">No products found in this store.</p>
                    )}
                </div>
            </div>
        </div>
    ) : <Loading />
}