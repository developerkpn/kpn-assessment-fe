import DialogComp from "@/components/Dialog";
import LanguageSelector from "@/components/LanguageSelector";
import useAPI from "@/hooks/useAPIAssesse";
import useFetch from "@/hooks/useFetch";
import useLanguageStore from "@/hooks/useLanguageStore";
import { snack } from "@/providers/SnackbarProvider";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Container,
  FormControlLabel,
  Grid2 as Grid,
  Paper,
  Radio,
  RadioGroup,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { isAxiosError } from "axios";
import React, { useEffect, useMemo, useState } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import logo from "../../assets/kpn-logo.png";
import ProctoringProvider from "./ProctoringProvider";
import parse from "html-react-parser";

interface Choice {
  text?: string;
  image_url?: string | null;
  point?: string;
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

const QuestionAnswerExample: React.FC = () => {
  const { t } = useTranslation();
  const api = useAPI();
  const navigate = useNavigate();
  const { id, token } = useParams<{ id: string; token: string }>();
  const { data: Question, loading } = useFetch<any>(`/assessment/test/subtest/example/${id}`);
  const selectedLanguage = useLanguageStore(state => state.selectedLanguage);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, boolean>>({});
  const [openSubmitDialog, setOpenSubmitDialog] = useState(false);

  // Determine if example answers should be shown
  const isExampleAnswerShown = useMemo(
    () => Question?.is_example_answer_shown ?? false,
    [Question]
  );

  const questions = useMemo<QuestionItem[]>(
    () => Question?.data?.[selectedLanguage] ?? [],
    [Question, selectedLanguage]
  );
  const subtestname = useMemo(() => Question?.subtest_name ?? "", [Question]);
  const intro_desc = useMemo<string>(
    () => Question?.intro_desc?.[selectedLanguage] ?? "",
    [Question, selectedLanguage]
  );

  const totalQuestions = useMemo(() => questions.length, [questions]);
  const currentQuestion = useMemo(
    () => questions[currentQuestionIndex],
    [currentQuestionIndex, questions]
  );

  const choices = currentQuestion?.choices || {};

  const allImageOnly =
    Object.values(choices).filter(choice => choice.image_url).length > 0 &&
    Object.values(choices)
      .filter(choice => choice.image_url)
      .every(choice => choice.image_url);

  const rightAnswers = useMemo(() => {
    return questions.map(value => {
      let answer = "";
      Object.keys(value.choices).forEach(key => {
        const choice = value.choices[key];
        const pointint = parseInt(choice.point || "0", 10);
        if (pointint > 0) {
          answer = key;
        }
      });
      return answer;
    });
  }, [questions]);

  const currentAnswer = useMemo(
    () => Object.entries(selectedAnswers).find(([, val]) => val)?.[0] ?? null,
    [selectedAnswers]
  );

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
        Object.keys(updated).forEach(k => (updated[k] = false));
        updated[key] = true;
      } else {
        updated[key] = !updated[key];
      }
      currentQuestion.choosen_answer = updated;
      return updated;
    });
  };

  const handleClearAll = () => {
    setSelectedAnswers(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(k => (updated[k] = false));
      return updated;
    });
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleOpenSubmitDialog = () => setOpenSubmitDialog(true);
  const handleCloseSubmitDialog = () => setOpenSubmitDialog(false);

  const handleContinueToTest = async () => {
    try {
      await api.patch(`assessment/test/subtest/example/${id}`);
      navigate(`/client/assessment/${token}/subtest/${id}`);
    } catch (error) {
      if (isAxiosError(error)) {
        snack.error(error.response?.data.message);
      }
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4, display: "flex", justifyContent: "center" }}>
        <CircularProgress />
      </Container>
    );
  }

  if (questions.length === 0) return null;

  return (
    <ProctoringProvider isskip={true}>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper elevation={1} sx={{ overflow: "hidden", borderRadius: 1 }}>
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
                sx={{ width: 30, height: 30, mr: 1, borderRadius: 1 }}
              />
              <Typography variant={isMobile ? "h6" : "h5"} sx={{ fontWeight: 600, mb: 0, mr: 2 }}>
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
                  {subtestname}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Typography variant="h5">{t("example_question")}</Typography>
              <LanguageSelector />
            </Box>
          </Box>

          <Box sx={{ p: 4 }}>
            <Paper variant="outlined" sx={{ p: 2, my: 1 }}>
              <h3 style={{ marginBottom: 1 }}>{t("introduction")}</h3>
              <Box>{parse(intro_desc)}</Box>
            </Paper>
            <Typography variant="body1" fontWeight={600} sx={{ mb: 3 }}>
              {t("question")} {currentQuestionIndex + 1}/{totalQuestions}
            </Typography>

            <Box sx={{ mb: 4 }}>{parse(currentQuestion.input.text)}</Box>

            {currentQuestion.input.image_url && (
              <Box sx={{ textAlign: "center", mb: 4 }}>
                <img
                  src={`${import.meta.env.VITE_API_URL}/static/question/${
                    currentQuestion.input.image_url
                  }`}
                  alt="Question illustration"
                  style={{ maxWidth: "100%", maxHeight: 300 }}
                />
              </Box>
            )}

            {currentQuestion.answer_type === "single" ? (
              <RadioGroup value={currentAnswer || ""}>
                {allImageOnly ? (
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
                ) : (
                  // Standard vertical layout for text or mixed options
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 4 }}>
                    {Object.entries(currentQuestion.choices)
                      .filter(([, choice]) => choice.text || choice.image_url)
                      .map(([key, choice]) => (
                        <FormControlLabel
                          key={key}
                          value={key}
                          control={<Radio onChange={() => handleChoiceChange(key)} />}
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
                                    maxHeight: "100px",
                                    maxWidth: "100%",
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
              <Box sx={{ mb: 4 }}>
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
                      .filter(([, choice]) => choice.text || choice.image_url)
                      .map(([key, choice]) => (
                        <FormControlLabel
                          key={key}
                          control={
                            <Checkbox
                              checked={!!selectedAnswers[key]}
                              onChange={() => handleChoiceChange(key)}
                            />
                          }
                          label={choice.text}
                        />
                      ))}
                  </>
                )}
              </Box>
            )}

            {/* Show correct/wrong only if allowed */}
            {isExampleAnswerShown && currentAnswer && (
              <Alert
                severity={
                  currentAnswer === rightAnswers[currentQuestionIndex] ? "success" : "error"
                }
                sx={{ mb: 2 }}
              >
                {currentAnswer === rightAnswers[currentQuestionIndex]
                  ? t("Answer Correct")
                  : t("Answer Incorrect")}
              </Alert>
            )}

            <Box sx={{ mb: 2 }}>
              <Button variant="outlined" onClick={handleClearAll}>
                {t("clear_all")}
              </Button>
            </Box>

            <Box sx={{ display: "flex", justifyContent: "space-between", mt: 2 }}>
              <Button
                variant="outlined"
                startIcon={<FaChevronLeft />}
                onClick={handlePrevQuestion}
                disabled={currentQuestionIndex === 0}
              >
                {t("prev")}
              </Button>

              {currentQuestionIndex < totalQuestions - 1 ? (
                <Button
                  variant="outlined"
                  endIcon={<FaChevronRight />}
                  onClick={handleNextQuestion}
                >
                  {t("next_button")}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="success"
                  onClick={handleOpenSubmitDialog}
                  sx={{ color: "white" }}
                >
                  {t("submit")}
                </Button>
              )}
            </Box>
          </Box>
        </Paper>

        <DialogComp
          title={t("continue_test_assessment")}
          open={openSubmitDialog}
          onClose={handleCloseSubmitDialog}
          actions={
            <>
              <Button onClick={handleCloseSubmitDialog}>{t("cancel_button")}</Button>
              <Button variant="contained" onClick={handleContinueToTest}>
                {t("continue")}
              </Button>
            </>
          }
        >
          <Typography>{t("confirm_continue")}</Typography>
        </DialogComp>
      </Container>
    </ProctoringProvider>
  );
};

export default QuestionAnswerExample;
