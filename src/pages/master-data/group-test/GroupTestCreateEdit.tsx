import { Button, Typography, Box, IconButton } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { MaterialReactTable, MRT_ColumnDef, useMaterialReactTable } from "material-react-table";
import useFetch from "@/hooks/useFetch";
import useAPI from "@/hooks/useAPI";
import { snack } from "@/providers/SnackbarProvider";
import { useLoading } from "@/providers/LoadingProvider";
import DialogComp from "@/components/Dialog";
import TextFieldCtrl from "@/components/forms/TextField";
import useDialog from "@/hooks/useDialog";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckboxCtrl from "@/components/forms/Checkbox.tsx";
import RTEField from "@/components/forms/RTEField";
import useAuthStore from "@/hooks/useAuthStore";
import InfoIcon from "@mui/icons-material/Info";
import { isAxiosError } from "axios";
// import {GroupTestDetail} from "@/types/MasterData.ts";
import moment from "moment/moment";

const GroupTestCreateEdit = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const API = useAPI();
  const { showLoading, hideLoading } = useLoading();
  const { isOpen, open, close } = useDialog();
  const navigate = useNavigate();
  const { data: grouptest, refetch: refetchGroupTest } = useFetch<any>(
    isEdit ? `/grouptest/${id}` : null
  );
  const { data: availableTest, refetch: refetchAvailableTest } = useFetch<{ data: any[] }>(
    isEdit ? `/grouptest/${id}/tests-available` : null
  );
  const { data: allTest } = useFetch<{ data: any[] }>(!isEdit ? `/test/active` : null);
  const { isOpen: isOpenDelete, open: openDelete, close: closeDelete } = useDialog();
  const [selectedRows, setSelectedRows] = useState({});
  const [selectedTest, setSelectedTest] = useState<{ id: string; test_name: string } | null>(null);
  const roleName = useAuthStore(state => state.role_name);
  const isSuperAdmin = roleName === "Super Admin";

  const { control, handleSubmit, trigger, reset } = useForm({
    defaultValues: {
      grouptest_name: "",
      grouptest_code: "",
      instruction: "",
      is_active: true,
      tests: [],
    },
    mode: "onChange",
  });

  useEffect(() => {
    if (!grouptest) return;
    if (isEdit && grouptest) {
      reset({
        grouptest_name: grouptest?.data.grouptest_name,
        grouptest_code: grouptest?.data.grouptest_code,
        instruction: grouptest?.data.instruction || "",
        is_active: grouptest?.data.is_active,
      });
    }
  }, [isEdit, grouptest]);

  const allChildColumns: MRT_ColumnDef<any>[] = useMemo(
    () => [
      {
        header: "Name",
        accessorKey: "test_name",
        muiTableHeadCellProps: { align: "center" },
        muiTableBodyCellProps: { align: "center" },
      },
      {
        header: "Code",
        accessorKey: "test_code",
        muiTableHeadCellProps: { align: "center" },
        muiTableBodyCellProps: { align: "center" },
      },
      {
        header: "Total Sub Test",
        accessorKey: "subtest_count",
        muiTableHeadCellProps: { align: "center" },
        muiTableBodyCellProps: { align: "center" },
      },
      {
        header: "Status",
        accessorKey: "is_active",
        muiTableHeadCellProps: { align: "center" },
        muiTableBodyCellProps: { align: "center" },
        Cell: ({ cell }: any) => (cell.getValue() ? "Active" : "Inactive"),
      },
      {
        header: "Created By",
        accessorKey: "created_by",
        muiTableHeadCellProps: { align: "center" },
        muiTableBodyCellProps: { align: "center" },
      },
      {
        header: "Created At",
        accessorKey: "created_at",
        muiTableHeadCellProps: { align: "center" },
        muiTableBodyCellProps: { align: "center" },
        Cell: ({ cell }) => {
          const value = cell.getValue();
          return value ? moment(value).format("MMMM DD, YYYY hh:mm A") : "";
        },
      },
    ],
    []
  );

  const selectedColumns: MRT_ColumnDef<any>[] = useMemo(
    () => [
      {
        header: "Name",
        accessorKey: "test_name",
        muiTableHeadCellProps: { align: "center" },
        muiTableBodyCellProps: { align: "center" },
      },
      {
        header: "Code",
        accessorKey: "test_code",
        muiTableHeadCellProps: { align: "center" },
        muiTableBodyCellProps: { align: "center" },
      },
      {
        header: "Added By",
        accessorKey: "added_by",
        muiTableHeadCellProps: { align: "center" },
        muiTableBodyCellProps: { align: "center" },
      },
      {
        header: "Added At",
        accessorKey: "added_at",
        muiTableHeadCellProps: { align: "center" },
        muiTableBodyCellProps: { align: "center" },
        Cell: ({ cell }) => {
          const value = cell.getValue();
          return value ? moment(value).format("MMMM DD, YYYY hh:mm A") : "";
        },
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
          const test_name = row.original.test_name;
          return (
            <Box sx={{ display: "flex", justifyContent: "center", gap: "8px" }}>
              <IconButton>
                <InfoIcon />
              </IconButton>
              <IconButton color="error" onClick={() => handleOpenDelete(id, test_name)}>
                <DeleteIcon />
              </IconButton>
            </Box>
          );
        },
      },
    ],
    []
  );

  const availableColumns: MRT_ColumnDef<any>[] = useMemo(
    () => [
      {
        header: "Name",
        accessorKey: "test_name",
        muiTableHeadCellProps: { align: "center" },
        muiTableBodyCellProps: { align: "center" },
      },
      {
        header: "Code",
        accessorKey: "test_code",
        muiTableHeadCellProps: { align: "center" },
        muiTableBodyCellProps: { align: "center" },
      },
      {
        header: "Total Sub Test",
        accessorKey: "subtest_count",
        muiTableHeadCellProps: { align: "center" },
        muiTableBodyCellProps: { align: "center" },
      },
      {
        header: "Status",
        accessorKey: "is_active",
        muiTableHeadCellProps: { align: "center" },
        muiTableBodyCellProps: { align: "center" },
        Cell: ({ cell }: any) => (cell.getValue() ? "Active" : "Inactive"),
      },
      {
        header: "Created By",
        accessorKey: "created_by",
        muiTableHeadCellProps: { align: "center" },
        muiTableBodyCellProps: { align: "center" },
      },
      {
        header: "Created At",
        accessorKey: "created_at",
        muiTableHeadCellProps: { align: "center" },
        muiTableBodyCellProps: { align: "center" },
        Cell: ({ cell }) => {
          const value = cell.getValue();
          return value ? moment(value).format("MMMM DD, YYYY hh:mm A") : "";
        },
      },
      {
        header: "Actions",
        accessorKey: "actions",
        enableSorting: false,
        enableColumnFilter: false,
        muiTableHeadCellProps: { align: "center" },
        muiTableBodyCellProps: { align: "center" },
        Cell: () => {
          //{ row }
          // const id = row.original.id;
          return (
            <Box sx={{ display: "flex", justifyContent: "center", gap: "8px" }}>
              <IconButton>
                <InfoIcon />
              </IconButton>
            </Box>
          );
        },
      },
    ],
    []
  );

  // Tabel yang sudah dipilih (saat edit)
  const selectedTable = useMaterialReactTable({
    columns: selectedColumns,
    data: grouptest?.data.tests ?? [],
    getRowId: row => row.id,
    enablePagination: true,
    enableRowSelection: false,
    enableColumnFilters: true,
    enableSorting: true,
    enableRowActions: false,
  });

  // Tabel subtest yang masih bisa dipilih (saat edit)
  const availableTable = useMaterialReactTable({
    columns: availableColumns,
    data: availableTest?.data ?? [],
    getRowId: row => row.id,
    enablePagination: true,
    enableRowSelection: true,
    enableColumnFilters: true,
    enableSorting: true,
    onRowSelectionChange: setSelectedRows,
    state: { rowSelection: selectedRows },
  });

  // Tabel semua subtest (jika mode create)
  const allTable = useMaterialReactTable({
    columns: allChildColumns,
    data: allTest?.data ?? [],
    getRowId: row => row.id,
    enablePagination: true,
    enableRowSelection: true,
    enableColumnFilters: true,
    enableSorting: true,
    onRowSelectionChange: setSelectedRows,
    state: { rowSelection: selectedRows },
  });

  const handleOpenDelete = (id: string, test_name: string) => {
    setSelectedTest({ id, test_name });
    openDelete();
  };

  const onSubmit = async (values: any) => {
    showLoading();
    try {
      const payload: any = {
        grouptest_name: values.grouptest_name,
        grouptest_code: values.grouptest_code,
        is_active: values.is_active,
        tests: Object.keys(selectedRows).map(id => ({
          test_id: id,
        })),
      };

      if (isSuperAdmin) {
        payload.instruction = values.instruction || "";
      }

      if (isEdit) {
        await API.patch(`/grouptest/${id}`, payload);
        snack.success("Group Test updated successfully");
        navigate(-1);
      } else {
        delete payload.is_active;
        await API.post("/grouptest", payload);
        snack.success("Group Test created successfully");
        navigate(-1);
      }
      // refetchGroupTest();
    } catch {
      snack.error("Something went wrong, please try again later");
    } finally {
      hideLoading();
    }
  };

  const handleDelete = async (id: string, detailId: string) => {
    showLoading();
    try {
      await API.delete(`/grouptest/${id}/tests/${detailId}`);
      refetchGroupTest();
      refetchAvailableTest();
      snack.success("Test deleted successfully");
    } catch (error) {
      if (isAxiosError(error)) {
        const data = error.response?.data;
        snack.error(
          "Something went wrong: " + (data?.message || "Please check the logs for details")
        );
      } else {
        snack.error("Error, check log for details");
      }
    } finally {
      closeDelete();
      hideLoading();
    }
  };

  return (
    <>
      <Box sx={{ display: "flex", alignItems: "center", mb: 2, gap: 1 }}>
        <IconButton onClick={() => navigate(-1)}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h2" color="primary">
          {isEdit ? "Edit" : "New"} Group Test
        </Typography>
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", mb: 0.5, gap: 1 }}>
        <TextFieldCtrl
          name="grouptest_name"
          control={control}
          label="Name"
          rules={{
            required: "Field required",
          }}
        />
        <TextFieldCtrl
          name="grouptest_code"
          control={control}
          label="Code"
          rules={{
            required: "Field required",
            maxLength: { value: 16, message: "Maximum 16 characters allowed" },
          }}
        />
      </Box>

      <Box sx={{ mb: 4, mt: 1 }}>
        <RTEField
          name="instruction"
          control={control}
          label="Instruction"
          placeholder="Write Instruction"
          disabled={!isSuperAdmin}
          sx={{ height: "12rem", mb: 6 }}
        />
      </Box>

      {isEdit ? (
        <>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <CheckboxCtrl name="is_active" control={control} label="Active" />
            <Typography variant="h6">Taken Tests</Typography>
            <MaterialReactTable table={selectedTable} />
            <Typography variant="h6">Available Tests</Typography>
            <MaterialReactTable table={availableTable} />
          </Box>
        </>
      ) : (
        <>
          <Typography variant="h6">Tests</Typography>
          <MaterialReactTable table={allTable} />
        </>
      )}

      <Box textAlign="right" mt={4}>
        <Button
          variant="contained"
          onClick={async () => {
            const valid = await trigger();
            if (valid) open();
          }}
        >
          Save
        </Button>
      </Box>

      <DialogComp
        title={isEdit ? "Edit Group Test" : "Create Group Test"}
        open={isOpen}
        onClose={close}
        actions={[
          <Button onClick={close} variant="outlined" color="error">
            Cancel
          </Button>,
          <Button onClick={handleSubmit(onSubmit)} variant="contained" color="error">
            {isEdit ? "Edit" : "Create"}
          </Button>,
        ]}
      >
        <Typography>{`Are you sure want to ${isEdit ? "edit" : "create"} Group Test?`}</Typography>
      </DialogComp>

      <DialogComp
        title="Delete Selected Test"
        open={isOpenDelete}
        onClose={closeDelete}
        actions={
          <>
            <Button onClick={closeDelete} variant="outlined" color="error">
              Cancel
            </Button>
            {selectedTest && (
              <Button
                onClick={() => handleDelete(id!, selectedTest?.id)}
                variant="contained"
                color="error"
              >
                Delete
              </Button>
            )}
          </>
        }
      >
        {selectedTest && (
          <Typography>{`Are you sure you want to delete ${selectedTest.test_name}?`}</Typography>
        )}
      </DialogComp>
    </>
  );
};

export default GroupTestCreateEdit;
