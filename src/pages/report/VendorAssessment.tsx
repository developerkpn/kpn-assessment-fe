import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  Box,
  Button,
  Chip,
  IconButton,
  Tooltip,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  CloudUpload as CloudUploadIcon,
  Visibility as VisibilityIcon,
  Download as DownloadIcon,
  Info as InfoIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import { MaterialReactTable, type MRT_ColumnDef, useMaterialReactTable } from "material-react-table";
import { format } from "date-fns";
import useAPI from "@/hooks/useAPI";
import useAuthStore from "@/hooks/useAuthStore";
import { snack } from "@/providers/SnackbarProvider";
import UploadVendorModal from "@/components/vendor-assessment/UploadVendorModal";
import DetailVendorModal from "@/components/vendor-assessment/DetailVendorModal";
import PdfViewerModal from "@/components/vendor-assessment/PdfViewerModal";

export const VendorAssessment: React.FC = () => {
  const API = useAPI();
  const accessToken = useAuthStore(state => state.access_token);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Modals state
  const [openUpload, setOpenUpload] = useState(false);
  const [openDetail, setOpenDetail] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);

  // PDF Preview Modal state
  const [openPdf, setOpenPdf] = useState(false);
  const [pdfTitle, setPdfTitle] = useState("");
  const [pdfFileUrl, setPdfFileUrl] = useState("");
  const [pdfDownloadUrl, setPdfDownloadUrl] = useState("");

  // Delete Dialog state
  const [openDelete, setOpenDelete] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<any | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get("/vendor-assessment");
      setData(res.data?.data || []);
    } catch (err: any) {
      console.error("Error fetching vendor assessments:", err);
      snack.error(err?.response?.data?.message || "Gagal memuat data vendor assessment");
    } finally {
      setLoading(false);
    }
  }, [API]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenPdfPreview = (fileUrl: string, downloadUrl: string, title: string) => {
    setPdfFileUrl(fileUrl);
    setPdfDownloadUrl(downloadUrl);
    setPdfTitle(title);
    setOpenPdf(true);
  };

  const handleDeleteConfirm = async () => {
    if (!recordToDelete) return;
    setDeleteLoading(true);
    try {
      await API.delete(`/vendor-assessment/${recordToDelete.id}`);
      snack.success("Data asesmen vendor berhasil dihapus");
      setOpenDelete(false);
      setRecordToDelete(null);
      fetchData();
    } catch (err: any) {
      console.error("Delete error:", err);
      snack.error(err?.response?.data?.message || "Gagal menghapus data");
    } finally {
      setDeleteLoading(false);
    }
  };

  const columns = useMemo<MRT_ColumnDef<any>[]>(
    () => [
      {
        header: "Nama Peserta",
        accessorKey: "participant_name",
        Cell: ({ row }) => (
          <Box>
            <Typography variant="body2" fontWeight="600">
              {row.original.participant_name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {row.original.participant_email}
            </Typography>
          </Box>
        ),
      },
      {
        header: "NIK",
        accessorKey: "participant_nik",
        Cell: ({ cell }) => cell.getValue<string>() || "-",
      },
      {
        header: "Vendor",
        accessorKey: "vendor_name",
        Cell: ({ cell }) => (
          <Chip
            label={cell.getValue<string>()}
            size="small"
            color="primary"
            variant="outlined"
            sx={{ fontWeight: "600" }}
          />
        ),
      },
      {
        header: "Tgl Asesmen",
        accessorKey: "assessment_date",
        Cell: ({ cell }) => {
          const val = cell.getValue<string>();
          if (!val) return "-";
          try {
            return format(new Date(val), "dd MMM yyyy");
          } catch {
            return val;
          }
        },
      },
      {
        header: "Critical Thinking",
        accessorKey: "has_critical_thinking",
        muiTableHeadCellProps: { align: "center" },
        muiTableBodyCellProps: { align: "center" },
        Cell: ({ row }) => {
          const taken = row.original.has_critical_thinking;
          return (
            <Chip
              label={taken ? "Yes" : "No"}
              color={taken ? "success" : "default"}
              size="small"
              variant={taken ? "filled" : "outlined"}
              sx={{ minWidth: 60 }}
            />
          );
        },
      },
      {
        header: "Work & Endurance",
        accessorKey: "has_work_endurance",
        muiTableHeadCellProps: { align: "center" },
        muiTableBodyCellProps: { align: "center" },
        Cell: ({ row }) => {
          const taken = row.original.has_work_endurance;
          return (
            <Chip
              label={taken ? "Yes" : "No"}
              color={taken ? "success" : "default"}
              size="small"
              variant={taken ? "filled" : "outlined"}
              sx={{ minWidth: 60 }}
            />
          );
        },
      },
      {
        header: "Growth Mindset",
        accessorKey: "has_growth_mindset",
        muiTableHeadCellProps: { align: "center" },
        muiTableBodyCellProps: { align: "center" },
        Cell: ({ row }) => {
          const taken = row.original.has_growth_mindset;
          return (
            <Chip
              label={taken ? "Yes" : "No"}
              color={taken ? "success" : "default"}
              size="small"
              variant={taken ? "filled" : "outlined"}
              sx={{ minWidth: 60 }}
            />
          );
        },
      },
      {
        header: "Actions",
        id: "actions",
        enableSorting: false,
        enableColumnFilter: false,
        muiTableHeadCellProps: { align: "center" },
        muiTableBodyCellProps: { align: "center" },
        Cell: ({ row }) => {
          const item = row.original;
          const apiBase = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
          const tokenQuery = accessToken ? `?token=${encodeURIComponent(accessToken)}` : "";
          const fileUrl = `${apiBase}/vendor-assessment/${item.id}/file${tokenQuery}`;
          const downloadUrl = `${apiBase}/vendor-assessment/${item.id}/download${tokenQuery}`;

          return (
            <Box sx={{ display: "flex", justifyContent: "center", gap: 0.5 }}>
              <Tooltip title="Lihat Report PDF" arrow>
                <IconButton
                  size="small"
                  color="primary"
                  onClick={() => handleOpenPdfPreview(fileUrl, downloadUrl, item.file_original_name)}
                >
                  <VisibilityIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <Tooltip title="Unduh Report PDF" arrow>
                <IconButton
                  size="small"
                  color="secondary"
                  component="a"
                  href={downloadUrl}
                  download
                >
                  <DownloadIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <Tooltip title="Detail Asesmen" arrow>
                <IconButton
                  size="small"
                  color="info"
                  onClick={() => {
                    setSelectedRecord(item);
                    setOpenDetail(true);
                  }}
                >
                  <InfoIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <Tooltip title="Hapus Data" arrow>
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => {
                    setRecordToDelete(item);
                    setOpenDelete(true);
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          );
        },
      },
    ],
    []
  );

  const table = useMaterialReactTable({
    columns,
    data,
    state: { isLoading: loading },
    enableRowSelection: false,
    enableColumnFilters: true,
    enableGlobalFilter: true,
    positionGlobalFilter: "left",
    enableStickyHeader: true,
    muiTableContainerProps: {
      sx: { maxHeight: "calc(100vh - 280px)" },
    },
  });

  return (
    <Box sx={{ p: 3 }}>
      {/* Header Bar */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          mb: 3,
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight="bold" color="primary">
            Vendor Assessment
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Kelola dan tinjau data hasil asesmen peserta dari vendor eksternal (Critical Thinking, Work & Endurance, Growth Mindset)
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchData}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<CloudUploadIcon />}
            onClick={() => setOpenUpload(true)}
            sx={{ fontWeight: "600" }}
          >
            + Upload Report Vendor
          </Button>
        </Box>
      </Box>

      {/* Main Table */}
      <MaterialReactTable table={table} />

      {/* Upload Modal (CR 8 Acceptance Criteria 1 & 2) */}
      <UploadVendorModal
        open={openUpload}
        onClose={() => setOpenUpload(false)}
        onSuccess={fetchData}
      />

      {/* Detail Modal (CR 8 Acceptance Criteria 3) */}
      <DetailVendorModal
        open={openDetail}
        onClose={() => {
          setOpenDetail(false);
          setSelectedRecord(null);
        }}
        data={selectedRecord}
        onPreviewPdf={handleOpenPdfPreview}
      />

      {/* PDF Viewer Modal (CR 8 Acceptance Criteria 3) */}
      <PdfViewerModal
        open={openPdf}
        onClose={() => setOpenPdf(false)}
        title={pdfTitle}
        fileUrl={pdfFileUrl}
        downloadUrl={pdfDownloadUrl}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDelete} onClose={() => setOpenDelete(false)}>
        <DialogTitle>Konfirmasi Hapus</DialogTitle>
        <DialogContent>
          <Typography>
            Apakah Anda yakin ingin menghapus data hasil asesmen vendor untuk peserta{" "}
            <strong>{recordToDelete?.participant_name}</strong>? File report terkait juga akan dihapus.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenDelete(false)} disabled={deleteLoading}>
            Batal
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={deleteLoading}
          >
            {deleteLoading ? "Menghapus..." : "Hapus"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VendorAssessment;
