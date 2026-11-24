import DialogComp from "@/components/Dialog.tsx";
import { TableSkeleton } from "@/components/Skeleton.tsx";
import useAPI from "@/hooks/useAPI.tsx";
import useAuthStore from "@/hooks/useAuthStore.tsx";
import useDialog from "@/hooks/useDialog.tsx";
import useFetch from "@/hooks/useFetch.tsx";
import { useLoading } from "@/providers/LoadingProvider.tsx";
import { snack } from "@/providers/SnackbarProvider.tsx";
import theme from "@/theme";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import InfoIcon from "@mui/icons-material/Info";
import { Box, Button, Chip, IconButton, Tooltip, Typography } from "@mui/material";
import { isAxiosError } from "axios";
import { format } from "date-fns";
import { MaterialReactTable, MRT_ColumnDef, useMaterialReactTable } from "material-react-table";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const Batch = () => {
  const API = useAPI();
  const navigate = useNavigate();
  const getPermission = useAuthStore(state => state.getPermission);
  const { showLoading, hideLoading } = useLoading();
  const { data: batch, refetch, loading } = useFetch<{ data: any[] }>("/batch");
  const [selectedBatch, setSelectedBatch] = useState<{
    id: string;
    batch_name: string;
  } | null>(null);
  const { isOpen: isOpenDelete, open: openDelete, close: closeDelete } = useDialog();

  const formatPeriod = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return `${format(startDate, "dd MMM yyyy")} - ${format(endDate, "dd MMM yyyy")}`;
  };

  const columns: MRT_ColumnDef<any>[] = useMemo(
    () => [
      {
        header: "Name",
        accessorKey: "batch_name",
        muiTableHeadCellProps: { align: "left" },
        muiTableBodyCellProps: { align: "left" },
      },
      {
        header: "Code",
        accessorKey: "batch_code",
        muiTableHeadCellProps: { align: "left" },
        muiTableBodyCellProps: { align: "left" },
      },
      {
        header: "Total Assessee",
        accessorKey: "total_assessee",
        muiTableHeadCellProps: { align: "center" },
        muiTableBodyCellProps: { align: "center" },
      },
      {
        header: "Assessees",
        id: "assessee_names",
        accessorFn: row => row.assessee_names ?? "",
        enableHiding: true,
      },
      {
        header: "Type",
        accessorKey: "type",
        muiTableHeadCellProps: { align: "center" },
        muiTableBodyCellProps: { align: "center" },
        Cell: ({ row }) => {
          const type = row.original.type;
          return (
            <Chip
              label={type.charAt(0).toUpperCase() + type.slice(1)}
              color={type === "external" ? "info" : "primary"}
              size="small"
              sx={{ minWidth: "90px" }}
              variant="outlined"
            />
          );
        },
      },
      {
        header: "Status",
        accessorKey: "status",
        muiTableHeadCellProps: { align: "center" },
        muiTableBodyCellProps: { align: "center" },
        Cell: ({ row }) => {
          const status = row.original.status;
          return (
            <Chip
              label={status}
              color={status === "Draft" ? "info" : "success"}
              size="small"
              sx={{ minWidth: "90px" }}
              variant="outlined"
            />
          );
        },
      },
      {
        header: "Period",
        accessorFn: row => formatPeriod(row.start_period, row.end_period),
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
        Cell: ({ row }) => {
          const id = row.original.id;
          const batch_name = row.original.batch_name;
          return (
            <Box sx={{ display: "flex", justifyContent: "center", gap: "8px" }}>
              {getPermission("fupdate", 15) && (
                <Tooltip title="Edit Batch" placement="top" arrow>
                  <IconButton
                    onClick={() => {
                      if (row.original.status === "Published") {
                        snack.warning("Cannot edit, batch already published");
                        return;
                      }
                      navigate(`/admin/batch/edit/${id}`);
                    }}
                    aria-label="edit"
                    size="small"
                  >
                    <EditIcon sx={{ color: "secondary.dark" }} />
                  </IconButton>
                </Tooltip>
              )}
              <Tooltip title="View Details" placement="top" arrow>
                <IconButton
                  size="small"
                  onClick={() => navigate(`/admin/batch/detail/${id}`)}
                  aria-label="detail"
                >
                  <InfoIcon sx={{ color: "info.light" }} />
                </IconButton>
              </Tooltip>
              {getPermission("fdelete", 15) && (
                <Tooltip title="Delete Batch" placement="top" arrow>
                  <IconButton
                    color="error"
                    onClick={() => {
                      if (row.original.status === "Published") {
                        snack.warning("Cannot delete, batch already published");
                        return;
                      }
                      handleOpenDelete(id, batch_name);
                    }}
                    size="small"
                  >
                    <DeleteIcon sx={{ color: "primary.main" }} />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          );
        },
      },
    ],
    []
  );

  const table = useMaterialReactTable({
    columns,
    data: batch?.data ?? [],
    getRowId: row => row.id,
    positionGlobalFilter: "left",
    enablePagination: true,
    enableSorting: true,
    enableRowSelection: false,
    enableFullScreenToggle: false,
    enableDensityToggle: false,
    enableHiding: false,
    enableFilters: true,
    enableGlobalFilter: true,
    enableColumnFilters: false,
    globalFilterFn: "includesString",
    enableStickyHeader: true,
    enableFilterMatchHighlighting: true,
    muiTableContainerProps: {
      sx: {
        maxHeight: "calc(100vh - 200px)",
        overflowY: "auto",
        "&::-webkit-scrollbar": {
          width: "8px",
        },
        "&::-webkit-scrollbar-thumb": {
          backgroundColor: "#ccc",
          borderRadius: "4px",
        },
        "&::-webkit-scrollbar-track": {
          backgroundColor: "#f1f1f1",
        },
        "&::-webkit-scrollbar-thumb:hover": {
          backgroundColor: "#aaa",
          width: "8px",
        },
      },
    },
    muiTableHeadProps: {
      sx: {
        "& tr th": {
          position: "sticky",
          backgroundColor: theme => theme.palette.primary.main,
          color: "white",
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
        tableLayout: "fixed",
        width: "100%",
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
      columnVisibility: {
        assessee_names: false,
      },
      sorting: [
        {
          id: "period",
          desc: true,
        },
      ],
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
            borderColor: theme => theme.palette.primary.main,
          },
        },
      },
    },
    muiTopToolbarProps: {
      sx: {
        backgroundColor: theme => theme.palette.background.paper,
        // borderBottom: `1px solid ${theme.palette.divider}`,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        // padding: "8px 16px",
      },
    },
  });

  const handleOpenDelete = (id: string, batch_name: string) => {
    setSelectedBatch({ id, batch_name });
    openDelete();
  };

  const handleDelete = async (id: string) => {
    showLoading();
    try {
      const res = await API.delete(`/batch/${id}`);
      refetch();
      snack.success(res.data?.message);
    } catch (error) {
      if (isAxiosError(error)) {
        const data = error.response?.data;
        snack.error(data?.message || "Terjadi kesalahan");
      } else {
        snack.error("Error, check log for details");
      }
    } finally {
      closeDelete();
      hideLoading();
    }
  };

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
      <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="h1" color="primary">
          Batch
        </Typography>
        {getPermission("fcreate", 15) && (
          <Button
            startIcon={<AddIcon />}
            variant="contained"
            onClick={() => navigate(`/admin/batch/create`)}
            size="medium"
          >
            Create Batch
          </Button>
        )}
      </Box>

      <Box sx={{ flex: 1, minWidth: 0, overflow: "auto" }}>
        {!loading ? (
          getPermission("fread", 15) && <MaterialReactTable table={table} />
        ) : (
          <TableSkeleton column={4} row={2} small />
        )}
      </Box>

      <DialogComp
        title="Delete Batch"
        open={isOpenDelete}
        onClose={closeDelete}
        actions={
          <>
            <Button onClick={closeDelete} variant="outlined" color="inherit">
              Cancel
            </Button>
            {selectedBatch && (
              <Button
                onClick={() => handleDelete(selectedBatch?.id)}
                variant="contained"
                color="error"
              >
                Delete
              </Button>
            )}
          </>
        }
      >
        {selectedBatch && (
          <Typography>{`Are you sure you want to delete ${selectedBatch.batch_name}?`}</Typography>
        )}
      </DialogComp>
    </Box>
  );
};

export default Batch;
