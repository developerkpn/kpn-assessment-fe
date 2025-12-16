import CustomTable, { CustomTableColumn } from "@/components/CustomTable";
import useAPI from "@/hooks/useAPI.tsx";
import useAuthStore from "@/hooks/useAuthStore.tsx";
import useFetch from "@/hooks/useFetch.tsx";
import { useLoading } from "@/providers/LoadingProvider.tsx";
import { snack } from "@/providers/SnackbarProvider.tsx";
import DownloadIcon from "@mui/icons-material/Download";
import InfoIcon from "@mui/icons-material/Info";
import { Box, IconButton, Tooltip, Typography } from "@mui/material";
import { isAxiosError } from "axios";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import {
  DialogListAssesseOnBatch,
  DialogListAssesseOnBatchRef,
} from "@/components/report/DialogListAssesseOnBatch";
import { useState, useRef, useMemo } from "react";
import theme from "@/theme";
import EditIcon from "@mui/icons-material/Edit";

const BatchReport = () => {
  const API = useAPI();
  const navigate = useNavigate();
  const getPermission = useAuthStore(state => state.getPermission);
  const { showLoading, hideLoading } = useLoading();
  const { data: data_report, loading } = useFetch<any>("/report");
  const [batch_id, setBatchId] = useState("");
  const [batch_name, setBatchname] = useState("");
  const refDialog = useRef<DialogListAssesseOnBatchRef>(null);
  const report_gen = useMemo(() => data_report?.data ?? [], [data_report]);

  console.log("report_gen", JSON.stringify(report_gen, null, 2));

  const handleDownloadReport = async (batchId: string, batchName: string, batchCode: string) => {
    showLoading();
    try {
      const response = await API.get(`/report/download/${batchId}`, {
        responseType: "blob",
      });

      // Buat URL objek dari blob
      const url = window.URL.createObjectURL(new Blob([response.data]));

      // Buat elemen anchor untuk download
      const link = document.createElement("a");
      link.href = url;

      // Ambil filename dari headers Content-Disposition jika ada
      const contentDisposition = response.headers["content-disposition"];
      let filename;

      if (contentDisposition) {
        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        const matches = filenameRegex.exec(contentDisposition);
        if (matches != null && matches[1]) {
          filename = matches[1].replace(/['"]/g, "");
        }
      }

      // Jika tidak ada nama file dari header, gunakan default
      link.setAttribute("download", filename || `${batchName}-${batchCode}-report.xlsx`);

      // Append link ke body (tidak terlihat)
      document.body.appendChild(link);

      // Klik link untuk memulai download
      link.click();

      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);

      snack.success("Report downloaded successfully");
    } catch (error) {
      if (isAxiosError(error)) {
        const data = error.response?.data;
        snack.error(data?.message || "Failed to download report");
      } else {
        snack.error("Error downloading report");
        console.error("Error downloading report:", error);
      }
    } finally {
      hideLoading();
    }
  };

  const formatPeriod = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return `${format(startDate, "dd MMM yyyy")} - ${format(endDate, "dd MMM yyyy")}`;
  };

  const columns: CustomTableColumn<any>[] = [
    {
      header: "Name",
      accessorKey: "batch_name",
      muiTableHeadCellProps: { align: "left" },
      muiTableBodyCellProps: { align: "left" },
      muiFilterTextFieldProps: {
        sx: {
          "& .MuiInputBase-input::placeholder": {
            color: "#ffff",
            opacity: 1,
          },
          "& .MuiInputLabel-root": {
            color: "#ffff",
          },
          "& .MuiInputBase-input": {
            color: "#ffff",
          },
        },
      },
    },
    {
      header: "Code",
      accessorKey: "batch_code",
      filterVariant: "autocomplete",
      enableColumnFilter: true,
      muiTableHeadCellProps: { align: "left" },
      muiTableBodyCellProps: { align: "left" },
      muiFilterTextFieldProps: {
        sx: {
          "& .MuiInputBase-input::placeholder": {
            color: "#ffff",
            opacity: 1,
          },
          "& .MuiInputLabel-root": {
            color: "#ffff",
          },
          "& .MuiInputBase-input": {
            color: "#ffff",
          },
        },
      },
    },
    {
      header: "Total Assessee",
      accessorKey: "total_assessee",
      enableColumnFilter: false,
      muiTableHeadCellProps: { align: "center" },
      muiTableBodyCellProps: { align: "center" },
    },
    {
      header: "Type",
      accessorKey: "type",
      enableColumnFilter: false,
      muiTableHeadCellProps: { align: "center" },
      muiTableBodyCellProps: { align: "center" },
      renderChip: value => ({
        label: value.charAt(0).toUpperCase() + value.slice(1),
        color: value === "external" ? "info" : "primary",
        variant: "outlined",
      }),
    },
    {
      header: "Report Status",
      accessorKey: "is_report_exist",
      enableColumnFilter: false,
      muiTableHeadCellProps: { align: "center" },
      muiTableBodyCellProps: { align: "center" },
      renderChip: value => ({
        label: value ? "Report Created" : "Report Not Created",
        color: value ? "success" : "primary",
        variant: "outlined",
      }),
    },
    {
      header: "Period",
      accessorFn: row => formatPeriod(row.start_period, row.end_period),
      enableColumnFilter: false,
      muiTableHeadCellProps: { align: "left" },
      muiTableBodyCellProps: { align: "left" },
    },
    {
      header: "Actions",
      accessorKey: "actions",
      enableSorting: false,
      enableColumnFilter: false,
      muiTableHeadCellProps: { align: "center" },
      muiTableBodyCellProps: { align: "center" },
      renderCell: row => {
        const id = row.id;
        const batch_name = row.batch_name;
        const batch_code = row.batch_code;
        return (
          <Box sx={{ display: "flex", justifyContent: "center", gap: 1 }}>
            <Tooltip title="Create/Edit Report" placement="top" arrow>
              <IconButton
                size="small"
                onClick={() => {
                  if (row.report_id) {
                    navigate(`/admin/report/edit/${row.report_id}`, { state: { batchId: row.id } });
                  } else {
                    navigate(`/admin/report/create`, { state: { batchId: row.id } });
                  }
                }}
              >
                <EditIcon sx={{ color: "secondary.dark" }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="View Assessees" placement="top" arrow>
              <IconButton
                size="small"
                onClick={event => {
                  event.stopPropagation();
                  if (!row.report_id) {
                    snack.warning("Report is not created yet.");
                  } else {
                    setBatchId(row.id);
                    setBatchname(row.batch_name);
                    setTimeout(() => {
                      refDialog.current?.open();
                    }, 0);
                  }
                }}
              >
                <InfoIcon sx={{ color: "info.light" }} />
              </IconButton>
            </Tooltip>
            {/* <Tooltip title="Download Report" placement="top" arrow>
              <IconButton
                onClick={() => handleDownloadReport(id, batch_name, batch_code)}
                aria-label="download report"
                size="small"
                color="primary"
              >
                <DownloadIcon />
              </IconButton>
            </Tooltip> */}
          </Box>
        );
      },
    },
  ];

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
      <Box sx={{ mb: 2 }}>
        <Typography variant="h1" color="primary">
          Report
        </Typography>
      </Box>

      <Box sx={{ flex: 1, minWidth: 0, overflow: "auto" }}>
        <CustomTable
          columns={columns}
          data={report_gen}
          isLoading={loading}
          hasPermission={getPermission("fread", 17)}
          enableFilters={true}
          enableFacetedValues={true}
          enableColumnFilters={true}
        />
      </Box>
      {batch_id && (
        <DialogListAssesseOnBatch Batchid={batch_id} Batchname={batch_name} ref={refDialog} />
      )}
    </Box>
  );
};

export default BatchReport;
