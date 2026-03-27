import { useDispatch } from "react-redux";
import { setPage, setLoading, setError, clearError } from "../store/slices/uiSlice";

export const useUI = () => {
  
  const dispatch = useDispatch();

  return {
    setPage: (page, data) => dispatch(setPage({ page, data })),
    setLoading: (bool) => dispatch(setLoading(bool)),
    setError: (msg) => dispatch(setError(msg)),
    clearError: () => dispatch(clearError()),
  };
};