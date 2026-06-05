'use client'

// ✅ FIX: Combined imports from lucide-react
import { Star, XIcon } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { useAuth } from '@clerk/nextjs'
import { useDispatch } from 'react-redux'
import axios from 'axios'
import { addRating } from '@/lib/features/rating/ratingSlice'
import { fetchProducts } from '@/lib/features/product/productSlice'

const RatingModal = ({ ratingModal, setRatingModal }) => {

    const { getToken } = useAuth()
    const dispatch = useDispatch()

    const [rating, setRating] = useState(0)
    const [review, setReview] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false) // ✅ ADDED: Loading state for the button

    const handleSubmit = async () => {
        // ✅ FIX: Check if rating is 0 (meaning no stars were clicked)
        if (rating === 0) {
            return toast.error('Please select a rating')
        }
        
        // ✅ FIX: Updated validation message to match the requirement
        if (review.length < 5) {
            return toast.error('Please write a review (at least 5 characters)')
        }

        setIsSubmitting(true)

        try {
            const token = await getToken()
            const { data } = await axios.post('/api/rating', {
                productId: ratingModal.productId, 
                orderId: ratingModal.orderId, 
                rating, 
                review
            }, {
                headers: { Authorization: `Bearer ${token}` }
            })
            
            dispatch(addRating(data.rating))
            
            // ✅ FIX: Dispatch fetchProducts to pull the latest ratings from the database!
            // This updates the home page and shop page instantly.
            dispatch(fetchProducts({})) 
            
            toast.success(data.message)
            setRatingModal(null)
        } catch (error) {
            toast.error(error?.response?.data?.error || error.message)
        } finally {
            setIsSubmitting(false)
        }}

    return (
        // ✅ FIX: Changed z-120 to z-[120] so Tailwind compiles it correctly
        <div className='fixed inset-0 z-[120] flex items-center justify-center bg-black/10 backdrop-blur-sm'>
            <div className='bg-white p-8 rounded-lg shadow-lg w-96 relative'>
                <button onClick={() => setRatingModal(null)} className='absolute top-3 right-3 text-gray-500 hover:text-gray-700'>
                    <XIcon size={20} />
                </button>
                <h2 className='text-xl font-medium text-slate-600 mb-4'>Rate Product</h2>
                
                <div className='flex items-center justify-center mb-4'>
                    {Array.from({ length: 5 }, (_, i) => (
                        <Star
                            key={i}
                            className={`size-8 cursor-pointer ${rating > i ? "text-green-400 fill-current" : "text-gray-300"}`}
                            onClick={() => setRating(i + 1)}
                        />
                    ))}
                </div>
                
                <textarea
                    className='w-full p-2 border border-gray-300 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-green-400'
                    // ✅ FIX: Removed "(optional)" since the code requires at least 5 characters
                    placeholder='Write your review (minimum 5 characters)' 
                    rows='4'
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                ></textarea>
                
                {/* ✅ FIX: Removed toast.promise to prevent double toasts. 
                    Added disabled state and loading text for better UX. */}
                <button 
                    onClick={handleSubmit} 
                    disabled={isSubmitting}
                    className='w-full bg-green-500 text-white py-2 rounded-md hover:bg-green-600 transition disabled:opacity-50 disabled:cursor-not-allowed'
                >
                    {isSubmitting ? 'Submitting...' : 'Submit Rating'}
                </button>
            </div>
        </div>
    )
}

export default RatingModal