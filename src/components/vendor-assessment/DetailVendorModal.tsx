import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Grid2 as Grid,
  Card,
  CardContent,
  Chip,
  Divider,
  IconButton,
} from "@mui/material";
import {
  Close as CloseIcon,
  Download as DownloadIcon,
  Visibility as VisibilityIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Psychology as PsychologyIcon,
  Speed as SpeedIcon,
  TrendingUp as TrendingUpIcon,
  Description as DescriptionIcon,
} from "@mui/icons-material";
import { format } from "date-fns";
import useAuthStore from "@/hooks/useAuthStore";

interface DetailVendorModalProps {
  open: boolean;
  onClose: () => void;
  data: any | null;
  onPreviewPdf: (url: string, downloadUrl: string, title: string) => void;
}

export const DetailVendorModal: React.FC<DetailVendorModalProps> = ({
  open,
  onClose,
  data,
  onPreviewPdf,
}) => {
  if (!data) return null;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    try {
      return format(new Date(dateStr), "dd MMMM yyyy");
    } catch {
      return dateStr;
    }
  };

  const accessToken = useAuthStore(state => state.access_token);
  const tokenQuery = accessToken ? `?token=${encodeURIComponent(accessToken)}` : "";
  const apiBase = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  const fileUrl = `${apiBase}/vendor-assessment/${data.id}/file${tokenQuery}`;
  const downloadUrl = `${apiBase}/vendor-assessment/${data.id}/download${tokenQuery}`;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
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
            Detail Hasil Asesmen Vendor
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {data.participant_name} ({data.vendor_name})
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ py: 3 }}>
        {/* Section 1: Participant & Vendor Info */}
        <Typography variant="subtitle2" color="primary" fontWeight="bold" sx={{ mb: 1.5 }}>
          INFORMASI PESERTA & VENDOR
        </Typography>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography variant="caption" color="text.secondary">Nama Peserta</Typography>
            <Typography variant="body1" fontWeight="600">{data.participant_name}</Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography variant="caption" color="text.secondary">Email Peserta</Typography>
            <Typography variant="body1">{data.participant_email}</Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography variant="caption" color="text.secondary">NIK</Typography>
            <Typography variant="body1">{data.participant_nik || "-"}</Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography variant="caption" color="text.secondary">Vendor Asesmen</Typography>
            <Typography variant="body1" fontWeight="600">{data.vendor_name}</Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography variant="caption" color="text.secondary">Tanggal Asesmen</Typography>
            <Typography variant="body1">{formatDate(data.assessment_date)}</Typography>
          </Grid>
          {data.notes && (
            <Grid size={{ xs: 12 }}>
              <Typography variant="caption" color="text.secondary">Catatan</Typography>
              <Typography variant="body2">{data.notes}</Typography>
            </Grid>
          )}
        </Grid>

        <Divider sx={{ my: 2 }} />

        {/* Section 2: Keikutsertaan Tes & Hasil */}
        <Typography variant="subtitle2" color="primary" fontWeight="bold" sx={{ mb: 1.5 }}>
          KEIKUTSERTAAN & HASIL MODUL TES
        </Typography>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {/* Critical Thinking */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Card
              variant="outlined"
              sx={{
                height: "100%",
                borderColor: data.has_critical_thinking ? "success.light" : "grey.300",
                backgroundColor: data.has_critical_thinking ? "rgba(46, 125, 50, 0.04)" : "inherit",
              }}
            >
              <CardContent sx={{ pb: "16px !important" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                  <PsychologyIcon color={data.has_critical_thinking ? "success" : "disabled"} />
                  <Typography variant="subtitle2" fontWeight="bold">
                    Critical Thinking
                  </Typography>
                </Box>
                <Chip
                  size="small"
                  icon={data.has_critical_thinking ? <CheckCircleIcon /> : <CancelIcon />}
                  label={data.has_critical_thinking ? "Sudah Diambil" : "Tidak Diambil"}
                  color={data.has_critical_thinking ? "success" : "default"}
                  variant={data.has_critical_thinking ? "filled" : "outlined"}
                  sx={{ mb: 1.5 }}
                />
                {data.has_critical_thinking && (
                  <Box sx={{ mt: 1, fontSize: "13px" }}>
                    <div><strong>Skor:</strong> {data.critical_thinking_score || "-"}</div>
                    <div><strong>Kategori:</strong> {data.critical_thinking_category || "-"}</div>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Work & Endurance */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Card
              variant="outlined"
              sx={{
                height: "100%",
                borderColor: data.has_work_endurance ? "success.light" : "grey.300",
                backgroundColor: data.has_work_endurance ? "rgba(46, 125, 50, 0.04)" : "inherit",
              }}
            >
              <CardContent sx={{ pb: "16px !important" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                  <SpeedIcon color={data.has_work_endurance ? "success" : "disabled"} />
                  <Typography variant="subtitle2" fontWeight="bold">
                    Work & Endurance
                  </Typography>
                </Box>
                <Chip
                  size="small"
                  icon={data.has_work_endurance ? <CheckCircleIcon /> : <CancelIcon />}
                  label={data.has_work_endurance ? "Sudah Diambil" : "Tidak Diambil"}
                  color={data.has_work_endurance ? "success" : "default"}
                  variant={data.has_work_endurance ? "filled" : "outlined"}
                  sx={{ mb: 1.5 }}
                />
                {data.has_work_endurance && (
                  <Box sx={{ mt: 1, fontSize: "13px" }}>
                    <div><strong>Skor:</strong> {data.work_endurance_score || "-"}</div>
                    <div><strong>Kategori:</strong> {data.work_endurance_category || "-"}</div>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Growth Mindset */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Card
              variant="outlined"
              sx={{
                height: "100%",
                borderColor: data.has_growth_mindset ? "success.light" : "grey.300",
                backgroundColor: data.has_growth_mindset ? "rgba(46, 125, 50, 0.04)" : "inherit",
              }}
            >
              <CardContent sx={{ pb: "16px !important" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                  <TrendingUpIcon color={data.has_growth_mindset ? "success" : "disabled"} />
                  <Typography variant="subtitle2" fontWeight="bold">
                    Growth Mindset
                  </Typography>
                </Box>
                <Chip
                  size="small"
                  icon={data.has_growth_mindset ? <CheckCircleIcon /> : <CancelIcon />}
                  label={data.has_growth_mindset ? "Sudah Diambil" : "Tidak Diambil"}
                  color={data.has_growth_mindset ? "success" : "default"}
                  variant={data.has_growth_mindset ? "filled" : "outlined"}
                  sx={{ mb: 1.5 }}
                />
                {data.has_growth_mindset && (
                  <Box sx={{ mt: 1, fontSize: "13px" }}>
                    <div><strong>Skor:</strong> {data.growth_mindset_score || "-"}</div>
                    <div><strong>Kategori:</strong> {data.growth_mindset_category || "-"}</div>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        {/* Section 3: Document File Metadata */}
        <Typography variant="subtitle2" color="primary" fontWeight="bold" sx={{ mb: 1.5 }}>
          DOKUMEN REPORT VENDOR
        </Typography>
        <Card variant="outlined" sx={{ backgroundColor: "#fbfbfb" }}>
          <CardContent sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <DescriptionIcon sx={{ fontSize: 36, color: "error.main" }} />
              <Box>
                <Typography variant="body1" fontWeight="600">{data.file_original_name}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {data.file_size ? `${(Number(data.file_size) / (1024 * 1024)).toFixed(2)} MB • ` : ""}
                  PDF Document
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<VisibilityIcon />}
                onClick={() => onPreviewPdf(fileUrl, downloadUrl, data.file_original_name)}
              >
                Lihat Report
              </Button>
              <Button
                component="a"
                href={downloadUrl}
                download
                variant="contained"
                size="small"
                startIcon={<DownloadIcon />}
              >
                Unduh Report
              </Button>
            </Box>
          </CardContent>
        </Card>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, borderTop: "1px solid #e0e0e0" }}>
        <Button onClick={onClose} variant="contained">
          Tutup
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DetailVendorModal;
