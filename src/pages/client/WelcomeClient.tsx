import { BoxSkeleton, TableSkeleton } from "@/components/Skeleton";
import LanguageSelector from "@/components/LanguageSelector";
import useFetch from "@/hooks/useFetch";
import useLanguageStore from "@/hooks/useLanguageStore";
import useQNAIdentityStore from "@/hooks/useQNAIdentityStore";
import { API } from "@/utils/api";
import { BatchHeadAs } from "@/types/AssessmentTypes";
import {
  CheckCircleOutline,
  ChevronLeft,
  PlayCircleOutline,
  RadioButtonChecked,
  Schedule,
} from "@mui/icons-material";
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Container,
  Grid2 as Grid,
  Grow,
  Paper,
  Typography,
  useTheme,
} from "@mui/material";
import dayjs from "dayjs";
import parse from "html-react-parser";
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import useTokenAssessee from "@/hooks/useTokenAssessee";
import useAuthExternStore from "@/hooks/useAuthExternStore";
import useGuidelineReadStore from "@/hooks/useGuidelineReadStore";
import ModalViewerPDF from "@/components/ModalViewerPDF";
import { useTranslation } from "react-i18next";
import "dayjs/locale/id";
import "dayjs/locale/zh";
import "dayjs/locale/ko";
import "dayjs/locale/en";
import useAPI from "@/hooks/useAPI";
import { AxiosResponse } from "axios";

type TestStatus = "Completed" | "Not Completed" | "In Progress";

interface TestData {
  test_id: string;
  test_name: string;
  status: TestStatus;
}

const WelcomeClient: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { token } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const api = useAPI();

  const type = useTokenAssessee(state => state.type);
  const is_complete = useAuthExternStore(state => state.is_complete);
  const [openGuideline, setOpenGuideline] = useState(false);

  useEffect(() => {
    if (type == "external" && !is_complete) {
      navigate("/client/dashboard");
    }
  }, [type, is_complete]);

  const setIdentity = useQNAIdentityStore(state => state.setIdentity);
  const selectedLanguage = useLanguageStore(state => state.selectedLanguage);
  const [batchTranslations, setBatchTranslations] = useState<Record<string, any>>({});

  const { data: Batch, loading: BatchLoading } = useFetch<{
    message: string;
    data: BatchHeadAs;
  }>(`/assessment/${token}/batch`);
  const {
    data: Test,
    loading: TestLoading,
    refetch,
  } = useFetch<{ data: TestData[] }>(`/assessment/${token}/test`);

  useEffect(() => {
    if (!Batch?.data.id) {
      return;
    }
  }, [Batch]);

  useEffect(() => {
    if (token && !openGuideline) {
      (async () => {
        const { data }: AxiosResponse<{ data: boolean }> = await api.get(
          `/assessment/guidelineopen/${token}`
        );
        if (data.data) {
          setOpenGuideline(true);
        }
      })();
    }
  }, [token]);

  useEffect(() => {
    if (Batch?.data?.batch_id) {
      setIdentity({ batch_id: Batch.data.batch_id });
      refetch();
    }
  }, [Batch, setIdentity, refetch]);

  // Fetch all batch translations on mount
  useEffect(() => {
    const fetchBatchTranslations = async () => {
      if (!Batch?.data.id) return;

      try {
        const response = await API.get(`/public/batch/${Batch?.data.id}/language`);
        if (response.data?.data) {
          setBatchTranslations(response.data.data);
        }
      } catch (error) {
        console.error("Failed to fetch batch translations:", error);
      }
    };

    fetchBatchTranslations();
  }, [Batch?.data?.id]);

  const formatDate = useCallback(
    (dateString: string | undefined) => {
      if (!dateString) return "N/A";
      return dayjs(dateString).locale(i18n.language).format("D MMMM YYYY | HH:mm");
    },
    [i18n.language]
  );

  const getStatusChip = (status: TestStatus) => {
    const chipProps = {
      variant: "outlined" as const,
      title: `Status: ${t(status)}`,
    };

    switch (status) {
      case "Completed":
        return (
          <Chip {...chipProps} icon={<CheckCircleOutline />} label={t(status)} color="success" />
        );
      case "In Progress":
        return (
          <Chip {...chipProps} icon={<RadioButtonChecked />} label={t(status)} color="warning" />
        );
      case "Not Completed":
      default:
        return (
          <Chip {...chipProps} icon={<PlayCircleOutline />} label={t("Not Started")} color="info" />
        );
    }
  };

  const getActionButton = (test: TestData) => {
    const commonProps = {
      onClick: () => {
        // Future enhancement: Consider a confirmation modal before navigating.
        navigate(`/client/assessment/${token}/test/${test.test_id}`);
      },
    };

    switch (test.status) {
      case "Completed":
        return null;
      case "In Progress":
        return (
          <Button
            {...commonProps}
            variant="contained"
            color="primary"
            aria-label={`Continue ${test.test_name} test`}
          >
            {t("continue_test")}
          </Button>
        );
      case "Not Completed":
      default:
        return (
          <Button
            {...commonProps}
            variant="contained"
            color="primary"
            aria-label={`Start ${test.test_name} test`}
          >
            {t("start_button")}
          </Button>
        );
    }
  };

  if (BatchLoading || TestLoading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <BoxSkeleton />
          <Grid container spacing={3}>
            {[...Array(3)].map((_, index) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
                <TableSkeleton row={1} column={1} />
              </Grid>
            ))}
          </Grid>
        </Box>
      </Container>
    );
  }

  const allTestsCompleted = Test?.data?.every(test => test.status === "Completed");

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 4,
        }}
      >
        <Button
          onClick={() => navigate("/client/dashboard")}
          variant="outlined"
          startIcon={<ChevronLeft />}
        >
          {t("back_main_btn")}
        </Button>
        <LanguageSelector />
      </Box>

      <Box sx={{ textAlign: "center", mb: 4 }}>
        <Typography variant="h2" component="h1" fontWeight="700" color="primary">
          {t("main_assessment_title")}
        </Typography>
        <Typography variant="h5" color="text.secondary" gutterBottom>
          {Batch?.data?.batch_name}
        </Typography>
      </Box>

      <Alert severity="info" icon={<Schedule fontSize="inherit" />} sx={{ mb: 4 }}>
        <AlertTitle>{t("assess_sched_title")}</AlertTitle>
        {t("available_from")} <strong>{formatDate(Batch?.data?.start_period)}</strong> {t("to")}{" "}
        <strong>{formatDate(Batch?.data?.end_period)}</strong>.
      </Alert>

      <Paper elevation={2} sx={{ p: 3, mb: 4, backgroundColor: "background.paper" }}>
        <Typography variant="h6" gutterBottom>
          {t("instruction_title")}
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          {parse(
            batchTranslations[selectedLanguage]?.description || Batch?.data?.description || ""
          )}
        </Typography>
      </Paper>

      <Grid container spacing={3}>
        {Test?.data?.map((test, index) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={test.test_id}>
            <Grow in={true} timeout={500 + index * 100}>
              <Card
                elevation={2}
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  transition: "transform 0.2s, box-shadow 0.2s",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: theme.shadows[6],
                  },
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h5" component="div" gutterBottom>
                    {test.test_name}
                  </Typography>
                  {getStatusChip(test.status)}
                </CardContent>
                <CardActions sx={{ p: 2, justifyContent: "flex-start" }}>
                  {getActionButton(test)}
                </CardActions>
              </Card>
            </Grow>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ mt: 4, textAlign: "center" }}>
        {allTestsCompleted ? (
          <Alert severity="success">{t("congratulations_complete_title")}</Alert>
        ) : (
          <Typography variant="body1" color="text.secondary">
            {t("after_all_complete_message")}{" "}
            <Typography component="span" color="success.main" fontWeight="bold">
              {t("Completed")}
            </Typography>
            {t("after_complete_close_message")}
          </Typography>
        )}
      </Box>
      <ModalViewerPDF
        open={openGuideline}
        setOpen={(value: boolean) => {
          setOpenGuideline(value);
        }}
      />
    </Container>
  );
};

export default WelcomeClient;
