import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import axios from 'axios'

export const fetchUserRatings = createAsyncThunk(
    'rating/fetchUserRatings', 
    async ({ getToken }, thunkAPI) => {
        try {
            const token = await getToken()
            const { data } = await axios.get('/api/rating', {
                headers: { Authorization: `Bearer ${token}` }
            })
            return data ? data.ratings : []
        } catch (error) {
            // ✅ FIX: Added optional chaining (?.) to prevent crashes on network errors
            return thunkAPI.rejectWithValue(error.response?.data || { error: "Failed to fetch ratings" })
        }
    }
)

const ratingSlice = createSlice({
    name: 'rating',
    initialState: {
        ratings: [],
        // ✅ PRO-TIP: Added loading and error states for better UI handling
        loading: false,
        error: null,
    },
    reducers: {
        addRating: (state, action) => {
            state.ratings.push(action.payload)
        },
        clearRatings: (state) => {
            state.ratings = []
        }
    },
    extraReducers: (builder) => {
        builder
            // ✅ PRO-TIP: Handle the loading state while the API call is happening
            .addCase(fetchUserRatings.pending, (state) => {
                state.loading = true
                state.error = null
            })
            // Handle the successful API response
            .addCase(fetchUserRatings.fulfilled, (state, action) => {
                state.ratings = action.payload
                state.loading = false
            })
            // ✅ PRO-TIP: Handle the error state if the API call fails
            .addCase(fetchUserRatings.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload?.error || "An error occurred"
            })
    }
})

// ✅ FIX: Added clearRatings to the exports
export const { addRating, clearRatings } = ratingSlice.actions

export default ratingSlice.reducer