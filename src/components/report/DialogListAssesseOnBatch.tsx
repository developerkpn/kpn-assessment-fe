import useAPI from "@/hooks/useAPI";
import useFetch from "@/hooks/useFetch";
import { useLoading } from "@/providers/LoadingProvider";
import { snack } from "@/providers/SnackbarProvider";
import { ListAssesseeperBatch } from "@/types/ReportTypes";
import { Preview } from "@mui/icons-material";
import DownloadIcon from "@mui/icons-material/Download";
import { Box, Button, Dialog, IconButton, Tooltip, Typography } from "@mui/material";
import { isAxiosError } from "axios";
import { forwardRef, useImperativeHandle, useMemo, useState, useRef } from "react";
import CustomTable, { CustomTableColumn, CustomTablePropsRef } from "../CustomTable";
import { error } from "console";

export interface DialogListAssesseOnBatchRef {
  open: () => void;
}

interface DialogListAssesseOnBatchProps {
  Batchid: string;
  Batchname: string;
}

export const DialogListAssesseOnBatch = forwardRef<
  DialogListAssesseOnBatchRef,
  DialogListAssesseOnBatchProps
>((props, ref) => {
  const refTable = useRef<CustomTablePropsRef | null>(null);
  const { Batchid, Batchname } = props;
  const API = useAPI();
  const [openDialog, setOpenDialog] = useState(false);
  const { data: data_user, loading } = useFetch<{ data: ListAssesseeperBatch[] }>(
    `/report/personal/${Batchid}`
  );
  const { showLoading, hideLoading } = useLoading();

  const handleGenerateBulkReport = async () => {
    try {
      showLoading();
      if (!refTable.current) {
        throw Error("Something wrong");
      }
      if (!Object.keys(refTable.current?.GetSelectedData()).length) {
        throw Error("No assessee selected");
      }
      let assessee_id = Object.keys(refTable.current.GetSelectedData());
      const payload = {
        batch_id: Batchid,
        assessee_id: assessee_id,
      };
      const response = await API.post("/report/bulkpdfgen", payload, { responseType: "blob" });
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
      link.setAttribute("download", filename || `${Batchid}-individualreport.zip`);

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
        snack.error(error.response?.data.message);
      } else {
        snack.error((error as Error).message);
      }
    } finally {
      hideLoading();
    }
  };

  const handleExportBatchExcel = async () => {
    showLoading();
    try {
      const response = await API.get(`/report/exportscores/${Batchid}`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;

      const contentDisposition = response.headers["content-disposition"];
      let filename;
      if (contentDisposition) {
        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        const matches = filenameRegex.exec(contentDisposition);
        if (matches != null && matches[1]) {
          filename = matches[1].replace(/['"]/g, "");
        }
      }

      link.setAttribute("download", filename || `${Batchname}-Scores.xlsx`);
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);

      snack.success("Excel downloaded successfully");
    } catch (error) {
      if (isAxiosError(error)) {
        snack.error(error.response?.data?.message || "Failed to download excel");
      } else {
        snack.error("An unexpected error occurred while downloading the excel");
      }
    } finally {
      hideLoading();
    }
  };

  const handleDownloadReport = async (
    assessee_nik: string,
    assessee_email: string,
    batch_id: string,
    assessee_name: string
  ) => {
    showLoading();
    try {
      const payload = {
        assessee_id: assessee_nik,
        assessee_email: assessee_email,
        batch_id: batch_id,
      };
      const URLParams = new URLSearchParams();
      URLParams.append("assessee_id", assessee_nik);
      URLParams.append("assessee_email", assessee_email);
      URLParams.append("batch_id", batch_id);
      const response = await API.get(`/report/pdfgen?${URLParams.toString()}`, {
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
      link.setAttribute(
        "download",
        filename || `${assessee_name}_${assessee_nik}-PotentialAssessment.pdf`
      );

      // Append link ke body (tidak terlihat)
      document.body.appendChild(link);

      // Klik link untuk memulai download
      link.click();

      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);

      snack.success("Report downloaded successfully");
      // window.open(
      //   `${location.protocol}//${location.hostname}${
      //     import.meta.env.MODE == "development" ? `:5000` : ""
      //   }/api/report/pdfgen?${URLParams.toString()}`
      // );
    } catch (error) {
      if (isAxiosError(error)) {
        snack.error(error.response?.data?.message || "Failed to download report");
      } else {
        snack.error("An unexpected error occurred while downloading the report");
      }
    } finally {
      hideLoading();
    }
  };

  //column list user
  const columns = useMemo<CustomTableColumn<ListAssesseeperBatch>[]>(
    () => [
      {
        header: "NIK",
        accessorKey: "assessee_nik",
      },
      {
        header: "Name",
        accessorKey: "assessee_name",
      },
      {
        header: "Email",
        accessorKey: "assessee_email",
      },
      {
        header: "First Taken",
        accessorKey: "first_taken_subtest_at",
      },
      {
        header: "Last Finished",
        accessorKey: "last_finished_subtest_at",
      },
      {
        header: "Action",
        accessorKey: "assessee_nik",
        renderCell: row => {
          return (
            <>
              {!!row.last_finished_subtest_at && (
                <Tooltip title="Download Report" placement="top" arrow>
                  <IconButton
                    onClick={() =>
                      handleDownloadReport(
                        row.assessee_nik,
                        row.assessee_email,
                        Batchid,
                        row.assessee_name
                      )
                    }
                  >
                    <DownloadIcon />
                  </IconButton>
                </Tooltip>
              )}
            </>
          );
        },
      },
    ],
    [data_user]
  );

  useImperativeHandle(ref, () => ({
    open: () => {
      setOpenDialog(true);
    },
  }));
  return (
    <Dialog
      open={openDialog}
      onClose={() => {
        setOpenDialog(false);
      }}
      maxWidth="xl"
    >
      <Box sx={{ p: 4, height: "80dvh", width: "90dvw", display: "flex", flexDirection: "column" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h4" sx={{ mb: 2 }}>
            {Batchname}
          </Typography>
          <Button
            variant="contained"
            onClick={e => {
              handleGenerateBulkReport();
            }}
          >
            Generate Bulk Report
          </Button>
        </Box>
        <Box sx={{ flex: 1, minHeight: 0, overflow: "auto" }}>
          <CustomTable
            ref={refTable}
            columns={columns}
            data={data_user?.data ?? []}
            isLoading={loading}
            enableRowSelection={row => {
              return !!row.original.last_finished_subtest_at;
            }}
            idAccessor={"assessee_nik"}
            showSkeleton
          />
        </Box>
        <Box sx={{ display: "flex", justifyContent: "flex-start", pt: 2 }}>
          <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleExportBatchExcel}>
            Export Excel
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
});
