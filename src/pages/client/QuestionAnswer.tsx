import DialogComp from "@/components/Dialog";
import LanguageSelector from "@/components/LanguageSelector";
import QuestionDrawer from "@/components/QuestionDrawer";
import useAPI from "@/hooks/useAPI";
import useFetch from "@/hooks/useFetch";
import useLanguageStore from "@/hooks/useLanguageStore";
import parse from "html-react-parser";
import { snack } from "@/providers/SnackbarProvider";
import {
  Box,
  Button,
  Checkbox,
  Grid2 as Grid,
  CircularProgress,
  Collapse,
  Container,
  Fab,
  FormControlLabel,
  Paper,
  Radio,
  RadioGroup,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import React, { useEffect, useMemo, useState } from "react";
import Countdown from "react-countdown";
import { CgMenuGridR } from "react-icons/cg";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import logo from "../../assets/kpn-logo.png";
import ProctoringProvider from "./ProctoringProvider";
import { BatchHeadAs } from "@/types/AssessmentTypes";
import useQNAIdentityStore from "@/hooks/useQNAIdentityStore";
import useAuthDarwinStore from "@/hooks/useAuthDarwinStore";
import useAuthExternStore from "@/hooks/useAuthExternStore";
import ErrorPage from "./ErrorPage";
import { isAxiosError } from "axios";
import useWebCamCheck from "@/hooks/useWebcamCheck";
import useWebcamStore from "@/hooks/useWebcamStore";
import useScreenCheck from "@/hooks/useScreenCheck";
import useScreenShareStore from "@/hooks/useScreenShareStore";
import AntiCopyProvider from "./AntiCopyProvider";

interface Choice {
  text?: string;
  image_url?: string | null;
}

interface QuestionItem {
  question_id: string;
  subtest_id: string;
  input: {
    text: string;
    image_url: string | null;
  };
  answer_type: "single" | "multiple";
  choices: Record<string, Choice>;
  choosen_answer: Record<string, boolean>;
}

const QuestionAnswer: React.FC = () => {
  const { t } = useTranslation();
  const API = useAPI();
  const setAllowWebCam = useWebCamCheck(state => state.setAllowWebCam);
  const setAllowScreen = useScreenCheck(state => state.setAllowScreen);
  const setWebcamStream = useWebcamStore(state => state.setWebcamStream);
  const setScreenStream = useScreenShareStore(state => state.setScreenStream);
  const screenStream = useScreenShareStore(state => state.screen_stream);
  const webcamStream = useWebcamStore(state => state.webcam_stream);
  const darwin_sess = useAuthDarwinStore(state => state.darwin_sess);
  const ext_sess = useAuthExternStore(state => state.ext_sess);

  const user_id: string[] = useMemo(() => {
    let user_id = "";
    let username = "";
    let uid = [];
    if (darwin_sess && darwin_sess.employee_id) {
      user_id = darwin_sess.employee_id;
      username = darwin_sess.full_name;
    } else if (ext_sess && ext_sess.user_id) {
      user_id = ext_sess.user_id;
      username = ext_sess.name;
    } else {
      user_id = "";
      username = "";
    }
    for (let i = 0; i < 10; i++) {
      uid.push(username + " | " + user_id + " | ");
    }
    return uid;
  }, [darwin_sess, ext_sess]);

  const { id, token } = useParams<{ id: string; token: string }>();
  const { data: Batch } = useFetch<{ message: string; data: BatchHeadAs }>(
    `/assessment/${token}/batch`
  );
  // const batch_id = useQNAIdentityStore(state => state.batch_id);
  const setIdentity = useQNAIdentityStore(state => state.setIdentity);
  const {
    data: Question,
    loading,
    error: errorTest,
  } = useFetch<any>(`/assessment/${token}/test/subtest/${id}`);

  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openSubmitDialog, setOpenSubmitDialog] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading_submit, setLoading] = useState(false);

  const [timeDisplay, setTimeDisplay] = useState("00:00:00");

  const selectedLanguage = useLanguageStore(state => state.selectedLanguage);
  const assessmentData = Question?.data;
  // console.log("Question Data: ", JSON.stringify(assessmentData, null, 2));
  const questions: QuestionItem[] = assessmentData?.data?.[selectedLanguage] || [];
  const totalQuestions = questions.length;
  const currentQuestion = questions[currentQuestionIndex];
  const answeredCount = questions.filter(q =>
    Object.values(q.choosen_answer).some(val => val === true)
  ).length;

  const hasDuration =
    assessmentData && assessmentData.duration != null && assessmentData.duration !== "Invalid date";

  const isMandatory = assessmentData?.is_mandatory;
  const hasSelection = Object.values(selectedAnswers).some(val => val);

  const endTime = useMemo(() => {
    if (hasDuration && assessmentData?.duration) {
      const [hours, minutes, seconds] = assessmentData.duration.split(":").map(Number);
      const totalMs = (hours * 3600 + minutes * 60 + seconds) * 1000;
      return Date.now() + totalMs;
    }
    return null;
  }, [assessmentData, hasDuration]);

  const choices = currentQuestion?.choices ?? {};

  const allImageOnly =
    Object.values(choices).filter(choice => choice.image_url).length > 0 &&
    Object.values(choices)
      .filter(choice => choice.image_url)
      .every(choice => choice.image_url);

  const optionContainerStyle = {
    display: "flex",
    flexDirection: allImageOnly ? "row" : "column",
    gap: 2,
    mb: 4,
    flexWrap: "wrap",
    justifyContent: allImageOnly ? "center" : "flex-start",
    alignItems: allImageOnly ? "center" : "flex-start",
  };

  const allQuestionsAnswered = useMemo(() => {
    if (!assessmentData || !questions.length) return false;
    return answeredCount === totalQuestions;
  }, [answeredCount, totalQuestions, assessmentData]);

  // lalu render seperti yang sudah diberikan sebelumnya...

  useEffect(() => {
    if (currentQuestion) {
      setSelectedAnswers({ ...currentQuestion.choosen_answer });
    }
  }, [currentQuestionIndex, currentQuestion]);

  const handleChoiceChange = (key: string) => {
    if (!currentQuestion) return;

    const { answer_type } = currentQuestion;
    setSelectedAnswers(prev => {
      const updated = { ...prev };

      if (answer_type === "single") {
        Object.keys(updated).forEach(k => {
          updated[k] = false;
        });
        updated[key] = true;
      } else {
        updated[key] = !updated[key];
      }
      return updated;
    });
  };

  const handleClearAll = () => {
    setSelectedAnswers(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(key => {
        updated[key] = false;
      });
      return updated;
    });
  };

  const saveAnswer = async (): Promise<boolean> => {
    if (!currentQuestion) return false;
    try {
      setIsSubmitting(true);

      // Submit jawaban ke API
      const answerPayload = {
        det_id: assessmentData?.det_id,
        question_id: currentQuestion.question_id,
        answer: {
          answer_a: !!selectedAnswers.a,
          answer_b: !!selectedAnswers.b,
          answer_c: !!selectedAnswers.c,
          answer_d: !!selectedAnswers.d,
          answer_e: !!selectedAnswers.e,
          answer_f: !!selectedAnswers.f,
          answer_g: !!selectedAnswers.g,
        },
      };

      currentQuestion.choosen_answer = { ...selectedAnswers };
      API.post(`/assessment/${token}/subtest/submission`, answerPayload);

      // Update local state di question data agar tetap sinkron

      return true;
    } catch (error) {
      console.error(error);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextQuestion = async () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      const saved = await saveAnswer();
      if (saved) {
        setCurrentQuestionIndex(prev => prev + 1);
      }
    }
  };

  const handlePrevQuestion = async () => {
    if (currentQuestionIndex > 0) {
      const saved = await saveAnswer();
      if (saved) {
        setCurrentQuestionIndex(prev => prev - 1);
      }
    }
  };

  const handleDrawerOpen = (open: boolean) => (event: React.KeyboardEvent | React.MouseEvent) => {
    if (
      event &&
      event.type === "keydown" &&
      ((event as React.KeyboardEvent).key === "Tab" ||
        (event as React.KeyboardEvent).key === "Shift")
    ) {
      return;
    }

    setDrawerOpen(open);
  };

  const handleOpenSubmitDialog = async () => {
    const saved = await saveAnswer();
    if (saved) {
      setOpenSubmitDialog(true);
    }
  };

  const handleCloseSubmitDialog = () => {
    setOpenSubmitDialog(false);
  };

  const stopMediaStream = (stream: MediaStream | null) => {
    if (stream) {
      console.log(stream);
      stream.getTracks().forEach(track => {
        track.stop();
        track.enabled = false;
        console.log(track);
        console.log(`Stopped ${track.kind} track:`, track.label);
      });
    }
  };

  const handleConfirmSubmit = async () => {
    try {
      setLoading(true);
      const { data } = await API.put(`/assessment/subtest/submission`, {
        det_id: assessmentData?.det_id,
      });
      console.log(data);
      snack.success(t("Your answer has been submitted"));
      // Cleanup stream setelah navigasi
      stopMediaStream(webcamStream);
      stopMediaStream(screenStream);
      // console.log(stopRecordingScreen);
      // console.log(stopRecordingWebcam);

      setAllowScreen(false);
      setAllowWebCam(false);
      setScreenStream(null);
      setWebcamStream(null);
      // stopRecordingScreen();
      // stopRecordingWebcam();
      setTimeout(() => {
        navigate(`/client/assessment/${token}/test/${data.test_id}`);
      }, 100);
    } catch (error) {
      console.error(error);
      if (isAxiosError(error)) {
        snack.error(error.response?.data.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCountdownComplete = hasDuration
    ? async () => {
        try {
          setLoading(true);
          const { data } = await API.put(`/assessment/subtest/submission`, {
            det_id: assessmentData?.det_id,
          });
          navigate(`/client/assessment/${token}/test/${data.test_id}`);
          snack.success(t("Your answer has been submitted due to time limit"));
          setTimeout(() => {
            stopMediaStream(webcamStream);
            stopMediaStream(screenStream);

            setAllowScreen(false);
            setAllowWebCam(false);
            setScreenStream(null);
            setWebcamStream(null);
          }, 100);
        } catch (error) {
          console.error(error);
          if (isAxiosError(error)) {
            snack.error(error.response?.data.message);
          }
        } finally {
          setLoading(false);
        }
      }
    : undefined;

  useEffect(() => {
    if (Batch) {
      setIdentity({
        batch_id: Batch.data.id,
      });
    }
  }, [Batch]);

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4, display: "flex", justifyContent: "center" }}>
        <CircularProgress />
      </Container>
    );
  }

  if (errorTest) {
    return <ErrorPage error={errorTest} />;
  }

  if (Question) {
    return (
      <AntiCopyProvider>
        <ProctoringProvider>
          {(!isMandatory || (isMandatory && allQuestionsAnswered)) && (
            <Fab
              variant="extended"
              size="large"
              sx={{
                position: "fixed",
                top: "10%",
                transform: "translateY(-50%)",
                right: -12,
                zIndex: 1000,
                backgroundColor: "primary.main",
                color: "white",
                boxShadow: "0 4px 6px rgba(0,0,0,0.1)", // Subtle shadow
                "&:hover": {
                  backgroundColor: "primary.dark",
                },
                width: "72px",
                height: "42px",
                borderRadius: "16px",
                padding: "0 8px",
                minWidth: "auto",
                display: "flex",
                alignItems: "center",
                justifyContent: "left",
              }}
              onClick={handleDrawerOpen(true)}
            >
              <CgMenuGridR size={28} />
            </Fab>
          )}
          <QuestionDrawer
            currentQuestionIndex={currentQuestionIndex}
            setCurrentQuestionIndex={setCurrentQuestionIndex}
            saveAnswer={saveAnswer}
            drawerOpen={drawerOpen}
            setDrawerOpen={setDrawerOpen}
            questions={questions}
          />

          <Container maxWidth="md" sx={{ py: 4 }}>
            <Paper
              elevation={1}
              sx={{
                overflow: "hidden",
                borderRadius: 1,
              }}
            >
              {/* Header */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  p: 2,
                  borderBottom: `1px solid ${theme.palette.divider}`,
                  backgroundColor: "#f5f7f9",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Box
                    component="img"
                    src={logo}
                    alt="Assessment Logo"
                    sx={{
                      width: 30,
                      height: 30,
                      mr: 1,
                      borderRadius: "4px",
                    }}
                  />
                  <Typography
                    variant={isMobile ? "h6" : "h5"}
                    sx={{
                      fontWeight: "bold",
                      color: "#2f3e46",
                      mr: 2,
                      mb: 0,
                    }}
                  >
                    ASSESSMENT
                  </Typography>
                  <Box
                    sx={{
                      borderLeft: "2px solid #e0e0e0",
                      pl: 2,
                      display: { xs: "none", sm: "block" },
                    }}
                  >
                    <Typography variant="subtitle1" color="text.secondary">
                      {assessmentData?.subtest_name}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <LanguageSelector />
                  {hasDuration && (
                    <Typography variant="body2" color="text.secondary">
                      Time remaining:{" "}
                      <Typography component="span" color="primary">
                        <Countdown
                          date={endTime || Date.now()}
                          onComplete={handleCountdownComplete}
                          renderer={props => {
                            const { hours, minutes, seconds, completed } = props;
                            const h = String(hours || 0).padStart(2, "0");
                            const m = String(minutes || 0).padStart(2, "0");
                            const s = String(seconds || 0).padStart(2, "0");
                            const newTimeDisplay = `${h}:${m}:${s}`;

                            // Update the display state if it changed
                            if (newTimeDisplay !== timeDisplay) {
                              setTimeDisplay(newTimeDisplay);
                            }

                            return (
                              <span
                                style={{
                                  fontSize: "14px",
                                  color: timeDisplay <= "00:01:00" ? "#c41e1e" : "#1FB77D",
                                }}
                              >
                                {completed ? "00:00:00" : timeDisplay}
                              </span>
                            );
                          }}
                        />
                      </Typography>
                    </Typography>
                  )}
                </Box>
              </Box>

              <Box sx={{ p: 4, position: "relative" }}>
                <Box sx={{ position: "absolute", top: "80px", px: 3 }}>
                  <Typography variant="body1" sx={{ opacity: "0.1", textAlign: "justify" }}>
                    {user_id.map(value => value)}
                  </Typography>
                </Box>
                <Typography variant="body1" fontWeight={600} sx={{ mb: 3 }}>
                  {t("question")} {currentQuestionIndex + 1}/{totalQuestions}
                </Typography>

                <Box sx={{ mb: 4 }}>{parse(currentQuestion.input.text)}</Box>

                {/* Tampilkan gambar soal jika ada */}
                {currentQuestion.input.image_url && (
                  <Box sx={{ textAlign: "center", mb: 4 }}>
                    <img
                      src={`${import.meta.env.VITE_API_URL}/static/question/${
                        currentQuestion.input.image_url
                      }`}
                      alt="Question illustration"
                      style={{ maxWidth: "100%", maxHeight: "300px" }}
                    />
                  </Box>
                )}

                {currentQuestion.answer_type === "single" ? (
                  <RadioGroup
                    value={Object.entries(selectedAnswers).find(([, val]) => val)?.[0] || ""}
                    sx={optionContainerStyle}
                  >
                    {allImageOnly ? (
                      <Grid container spacing={2} sx={{ mb: 4 }}>
                        <Grid container spacing={2} sx={{ mb: 4 }}>
                          {Object.entries(currentQuestion.choices)
                            .filter(([, choice]) => choice.text || choice.image_url)
                            .map(([key, choice]) => (
                              <Grid size={{ xs: 6 }} key={key}>
                                <Box
                                  sx={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    textAlign: "center",
                                    cursor: "pointer",
                                    p: 1,
                                    border: selectedAnswers[key]
                                      ? "2px solid #1976d2"
                                      : "1px solid #e0e0e0",
                                    borderRadius: 1,
                                    "&:hover": {
                                      backgroundColor: "#f5f5f5",
                                    },
                                  }}
                                  onClick={() => handleChoiceChange(key)}
                                >
                                  <Radio
                                    checked={!!selectedAnswers[key]}
                                    onChange={() => handleChoiceChange(key)}
                                    value={key}
                                    sx={{ mb: 1 }}
                                  />
                                  {choice.text && (
                                    <Typography variant="body2" sx={{ mb: 1 }}>
                                      {choice.text}
                                    </Typography>
                                  )}
                                  {choice.image_url && (
                                    <img
                                      src={`${import.meta.env.VITE_API_URL}/static/question/${
                                        choice.image_url
                                      }`}
                                      alt={`Option ${key}`}
                                      style={{
                                        maxHeight: "150px",
                                        maxWidth: "100%",
                                        borderRadius: 6,
                                      }}
                                    />
                                  )}
                                </Box>
                              </Grid>
                            ))}
                        </Grid>
                      </Grid>
                    ) : (
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        {Object.entries(currentQuestion.choices)
                          .filter(([_, choice]) => choice.text != null || choice.image_url != null)
                          .map(([key, choice]) => (
                            <FormControlLabel
                              key={key}
                              value={key}
                              control={
                                <Radio
                                  onChange={() => handleChoiceChange(key)}
                                  sx={{
                                    color: "#81b29a",
                                    "&.Mui-checked": { color: "#81b29a" },
                                  }}
                                />
                              }
                              label={
                                <Box sx={{ textAlign: "center" }}>
                                  {choice.text && <Typography>{choice.text}</Typography>}
                                  {choice.image_url && (
                                    <img
                                      src={`${import.meta.env.VITE_API_URL}/static/question/${
                                        choice.image_url
                                      }`}
                                      alt={`Option ${key}`}
                                      style={{
                                        maxHeight: allImageOnly ? "120px" : "50px",
                                        maxWidth: allImageOnly ? "120px" : "100%",
                                        borderRadius: 6,
                                      }}
                                    />
                                  )}
                                </Box>
                              }
                              sx={{ mb: 1 }}
                            />
                          ))}
                      </Box>
                    )}
                  </RadioGroup>
                ) : (
                  <Box sx={optionContainerStyle}>
                    {allImageOnly ? (
                      <Grid container spacing={2}>
                        {Object.entries(currentQuestion.choices)
                          .filter(([, choice]) => choice.text || choice.image_url)
                          .map(([key, choice]) => (
                            <Grid size={{ xs: 6 }} key={key}>
                              <Box
                                sx={{
                                  display: "flex",
                                  flexDirection: "column",
                                  alignItems: "center",
                                  textAlign: "center",
                                  cursor: "pointer",
                                  p: 1,
                                  border: selectedAnswers[key]
                                    ? "2px solid #1976d2"
                                    : "1px solid #e0e0e0",
                                  borderRadius: 1,
                                  "&:hover": {
                                    backgroundColor: "#f5f5f5",
                                  },
                                }}
                                onClick={() => handleChoiceChange(key)}
                              >
                                <Checkbox
                                  checked={!!selectedAnswers[key]}
                                  onChange={() => handleChoiceChange(key)}
                                  sx={{ mb: 1 }}
                                />
                                {choice.text && (
                                  <Typography variant="body2" sx={{ mb: 1 }}>
                                    {choice.text}
                                  </Typography>
                                )}
                                {choice.image_url && (
                                  <img
                                    src={`${import.meta.env.VITE_API_URL}/static/question/${
                                      choice.image_url
                                    }`}
                                    alt={`Option ${key}`}
                                    style={{
                                      maxHeight: "150px",
                                      maxWidth: "100%",
                                      borderRadius: 6,
                                    }}
                                  />
                                )}
                              </Box>
                            </Grid>
                          ))}
                      </Grid>
                    ) : (
                      <>
                        {Object.entries(currentQuestion.choices)
                          .filter(([_, choice]) => choice.text != null || choice.image_url != null)
                          .map(([key, choice]) => (
                            <FormControlLabel
                              key={key}
                              control={
                                <Checkbox
                                  checked={!!selectedAnswers[key]}
                                  onChange={() => handleChoiceChange(key)}
                                  sx={{
                                    color: "#81b29a",
                                    "&.Mui-checked": { color: "#81b29a" },
                                  }}
                                />
                              }
                              label={
                                <Box sx={{ textAlign: "center" }}>
                                  {choice.text && <Typography>{choice.text}</Typography>}
                                  {choice.image_url && (
                                    <img
                                      src={`${import.meta.env.VITE_API_URL}/static/question/${
                                        choice.image_url
                                      }`}
                                      alt={`Option ${key}`}
                                      style={{
                                        maxHeight: allImageOnly ? "120px" : "50px",
                                        maxWidth: allImageOnly ? "120px" : "100%",
                                        borderRadius: 6,
                                      }}
                                    />
                                  )}
                                </Box>
                              }
                              sx={{ mr: allImageOnly ? 2 : 0 }}
                            />
                          ))}
                      </>
                    )}
                  </Box>
                )}
                {!isMandatory && (
                  <Collapse in={hasSelection} timeout="auto" unmountOnExit>
                    <Button variant="outlined" color="primary" onClick={handleClearAll}>
                      {t("clear_all")}
                    </Button>
                  </Collapse>
                )}

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mt: 2,
                  }}
                >
                  <Box>
                    <Button
                      variant="outlined"
                      startIcon={<FaChevronLeft />}
                      onClick={handlePrevQuestion}
                      disabled={currentQuestionIndex === 0 || isSubmitting}
                      sx={{
                        mr: 2,
                        borderColor: "#e0e0e0",
                        color: "text.secondary",
                        "&:hover": {
                          borderColor: "#c3c3c3",
                          backgroundColor: "#f5f5f5",
                        },
                      }}
                    >
                      {t("prev")}
                    </Button>

                    {currentQuestionIndex < totalQuestions - 1 ? (
                      <Button
                        variant="outlined"
                        endIcon={<FaChevronRight />}
                        onClick={handleNextQuestion}
                        disabled={isSubmitting || (!hasSelection && isMandatory)}
                        sx={{
                          borderColor: "#e0e0e0",
                          color: "#81b29a",
                          "&:hover": {
                            borderColor: "#81b29a",
                            backgroundColor: "rgba(129, 178, 154, 0.04)",
                          },
                        }}
                      >
                        {t("next_button")}
                      </Button>
                    ) : (
                      <Button
                        variant="outlined"
                        onClick={handleOpenSubmitDialog}
                        disabled={isSubmitting || (!hasSelection && isMandatory)}
                        sx={{
                          borderColor: "#e0e0e0",
                          color: "#81b29a",
                          "&:hover": {
                            borderColor: "#81b29a",
                            backgroundColor: "rgba(129, 178, 154, 0.04)",
                          },
                        }}
                      >
                        {t("submit")}
                      </Button>
                    )}
                  </Box>
                </Box>
              </Box>
            </Paper>

            <DialogComp
              title={t("submit_assessment")}
              open={openSubmitDialog}
              onClose={handleCloseSubmitDialog}
              actions={
                <>
                  <Button onClick={handleCloseSubmitDialog} variant="outlined" color="primary">
                    {t("cancel_button")}
                  </Button>
                  <Button
                    onClick={handleConfirmSubmit}
                    variant="contained"
                    color="success"
                    loading={loading_submit}
                  >
                    {t("submit")}
                  </Button>
                </>
              }
            >
              <Typography variant="body1" fontWeight="600" sx={{ mb: 2 }}>
                {t("subtest_label")}: {assessmentData?.subtest_name}
              </Typography>
              <Box>
                {hasDuration && (
                  <Box sx={{ bgcolor: "background.default", p: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      {t("time_remaining")}:{" "}
                      <Typography component="span" color="primary">
                        <span
                          style={{
                            fontSize: "14px",
                            color: timeDisplay <= "00:01:00" ? "#c41e1e" : "#1FB77D",
                          }}
                        >
                          {timeDisplay}
                        </span>
                      </Typography>
                    </Typography>
                  </Box>
                )}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    border: "2px solid #e0e0e0",
                  }}
                >
                  <Box sx={{ alignItems: "center", borderRight: "2px solid #e0e0e0", padding: 2 }}>
                    <Typography variant="h5" fontWeight="600">
                      {totalQuestions}
                    </Typography>
                    <Typography>{t("question")}</Typography>
                  </Box>
                  <Box sx={{ alignItems: "center", padding: 2 }}>
                    <Typography variant="h5" fontWeight="600">
                      {answeredCount}
                    </Typography>
                    <Typography>{t("answered")}</Typography>
                  </Box>
                  <Box sx={{ alignItems: "center", padding: 2 }}>
                    <Typography variant="h5" fontWeight="600">
                      {totalQuestions - answeredCount}
                    </Typography>
                    <Typography>{t("unanswered")}</Typography>
                  </Box>
                </Box>
              </Box>
            </DialogComp>
          </Container>
        </ProctoringProvider>
      </AntiCopyProvider>
    );
  }
};

export default QuestionAnswer;
