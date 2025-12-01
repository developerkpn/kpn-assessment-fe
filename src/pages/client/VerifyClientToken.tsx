import useAuthDarwinStore from "@/hooks/useAuthDarwinStore";
import useTokenDarwin from "@/hooks/useTokenDarwin";
import useTokenExternal from "@/hooks/useTokenExternal";
import useAuthExternStore from "@/hooks/useAuthExternStore";
import useAPIAssessee from "@/hooks/useAPIAssesse";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { Outlet } from "react-router-dom";
import { ResponseDataEmpDarwin, ResponseDataEmpExt } from "@/types/AssessmentTypes";
import { AxiosResponse } from "axios";
import useTokenAssessee from "@/hooks/useTokenAssessee";

export type PayloadDarwin = {
  token_client?: string;
  emp_id?: string;
  encoded_payload?: string;
};

export default function VerifyClientToken() {
  const location = useLocation();
  const type_user = location?.state?.type;
  const email_token = location?.state?.token;
  const apiAssessee = useAPIAssessee();
  const token_as = useTokenAssessee(state => state.token_as);
  const setTokenAs = useTokenAssessee(state => state.setTokenAss);
  const resetTokenAs = useTokenAssessee(state => state.resetTokenAss);
  const setDarwinStore = useAuthDarwinStore(state => state.setDarwinStore);
  const setExternStore = useAuthExternStore(state => state.setExternStore);
  const [searchParams] = useSearchParams();
  const enc_token = useMemo(() => searchParams.get("data"), []);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        // if ?data is provided, decode it but incase token_as is empty
        if (enc_token) {
          const { data: user_darwin } = await apiAssessee.post(`/auth/darwin`, {
            encoded_payload: enc_token,
          });
          setTokenAs({ token: user_darwin.token, type: "internal" });
          if (user_darwin.status == "failed" && !token_as) {
            resetTokenAs();
            setTimeout(() => {
              navigate("/login/client");
            }, 500);
          }
        } else if (!token_as) {
          navigate(`/login/client/${email_token ?? ""}`);
          return;
        }
        return;
      } catch (error) {
        console.error(error);
        resetTokenAs();
        // setTimeout(() => {
        //   navigate("/login/client");
        // }, 500);
      } finally {
        setLoading(false);
      }
    })();
  }, []);
  useEffect(() => {
    (async () => {
      try {
        if (!token_as) return;
        const { data } = await apiAssessee.get(`/assessee/profile`);
        if (data.type == "internal") {
          setDarwinStore(data.data);
          setExternStore(null);
        } else {
          setExternStore(data.data);
          setDarwinStore(null);
        }
      } catch (error) {
        setTokenAs({
          token: "",
          type: "",
        });
      }
    })();
  }, [token_as]);
  return <>{token_as && !loading ? <Outlet /> : <></>}</>;
}
