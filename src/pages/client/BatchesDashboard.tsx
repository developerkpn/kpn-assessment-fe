import useAuthDarwinStore from "@/hooks/useAuthDarwinStore";
import useTokenDarwin from "@/hooks/useTokenDarwin";
import "@/index.css";
import { AppBar, Box, Card } from "@mui/material";
import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import CardProfileClient from "./CardProfileClient";
import ListCardOsBatches from "./ListCardOsBatches";
import { SettingsToolbarRef } from "./SettingsToolbar";
import LanguageSelector from "@/components/LanguageSelector";
import useGuidelineReadStore from "@/hooks/useGuidelineReadStore";

export default function BatchesDashboard() {
  const { setGuidelineStatus } = useGuidelineReadStore();
  const nik = useTokenDarwin(state => state.nik);
  const settingsRef = useRef<SettingsToolbarRef | null>(null);
  const data_emp = useAuthDarwinStore(state => state.darwin_sess);
  const { control, reset } = useForm({
    defaultValues: {
      date_join: "",
      comp_payroll: "",
      role_name: "",
      email: "",
    },
  });

  useEffect(() => {
    setGuidelineStatus({ batch_id: "", guideline_opened: false });
  }, []);

  useEffect(() => {
    reset({
      date_join: data_emp?.date_join,
      comp_payroll: data_emp?.contribution_level,
      role_name: data_emp?.designation_name,
      email: data_emp?.company_email_id,
    });
  }, [data_emp]);

  return (
    <Box sx={{ heigth: "100vh", width: "100vw" }}>
      <Box sx={{ width: "100%" }}>
        <AppBar position="static">
          <Box
            sx={{
              px: 2,
              py: 1,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h3>Assessment</h3>
            <LanguageSelector variant="light" />
          </Box>
        </AppBar>
      </Box>
      <Box
        sx={theme => ({
          backgroundColor: theme.palette.background.default,
          display: "flex",
          justifyContent: "space-evenly",
          flexWrap: "wrap",
          height: "100%",
          p: 2,
        })}
        className="client"
      >
        <CardProfileClient />
        <Card
          sx={{
            flexGrow: 1,
            m: 2,
            borderRadius: "30px",
            p: 2,
            gap: 2,
            height: "75vh",
            overflowY: "scroll",
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              flexShrink: 0,
              gap: 3,
            }}
          >
            <ListCardOsBatches />
          </Box>
        </Card>
      </Box>
    </Box>
  );
}
