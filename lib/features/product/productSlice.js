import { createSlice, createAsyncThunk } from '@reduxjs/toolkit' // ✅ FIX: Added createAsyncThunk
import axios from 'axios' // ✅ ADDED: Missing axios import
// ✅ REMOVED: Unused import (productDummyData)

export const fetchProducts = createAsyncThunk(
    'product/fetchProducts',
    async ({ storeId }, thunkAPI) => {
        try {
            // ✅ FIX: Added leading slash to the API URL so it always calls the root route
            const { data } = await axios.get('/api/products' + (storeId ? `?storeId=${storeId}` : ''))
            return data.products
        } catch (error) {
            return thunkAPI.rejectWithValue(error.response?.data || { error: "Failed to fetch products" })
        }
    }
)

const productSlice = createSlice({
    name: 'product',
    initialState: {
        list: [],
        // ✅ PRO-TIP: Added loading and error states for better UI handling
        loading: false,
        error: null,
    },
    reducers: {
        setProduct: (state, action) => {
            state.list = action.payload
        },
        clearProduct: (state) => {
            state.list = []
        }
    },
    extraReducers: (builder) => {
        builder
            // ✅ PRO-TIP: Handle the loading state while the API call is happening
            .addCase(fetchProducts.pending, (state) => {
                state.loading = true
                state.error = null
            })
            // Handle the successful API response
            .addCase(fetchProducts.fulfilled, (state, action) => {
                state.list = action.payload
                state.loading = false
            })
            // ✅ PRO-TIP: Handle the error state if the API call fails
            .addCase(fetchProducts.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload?.error || "An error occurred"
            })
    }
})

export const { setProduct, clearProduct } = productSlice.actions

export default productSlice.reducer