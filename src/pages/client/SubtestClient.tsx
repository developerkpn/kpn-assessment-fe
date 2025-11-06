import { BoxSkeleton, TableSkeleton } from "@/components/Skeleton";
import LanguageSelector from "@/components/LanguageSelector";
import useDialog from "@/hooks/useDialog";
import useFetch from "@/hooks/useFetch";
import useLanguageStore from "@/hooks/useLanguageStore";
import { API } from "@/utils/api";
import { useTranslation } from "react-i18next";
import {
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as NotStartedIcon,
  PlayArrow as PlayArrowIcon,
  Refresh as RefreshIcon,
  Schedule as ScheduleIcon,
  BarChart as StatusIcon,
  AccessTime as TimeIcon,
  AllInclusive as InfiniteIcon,
  Error as ErrorIcon,
  ArrowBackIosNew as ArrowBack,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Fade,
  Grid2 as Grid,
  IconButton,
  LinearProgress,
  Paper,
  Slide,
  Stack,
  Typography,
  useTheme,
  Alert,
  AlertTitle,
} from "@mui/material";
import dayjs from "dayjs";
import "dayjs/locale/id";
import "dayjs/locale/zh";
import "dayjs/locale/ko";
import "dayjs/locale/en";
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import parse from "html-react-parser";

interface Subtest {
  id: string;
  subtest_name: string;
  subtest_duration: string;
  status: "Completed" | "Not Started" | "In Progress";
}

interface SubtestData {
  test: {
    test_name: string;
    description: string;
    intro_desc?: string;
  };
  subtests: Subtest[];
}

interface BatchData {
  start_period: string;
  end_period: string;
}

const SubtestClient: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { id, token } = useParams<{ id: string; token: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const { open, isOpen, close } = useDialog();
  const [selectedCard, setSelectedCard] = useState<{
    id: string;
    subtest_name: string;
    status: string;
  } | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const selectedLanguage = useLanguageStore(state => state.selectedLanguage);
  const [testTranslations, setTestTranslations] = useState<Record<string, any>>({});

  const { data: Batch, loading: BatchLoading } = useFetch<{ data: BatchData }>(
    `/assessment/${token}/batch`
  );
  const { data: Subtest, loading: SubtestLoading } = useFetch<{ data: SubtestData }>(
    `/assessment/${token}/test/${id}`
  );

  // Fetch all test translations on mount
  useEffect(() => {
    const fetchTestTranslations = async () => {
      if (!id) return;

      try {
        const response = await API.get(`/public/test/${id}/language`);
        console.log("Test Translations Response:", response.data);
        if (response.data?.data) {
          setTestTranslations(response.data.data);
          console.log("Test Translations Set:", response.data.data);
        }
      } catch (error) {
        console.error("Failed to fetch test translations:", error);
      }
    };

    fetchTestTranslations();
  }, [id]);

  // Calculate progress
  useEffect(() => {
    if (Subtest?.data?.subtests) {
      const completed = Subtest.data.subtests.filter(
        subtest => subtest.status === "Completed"
      ).length;
      const total = Subtest.data.subtests.length;
      const progressPercentage = total > 0 ? (completed / total) * 100 : 0;
      setProgress(progressPercentage);
    }
  }, [Subtest]);

  const formatDate = useCallback(
    (dateString: string) => {
      if (!dateString) return "N/A";
      return dayjs(dateString).locale(i18n.language).format("D MMMM YYYY | HH:mm");
      // return dayjs(dateString).locale(i18n.language).format("DD/MM/YYYY | HH:mm");
    },
  [i18n.language]
  );

  const handleOpenDialog = (id: string, subtest_name: string, status: string) => {
    setSelectedCard({ id, subtest_name, status });
    open();
  };

  const handleAttempt = () => {
    if (selectedCard && selectedCard.status !== "Completed") {
      navigate(`/client/assessment/${token}/subtest/${selectedCard.id}/termspp`);
    }
    close();
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return {
          bg: "#E8F5E8",
          color: "#2E7D32",
          border: "#4CAF50",
        };
      case "In Progress":
        return {
          bg: "#FFF3E0",
          color: "#E65100",
          border: "#FF9800",
        };
      default:
        return {
          bg: "#FFEBEE",
          color: "#C62828",
          border: "#F44336",
        };
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Completed":
        return <CheckCircleIcon sx={{ fontSize: 16 }} />;
      case "In Progress":
        return <PlayArrowIcon sx={{ fontSize: 16 }} />;
      default:
        return <NotStartedIcon sx={{ fontSize: 16 }} />;
    }
  };

  // Function to check if duration is empty or null
  const isDurationEmpty = (duration: string) => {
    return !duration || duration.trim() === "" || duration === "00:00:00" || duration === "0";
  };

  // Function to render duration display
  const renderDuration = (duration: string) => {
    if (isDurationEmpty(duration)) {
      return (
        <Stack direction="row" alignItems="center" spacing={1}>
          <InfiniteIcon sx={{ fontSize: 18, color: "#6c757d" }} />
          <Typography variant="caption" sx={{ color: "#6c757d", fontWeight: 500 }}>
            No Limit
          </Typography>
        </Stack>
      );
    }
    return (
      <Typography variant="h6" fontWeight={600} sx={{ fontSize: "1rem", color: "#343a40" }}>
        {duration}
      </Typography>
    );
  };

  const test_title = Subtest?.data?.test?.test_name;

  // Debug logging
  console.log("Selected Language:", selectedLanguage);
  console.log("Test Translations:", testTranslations);
  console.log("Translation for selected language:", testTranslations[selectedLanguage]);
  console.log("Subtest data:", Subtest?.data?.test);
  console.log("Description from translation:", testTranslations[selectedLanguage]?.intro_desc);
  console.log("Description from main data:", Subtest?.data?.test?.description);

  const completedCount =
    Subtest?.data?.subtests?.filter(subtest => subtest.status === "Completed").length || 0;
  const totalCount = Subtest?.data?.subtests?.length || 0;

  if (BatchLoading || SubtestLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Stack spacing={3}>
          <BoxSkeleton />
          <TableSkeleton row={4} column={3} />
        </Stack>
      </Container>
    );
  }

  return (
    <>
      <Box
        sx={{
          background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
          minHeight: "100vh",
          py: 3,
        }}
      >
        <Container maxWidth="md">
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              mb: 2,
            }}
          >
            <LanguageSelector />
          </Box>
          <Fade in timeout={800}>
            <Card
              sx={{
                borderRadius: 4,
                overflow: "hidden",
                boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
                background: "white",
                border: "1px solid rgba(255,255,255,0.2)",
              }}
            >
              <Box
                sx={{
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
                  color: "white",
                  p: 4,
                  position: "relative",
                }}
              >
                <IconButton
                  onClick={() => navigate(`/client/${token}`)}
                  sx={{
                    position: "absolute",
                    top: 20,
                    left: 20,
                    color: "white",
                    backgroundColor: "rgba(255,255,255,0.1)",
                    backdropFilter: "blur(10px)",
                    width: 40,
                    height: 40,
                    "&:hover": {
                      backgroundColor: "rgba(255,255,255,0.2)",
                      transform: "translateX(-4px)",
                    },
                    transition: "all 0.4s ease",
                  }}
                >
                  <ArrowBack fontSize="small" />
                </IconButton>
                <IconButton
                  onClick={handleRefresh}
                  sx={{
                    position: "absolute",
                    top: 20,
                    right: 20,
                    color: "white",
                    backgroundColor: "rgba(255,255,255,0.1)",
                    backdropFilter: "blur(10px)",
                    width: 40,
                    height: 40,
                    "&:hover": {
                      backgroundColor: "rgba(255,255,255,0.2)",
                      transform: "rotate(180deg)",
                    },
                    transition: "all 0.4s ease",
                  }}
                >
                  <RefreshIcon />
                </IconButton>

                <Typography
                  variant="h2"
                  component="h1"
                  sx={{
                    fontWeight: 600,
                    textAlign: "center",
                    mb: 0.5,
                    letterSpacing: "-0.3px",
                  }}
                >
                  {t('main_assessment_title')}
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    textAlign: "center",
                    opacity: 0.9,
                    fontWeight: 600,
                  }}
                >
                  {test_title}
                </Typography>
              </Box>

              {/* Schedule Info - Subtle Background */}
              <Box
                sx={{
                  background: "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)",
                  color: "#495057",
                  p: 2.5,
                  borderBottom: "1px solid #dee2e6",
                }}
              >
                <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
                  <ScheduleIcon fontSize="small" sx={{ color: "#6c757d" }} />
                  <Typography variant="body2" fontWeight={500} sx={{ fontSize: "0.95rem" }}>
                    {t('assess_sched_title')}:{" "}
                    {Batch?.data?.start_period && formatDate(Batch.data.start_period)} -{" "}
                    {Batch?.data?.end_period && formatDate(Batch.data.end_period)}
                  </Typography>
                </Stack>
              </Box>

              {/* Main Content */}
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ mb: 4 }}>
                  {parse(
                    testTranslations[selectedLanguage]?.intro_desc ||
                      Subtest?.data?.test?.description ||
                      "No description available for this test."
                  )}
                </Box>

                {/* Progress Section */}
                <Box sx={{ mb: 4 }}>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{ mb: 2 }}
                  >
                    <Typography
                      variant="h6"
                      fontWeight={600}
                      color="#343a40"
                      sx={{ fontSize: "1.1rem" }}
                    >
                      {t('overall_title')}
                    </Typography>
                    <Typography variant="body2" color="#6c757d" sx={{ fontSize: "0.9rem" }}>
                      {completedCount} {t('of').toLowerCase()} {totalCount} {t('subtests_completed').toLowerCase()}
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={progress}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: "#e9ecef",
                      "& .MuiLinearProgress-bar": {
                        borderRadius: 4,
                        background: "linear-gradient(90deg, #28a745 0%, #20c997 100%)",
                      },
                    }}
                  />
                </Box>

                <Paper
                  elevation={0}
                  sx={{
                    border: "1px solid #dee2e6",
                    borderRadius: 2,
                    overflow: "hidden",
                    mb: 4,
                  }}
                >
                  <Grid container spacing={0}>
                    <Grid size={{ xs: 12, md: 2 }}>
                      <Box
                        sx={{
                          background: "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)",
                          color: "#495057",
                          p: 2.5,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 1,
                          borderRight: "1px solid #dee2e6",
                        }}
                      >
                        <TimeIcon fontSize="small" />
                        <Typography variant="subtitle2" fontWeight={600}>
                          {t('duration')}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 12, md: 7 }}>
                      <Box
                        sx={{
                          background: "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)",
                          color: "#495057",
                          p: 2.5,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 1,
                          borderRight: "1px solid #dee2e6",
                        }}
                      >
                        <AssignmentIcon fontSize="small" />
                        <Typography variant="subtitle2" fontWeight={600}>
                          {t('subtest_title')}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 12, md: 3 }}>
                      <Box
                        sx={{
                          background: "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)",
                          color: "#495057",
                          p: 2.5,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 1,
                        }}
                      >
                        <StatusIcon fontSize="small" />
                        <Typography variant="subtitle2" fontWeight={600}>
                          {t('status')}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>

                  {Subtest?.data?.subtests?.map((subtest, index) => (
                    <Slide key={subtest.id} direction="up" in timeout={500 + index * 100}>
                      <Grid container spacing={0}>
                        <Grid size={{ xs: 12, md: 2 }}>
                          <Box
                            sx={{
                              p: 3,
                              minHeight: 80,
                              backgroundColor: index % 2 === 0 ? "#ffffff" : "#f8f9fa",
                              borderBottom: "1px solid #dee2e6",
                              borderRight: "1px solid #dee2e6",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            {renderDuration(subtest.subtest_duration)}
                          </Box>
                        </Grid>
                        <Grid size={{ xs: 12, md: 7 }}>
                          <Box
                            sx={{
                              p: 3,
                              minHeight: 80,
                              backgroundColor: index % 2 === 0 ? "#ffffff" : "#f8f9fa",
                              borderBottom: "1px solid #dee2e6",
                              borderRight: "1px solid #dee2e6",
                              cursor: "pointer",
                              transition: "all 0.2s ease",
                              "&:hover": {
                                backgroundColor:
                                  subtest.status === "Completed" ? "#ffebee" : "#e3f2fd",
                                transform: "translateX(2px)",
                              },
                            }}
                            onClick={() =>
                              handleOpenDialog(subtest.id, subtest.subtest_name, subtest.status)
                            }
                          >
                            <Typography variant="body1" sx={{ fontWeight: 500, color: "#343a40" }}>
                              {subtest.subtest_name}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid size={{ xs: 12, md: 3 }}>
                          <Box
                            sx={{
                              p: 3,
                              minHeight: 80,
                              backgroundColor: index % 2 === 0 ? "#ffffff" : "#f8f9fa",
                              borderBottom: "1px solid #dee2e6",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Chip
                              icon={getStatusIcon(subtest.status)}
                              label={
                                subtest.status === "Not Started"
                                  ? t('Not Taken').toUpperCase()
                                  : subtest.status === "Completed"
                                  ? t('Completed').toUpperCase()
                                  : t('In Progress').toUpperCase()
                              }
                              size="small"
                              sx={{
                                backgroundColor: getStatusColor(subtest.status).bg,
                                color: getStatusColor(subtest.status).color,
                                border: `1px solid ${getStatusColor(subtest.status).border}`,
                                fontWeight: 600,
                                fontSize: "0.75rem",
                                letterSpacing: 0.5,
                                borderRadius: "16px",
                                "& .MuiChip-icon": {
                                  color: getStatusColor(subtest.status).color,
                                },
                              }}
                            />
                          </Box>
                        </Grid>
                      </Grid>
                    </Slide>
                  ))}
                </Paper>

                <Paper
                  elevation={0}
                  sx={{
                    background:
                      progress < 100
                        ? "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
                        : "linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%)", // hijau lembut
                    color: progress < 100 ? "white" : "#155724",
                    p: 4,
                    textAlign: "center",
                    borderRadius: 3,
                    boxShadow: "0 8px 32px rgba(0,0,0,0.05)",
                  }}
                >
                  <Box sx={{ mb: 2 }}>
                    <Typography
                      variant="h5"
                      sx={{
                        mb: 1,
                        fontWeight: 700,
                        color: progress < 100 ? "white" : "#155724",
                        textShadow: progress < 100 ? "0 1px 2px rgba(0,0,0,0.2)" : "none",
                      }}
                    >
                      {progress < 100 ? `🎯 ${t('ready_to_begin')}` : "✅ All Subtests Completed!"}
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{
                        opacity: progress < 100 ? 0.95 : 1,
                        lineHeight: 1.6,
                        color: progress < 100 ? "white" : "#155724",
                      }}
                    >
                      {progress < 100
                        ? t('subtitle_rtb')
                        : "You've completed all subtests! You can now return to the home page."}
                    </Typography>
                  </Box>

                  {progress < 100 ? (
                    <Button
                      variant="contained"
                      size="large"
                      sx={{
                        backgroundColor: "white",
                        color: "#4facfe",
                        fontWeight: 700,
                        borderRadius: "25px",
                        px: 4,
                        py: 1.5,
                        fontSize: "0.95rem",
                        letterSpacing: "0.5px",
                        boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                        "&:hover": {
                          backgroundColor: "#f8f9fa",
                          transform: "translateY(-2px)",
                          boxShadow: "0 8px 25px rgba(0,0,0,0.15)",
                        },
                        transition: "all 0.3s ease",
                      }}
                      onClick={() => {
                        const firstIncomplete = Subtest?.data?.subtests?.find(
                          subtest => subtest.status !== "Completed"
                        );
                        if (firstIncomplete) {
                          handleOpenDialog(
                            firstIncomplete.id,
                            firstIncomplete.subtest_name,
                            firstIncomplete.status
                          );
                        }
                      }}
                    >
                      {t('start_first_button').toUpperCase()}
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      size="large"
                      sx={{
                        backgroundColor: "#28a745", // hijau solid
                        color: "white",
                        fontWeight: 700,
                        borderRadius: "25px",
                        px: 4,
                        py: 1.5,
                        fontSize: "0.95rem",
                        letterSpacing: "0.5px",
                        boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                        "&:hover": {
                          backgroundColor: "#218838",
                          transform: "translateY(-2px)",
                          boxShadow: "0 8px 25px rgba(0,0,0,0.15)",
                        },
                        transition: "all 0.3s ease",
                      }}
                      onClick={() => navigate(`/client/${token}`)}
                    >
                      {t('back_main_btn').toUpperCase()}
                    </Button>
                  )}
                </Paper>
              </CardContent>
            </Card>
          </Fade>
        </Container>
      </Box>

      {/* Confirmation Dialog */}
      <Dialog
        open={isOpen}
        onClose={close}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            p: 1,
          },
        }}
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            {selectedCard?.status === "Completed" ? (
              <ErrorIcon color="error" />
            ) : (
              <PlayArrowIcon color="primary" />
            )}
            <Typography variant="h6" fontWeight={600}>
              {selectedCard?.status === "Completed"
                ? t('subtest_completed_title')
                : t('attempt_subtest_title')}
            </Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          {selectedCard && (
            <>
              {selectedCard.status === "Completed" ? (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  <AlertTitle>{t('cannot_reattempt')}</AlertTitle>
                  {t('subtest_completed_message')}
                </Alert>
              ) : null}
              <Typography variant="body1">
                {selectedCard.status === "Completed"
                  ? t('subtest_completed_detail', { name: selectedCard.subtest_name })
                  : t('confirm_attempt_subtest', { name: selectedCard.subtest_name })}
              </Typography>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button
            onClick={close}
            variant="outlined"
            sx={{
              borderRadius: 2,
              fontWeight: 500,
            }}
          >
            {selectedCard?.status === "Completed" ? t('close_button') : t('cancel_button')}
          </Button>
          {selectedCard?.status !== "Completed" && (
            <Button
              onClick={handleAttempt}
              variant="contained"
              sx={{
                borderRadius: 2,
                px: 3,
                fontWeight: 600,
              }}
            >
              {t('start_button')}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SubtestClient;
