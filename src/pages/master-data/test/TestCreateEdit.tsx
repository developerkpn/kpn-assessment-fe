import { Button, Typography, Box, IconButton, Grid2 as Grid, MenuItem } from "@mui/material";
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
import InfoIcon from "@mui/icons-material/Info";
import { isAxiosError } from "axios";
import moment from "moment";
import VisibilityIcon from "@mui/icons-material/Visibility";
import SelectCtrl from "@/components/forms/Select";
import RTEField from "@/components/forms/RTEField";
import useAuthStore from "@/hooks/useAuthStore";
import LanguageControls from "@/components/forms/LanguageControls";

const TestCreateEdit = () => {
  const getPermission = useAuthStore(state => state.getPermission);
  const { id } = useParams();
  const isEdit = Boolean(id);
  const API = useAPI();
  const { showLoading, hideLoading } = useLoading();
  const navigate = useNavigate();
  const { data: test, refetch: refetchTest } = useFetch<any>(isEdit ? `/test/${id}` : null);
  const { data: availableSubtest, refetch: refetchAvailableSubtest } = useFetch<{ data: any[] }>(
    isEdit ? `/test/${id}/subtest-available` : null
  );
  const { data: allSubtest } = useFetch<{ data: any[] }>(!isEdit ? `/subtest/active` : null);
  const { isOpen: isOpenDelete, open: openDelete, close: closeDelete } = useDialog();
  const [selectedRows, setSelectedRows] = useState({});
  const [selectedTest, setSelectedTest] = useState<{ id: string; subtest_name: string } | null>(
    null
  );
  const [didReset, setDidReset] = useState(false);
  const { isOpen: isOpenForm, open: openForm, close: closeForm } = useDialog();
  const { data: categoryData } = useFetch<any>(`/category/active`);

  const { control, handleSubmit, reset, watch, setValue } = useForm({
    defaultValues: {
      test_name: "",
      test_code: "",
      description: "",
      intro_desc: "",
      category_id: "",
      is_active: true,
      subtests: [],
      language_id: "",
      language_type: "main",
    },
  });

  const languageType = watch("language_type");
  const selectedLanguageId = watch("language_id");

  const { data: languages } = useFetch<any>("/languages");
  const { data: languagesWithStatus } = useFetch<any>(
    isEdit && id ? `/test/${id}/languages` : null
  );

  const [translationState, setTranslationState] = useState<{
    isChecking: boolean;
    isGenerating: boolean;
  }>({
    isChecking: false,
    isGenerating: false,
  });

  useEffect(() => {
    if (!test || didReset) return;

    if (isEdit && test) {
      reset({
        test_name: test?.data.test_name,
        test_code: test?.data.test_code,
        description: test?.data.description,
        intro_desc: test?.data.intro_desc,
        is_active: test?.data.is_active,
        category_id: test?.data.category_id,
        language_id: test?.data.language_id || "",
        language_type: "main",
      });
      setDidReset(true);
    }
  }, [isEdit, test, didReset, reset]);

  // Handle language type switching using language-selection endpoint
  useEffect(() => {
    if (!isEdit || !id || !languageType || !languagesWithStatus?.data) return;

    const handleLanguageTypeSwitch = async () => {
      try {
        const response = await API.get(
          `/test/${id}/language-selection?languageType=${languageType}`
        );
        const data = response.data.data;

        setValue("language_id", data.language_code);

        if (languageType === "sub" && data.has_translation && data.translation_data) {
          // Use existing translation
          setValue("intro_desc", data.translation_data.intro_desc || "");
        } else {
          // No translation exists or switching to main - use main language data
          setValue("intro_desc", test?.data.intro_desc || "");
        }
      } catch (error) {
        console.error("Language type switch error:", error);
      }
    };

    handleLanguageTypeSwitch();
  }, [isEdit, languageType, languagesWithStatus]);

  // Handle language ID changes (switching between sub languages)
  useEffect(() => {
    if (!isEdit || languageType !== "sub" || !selectedLanguageId) return;

    const fetchTranslationForLanguage = async () => {
      try {
        const response = await API.get(`/test/${id}/language/${selectedLanguageId}`);
        const translationData = response.data.data;

        // Use translation if exists, otherwise fallback to main language data
        setValue("intro_desc", translationData?.intro_desc || test?.data.intro_desc || "");
      } catch (error) {
        // Translation doesn't exist - fallback to main language data
        setValue("intro_desc", test?.data.intro_desc || "");
      }
    };

    fetchTranslationForLanguage();
  }, [isEdit, selectedLanguageId, languageType]);

  const allChildColumns: MRT_ColumnDef<any>[] = useMemo(
    () => [
      {
        header: "Name",
        accessorKey: "subtest_name",
        muiTableHeadCellProps: { align: "center" },
        muiTableBodyCellProps: { align: "center" },
      },
      {
        header: "Code",
        accessorKey: "subtest_code",
        muiTableHeadCellProps: { align: "center" },
        muiTableBodyCellProps: { align: "center" },
      },
      {
        header: "Total Series",
        accessorKey: "series_count",
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
        Cell: ({ row }) => {
          const id = row.original.id;
          if (getPermission("fupdate", 14)) {
            return (
              <Box sx={{ display: "flex", justifyContent: "center" }}>
                <IconButton
                  onClick={() => navigate(`/admin/subtest/detail/${id}`)}
                  aria-label="edit"
                  size="small"
                >
                  <VisibilityIcon />
                </IconButton>
              </Box>
            );
          } else {
            return <></>;
          }
        },
      },
    ],
    []
  );

  const selectedColumns: MRT_ColumnDef<any>[] = useMemo(
    () => [
      {
        header: "Name",
        accessorKey: "subtest_name",
        muiTableHeadCellProps: { align: "center" },
        muiTableBodyCellProps: { align: "center" },
      },
      {
        header: "Code",
        accessorKey: "subtest_code",
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
          const subtest_name = row.original.subtest_name;
          return (
            <Box sx={{ display: "flex", justifyContent: "center", gap: "8px" }}>
              <IconButton>
                <InfoIcon
                  onClick={() => {
                    window.open(
                      `${location.protocol}//${location.hostname}${
                        import.meta.env.MODE == "development" ? `:${location.port}` : ""
                      }/admin/subtest/detail/${row.original.subtest_id}`
                    );
                  }}
                />
              </IconButton>
              {getPermission("fdelete", 14) && (
                <IconButton color="error" onClick={() => handleOpenDelete(id, subtest_name)}>
                  <DeleteIcon />
                </IconButton>
              )}
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
        accessorKey: "subtest_name",
        muiTableHeadCellProps: { align: "center" },
        muiTableBodyCellProps: { align: "center" },
      },
      {
        header: "Code",
        accessorKey: "subtest_code",
        muiTableHeadCellProps: { align: "center" },
        muiTableBodyCellProps: { align: "center" },
      },
      {
        header: "Total Series",
        accessorKey: "series_count",
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
    data: test?.data.subtests ?? [],
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
    data: availableSubtest?.data ?? [],
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
    data: allSubtest?.data ?? [],
    getRowId: row => row.id,
    enablePagination: true,
    enableRowSelection: true,
    enableColumnFilters: true,
    enableSorting: true,
    onRowSelectionChange: setSelectedRows,
    state: { rowSelection: selectedRows },
  });

  const handleOpenForm = () => {
    openForm();
  };

  const handleCloseForm = () => {
    reset();
    closeForm();
  };

  const handleOpenDelete = (id: string, subtest_name: string) => {
    setSelectedTest({ id, subtest_name });
    openDelete();
  };

  const getLanguageOptions = () => {
    if (isEdit && languagesWithStatus?.data) {
      return languageType === "main"
        ? languagesWithStatus.data.filter((lang: any) => lang.translation_status === "main")
        : languagesWithStatus.data.filter((lang: any) => lang.translation_status !== "main");
    }
    return languages?.data || [];
  };

  const generateTranslation = async (fields: string[]) => {
    if (!selectedLanguageId || languageType !== "sub") {
      snack.error("Please select a sub language first");
      return;
    }

    setTranslationState(prev => ({ ...prev, isGenerating: true }));
    try {
      const response = await API.post(`/test/${id}/language/${selectedLanguageId}/generate`, {
        fields,
      });

      if (response.data?.data) {
        const translatedData = response.data.data;
        if (translatedData.intro_desc) {
          setValue("intro_desc", translatedData.intro_desc);
        }
        snack.success("Translation generated successfully");
      }
    } catch (error) {
      console.error("Translation generation error:", error);
      snack.error("Failed to generate translation");
    } finally {
      setTranslationState(prev => ({ ...prev, isGenerating: false }));
    }
  };

  const onSubmit = async (values: any) => {
    showLoading();
    try {
      const payload: any = {
        test_name: values.test_name,
        test_code: values.test_code,
        is_active: values.is_active,
        description: values.description,
        intro_desc: values.intro_desc,
        subtests: Object.keys(selectedRows).map(id => ({
          subtest_id: id,
        })),
        category_id: values.category_id,
      };

      if (isEdit) {
        payload.language_id = values.language_id;
        payload.language_type = values.language_type;
        await API.patch(`/test/${id}`, payload);
        snack.success("Test updated successfully");
        navigate(-1);
      } else {
        delete payload.is_active;
        payload.language_id = values.language_id;
        await API.post("/test", payload);
        snack.success("Test created successfully");
        navigate(-1);
      }
      // refetchTest();
    } catch {
      snack.error("Error, check log for details");
    } finally {
      handleCloseForm();
      hideLoading();
    }
  };

  const handleDelete = async (id: string, detailId: string) => {
    showLoading();
    try {
      const res = await API.delete(`/test/${id}/subtest/${detailId}`); // Pastikan endpoint benar
      refetchTest();
      refetchAvailableSubtest();
      snack.success("Test deleted successfully");
    } catch (error) {
      if (isAxiosError(error)) {
        const data = error.response?.data;
        snack.error("Something went wrong: " + (data?.message || "Unknown error"));
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
          {isEdit ? "Edit" : "New"} Test
        </Typography>
      </Box>

      <LanguageControls
        isEdit={isEdit}
        languagesWithStatus={languagesWithStatus}
        languages={languages}
        methods={{ control, setValue }}
        getLanguageOptions={getLanguageOptions}
        generateTranslation={generateTranslation}
        translationState={translationState}
        selectedLanguageId={selectedLanguageId}
        languageType={languageType}
        fieldsToTranslate={["intro_desc"]}
        containerSx={{ px: 0 }}
      />

      <Grid container spacing={1}>
        <Grid size={4}>
          <TextFieldCtrl
            name="test_name"
            control={control}
            label="Name"
            rules={{
              required: "Field required",
              maxLength: { value: 128, message: "Max 128 characters allowed" },
            }}
          />
        </Grid>
        <Grid size={4}>
          <TextFieldCtrl
            name="test_code"
            control={control}
            label="Code"
            rules={{
              required: "Field required",
              maxLength: { value: 16, message: "Max 16 characters allowed" },
            }}
          />
        </Grid>
        <Grid size={4}>
          <SelectCtrl
            control={control}
            name="category_id"
            label="Category"
            rules={{ required: "Field required" }}
          >
            {categoryData?.data.map((category: any) => (
              <MenuItem key={category.id} value={category.id}>
                {category.category_name}
              </MenuItem>
            ))}
          </SelectCtrl>
        </Grid>
      </Grid>

      <Box sx={{ mt: 2 }}>
        <RTEField
          control={control}
          name="intro_desc"
          label="Intro Description (Will be shown in test intro)"
          rules={{ required: "Field required" }}
          sx={{ minHeight: "15rem" }}
        />
      </Box>

      <Box>
        <RTEField
          control={control}
          name="description"
          label="Description (Will be shown in report)"
          rules={{ required: "Field required" }}
          sx={{ minHeight: "15rem" }}
        />
      </Box>

      {isEdit ? (
        <>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <CheckboxCtrl name="is_active" control={control} label="Active" />
            <Typography variant="h6">Taken Subtests</Typography>
            <MaterialReactTable table={selectedTable} />
            <Typography variant="h6">Available Subtests</Typography>
            <MaterialReactTable table={availableTable} />
          </Box>
        </>
      ) : (
        <>
          <Typography variant="h6">Subtest</Typography>
          <MaterialReactTable table={allTable} />
        </>
      )}
      {getPermission("fcreate", 14) && (
        <Box textAlign="right" mt={4}>
          <Button variant="contained" onClick={handleOpenForm}>
            Save
          </Button>
        </Box>
      )}

      <DialogComp
        title={isEdit ? "Edit Test" : "Create Test"}
        open={isOpenForm}
        onClose={closeForm}
        actions={[
          <Button onClick={closeForm} variant="outlined" color="error">
            Cancel
          </Button>,
          <Button onClick={handleSubmit(onSubmit)} variant="contained" color="error">
            {isEdit ? "Edit" : "Create"}
          </Button>,
        ]}
      >
        <Typography>{`Are you sure want to ${isEdit ? "edit" : "create"} Test?`}</Typography>
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
          <Typography>{`Are you sure you want to delete ${selectedTest.subtest_name}?`}</Typography>
        )}
      </DialogComp>
    </>
  );
};

export default TestCreateEdit;
