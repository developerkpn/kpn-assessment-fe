import useAPI from "@/hooks/useAPI";
import { useLoading } from "@/providers/LoadingProvider";
import { snack } from "@/providers/SnackbarProvider";
import theme from "@/theme";
import {
  AC_COMPETENCY_MASTER,
  AC_TARGET_GRADES,
  ACCompetencyCode,
  ACCompetencyFormItem,
  ACRecommendationType,
  ACReportStatus,
  createInitialCompetencyMap,
  evaluateACClient,
  getRequiredLevelsByGrade,
} from "@/utils/acCompetencyMaster";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import DownloadIcon from "@mui/icons-material/Download";
import SaveIcon from "@mui/icons-material/Save";
import SearchIcon from "@mui/icons-material/Search";
import SendIcon from "@mui/icons-material/Send";
import {
  Box,
  Button,
  Chip,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { isAxiosError } from "axios";
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const STEPS = [
  "Identitas Asesi",
  "Profil Kompetensi",
  "Ringkasan & Rekomendasi",
  "Development Plan",
];

const SCROLLABLE_SELECT_MENU_PROPS = {
  anchorOrigin: {
    vertical: "bottom" as const,
    horizontal: "left" as const,
  },
  transformOrigin: {
    vertical: "top" as const,
    horizontal: "left" as const,
  },
  PaperProps: {
    sx: {
      maxHeight: 220,
      overflowY: "auto",
      "&::-webkit-scrollbar": {
        width: "6px",
      },
      "&::-webkit-scrollbar-thumb": {
        backgroundColor: "#ccc",
        borderRadius: "4px",
      },
    },
  },
};

const ACReportCreateEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const API = useAPI();
  const navigate = useNavigate();
  const { showLoading, hideLoading } = useLoading();

  const [activeStep, setActiveStep] = useState(0);

  // Step 1: Identitas Asesi & Golongan Tujuan
  const [nik, setNik] = useState("");
  const [name, setName] = useState("");
  const [gender, setGender] = useState("Perempuan");
  const [age, setAge] = useState("");
  const [businessUnit, setBusinessUnit] = useState("");
  const [department, setDepartment] = useState("");
  const [workLocation, setWorkLocation] = useState("");
  const [joinDate, setJoinDate] = useState("");
  const [reviewDate, setReviewDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [assessorName, setAssessorName] = useState("");
  const [currentPositionGrade, setCurrentPositionGrade] = useState("");
  const [proposedPosition, setProposedPosition] = useState("");
  const [targetGrade, setTargetGrade] = useState("6A");

  // Step 2 & 4: 9 Kompetensi & 70:20:10
  const [competencies, setCompetencies] = useState<Record<ACCompetencyCode, ACCompetencyFormItem>>(
    () => createInitialCompetencyMap("6A")
  );

  // Step 3: Ringkasan & Rekomendasi
  const [strength, setStrength] = useState("");
  const [areaOfDevelopment, setAreaOfDevelopment] = useState("");
  const [manualRecOverride, setManualRecOverride] = useState<ACRecommendationType | null>(null);
  const [devDuration, setDevDuration] = useState("6 - 12 bulan");
  const [evaluationGrade, setEvaluationGrade] = useState("6A");
  const [signPlaceDate, setSignPlaceDate] = useState("");
  const [currentStatus, setCurrentStatus] = useState<ACReportStatus>("Draft");

  // Load existing report when editing
  useEffect(() => {
    if (!id) return;
    let mounted = true;
    const fetchDetail = async () => {
      showLoading();
      try {
        const res = await API.get(`/report-ac/${id}`);
        const d = res.data?.data;
        if (!mounted || !d) return;

        setNik(d.assessee_nik || "");
        setName(d.assessee_name || "");
        setGender(d.gender || "Perempuan");
        setAge(d.age || "");
        setBusinessUnit(d.business_unit || "");
        setDepartment(d.department || "");
        setWorkLocation(d.work_location || "");
        setJoinDate(d.join_date || "");
        setReviewDate(d.review_date || "");
        setAssessorName(d.assessor_name || "");
        setCurrentPositionGrade(d.current_position_grade || "");
        setProposedPosition(d.proposed_position || "");
        setTargetGrade(d.target_grade || "6A");
        setStrength(d.strength || "");
        setAreaOfDevelopment(d.area_of_development || "");
        setDevDuration(d.development_duration || "6 - 12 bulan");
        setEvaluationGrade(d.evaluation_grade || d.target_grade || "6A");
        setSignPlaceDate(d.sign_place_date || "");
        setCurrentStatus(d.status === "Completed" ? "Completed" : "Draft");

        if (d.recommendation_type && d.recommendation_type !== d.auto_recommendation_type) {
          setManualRecOverride(d.recommendation_type);
        } else {
          setManualRecOverride(null);
        }

        const nextMap = createInitialCompetencyMap(d.target_grade || "6A");
        if (Array.isArray(d.competencies)) {
          for (const item of d.competencies) {
            const code = item.competency_code as ACCompetencyCode;
            const master = AC_COMPETENCY_MASTER.find((m) => m.code === code);
            if (nextMap[code] && master) {
              nextMap[code] = {
                competency_code: code,
                actual_level: Number(item.actual_level || nextMap[code].actual_level),
                uraian_kompetensi: item.uraian_kompetensi || "",
                uraian_gap: item.uraian_gap === "-" ? "" : item.uraian_gap || "",
                training_recommendation:
                  item.training_recommendation || master.defaultTraining,
                coaching_plan: item.coaching_plan || master.coachingOptions[0],
                ojt_plan: item.ojt_plan || master.ojtOptions[0],
              };
            }
          }
        }
        setCompetencies(nextMap);
      } catch (error) {
        if (isAxiosError(error)) {
          snack.error(error.response?.data?.message || "Gagal memuat detail Report AC");
        } else {
          snack.error("Terjadi kesalahan saat memuat Report AC");
        }
        navigate("/admin/report-ac");
      } finally {
        hideLoading();
      }
    };
    fetchDetail();
    return () => {
      mounted = false;
    };
  }, [id]);

  const evaluation = useMemo(
    () => evaluateACClient(targetGrade, competencies),
    [targetGrade, competencies]
  );

  const selectedRecommendation: ACRecommendationType =
    manualRecOverride ?? evaluation.autoRecType;

  const gapCompetencies = useMemo(
    () => evaluation.items.filter((item) => !item.isPass),
    [evaluation.items]
  );

  const handleGradeChange = (newGrade: string) => {
    setTargetGrade(newGrade);
    setEvaluationGrade(newGrade);
    // Pastikan setiap kompetensi yang baru menjadi gap memiliki default training/coaching/OJT otomatis
    const reqMap = getRequiredLevelsByGrade(newGrade);
    setCompetencies((prev) => {
      const updated = { ...prev };
      for (const m of AC_COMPETENCY_MASTER) {
        const cur = updated[m.code];
        const isGapNow = cur.actual_level < reqMap[m.code];
        updated[m.code] = {
          ...cur,
          training_recommendation: isGapNow
            ? cur.training_recommendation || m.defaultTraining
            : cur.training_recommendation,
          coaching_plan: isGapNow
            ? cur.coaching_plan || m.coachingOptions[0]
            : cur.coaching_plan,
          ojt_plan: isGapNow ? cur.ojt_plan || m.ojtOptions[0] : cur.ojt_plan,
        };
      }
      return updated;
    });
    snack.info(`Standar nilai kompetensi otomatis disesuaikan ke Golongan ${newGrade}`);
  };

  const handleSetScore = (code: ACCompetencyCode, level: number) => {
    const master = AC_COMPETENCY_MASTER.find((m) => m.code === code)!;
    const reqLvl = getRequiredLevelsByGrade(targetGrade)[code];
    setCompetencies((prev) => {
      const cur = prev[code];
      const isGap = level < reqLvl;
      return {
        ...prev,
        [code]: {
          ...cur,
          actual_level: level,
          training_recommendation: isGap
            ? cur.training_recommendation || master.defaultTraining
            : cur.training_recommendation,
          coaching_plan: isGap
            ? cur.coaching_plan || master.coachingOptions[0]
            : cur.coaching_plan,
          ojt_plan: isGap ? cur.ojt_plan || master.ojtOptions[0] : cur.ojt_plan,
        },
      };
    });
  };

  const handleUpdateCompField = (
    code: ACCompetencyCode,
    field: keyof ACCompetencyFormItem,
    value: string
  ) => {
    setCompetencies((prev) => ({
      ...prev,
      [code]: {
        ...prev[code],
        [field]: value,
      },
    }));
  };

  const parseDarwinDateToISO = (raw?: unknown): string | null => {
    if (!raw || typeof raw !== "string") return null;
    const val = raw.trim();
    if (!val) return null;

    // YYYY-MM-DD atau ISO timestamp
    const isoMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(val);
    if (isoMatch) {
      return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
    }

    // DD-MM-YYYY atau DD/MM/YYYY
    const dmyMatch = /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/.exec(val);
    if (dmyMatch) {
      const dd = dmyMatch[1].padStart(2, "0");
      const mm = dmyMatch[2].padStart(2, "0");
      return `${dmyMatch[3]}-${mm}-${dd}`;
    }

    const parsed = new Date(val);
    if (!Number.isNaN(parsed.getTime())) {
      const yyyy = parsed.getFullYear();
      const mm = String(parsed.getMonth() + 1).padStart(2, "0");
      const dd = String(parsed.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    }
    return null;
  };

  const calculateAgeYears = (isoDate: string): number | null => {
    const [y, m, d] = isoDate.split("-").map(Number);
    if (!y || !m || !d) return null;
    const today = new Date();
    let years = today.getFullYear() - y;
    const monthDiff = today.getMonth() + 1 - m;
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < d)) {
      years--;
    }
    return years >= 0 && years < 120 ? years : null;
  };

  const handleLookupDarwin = async () => {
    if (!nik.trim()) {
      snack.warning("Masukkan NIK terlebih dahulu");
      return;
    }
    showLoading();
    try {
      const res = await API.get(`/report-ac/darwin/${encodeURIComponent(nik.trim())}`);
      const emp = res.data?.data || res.data;
      if (emp && (emp.full_name || emp.assessee_name || emp.name)) {
        setName(emp.full_name || emp.assessee_name || emp.name || name);

        if (emp.gender && typeof emp.gender === "string") {
          const g = emp.gender.trim().toLowerCase();
          if (g === "m" || g.startsWith("male") || g.startsWith("laki") || g === "pria") {
            setGender("Laki-laki");
          } else if (
            g === "f" ||
            g.startsWith("female") ||
            g.startsWith("perempuan") ||
            g === "wanita"
          ) {
            setGender("Perempuan");
          }
        }

        if (emp.age) {
          const rawAge = String(emp.age).trim();
          setAge(/^\d+$/.test(rawAge) ? `${rawAge} tahun` : rawAge);
        } else {
          const dobIso = parseDarwinDateToISO(
            emp.date_of_birth || emp.dob || emp.birth_date
          );
          const years = dobIso ? calculateAgeYears(dobIso) : null;
          if (years !== null) {
            setAge(`${years} tahun`);
          }
        }

        const buVal = emp.group_company || emp.business_unit || emp.company_name;
        if (buVal) {
          setBusinessUnit(String(buVal).trim());
        }

        const deptVal =
          emp.department_name || emp.department || emp.functional_area || emp.division;
        if (deptVal) {
          setDepartment(String(deptVal).trim());
        }

        const locVal =
          emp.office_area || emp.work_location || emp.location || emp.work_area_code;
        if (locVal) {
          setWorkLocation(String(locVal).trim());
        }

        const joinIso = parseDarwinDateToISO(
          emp.date_of_joining || emp.date_join || emp.join_date
        );
        if (joinIso) {
          setJoinDate(joinIso);
        }

        const posVal = String(
          emp.designation_name || emp.designation || emp.position || ""
        ).trim();
        const gradeVal = String(
          emp.contribution_level || emp.job_level || emp.grade || ""
        ).trim();
        if (posVal && gradeVal && !posVal.toLowerCase().includes(gradeVal.toLowerCase())) {
          setCurrentPositionGrade(`${posVal} / ${gradeVal}`);
        } else if (posVal || gradeVal) {
          setCurrentPositionGrade(posVal || gradeVal);
        }

        snack.success("Data karyawan berhasil ditemukan dari Darwinbox");
      } else {
        snack.info("Data NIK tidak ditemukan di Darwinbox, silakan isi secara manual");
      }
    } catch {
      snack.info("Data NIK belum tersedia dari Darwinbox, silakan lanjutkan isi manual");
    } finally {
      hideLoading();
    }
  };

  const validateFormForStatus = (status: ACReportStatus): boolean => {
    if (!nik.trim() || !name.trim()) {
      snack.warning("Mohon lengkapi NIK dan Nama Asesi terlebih dahulu pada Step 1");
      setActiveStep(0);
      return false;
    }

    if (status === "Completed") {
      // Validasi Step 1: Identitas Asesi & Posisi/Golongan
      const step0Checks: Array<[string, string]> = [
        [gender, "Gender"],
        [age, "Usia"],
        [businessUnit, "Unit Bisnis"],
        [department, "Departemen"],
        [workLocation, "Lokasi Kerja"],
        [reviewDate, "Tanggal Review"],
        [assessorName, "Assessor"],
        [currentPositionGrade, "Posisi & Golongan Saat Ini"],
        [proposedPosition, "Posisi Tujuan"],
        [targetGrade, "Golongan (Grade) Tujuan"],
      ];

      for (const [val, label] of step0Checks) {
        if (!val || !val.trim()) {
          snack.warning(`Mohon lengkapi kolom "${label}" pada Step 1 (Identitas Asesi)`);
          setActiveStep(0);
          return false;
        }
      }

      // Validasi Step 2: Uraian Kompetensi & Uraian Gap (khusus aspek GAP)
      for (const d of evaluation.items) {
        const entry = competencies[d.code];
        if (!entry?.uraian_kompetensi?.trim()) {
          snack.warning(
            `Mohon isi Uraian Kompetensi pada aspek "${d.no}. ${d.name}" (Step 2)`
          );
          setActiveStep(1);
          return false;
        }
        if (
          !d.isPass &&
          (!entry?.uraian_gap?.trim() || entry.uraian_gap.trim() === "-")
        ) {
          snack.warning(
            `Mohon isi Uraian Gap pada aspek "${d.no}. ${d.name}" (Step 2)`
          );
          setActiveStep(1);
          return false;
        }
      }

      // Validasi Step 3: Kekuatan & Area Pengembangan
      if (!strength.trim()) {
        snack.warning("Mohon isi Kekuatan / Strength pada Step 3");
        setActiveStep(2);
        return false;
      }
      if (!areaOfDevelopment.trim()) {
        snack.warning("Mohon isi Area Pengembangan / Area of Development pada Step 3");
        setActiveStep(2);
        return false;
      }

      // Validasi Step 4: Rencana Pengembangan 70:20:10 untuk aspek GAP
      for (const d of gapCompetencies) {
        const entry = competencies[d.code];
        if (
          !entry?.training_recommendation?.trim() ||
          !entry?.coaching_plan?.trim() ||
          !entry?.ojt_plan?.trim()
        ) {
          snack.warning(
            `Mohon lengkapi Rencana Pengembangan (Training, Coaching, OJT) pada aspek "${d.name}" (Step 4)`
          );
          setActiveStep(3);
          return false;
        }
      }
    }

    return true;
  };

  const buildReportPayload = (status: ACReportStatus) => ({
    assessee_nik: nik.trim(),
    assessee_name: name.trim(),
    gender,
    age: age.trim(),
    business_unit: businessUnit.trim(),
    department: department.trim(),
    work_location: workLocation.trim(),
    join_date: joinDate || null,
    review_date: reviewDate || null,
    assessor_name: assessorName.trim(),
    current_position_grade: currentPositionGrade.trim(),
    proposed_position: proposedPosition.trim(),
    target_grade: targetGrade,
    strength,
    area_of_development: areaOfDevelopment,
    recommendation_type: selectedRecommendation,
    development_duration: devDuration.trim() || "6 - 12 bulan",
    evaluation_grade: evaluationGrade.trim() || targetGrade,
    sign_place_date: signPlaceDate.trim(),
    status,
    competencies: AC_COMPETENCY_MASTER.map((m) => competencies[m.code]),
  });

  const handleSave = async (status: ACReportStatus) => {
    if (!validateFormForStatus(status)) return;

    const payload = buildReportPayload(status);

    showLoading();
    try {
      const response = isEditMode
        ? await API.put(`/report-ac/${id}`, payload)
        : await API.post("/report-ac", payload);

      const syncStatus = response.data?.tmp_sync?.sync_status;
      const msg =
        response.data?.message ||
        (status === "Completed"
          ? "Report AC berhasil disimpan & otomatis terkirim ke sistem TMP"
          : "Draft Report AC berhasil disimpan");

      if (status === "Completed" && syncStatus && syncStatus !== "Synced") {
        snack.warning(msg);
      } else {
        snack.success(msg);
      }
      navigate("/admin/report-ac");
    } catch (error) {
      if (isAxiosError(error)) {
        snack.error(error.response?.data?.message || "Gagal menyimpan Report AC");
      } else {
        snack.error("Terjadi kesalahan saat menyimpan Report AC");
      }
    } finally {
      hideLoading();
    }
  };

  const handleDownloadCurrentPDF = async () => {
    if (!id) return;
    if (!validateFormForStatus(currentStatus)) return;

    showLoading();
    try {
      // Simpan perubahan form terbaru terlebih dahulu tanpa memicu ulang sinkronisasi TMP
      await API.put(`/report-ac/${id}?skip_tmp_sync=1`, buildReportPayload(currentStatus));

      const response = await API.get(`/report-ac/${id}/pdf`, { responseType: "blob" });
      const url = window.URL.createObjectURL(
        new Blob([response.data], { type: "application/pdf" })
      );
      const link = document.createElement("a");
      link.href = url;

      const contentDisposition = response.headers["content-disposition"];
      let filename = `Report_Assessment_Center_${name.trim().replace(/\s+/g, "_") || "Assessee"}_${nik.trim() || id}.pdf`;
      if (contentDisposition) {
        const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
        if (matches?.[1]) {
          filename = matches[1].replace(/['"]/g, "");
        }
      }

      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
      snack.success("Perubahan disimpan & PDF berhasil diunduh");
    } catch (error) {
      if (isAxiosError(error)) {
        snack.error(error.response?.data?.message || "Gagal menyimpan & mengunduh PDF");
      } else {
        snack.error("Gagal mengunduh PDF");
      }
    } finally {
      hideLoading();
    }
  };

  const gradeDigit = targetGrade.replace(/[^0-9]/g, "") || targetGrade;

  return (
    <Box
      sx={{
        p: 3,
        bgcolor: theme.palette.background.paper,
        borderRadius: 2,
        display: "flex",
        flexDirection: "column",
        gap: 3,
      }}
    >
      {/* Top Header */}
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <IconButton onClick={() => navigate("/admin/report-ac")} size="small">
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h1" color="primary">
            {isEditMode
              ? `Edit Assessment Center Report${name ? ` — ${name}` : ""}`
              : "Create Assessment Center Report"}
          </Typography>
        </Box>

        <Stack direction="row" spacing={1}>
          {isEditMode && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<DownloadIcon />}
              onClick={handleDownloadCurrentPDF}
            >
              Download PDF
            </Button>
          )}
          <Button
            variant="outlined"
            size="small"
            startIcon={<SaveIcon />}
            onClick={() => handleSave("Draft")}
          >
            Save as Draft
          </Button>
        </Stack>
      </Box>

      {/* MUI AlternativeLabel Stepper */}
      <Stepper activeStep={activeStep} alternativeLabel sx={{ pt: 1 }}>
        {STEPS.map((label, index) => (
          <Step key={label} completed={index < activeStep}>
            <StepLabel
              onClick={() => setActiveStep(index)}
              sx={{ cursor: "pointer" }}
            >
              {label}
            </StepLabel>
          </Step>
        ))}
      </Stepper>

      <Divider />

      {/* ================= STEP 0: IDENTITAS ASESI & GOLONGAN TUJUAN ================= */}
      {activeStep === 0 && (
        <Grid container spacing={2.5}>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              label="NIK / Employee ID Number *"
              size="small"
              fullWidth
              value={nik}
              onChange={(e) => setNik(e.target.value)}
              placeholder="Contoh: 04120010019"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <Tooltip title="Cari autofill dari Darwinbox (opsional)">
                      <IconButton size="small" edge="end" onClick={handleLookupDarwin}>
                        <SearchIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <TextField
              label="Nama / Name *"
              size="small"
              fullWidth
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nama lengkap asesi"
            />
          </Grid>

          <Grid item xs={6} sm={3} md={2}>
            <FormControl size="small" fullWidth>
              <InputLabel>Gender *</InputLabel>
              <Select
                label="Gender *"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
              >
                <MenuItem value="Perempuan">Perempuan</MenuItem>
                <MenuItem value="Laki-laki">Laki-laki</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={6} sm={3} md={2}>
            <TextField
              label="Usia / Age *"
              size="small"
              fullWidth
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="45 tahun"
            />
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <TextField
              label="Unit Bisnis / Business Unit *"
              size="small"
              fullWidth
              value={businessUnit}
              onChange={(e) => setBusinessUnit(e.target.value)}
              placeholder="Contoh: Cemindo Gemilang"
            />
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <TextField
              label="Departemen / Department *"
              size="small"
              fullWidth
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="Contoh: Batam Plant"
            />
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <TextField
              label="Lokasi Kerja / Work Location *"
              size="small"
              fullWidth
              value={workLocation}
              onChange={(e) => setWorkLocation(e.target.value)}
              placeholder="Contoh: Batam"
            />
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <TextField
              label="Tgl. Masuk / Join Date"
              type="date"
              size="small"
              fullWidth
              value={joinDate}
              onChange={(e) => setJoinDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <TextField
              label="Tgl. Review / Review Date *"
              type="date"
              size="small"
              fullWidth
              value={reviewDate}
              onChange={(e) => setReviewDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <TextField
              label="Assessor *"
              size="small"
              fullWidth
              value={assessorName}
              onChange={(e) => setAssessorName(e.target.value)}
              placeholder="Nama Asesor"
            />
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <TextField
              label="Posisi & Golongan Saat Ini *"
              size="small"
              fullWidth
              value={currentPositionGrade}
              onChange={(e) => setCurrentPositionGrade(e.target.value)}
              placeholder="Contoh: F&A Section Head / 5B"
            />
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <TextField
              label="Posisi Tujuan / Proposed Position *"
              size="small"
              fullWidth
              value={proposedPosition}
              onChange={(e) => setProposedPosition(e.target.value)}
              placeholder="Contoh: F&A Section Head"
            />
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <FormControl size="small" fullWidth>
              <InputLabel sx={{ color: "primary.main", fontWeight: 600 }}>
                Golongan (Grade) Tujuan * (Auto Standar Nilai)
              </InputLabel>
              <Select
                label="Golongan (Grade) Tujuan * (Auto Standar Nilai)"
                value={targetGrade}
                onChange={(e) => handleGradeChange(e.target.value)}
                MenuProps={SCROLLABLE_SELECT_MENU_PROPS}
                sx={{ fontWeight: 700 }}
              >
                {AC_TARGET_GRADES.map((g) => (
                  <MenuItem key={g} value={g}>
                    {g}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      )}

      {/* ================= STEP 1: PROFIL KOMPETENSI (SKOR 1-4, STANDAR, GAP & URAIAN) ================= */}
      {activeStep === 1 && (
        <Stack spacing={2}>
          <Paper
            variant="outlined"
            sx={{
              p: 1.75,
              bgcolor: "#fafafa",
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 1,
            }}
          >
            <Typography variant="body2">
              Golongan Tujuan:{" "}
              <Box component="span" sx={{ color: "primary.main", fontWeight: 700 }}>
                {targetGrade}
              </Box>{" "}
              — Required Proficiency Level (Standar) dan perhitungan GAP terisi otomatis.
            </Typography>
            <Chip
              label={`Meet Standard: ${evaluation.passCount} / 9 Kompetensi`}
              color={evaluation.passCount >= 7 ? "success" : "primary"}
              variant="outlined"
              size="small"
              sx={{ fontWeight: 700 }}
            />
          </Paper>

          {evaluation.items.map((d) => {
            const entry = competencies[d.code];
            return (
              <Paper
                key={d.code}
                variant="outlined"
                sx={{ p: 2.25, borderRadius: 2, display: "flex", flexDirection: "column", gap: 2 }}
              >
                <Box
                  sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 1.5,
                  }}
                >
                  <Box sx={{ flex: 1, minWidth: 260 }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      {d.group}
                    </Typography>
                    <Typography variant="subtitle1" fontWeight={700}>
                      {d.no}. {d.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                      {d.def}
                    </Typography>
                  </Box>

                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip
                      label={`Required: PL ${d.reqLvl}`}
                      size="small"
                      sx={{ fontWeight: 600 }}
                    />
                    <Chip
                      label={d.isPass ? `GAP: ${d.gap} (PASS)` : `GAP: ${d.gap}`}
                      color={d.isPass ? "success" : "error"}
                      variant="outlined"
                      size="small"
                      sx={{ fontWeight: 700 }}
                    />
                  </Stack>
                </Box>

                <Box
                  sx={{
                    p: 1.25,
                    borderRadius: 1,
                    bgcolor: "#f9f9f9",
                    border: "1px dashed #e0e0e0",
                  }}
                >
                  <Typography variant="caption" fontWeight={700} display="block" gutterBottom>
                    Key Behavior (Standar PL {d.reqLvl}):
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ whiteSpace: "pre-line", display: "block" }}
                  >
                    {d.keyBehavior}
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1 }}>
                  <Typography variant="body2" fontWeight={600} sx={{ mr: 1 }}>
                    Skor Aktual (1–4):
                  </Typography>
                  {[1, 2, 3, 4].map((lvl) => {
                    const isAct = d.actLvl === lvl;
                    const isReq = d.reqLvl === lvl;
                    return (
                      <Button
                        key={lvl}
                        size="small"
                        variant={isAct ? "contained" : "outlined"}
                        color={isAct ? "primary" : "inherit"}
                        onClick={() => handleSetScore(d.code, lvl)}
                        sx={{
                          minWidth: 92,
                          fontWeight: 600,
                          ...(!isAct && isReq
                            ? { bgcolor: "rgba(0,0,0,0.06)", borderColor: "#999" }
                            : {}),
                        }}
                      >
                        Level {lvl} {isReq ? "(Std)" : ""}
                      </Button>
                    );
                  })}
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Uraian Kompetensi *"
                      multiline
                      rows={3}
                      size="small"
                      fullWidth
                      value={entry.uraian_kompetensi}
                      onChange={(e) =>
                        handleUpdateCompField(d.code, "uraian_kompetensi", e.target.value)
                      }
                      placeholder={`Tuliskan uraian perilaku aktual asesi pada aspek ${d.name}...`}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label={d.isPass ? "Uraian Gap (Meet Requirement)" : "Uraian Gap *"}
                      multiline
                      rows={3}
                      size="small"
                      fullWidth
                      disabled={d.isPass}
                      value={d.isPass ? "-" : entry.uraian_gap}
                      onChange={(e) =>
                        handleUpdateCompField(d.code, "uraian_gap", e.target.value)
                      }
                      placeholder="Tuliskan uraian gap yang perlu dikembangkan..."
                    />
                  </Grid>
                </Grid>
              </Paper>
            );
          })}
        </Stack>
      )}

      {/* ================= STEP 2: KEKUATAN, AREA PENGEMBANGAN & REKOMENDASI ================= */}
      {activeStep === 2 && (
        <Stack spacing={2.5}>
          <Grid container spacing={2.5}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Kekuatan / Strength *"
                multiline
                rows={7}
                fullWidth
                value={strength}
                onChange={(e) => setStrength(e.target.value)}
                placeholder="- Tuliskan poin-poin kekuatan asesi..."
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Area Pengembangan / Area of Development *"
                multiline
                rows={7}
                fullWidth
                value={areaOfDevelopment}
                onChange={(e) => setAreaOfDevelopment(e.target.value)}
                placeholder="- Tuliskan poin-poin area pengembangan asesi..."
              />
            </Grid>
          </Grid>

          <Paper variant="outlined" sx={{ p: 2.5, bgcolor: "#fafafa", borderRadius: 2 }}>
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 1.5,
                gap: 1,
              }}
            >
              <Typography variant="subtitle2" fontWeight={700}>
                Rekomendasi / Recommendation *
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="caption" color="text.secondary">
                  {evaluation.ruleInfo}
                </Typography>
                {manualRecOverride && (
                  <Button
                    size="small"
                    variant="text"
                    onClick={() => setManualRecOverride(null)}
                  >
                    Ikuti Otomatis
                  </Button>
                )}
              </Stack>
            </Box>

            <Stack spacing={1.25} sx={{ mb: 2.5 }}>
              {[
                {
                  key: "Suitable" as ACRecommendationType,
                  label: `Sesuai untuk golongan ${targetGrade} / Recommended for grade ${targetGrade}`,
                },
                {
                  key: "Need Development" as ACRecommendationType,
                  label: `Perlu pengembangan dan evaluasi selama ${
                    devDuration || "6 - 12 bulan"
                  } untuk golongan ${evaluationGrade || targetGrade}`,
                },
                {
                  key: "Not Recommended" as ACRecommendationType,
                  label: `Belum sesuai untuk golongan ${gradeDigit} / Not recommended for grade ${gradeDigit}`,
                },
              ].map((opt) => {
                const isSelected = selectedRecommendation === opt.key;
                return (
                  <Box
                    key={opt.key}
                    onClick={() =>
                      setManualRecOverride(
                        opt.key === evaluation.autoRecType ? null : opt.key
                      )
                    }
                    sx={{
                      p: 1.5,
                      borderRadius: 1.5,
                      border: "1px solid",
                      borderColor: isSelected ? "primary.main" : "divider",
                      bgcolor: isSelected ? "rgba(185, 31, 39, 0.08)" : "background.paper",
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      cursor: "pointer",
                    }}
                  >
                    <Box
                      sx={{
                        width: 22,
                        height: 22,
                        borderRadius: 0.75,
                        border: "1px solid",
                        borderColor: isSelected ? "primary.main" : "grey.400",
                        bgcolor: isSelected ? "primary.main" : "transparent",
                        color: "white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        fontSize: "0.75rem",
                      }}
                    >
                      {isSelected ? "X" : ""}
                    </Box>
                    <Typography variant="body2" fontWeight={isSelected ? 700 : 400}>
                      {opt.label}
                    </Typography>
                  </Box>
                );
              })}
            </Stack>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Durasi Pengembangan (jika Need Development)"
                  size="small"
                  fullWidth
                  disabled={selectedRecommendation !== "Need Development"}
                  value={devDuration}
                  onChange={(e) => setDevDuration(e.target.value)}
                  placeholder="Contoh: 6 - 12 bulan"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl
                  size="small"
                  fullWidth
                  disabled={selectedRecommendation !== "Need Development"}
                >
                  <InputLabel>Golongan Evaluasi</InputLabel>
                  <Select
                    label="Golongan Evaluasi"
                    value={evaluationGrade}
                    onChange={(e) => setEvaluationGrade(e.target.value)}
                    MenuProps={SCROLLABLE_SELECT_MENU_PROPS}
                  >
                    {AC_TARGET_GRADES.map((g) => (
                      <MenuItem key={g} value={g}>
                        {g}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Tempat & Bulan Laporan (Footer TTD)"
                  size="small"
                  fullWidth
                  value={signPlaceDate}
                  onChange={(e) => setSignPlaceDate(e.target.value)}
                  placeholder="Contoh: Jakarta, Oktober 2026"
                />
              </Grid>
            </Grid>
          </Paper>
        </Stack>
      )}

      {/* ================= STEP 3: RENCANA PENGEMBANGAN 70:20:10 ================= */}
      {activeStep === 3 && (
        <Stack spacing={2}>
          <Paper
            variant="outlined"
            sx={{
              p: 1.75,
              bgcolor: "#fafafa",
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 1,
            }}
          >
            <Typography variant="body2">
              Menampilkan kompetensi dengan <strong>GAP &lt; 0</strong>. Rekomendasi{" "}
              <strong>10% Training</strong> terbentuk otomatis; pilih/sesuaikan opsi{" "}
              <strong>20% Coaching</strong> & <strong>70% OJT</strong>.
            </Typography>
            <Chip
              label={`${gapCompetencies.length} Kompetensi GAP`}
              color={gapCompetencies.length > 0 ? "primary" : "success"}
              variant="outlined"
              size="small"
              sx={{ fontWeight: 700 }}
            />
          </Paper>

          {gapCompetencies.length === 0 ? (
            <Paper variant="outlined" sx={{ p: 4, textAlign: "center" }}>
              <Typography variant="body2" color="text.secondary">
                Seluruh 9 kompetensi telah memenuhi standar nilai golongan tujuan (PASS). Tidak
                diperlukan rencana pengembangan gap.
              </Typography>
            </Paper>
          ) : (
            gapCompetencies.map((d) => {
              const entry = competencies[d.code];
              const selectedCoachVal = d.coachingOptions.includes(entry.coaching_plan)
                ? entry.coaching_plan
                : "__custom__";
              const selectedOjtIdx = d.ojtOptions.includes(entry.ojt_plan)
                ? entry.ojt_plan
                : "__custom__";

              return (
                <Paper
                  key={d.code}
                  variant="outlined"
                  sx={{ p: 2.25, borderRadius: 2, display: "flex", flexDirection: "column", gap: 2 }}
                >
                  <Typography variant="subtitle2" color="primary" fontWeight={700}>
                    {d.name} (Aktual PL {d.actLvl} / Standar PL {d.reqLvl} → GAP {d.gap})
                  </Typography>

                  <Grid container spacing={2}>
                    {/* 10% Training */}
                    <Grid item xs={12} md={4}>
                      <Typography variant="caption" fontWeight={700} display="block" sx={{ mb: 1 }}>
                        10% Training Soft Competencies (Otomatis)
                      </Typography>
                      <TextField
                        size="small"
                        fullWidth
                        multiline
                        rows={4}
                        value={entry.training_recommendation}
                        onChange={(e) =>
                          handleUpdateCompField(
                            d.code,
                            "training_recommendation",
                            e.target.value
                          )
                        }
                      />
                    </Grid>

                    {/* 20% Coaching */}
                    <Grid item xs={12} md={4}>
                      <Typography variant="caption" fontWeight={700} display="block" sx={{ mb: 1 }}>
                        20% Coaching dengan Atasan (Pilih Opsi Sesuai Gap)
                      </Typography>
                      <FormControl size="small" fullWidth sx={{ mb: 1 }}>
                        <Select
                          value={selectedCoachVal}
                          onChange={(e) => {
                            if (e.target.value !== "__custom__") {
                              handleUpdateCompField(d.code, "coaching_plan", e.target.value);
                            }
                          }}
                        >
                          {d.coachingOptions.map((opt, idx) => (
                            <MenuItem key={idx} value={opt}>
                              Opsi Coaching {idx + 1}
                            </MenuItem>
                          ))}
                          {selectedCoachVal === "__custom__" && (
                            <MenuItem value="__custom__">Kustomisasi Teks Coaching</MenuItem>
                          )}
                        </Select>
                      </FormControl>
                      <TextField
                        size="small"
                        fullWidth
                        multiline
                        rows={3}
                        value={entry.coaching_plan}
                        onChange={(e) =>
                          handleUpdateCompField(d.code, "coaching_plan", e.target.value)
                        }
                      />
                    </Grid>

                    {/* 70% OJT */}
                    <Grid item xs={12} md={4}>
                      <Typography variant="caption" fontWeight={700} display="block" sx={{ mb: 1 }}>
                        70% On-the-Job Training / OJT (Pilih Opsi)
                      </Typography>
                      <FormControl size="small" fullWidth sx={{ mb: 1 }}>
                        <Select
                          value={selectedOjtIdx}
                          onChange={(e) => {
                            if (e.target.value !== "__custom__") {
                              handleUpdateCompField(d.code, "ojt_plan", e.target.value);
                            }
                          }}
                        >
                          {d.ojtOptions.map((opt, idx) => (
                            <MenuItem key={idx} value={opt}>
                              Opsi OJT {idx + 1}
                            </MenuItem>
                          ))}
                          {selectedOjtIdx === "__custom__" && (
                            <MenuItem value="__custom__">Kustomisasi Teks OJT</MenuItem>
                          )}
                        </Select>
                      </FormControl>
                      <TextField
                        size="small"
                        fullWidth
                        multiline
                        rows={3}
                        value={entry.ojt_plan}
                        onChange={(e) =>
                          handleUpdateCompField(d.code, "ojt_plan", e.target.value)
                        }
                      />
                    </Grid>
                  </Grid>
                </Paper>
              );
            })
          )}
        </Stack>
      )}

      <Divider />

      {/* Footer Navigation Buttons */}
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 2,
        }}
      >
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          disabled={activeStep === 0}
          onClick={() => setActiveStep((prev) => Math.max(0, prev - 1))}
        >
          Back
        </Button>

        <Stack direction="row" spacing={1.5}>
          {activeStep < STEPS.length - 1 ? (
            <Button
              variant="contained"
              endIcon={<ArrowForwardIcon />}
              onClick={() => setActiveStep((prev) => Math.min(STEPS.length - 1, prev + 1))}
            >
              Next
            </Button>
          ) : (
            <>
              <Button
                variant="outlined"
                startIcon={<SaveIcon />}
                onClick={() => handleSave("Draft")}
              >
                Save as Draft
              </Button>
              <Button
                variant="contained"
                startIcon={<SendIcon />}
                onClick={() => handleSave("Completed")}
              >
                Save & Send to TMP
              </Button>
            </>
          )}
        </Stack>
      </Box>
    </Box>
  );
};

export default ACReportCreateEdit;
