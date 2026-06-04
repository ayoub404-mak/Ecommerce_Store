// ✅ REMOVED: Unused import (addressDummyData)
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import axios from 'axios'
// ✅ REMOVED: Invalid internal Next.js import (build)

export const fetchAddress = createAsyncThunk(
    'address/fetchAddress', 
    async ({ getToken }, thunkAPI) => {
        try {
            const token = await getToken()
            const { data } = await axios.get('/api/address', { 
                headers: { Authorization: `Bearer ${token}` }
            })
            
            // ✅ FIX: The backend returns `addresses`, not `addAddress`
            return data ? data.addresses : [] 
        } catch (error) {
            return thunkAPI.rejectWithValue(error.response?.data || { error: "Failed to fetch addresses" })
        }
    }
)

const addressSlice = createSlice({
    name: 'address',
    initialState: {
        // ✅ FIX: Start with an empty array instead of dummy data
        list: [], 
    },
    reducers: {
        addAddress: (state, action) => {
            state.list.push(action.payload)
        },
    },
    // ✅ FIX: Added the missing `builder` parameter
    extraReducers: (builder) => {
        // ✅ FIX: Fixed typo `satte` -> `state`
        builder.addCase(fetchAddress.fulfilled, (state, action) => {
            state.list = action.payload
        })
    }
})

export const { addAddress } = addressSlice.actions

export default addressSlice.reducer