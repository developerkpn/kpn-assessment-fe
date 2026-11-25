import DialogComp from "@/components/Dialog";
import { TableSkeleton } from "@/components/Skeleton";
import useAPI from "@/hooks/useAPI";
import useAuthStore from "@/hooks/useAuthStore";
import useDialog from "@/hooks/useDialog";
import useFetch from "@/hooks/useFetch";
import { useLoading } from "@/providers/LoadingProvider";
import { snack } from "@/providers/SnackbarProvider";
import theme from "@/theme";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import DownloadIcon from "@mui/icons-material/Download";
import EditIcon from "@mui/icons-material/Edit";
import SyncIcon from "@mui/icons-material/Sync";
import { Box, Button, Chip, IconButton, Tooltip, Typography } from "@mui/material";
import { isAxiosError } from "axios";
import { format } from "date-fns";
import { MaterialReactTable, MRT_ColumnDef, useMaterialReactTable } from "material-react-table";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

interface ACReportRow {
  id: string;
  assessee_nik: string;
  assessee_name: string;
  business_unit: string;
  target_grade: string;
  recommendation_type: "Suitable" | "Need Development" | "Not Recommended";
  status: "Draft" | "Completed";
  tmp_sync_status: "Pending" | "Synced" | "Failed";
  tmp_error_message?: string | null;
  review_date?: string | null;
}

const ACReportList = () => {
  const API = useAPI();
  const navigate = useNavigate();
  const getPermission = useAuthStore((state) => state.getPermission);
  const roleName = useAuthStore((state) => state.role_name);
  const { showLoading, hideLoading } = useLoading();
  const { data, refetch, loading } = useFetch<{ data: ACReportRow[] }>("/report-ac");
  const { data: adminMenu } = useFetch<{ data: any[] }>("/menu/admin");

  const { isOpen: isOpenDelete, open: openDelete, close: closeDelete } = useDialog();
  const [selectedReport, setSelectedReport] = useState<ACReportRow | null>(null);

  const acMenuEntry = useMemo(() => {
    for (const group of adminMenu?.data ?? []) {
      const found = (group.items ?? []).find((it: any) => it.path === "/admin/report-ac");
      if (found) return found;
    }
    return null;
  }, [adminMenu]);

  const canAction = (action: "fcreate" | "fread" | "fupdate" | "fdelete") => {
    if (roleName === "Super Admin") return true;
    if (acMenuEntry && typeof acMenuEntry[action] === "boolean") {
      return acMenuEntry[action];
    }
    return getPermission(action, 17);
  };

  const rows = useMemo(() => data?.data ?? [], [data]);

  const handleDownloadPDF = async (row: ACReportRow) => {
    showLoading();
    try {
      const response = await API.get(`/report-ac/${row.id}/pdf`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(
        new Blob([response.data], { type: "application/pdf" })
      );
      const link = document.createElement("a");
      link.href = url;

      const contentDisposition = response.headers["content-disposition"];
      let filename = `Report_Assessment_Center_${row.assessee_name.replace(/\s+/g, "_")}_${row.assessee_nik}.pdf`;
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
      snack.success("Report Assessment Center PDF berhasil diunduh");
    } catch (error) {
      if (isAxiosError(error)) {
        snack.error(error.response?.data?.message || "Gagal mengunduh PDF Report AC");
      } else {
        snack.error("Terjadi kesalahan saat mengunduh PDF");
      }
    } finally {
      hideLoading();
    }
  };

  const handleRetryTMP = async (row: ACReportRow) => {
    showLoading();
    try {
      const res = await API.post(`/report-ac/${row.id}/sync-tmp`);
      snack.success(res.data?.message || "Berhasil dikirim ke sistem TMP");
      refetch();
    } catch (error) {
      if (isAxiosError(error)) {
        snack.error(error.response?.data?.message || "Gagal mengirim ulang ke TMP");
      } else {
        snack.error("Terjadi kesalahan saat sinkronisasi TMP");
      }
      refetch();
    } finally {
      hideLoading();
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedReport) return;
    showLoading();
    try {
      await API.delete(`/report-ac/${selectedReport.id}`);
      snack.success("Report Assessment Center berhasil dihapus");
      closeDelete();
      setSelectedReport(null);
      refetch();
    } catch (error) {
      if (isAxiosError(error)) {
        snack.error(error.response?.data?.message || "Gagal menghapus Report AC");
      } else {
        snack.error("Terjadi kesalahan saat menghapus Report AC");
      }
    } finally {
      hideLoading();
    }
  };

  const columns = useMemo<MRT_ColumnDef<ACReportRow>[]>(
    () => [
      {
        header: "NIK",
        accessorKey: "assessee_nik",
        minSize: 100,
        muiTableHeadCellProps: { align: "left", sx: { whiteSpace: "nowrap" } },
        muiTableBodyCellProps: {
          align: "left",
          sx: { fontFamily: "monospace", fontSize: "0.82rem", whiteSpace: "nowrap" },
        },
      },
      {
        header: "Assessee Name",
        accessorKey: "assessee_name",
        minSize: 160,
        muiTableHeadCellProps: { align: "left", sx: { whiteSpace: "nowrap" } },
        muiTableBodyCellProps: { align: "left", sx: { fontWeight: 500 } },
      },
      {
        header: "Business Unit",
        accessorKey: "business_unit",
        minSize: 140,
        muiTableHeadCellProps: { align: "left", sx: { whiteSpace: "nowrap" } },
        muiTableBodyCellProps: { align: "left" },
        Cell: ({ row }) => row.original.business_unit || "-",
      },
      {
        header: "Target Grade",
        accessorKey: "target_grade",
        minSize: 115,
        muiTableHeadCellProps: { align: "center", sx: { whiteSpace: "nowrap" } },
        muiTableBodyCellProps: { align: "center", sx: { fontWeight: 700, whiteSpace: "nowrap" } },
      },
      {
        header: "Recommendation",
        accessorKey: "recommendation_type",
        minSize: 155,
        muiTableHeadCellProps: { align: "center", sx: { whiteSpace: "nowrap" } },
        muiTableBodyCellProps: { align: "center", sx: { whiteSpace: "nowrap" } },
        Cell: ({ row }) => {
          const val = row.original.recommendation_type || "Not Recommended";
          const color =
            val === "Suitable"
              ? "success"
              : val === "Need Development"
                ? "warning"
                : "error";
          return (
            <Chip
              label={val}
              color={color}
              variant="outlined"
              size="small"
              sx={{ minWidth: 96 }}
            />
          );
        },
      },
      {
        header: "Status",
        accessorKey: "status",
        minSize: 115,
        muiTableHeadCellProps: { align: "center", sx: { whiteSpace: "nowrap" } },
        muiTableBodyCellProps: { align: "center", sx: { whiteSpace: "nowrap" } },
        Cell: ({ row }) => {
          const val = row.original.status || "Draft";
          return (
            <Chip
              label={val}
              color={val === "Completed" ? "success" : "info"}
              variant="outlined"
              size="small"
              sx={{ minWidth: 88 }}
            />
          );
        },
      },
      {
        header: "TMP Sync",
        accessorKey: "tmp_sync_status",
        minSize: 115,
        muiTableHeadCellProps: { align: "center", sx: { whiteSpace: "nowrap" } },
        muiTableBodyCellProps: { align: "center", sx: { whiteSpace: "nowrap" } },
        Cell: ({ row }) => {
          const item = row.original;
          if (item.tmp_sync_status === "Synced") {
            return (
              <Chip
                label="Synced"
                color="success"
                variant="outlined"
                size="small"
                sx={{ minWidth: 82 }}
              />
            );
          }
          if (item.tmp_sync_status === "Failed") {
            return (
              <Tooltip
                title={item.tmp_error_message || "Klik untuk kirim ulang ke sistem TMP"}
                placement="top"
                arrow
              >
                <Chip
                  icon={<SyncIcon fontSize="small" />}
                  label="Failed"
                  color="warning"
                  variant="outlined"
                  size="small"
                  clickable={canAction("fupdate")}
                  onClick={() => canAction("fupdate") && handleRetryTMP(item)}
                  sx={{ minWidth: 82, fontWeight: 600 }}
                />
              </Tooltip>
            );
          }
          if (item.status === "Completed") {
            return (
              <Tooltip
                title={item.tmp_error_message || "Klik untuk kirim ke sistem TMP"}
                placement="top"
                arrow
              >
                <Chip
                  icon={<SyncIcon fontSize="small" />}
                  label="Pending"
                  color="default"
                  variant="outlined"
                  size="small"
                  clickable={canAction("fupdate")}
                  onClick={() => canAction("fupdate") && handleRetryTMP(item)}
                  sx={{ minWidth: 82, fontWeight: 500 }}
                />
              </Tooltip>
            );
          }
          return (
            <Tooltip
              title="Selesaikan report (Completed) untuk mengirim ke sistem TMP"
              placement="top"
              arrow
            >
              <Chip
                label="Pending"
                color="default"
                variant="outlined"
                size="small"
                sx={{ minWidth: 82 }}
              />
            </Tooltip>
          );
        },
      },
      {
        header: "Review Date",
        accessorKey: "review_date",
        minSize: 120,
        muiTableHeadCellProps: { align: "center", sx: { whiteSpace: "nowrap" } },
        muiTableBodyCellProps: { align: "center", sx: { whiteSpace: "nowrap" } },
        Cell: ({ row }) => {
          const val = row.original.review_date;
          if (!val) return "-";
          const d = new Date(val);
          return Number.isNaN(d.getTime()) ? val : format(d, "dd MMM yyyy");
        },
      },
      {
        header: "Actions",
        id: "actions",
        enableSorting: false,
        enableColumnFilter: false,
        enableColumnActions: false,
        minSize: 125,
        muiTableHeadCellProps: { align: "center", sx: { whiteSpace: "nowrap" } },
        muiTableBodyCellProps: { align: "center", sx: { whiteSpace: "nowrap" } },
        Cell: ({ row }) => {
          const item = row.original;
          return (
            <Box sx={{ display: "flex", justifyContent: "center", gap: "4px" }}>
              {canAction("fupdate") && (
                <Tooltip title="Edit AC Report" placement="top" arrow>
                  <IconButton
                    size="small"
                    onClick={() => navigate(`/admin/report-ac/edit/${item.id}`)}
                  >
                    <EditIcon fontSize="small" sx={{ color: "secondary.dark" }} />
                  </IconButton>
                </Tooltip>
              )}
              <Tooltip title="Download Report PDF" placement="top" arrow>
                <IconButton size="small" onClick={() => handleDownloadPDF(item)}>
                  <DownloadIcon fontSize="small" sx={{ color: "info.main" }} />
                </IconButton>
              </Tooltip>
              {canAction("fdelete") && (
                <Tooltip title="Delete Report" placement="top" arrow>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => {
                      setSelectedReport(item);
                      openDelete();
                    }}
                  >
                    <DeleteIcon fontSize="small" sx={{ color: "primary.main" }} />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          );
        },
      },
    ],
    [acMenuEntry, roleName]
  );

  const table = useMaterialReactTable({
    columns,
    data: rows,
    getRowId: (row) => row.id,
    positionGlobalFilter: "left",
    enablePagination: true,
    enableSorting: true,
    enableColumnActions: true,
    enableRowSelection: false,
    enableFullScreenToggle: false,
    enableDensityToggle: false,
    enableHiding: false,
    enableFilters: true,
    enableGlobalFilter: true,
    enableColumnFilters: false,
    globalFilterFn: "fuzzy",
    enableStickyHeader: true,
    enableFilterMatchHighlighting: true,
    localization: {
      noRecordsToDisplay: "Belum ada data Report Assessment Center",
    },
    muiTableContainerProps: {
      sx: {
        maxHeight: "calc(100vh - 220px)",
        overflowX: "auto",
        overflowY: "auto",
        "&::-webkit-scrollbar": {
          width: "8px",
          height: "8px",
        },
        "&::-webkit-scrollbar-thumb": {
          backgroundColor: "#ccc",
          borderRadius: "4px",
        },
        "&::-webkit-scrollbar-track": {
          backgroundColor: "#f1f1f1",
        },
      },
    },
    muiTableHeadProps: {
      sx: {
        "& tr th": {
          position: "sticky",
          backgroundColor: (t) => t.palette.primary.dark,
          color: "white",
          "& .MuiIconButton-root": {
            color: "rgba(255, 255, 255, 0.85)",
            "&:hover": {
              color: "#ffffff",
              backgroundColor: "rgba(255, 255, 255, 0.12)",
            },
          },
          "& .MuiTableSortLabel-root": {
            color: "white !important",
          },
          "& .MuiTableSortLabel-icon": {
            color: "rgba(255, 255, 255, 0.85) !important",
          },
        },
      },
    },
    muiTablePaperProps: {
      elevation: 0,
      sx: {
        borderRadius: "8px",
        border: "1px solid #e0e0e0",
        overflow: "hidden",
      },
    },
    muiTableProps: {
      sx: {
        tableLayout: "auto",
        minWidth: "100%",
      },
    },
    muiTableBodyRowProps: ({ row }) => ({
      sx: {
        backgroundColor: row.index % 2 === 0 ? "white" : "#f9f9f9",
      },
    }),
    initialState: {
      showGlobalFilter: true,
      density: "comfortable",
    },
    muiSearchTextFieldProps: {
      variant: "outlined",
      size: "small",
      placeholder: "Search...",
      sx: {
        width: "300px",
        marginLeft: "auto",
        marginRight: "16px",
        marginBottom: "8px",
        "& .MuiOutlinedInput-root": {
          borderRadius: "8px",
          "& fieldset": {
            borderColor: "#e0e0e0",
          },
          "&.Mui-focused fieldset": {
            borderColor: (t) => t.palette.primary.main,
          },
        },
      },
    },
    muiTopToolbarProps: {
      sx: {
        backgroundColor: (t) => t.palette.background.paper,
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "center",
      },
    },
  });

  return (
    <Box
      sx={{
        p: 3,
        height: "100%",
        bgcolor: theme.palette.background.paper,
        borderRadius: 2,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2 }}>
        <Typography variant="h1" color="primary">
          Assessment Center Report
        </Typography>
        {canAction("fcreate") && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate("/admin/report-ac/create")}
          >
            Create AC Report
          </Button>
        )}
      </Box>

      <Box sx={{ flex: 1, minWidth: 0, overflow: "auto" }}>
        {loading ? (
          <TableSkeleton column={6} row={3} small />
        ) : (
          canAction("fread") && <MaterialReactTable table={table} />
        )}
      </Box>

      <DialogComp
        title="Delete Assessment Center Report"
        open={isOpenDelete}
        onClose={closeDelete}
        maxWidth="xs"
        actions={
          <>
            <Button variant="outlined" onClick={closeDelete}>
              Cancel
            </Button>
            <Button variant="contained" color="primary" onClick={handleConfirmDelete}>
              Delete
            </Button>
          </>
        }
      >
        <Typography variant="body2">
          Apakah Anda yakin ingin menghapus Report Assessment Center untuk{" "}
          <strong>{selectedReport?.assessee_name}</strong> ({selectedReport?.assessee_nik})?
        </Typography>
      </DialogComp>
    </Box>
  );
};

export default ACReportList;
