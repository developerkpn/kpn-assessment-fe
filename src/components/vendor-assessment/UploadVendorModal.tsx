import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  Grid2 as Grid,
  FormControlLabel,
  Checkbox,
  Card,
  CardContent,
  IconButton,
  CircularProgress,
  Divider,
} from "@mui/material";
import {
  Close as CloseIcon,
  CloudUpload as CloudUploadIcon,
  PictureAsPdf as PdfIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { snack } from "@/providers/SnackbarProvider";
import useAPI from "@/hooks/useAPI";

interface UploadVendorModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const UploadVendorModal: React.FC<UploadVendorModalProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const API = useAPI();
  const [loading, setLoading] = useState(false);

  // Form states
  const [participantName, setParticipantName] = useState("");
  const [participantEmail, setParticipantEmail] = useState("");
  const [participantNik, setParticipantNik] = useState("");
  const [vendorName, setVendorName] = useState("Faxtor");
  const [assessmentDate, setAssessmentDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [notes, setNotes] = useState("");

  // Test checkboxes & optional metrics
  const [hasCriticalThinking, setHasCriticalThinking] = useState(true);
  const [ctScore, setCtScore] = useState("");
  const [ctCategory, setCtCategory] = useState("Tinggi");

  const [hasWorkEndurance, setHasWorkEndurance] = useState(true);
  const [weScore, setWeScore] = useState("");
  const [weCategory, setWeCategory] = useState("Good");

  const [hasGrowthMindset, setHasGrowthMindset] = useState(true);
  const [gmScore, setGmScore] = useState("");
  const [gmCategory, setGmCategory] = useState("Sangat Tinggi");

  // Selected PDF file
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.name.toLowerCase().endsWith(".pdf")) {
        snack.error("Hanya file PDF yang diperbolehkan");
        return;
      }
      setSelectedFile(file);
    }
  };

  const resetForm = () => {
    setParticipantName("");
    setParticipantEmail("");
    setParticipantNik("");
    setVendorName("Faxtor");
    setAssessmentDate(new Date().toISOString().split("T")[0]);
    setNotes("");
    setHasCriticalThinking(true);
    setCtScore("");
    setCtCategory("Tinggi");
    setHasWorkEndurance(true);
    setWeScore("");
    setWeCategory("Good");
    setHasGrowthMindset(true);
    setGmScore("");
    setGmCategory("Sangat Tinggi");
    setSelectedFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!participantName.trim()) {
      snack.warning("Nama peserta wajib diisi");
      return;
    }
    if (!participantEmail.trim()) {
      snack.warning("Email peserta wajib diisi");
      return;
    }
    if (!vendorName.trim()) {
      snack.warning("Nama vendor wajib diisi");
      return;
    }
    if (!selectedFile) {
      snack.warning("Silakan pilih file PDF report hasil asesmen");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("participant_name", participantName.trim());
      formData.append("participant_email", participantEmail.trim());
      formData.append("participant_nik", participantNik.trim());
      formData.append("vendor_name", vendorName.trim());
      formData.append("assessment_date", assessmentDate);
      formData.append("notes", notes.trim());

      // Checkboxes
      formData.append("has_critical_thinking", String(hasCriticalThinking));
      if (hasCriticalThinking) {
        formData.append("critical_thinking_score", ctScore.trim());
        formData.append("critical_thinking_category", ctCategory.trim());
      }

      formData.append("has_work_endurance", String(hasWorkEndurance));
      if (hasWorkEndurance) {
        formData.append("work_endurance_score", weScore.trim());
        formData.append("work_endurance_category", weCategory.trim());
      }

      formData.append("has_growth_mindset", String(hasGrowthMindset));
      if (hasGrowthMindset) {
        formData.append("growth_mindset_score", gmScore.trim());
        formData.append("growth_mindset_category", gmCategory.trim());
      }

      const res = await API.post("/vendor-assessment", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.status === 201 || res.status === 200) {
        snack.success("Report hasil asesmen vendor berhasil diunggah!");
        resetForm();
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      snack.error(err?.response?.data?.message || err?.message || "Gagal mengunggah file");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            pb: 1,
            borderBottom: "1px solid #e0e0e0",
          }}
        >
          <Box>
            <Typography variant="h6" fontWeight="bold">
              Upload Report Hasil Asesmen Vendor
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Unggah file PDF hasil asesmen eksternal beserta keikutsertaan modul tes
            </Typography>
          </Box>
          <IconButton onClick={onClose} disabled={loading} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ py: 3 }}>
          {/* 1. Participant & Vendor Details */}
          <Typography variant="subtitle2" color="primary" fontWeight="bold" sx={{ mb: 1.5 }}>
            1. INFORMASI PESERTA & VENDOR
          </Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Nama Peserta"
                placeholder="Contoh: Peserta 1"
                fullWidth
                size="small"
                required
                value={participantName}
                onChange={(e) => setParticipantName(e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Email Peserta"
                placeholder="peserta@kpn-corp.com"
                type="email"
                fullWidth
                size="small"
                required
                value={participantEmail}
                onChange={(e) => setParticipantEmail(e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="NIK Peserta (Opsional)"
                placeholder="Contoh: NIK-2026-001"
                fullWidth
                size="small"
                value={participantNik}
                onChange={(e) => setParticipantNik(e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="Nama Vendor"
                placeholder="Faxtor / SHL / dsb."
                fullWidth
                size="small"
                required
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="Tanggal Asesmen"
                type="date"
                fullWidth
                size="small"
                required
                InputLabelProps={{ shrink: true }}
                value={assessmentDate}
                onChange={(e) => setAssessmentDate(e.target.value)}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />

          {/* 2. Test Checkboxes (CR 8 Acceptance Criteria 2) */}
          <Typography variant="subtitle2" color="primary" fontWeight="bold" sx={{ mb: 1 }}>
            2. KEIKUTSERTAAN MODUL TES (CENTANG MODUL YANG DIAMBIL)
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
            Centang tes apa saja yang sudah diambil oleh peserta berdasarkan report yang di-upload
          </Typography>

          <Grid container spacing={2} sx={{ mb: 3 }}>
            {/* Critical Thinking */}
            <Grid size={{ xs: 12 }}>
              <Card variant="outlined" sx={{ p: 1.5, backgroundColor: hasCriticalThinking ? "#f9fcf9" : "#fafafa" }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={hasCriticalThinking}
                      onChange={(e) => setHasCriticalThinking(e.target.checked)}
                      color="primary"
                    />
                  }
                  label={
                    <Typography fontWeight="bold">
                      Critical Thinking
                    </Typography>
                  }
                />
                {hasCriticalThinking && (
                  <Box sx={{ display: "flex", gap: 2, mt: 1, pl: 4 }}>
                    <TextField
                      label="Skor / Raw Score"
                      placeholder="Contoh: 22"
                      size="small"
                      value={ctScore}
                      onChange={(e) => setCtScore(e.target.value)}
                      sx={{ width: 180 }}
                    />
                    <TextField
                      label="Kategori"
                      placeholder="Tinggi / Sedang / Rendah"
                      size="small"
                      value={ctCategory}
                      onChange={(e) => setCtCategory(e.target.value)}
                      sx={{ width: 220 }}
                    />
                  </Box>
                )}
              </Card>
            </Grid>

            {/* Work & Endurance */}
            <Grid size={{ xs: 12 }}>
              <Card variant="outlined" sx={{ p: 1.5, backgroundColor: hasWorkEndurance ? "#f9fcf9" : "#fafafa" }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={hasWorkEndurance}
                      onChange={(e) => setHasWorkEndurance(e.target.checked)}
                      color="primary"
                    />
                  }
                  label={
                    <Typography fontWeight="bold">
                      Work & Endurance
                    </Typography>
                  }
                />
                {hasWorkEndurance && (
                  <Box sx={{ display: "flex", gap: 2, mt: 1, pl: 4 }}>
                    <TextField
                      label="Skor / Jumlah Kerja"
                      placeholder="Contoh: 779"
                      size="small"
                      value={weScore}
                      onChange={(e) => setWeScore(e.target.value)}
                      sx={{ width: 180 }}
                    />
                    <TextField
                      label="Kategori / Sikap Kerja"
                      placeholder="Good / Fair / Poor"
                      size="small"
                      value={weCategory}
                      onChange={(e) => setWeCategory(e.target.value)}
                      sx={{ width: 220 }}
                    />
                  </Box>
                )}
              </Card>
            </Grid>

            {/* Growth Mindset */}
            <Grid size={{ xs: 12 }}>
              <Card variant="outlined" sx={{ p: 1.5, backgroundColor: hasGrowthMindset ? "#f9fcf9" : "#fafafa" }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={hasGrowthMindset}
                      onChange={(e) => setHasGrowthMindset(e.target.checked)}
                      color="primary"
                    />
                  }
                  label={
                    <Typography fontWeight="bold">
                      Growth Mindset
                    </Typography>
                  }
                />
                {hasGrowthMindset && (
                  <Box sx={{ display: "flex", gap: 2, mt: 1, pl: 4 }}>
                    <TextField
                      label="Skor"
                      placeholder="Contoh: 18"
                      size="small"
                      value={gmScore}
                      onChange={(e) => setGmScore(e.target.value)}
                      sx={{ width: 180 }}
                    />
                    <TextField
                      label="Kategori"
                      placeholder="Sangat Tinggi / Tinggi / dsb."
                      size="small"
                      value={gmCategory}
                      onChange={(e) => setGmCategory(e.target.value)}
                      sx={{ width: 220 }}
                    />
                  </Box>
                )}
              </Card>
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />

          {/* 3. File Upload Area */}
          <Typography variant="subtitle2" color="primary" fontWeight="bold" sx={{ mb: 1.5 }}>
            3. UNGGAH FILE REPORT ASESMEN VENDOR (PDF)
          </Typography>

          {!selectedFile ? (
            <Box
              component="label"
              sx={{
                border: "2px dashed #b71c1c",
                borderRadius: 2,
                p: 3,
                textAlign: "center",
                display: "block",
                cursor: "pointer",
                backgroundColor: "#fffbfb",
                "&:hover": { backgroundColor: "#fff5f5" },
              }}
            >
              <input
                type="file"
                accept=".pdf"
                hidden
                onChange={handleFileChange}
              />
              <CloudUploadIcon sx={{ fontSize: 44, color: "primary.main", mb: 1 }} />
              <Typography variant="body1" fontWeight="bold">
                Pilih atau Tarik File Report PDF
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Mendukung format .PDF (Maksimal 50 MB)
              </Typography>
            </Box>
          ) : (
            <Card variant="outlined" sx={{ p: 2, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <PdfIcon color="error" sx={{ fontSize: 36 }} />
                <Box>
                  <Typography variant="body2" fontWeight="bold">{selectedFile.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                  </Typography>
                </Box>
              </Box>
              <IconButton color="error" onClick={() => setSelectedFile(null)} size="small">
                <DeleteIcon />
              </IconButton>
            </Card>
          )}

          {/* Optional notes */}
          <TextField
            label="Catatan Tambahan (Opsional)"
            multiline
            rows={2}
            fullWidth
            size="small"
            sx={{ mt: 2 }}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, borderTop: "1px solid #e0e0e0" }}>
          <Button onClick={onClose} disabled={loading} variant="outlined">
            Batal
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <CloudUploadIcon />}
          >
            {loading ? "Mengunggah..." : "Simpan & Upload Report"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default UploadVendorModal;
