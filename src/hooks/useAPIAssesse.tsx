import { API } from "@/utils/api";
import { useEffect } from "react";
import useTokenAssessee from "./useTokenAssessee";
import useAuthDarwinStore from "./useAuthDarwinStore";
import useAuthExternStore from "./useAuthExternStore";
import { useNavigate } from "react-router-dom";

const useAPI = () => {
  const token = useTokenAssessee(state => state.token_as);
  const reset_token = useTokenAssessee(state => state.resetTokenAss);
  const setDarwinStore = useAuthDarwinStore(state => state.setDarwinStore);
  const setExternStore = useAuthExternStore(state => state.setExternStore);
  const navigate = useNavigate();
  useEffect(() => {
    const requestIntercept = API.interceptors.request.use(
      config => {
        if (!config.headers["Authorization"]) {
          config.headers["Authorization"] = `Bearer ${token}`;
        }

        return config;
      },
      error => Promise.reject(error)
    );

    const responseIntercept = API.interceptors.response.use(
      response => response,
      async error => {
        if (error?.response?.status === 403) {
          reset_token();
          setDarwinStore(null);
          setExternStore(null);
          navigate("/login/client");
        }

        return Promise.reject(error);
      }
    );

    return () => {
      API.interceptors.request.eject(requestIntercept);
      API.interceptors.response.eject(responseIntercept);
    };
  }, [token]);

  return API;
};

export default useAPI;
