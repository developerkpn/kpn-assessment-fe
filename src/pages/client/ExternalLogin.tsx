import PasswordWithEyev2 from "@/components/forms/PasswordWithEyev2";
import TextFieldCtrl from "@/components/forms/TextField";
import useAPI from "@/hooks/useAPIAssesse";
import useTokenAssessee from "@/hooks/useTokenAssessee";
import useTokenExternal from "@/hooks/useTokenExternal";
import { snack } from "@/providers/SnackbarProvider";
import { Alert, Box, Button, Container, IconButton, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { AxiosResponse, isAxiosError } from "axios";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import logo from "../../assets/kpn-logo.png";
import { DecodedToken } from "./RedirectPage";
import assessment_logo from "@/assets/assessment.png";
import LanguageSelector from "@/components/LanguageSelector";
import { useTranslation } from "react-i18next";

interface ExtLoginFormInt {
  email: string;
  password: string;
  new_password: string;
  confirm_password: string;
  name: string;
}

const ExternalLogin: React.FC = () => {
  const { t } = useTranslation();
  const api = useAPI();
  const [is_registered, setIsReg] = useState(false);
  const [email_checked, setEmailChecked] = useState(false);
  const [campaign, setCampaign] = useState<{ link_name: string } | null>(null);
  const [invalid_link, setInvalidLink] = useState(false);
  const setTokenExt = useTokenExternal(state => state.setTokenExt);
  const setTokenAs = useTokenAssessee(state => state.setTokenAss);
  const navigate = useNavigate();
  const { token, slug } = useParams();
  const {
    control,
    handleSubmit,
    reset,
    getValues,
    formState: { isSubmitting, errors },
  } = useForm<ExtLoginFormInt>({
    defaultValues: {
      email: "",
      password: "",
      new_password: "",
      confirm_password: "",
      name: "",
    },
  });

  const register = async (values: { name: string; email: string; new_password: string }) => {
    try {
      const { data } = await api.post("/assessee/registration", values);
      return data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const login = async (values: { email: string; password: string }) => {
    try {
      const { data }: AxiosResponse<{ message: string; data: { access_token: string } }> =
        await api.post("/assessee/login", values);
      return data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const checkEmail = async (values: ExtLoginFormInt) => {
    try {
      const { data: check_user }: AxiosResponse<{ is_exist: boolean; data: { name: string } | null }> =
        await api.get(`/assessee/isreg/${values.email}`);
      if (!check_user.data) {
        snack.error("This email is not registered for any assessment");
        return;
      }
      setIsReg(check_user.is_exist);
      reset({
        email: values.email,
        name: check_user.data.name ?? "",
        password: "",
        new_password: "",
        confirm_password: "",
      });
      setEmailChecked(true);
    } catch (error) {
      console.error(error);
      if (isAxiosError(error)) {
        snack.error(error.response?.data.message);
      } else {
        snack.error((error as Error).message);
      }
    }
  };

  const changeEmail = () => {
    setEmailChecked(false);
    setIsReg(true);
    reset({
      email: getValues("email"),
      name: "",
      password: "",
      new_password: "",
      confirm_password: "",
    });
  };

  const submitLogin = async (values: ExtLoginFormInt) => {
    try {
      if (is_registered) {
        let payload_login = { email: values.email, password: values.password };
        const result_login = await login(payload_login);
        if (result_login) {
          setTokenExt({ token: result_login?.data.access_token });
          setTokenAs({ token: result_login?.data.access_token, type: "external" });
          snack.success("Success Login");
          const timeout = setTimeout(() => {
            let nextnavi = "/client";
            if (token) {
              nextnavi += `/${token}`;
            } else {
              nextnavi += `/dashboard`;
            }
            navigate(nextnavi);
          }, 1000);
        } else {
          throw new Error("Error");
        }
      } else {
        let payload_register = {
          name: values.name,
          email: values.email,
          new_password: values.new_password,
        };
        const result_register = await register(payload_register);
        snack.success("Success Registered");
        setIsReg(true);
        reset({
          email: values.email,
          name: "",
          password: "",
          new_password: "",
          confirm_password: "",
        });
      }
    } catch (error) {
      console.error(error);
      if (isAxiosError(error)) {
        snack.error(error.response?.data.message);
      } else {
        snack.error((error as Error).message);
      }
    }
  };

  useEffect(() => {
    if (token) {
      (async () => {
        try {
          const { data: decoded_tok }: AxiosResponse<DecodedToken> = await api.get(
            `/assessee/${token}`
          );
          if (decoded_tok.type == "internal") {
            setIsReg(true);
            setEmailChecked(true);
            reset({
              name: "",
              email: "",
              new_password: "",
              confirm_password: "",
              password: "",
            });
            return;
          }
          const { data: check_user }: AxiosResponse<{ is_exist: boolean; data: { name: string } | null }> =
            await api.get(`/assessee/isreg/${decoded_tok.email}`);
          setIsReg(check_user.is_exist);
          setEmailChecked(true);
          reset({
            name: check_user.data?.name ?? "",
            email: decoded_tok.email,
            new_password: "",
            confirm_password: "",
            password: "",
          });
        } catch (error) {
          console.error(error);
        }
      })();
    } else {
      setIsReg(true);
    }
    if (slug) {
      (async () => {
        try {
          const { data: link }: AxiosResponse<{ data: { link_name: string; slug: string } }> =
            await api.get(`/public/universal-link/${slug}`);
          setCampaign(link.data);
        } catch (error) {
          console.error(error);
          setInvalidLink(true);
        }
      })();
    }
  }, []);

  console.log(errors);
  return (
    <Box sx={{ bgcolor: "#e8f0f7", minHeight: "100vh", pt: 4, pb: 4 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          width: "100vw",
          flexGrow: 1,
          px: 8,
          py: 1,
        }}
      >
        <LanguageSelector />
      </Box>
      <Container maxWidth="sm">
        <Box
          sx={{
            bgcolor: "#fff",
            borderRadius: 1,
            boxShadow: "0px 2px 4px rgba(0,0,0,0.1)",
            overflow: "hidden",
            pt: 3,
            pb: 3,
          }}
        >
          <Box
            sx={{
              maxWidth: 550,
              mx: "auto",
              p: 4,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              position: "relative",
            }}
          >
            {email_checked && !token && (
              <IconButton
                aria-label="back"
                onClick={changeEmail}
                sx={{ position: "absolute", top: 12, left: 12 }}
              >
                <ArrowBackIcon />
              </IconButton>
            )}
            <Box sx={{ display: "flex", alignItems: "center", mb: 5 }}>
              <Box component="img" src={logo} alt="Assessment Logo" sx={{ height: 40, mr: 2 }} />
              <Typography
                variant="h5"
                component="h1"
                sx={{
                  fontWeight: 600,
                  letterSpacing: "0.5px",
                  mb: 0,
                }}
              >
                KPN Online Assessment Platform
              </Typography>
            </Box>
            {campaign && (
              <Typography variant="h6" sx={{ mb: 3, mt: -3, fontWeight: 500, textAlign: "center" }}>
                {campaign.link_name}
              </Typography>
            )}
            {invalid_link && (
              <Alert severity="error" sx={{ my: 1, width: "100%" }}>
                <strong>This link is not available. Please contact your recruiter.</strong>
              </Alert>
            )}
            {email_checked && !is_registered && (
              <Alert severity="info" sx={{ my: 1 }}>
                <strong>{t("not_regis")}</strong>
              </Alert>
            )}

            {!invalid_link && (
            <Box component="form" onSubmit={() => {}} sx={{ width: "100%" }}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="body1" sx={{ mb: 1, fontWeight: 500 }}>
                  Email
                </Typography>
                <TextFieldCtrl
                  control={control}
                  name="email"
                  type="email"
                  placeholder="your@email.com"
                  size="small"
                  disabled={email_checked && !token}
                  sx={{ bgcolor: "#fff", mb: 0 }}
                  rules={{
                    required: "Email is required",
                    pattern: {
                      value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                      message: "Invalid email address",
                    },
                  }}
                />
              </Box>

              {email_checked && !is_registered && (
                <>
                  <PasswordWithEyev2 control={control} name="new_password" label="New Password" />
                  <PasswordWithEyev2
                    control={control}
                    rules={{
                      validate: value =>
                        value !== getValues("new_password") ? "Password not match" : true,
                    }}
                    name="confirm_password"
                    label="Confirm Password"
                  />
                </>
              )}

              {email_checked && is_registered && (
                <>
                  <PasswordWithEyev2 control={control} name="password" label="Password" />
                </>
              )}

              <Button
                type="submit"
                fullWidth
                variant="contained"
                loading={isSubmitting}
                onClick={handleSubmit(email_checked ? submitLogin : checkEmail)}
                sx={{
                  py: 1.5,
                  bgcolor: "#d94560",
                  "&:hover": {
                    bgcolor: "#c03651",
                  },
                  textTransform: "none",
                  borderRadius: "4px",
                  boxShadow: "none",
                }}
              >
                {!email_checked ? "Continue" : is_registered ? "Login" : "Sign Up"}
              </Button>
              <Box>
                <Typography variant="body2" sx={{ mt: 2, textAlign: "center" }}>
                  {t("employee_kpn_url")}
                  <Button
                    variant="text"
                    onClick={() => {
                      const token_as = useTokenAssessee.getState().token_as;
                      if (token_as) {
                        navigate("/client/dashboard");
                      } else {
                        window.location.href = `https://kpncorporation.darwinbox.com/user/login`;
                      }
                    }}
                    sx={{
                      textTransform: "none",
                      color: "#d94560",
                      fontWeight: 500,
                      padding: 0,
                      ml: 1,
                      position: "relative",
                      "&:hover": {
                        textDecoration: "underline",
                        bgcolor: "transparent",
                        "&::after": {
                          content: '""',
                          position: "absolute",
                          top: "-105px",
                          left: "50%",
                          transform: "translateX(-50%)",
                          width: "100px",
                          height: "100px",
                          backgroundColor: "rgba(214, 214, 214, 1)",
                          borderRadius: "10px",
                          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
                          backgroundImage: `url(${assessment_logo})`,
                          backgroundSize: "contain",
                          backgroundRepeat: "no-repeat",
                          backgroundPosition: "center",
                          zIndex: 1000,
                          animation: "fadeInScale 0.3s ease-in-out",
                        },
                        "&::before": {
                          content: '"ASSESSMENT"',
                          position: "absolute",
                          top: "-15px",
                          left: "50%",
                          transform: "translateX(-50%)",
                          fontSize: "10px",
                          fontWeight: 600,
                          color: "text.primary",
                          backgroundColor: "rgba(255, 255, 255, 0.9)",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          zIndex: 1001,
                          animation: "fadeInScale 0.3s ease-in-out",
                          whiteSpace: "nowrap",
                        },
                      },
                      "@keyframes fadeInScale": {
                        "0%": {
                          opacity: 0,
                          transform: "translateX(-50%) scale(0.5)",
                        },
                        "100%": {
                          opacity: 1,
                          transform: "translateX(-50%) scale(1)",
                        },
                      },
                    }}
                  >
                    {t("employee_kpn_nav")}
                  </Button>
                </Typography>
              </Box>
            </Box>
            )}
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default ExternalLogin;
