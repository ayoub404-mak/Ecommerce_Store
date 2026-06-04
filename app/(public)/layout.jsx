'use client'
import Banner from "@/components/Banner"
import Navbar from "@/components/Navbar"
import Footer from "@/components/Footer"
import { useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { fetchProducts } from "@/lib/features/product/productSlice"
import { useAuth, useUser } from "@clerk/nextjs"
import { fetchCart, uploadCart } from "@/lib/features/cart/cartSlice"
import { fetchAddress } from "@/lib/features/address/addressSlice"

export default function PublicLayout({ children }) {
    const dispatch = useDispatch()
    
    // ✅ FIX: Added isLoaded to ensure Clerk has finished initializing
    const { user, isLoaded } = useUser()
    const { getToken } = useAuth()

    const { cartItems } = useSelector((state) => state.cart)

    useEffect(() => {
        dispatch(fetchProducts({}))
    }, [dispatch]) // ✅ FIX: Added dispatch to dependencies

    useEffect(() => {
        // ✅ FIX: Wait for Clerk to load, and added all used variables to dependencies
        if (isLoaded && user) {
            dispatch(fetchCart({ getToken }))
            dispatch(fetchAddress({ getToken }))
        }
    }, [isLoaded, user, getToken, dispatch])

    useEffect(() => {
        // ✅ FIX: Added user, getToken, and dispatch to prevent stale closures
        if (isLoaded && user) {
            dispatch(uploadCart({ getToken }))
        }
    }, [isLoaded, user, cartItems, getToken, dispatch])

    return (
        <>
            <Banner />
            <Navbar />
            {children}
            <Footer />
        </>
    )
}