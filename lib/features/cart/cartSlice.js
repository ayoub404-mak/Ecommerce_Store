import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import axios from 'axios'

let debounceTimer = null

export const uploadCart = createAsyncThunk('cart/uploadCart', 
    async ({ getToken }, thunkAPI) => {
        return new Promise((resolve, reject) => {
            clearTimeout(debounceTimer)
            debounceTimer = setTimeout(async () => {
                try {
                    const { cartItems } = thunkAPI.getState().cart
                    const token = await getToken()
                    
                    await axios.post('/api/cart', { cart: cartItems }, {
                        headers: { Authorization: `Bearer ${token}` }
                    })
                    resolve({ message: 'Cart synced' })
                } catch (error) {
                    reject(error.response?.data || { error: 'Failed to sync cart' })
                }
            }, 1000)
        })
    }
)

export const fetchCart = createAsyncThunk('cart/fetchCart', 
    async ({ getToken }, thunkAPI) => {
        try {
            const token = await getToken()
            const { data } = await axios.get('/api/cart', {
                headers: { Authorization: `Bearer ${token}` }
            })
            return data
        } catch (error) {
            return thunkAPI.rejectWithValue(error.response?.data || { error: 'Failed to fetch cart' })
        }
    }
)

const cartSlice = createSlice({
    name: 'cart',
    initialState: {
        total: 0,
        cartItems: {},
    },
    reducers: {
        addToCart: (state, action) => {
            const { productId } = action.payload
            
            // ✅ FIX: If the database loaded an empty array [], convert it to an object {}
            if (Array.isArray(state.cartItems)) {
                state.cartItems = {}
            }

            if (state.cartItems[productId]) {
                state.cartItems[productId]++
            } else {
                state.cartItems[productId] = 1
            }
            state.total += 1
        },
        removeFromCart: (state, action) => {
            const { productId } = action.payload
            
            if (Array.isArray(state.cartItems)) {
                state.cartItems = {}
            }

            if (state.cartItems[productId]) {
                state.cartItems[productId]--
                if (state.cartItems[productId] === 0) {
                    delete state.cartItems[productId]
                }
            }
            state.total -= 1
        },
        deleteItemFromCart: (state, action) => {
            const { productId } = action.payload
            
            if (Array.isArray(state.cartItems)) {
                state.cartItems = {}
            }

            state.total -= state.cartItems[productId] ? state.cartItems[productId] : 0
            delete state.cartItems[productId]
        },
        clearCart: (state) => {
            state.cartItems = {}
            state.total = 0
        },
    },
    extraReducers: (builder) => {
        builder.addCase(fetchCart.fulfilled, (state, action) => {
            let cartData = action.payload.cart || {}
            
            // ✅ FIX: If the database returned an array [], reset it to an object {}
            if (Array.isArray(cartData)) {
                cartData = {}
            }

            state.cartItems = cartData
            state.total = Object.values(state.cartItems).reduce((acc, item) => acc + item, 0)
        })
    }
})

export const { addToCart, removeFromCart, clearCart, deleteItemFromCart } = cartSlice.actions

export default cartSlice.reducer