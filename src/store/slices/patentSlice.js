import { createSlice } from "@reduxjs/toolkit";

const patentSlice = createSlice({
  name: "patents",
  initialState: {
    patents: [],
    pagination: {
      page: 1,
      pageSize: 10,
      total: 0,
      totalPages: 0,
      hasNext: false,
    },
    selectedPatent: null,
    stats: {
      activeScans: 0,
      patentsAnalyzed: 0,
      highRiskMatches: 0,
      clearedPatents: 0,
      lastScanDate: null,
      newResults: 0,
    },
    filters: {
      status: "all",
      category: "all",
      searchQuery: "",
    },
  },
  reducers: {
    setPatents: (state, action) => {
      state.patents = action.payload;
    },
    appendPatents: (state, action) => {
      state.patents = [...state.patents, ...action.payload];
    },
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    setSelectedPatent: (state, action) => {
      state.selectedPatent = action.payload;
    },
    addPatent: (state, action) => {
      state.patents.push(action.payload);
    },
    updatePatent: (state, action) => {
      const index = state.patents.findIndex(p => p._id === action.payload._id);
      if (index !== -1) state.patents[index] = action.payload;
    },
    deletePatent: (state, action) => {
      state.patents = state.patents.filter(p => p._id !== action.payload);
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    setStats: (state, action) => {          // ← new
      state.stats = { ...state.stats, ...action.payload };
    },
  },
});

export const {
  setPatents,
  appendPatents,
  setPagination,
  setSelectedPatent,
  addPatent,
  updatePatent,
  deletePatent,
  setFilters,
  setStats,
} = patentSlice.actions;

export default patentSlice.reducer;
