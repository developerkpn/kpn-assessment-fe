import useAPI from "@/hooks/useAPI";
import useDialog from "@/hooks/useDialog";
import useFetch from "@/hooks/useFetch";
import { useLoading } from "@/providers/LoadingProvider";
import { snack } from "@/providers/SnackbarProvider";
import theme from "@/theme";
import {
  Box,
  Button,
  Chip,
  Divider,
  Grid2 as Grid,
  MenuItem,
  Popover,
  Stack,
  Typography,
} from "@mui/material";
import { isAxiosError } from "axios";
import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_ColumnDef,
} from "material-react-table";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Control, useFormContext } from "react-hook-form";
import { FaCheck } from "react-icons/fa6";
import { GrAdd, GrDownload, GrUpload } from "react-icons/gr";
import DialogComp from "../Dialog";
import SelectCtrl from "../forms/Select";
import TextFieldCtrl from "../forms/TextField";
import useAuthStore from "@/hooks/useAuthStore";

type Assessee = {
  id: string;
  assessee_nik: string;
  assessee_name: string;
  assessee_email: string;
  fromDB?: boolean;
};

type AssignmentProps = {
  control: Control<any>;
};

const Assignment: React.FC<AssignmentProps> = ({ control }) => {
  const API = useAPI();
  const role_name = useAuthStore(state => state.role_name);
  const bu_id = useAuthStore(state => state.bu_id);
  const { showLoading, hideLoading } = useLoading();
  const [loading, setLoading] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const assesseeInputRef = useRef<HTMLInputElement | null>(null);
  const [assesseeData, setAssesseeData] = useState<any>(null);
  const [assessmentResults, setAssessmentResults] = useState<{
    valid_assessee: Assessee[];
    invalid_assessee: { assessee_nik: string; reason: string }[];
  } | null>(null);
  const { open, isOpen, close } = useDialog();
  const { setValue, getValues, setError, watch } = useFormContext();
  const { data: BusinessUnit } = useFetch<any>("/bu/user");
  const { data: Scope } = useFetch<any>("/scope/user");
  const { data: FunctionMenu } = useFetch<any>("/function-menu");
  const assessees = watch("assessees") || [];
  const assignFor = useMemo(() => {
    if (watch("assign_for")) {
      return watch("assign_for");
    } else if (Scope?.data && Scope.data.length > 0) {
      setValue("assign_for", Scope.data[0].scope_id);
      return Scope.data[0].scope_id;
    }
  }, [watch("assign_for"), Scope?.data]);
  const excelFile = watch("excel_file");
  const externalAssessee = watch("external_assessee") || [];
  const deleted = watch("deleted_assessees") || [];
  // const externalAssesseeFile = watch("external_assessee_file") || null;

  const columns = useMemo<MRT_ColumnDef<Assessee>[]>(
    () => [
      {
        accessorKey: "assessee_nik",
        header: "NIK",
      },
      {
        accessorKey: "assessee_name",
        header: "Name",
      },
      {
        accessorKey: "assessee_email",
        header: "Email",
      },
    ],
    []
  );

  const externalColumns = useMemo<MRT_ColumnDef<any>[]>(
    () => [
      {
        accessorKey: "assessee_name",
        header: "Name",
      },
      {
        accessorKey: "assessee_email",
        header: "Email",
      },
    ],
    []
  );

  const validAssesseeColumns = useMemo<MRT_ColumnDef<Assessee>[]>(
    () => [
      {
        accessorKey: "assessee_nik",
        header: "NIK",
      },
      {
        accessorKey: "assessee_name",
        header: "Name",
      },
      {
        accessorKey: "assessee_email",
        header: "Email",
      },
    ],
    []
  );

  const validExternalColumns = useMemo<MRT_ColumnDef<any>[]>(
    () => [
      {
        accessorKey: "assessee_name",
        header: "Name",
      },
      {
        accessorKey: "assessee_email",
        header: "Email",
      },
    ],
    []
  );

  const invalidAssesseeColumns = useMemo<MRT_ColumnDef<any>[]>(
    () => [
      {
        accessorKey: "assessee_nik",
        header: "NIK",
      },
      {
        accessorKey: "reason",
        header: "Reason",
      },
    ],
    []
  );

  const invalidExternalColumns = useMemo<MRT_ColumnDef<any>[]>(
    () => [
      {
        accessorKey: "assessee_name",
        header: "Name",
      },
      {
        accessorKey: "assessee_email",
        header: "Email",
      },
      {
        accessorKey: "reason",
        header: "Reason",
      },
    ],
    []
  );

  const handleAddAssessee = () => {
    if (!assesseeData) return;

    // Buat ID unik untuk assessee baru
    const newId = `temp-${Date.now()}`;

    // Buat objek assessee baru
    const newAssessee: Assessee = {
      id: newId,
      assessee_nik: assesseeData.assessee_nik,
      assessee_name: assesseeData.assessee_name,
      assessee_email: assesseeData.assessee_email,
      fromDB: false,
    };

    // Periksa apakah assessee sudah ada dalam tabel
    const existingIndex = assessees.findIndex(
      (a: Assessee) => a.assessee_nik === newAssessee.assessee_nik
    );

    if (existingIndex >= 0) {
      snack.warning("Assessee dengan NIK ini sudah ada dalam daftar");
    } else {
      // Tambahkan assessee baru ke daftar
      const updatedAssessees = [...assessees, newAssessee];
      setValue("assessees", updatedAssessees);
      snack.success("Assessee berhasil ditambahkan");
    }

    // Reset form dan tutup popover
    setValue("assessee_nik", "");
    setAnchorEl(null);
    setAssesseeData(null);
    setIsPopoverOpen(false);
  };

  const handleAddExternalAssessee = () => {
    const name = getValues("external_assessee_name");
    const email = getValues("external_assessee_email");

    if (!name || !email) {
      setError("external_assessee_name", { type: "manual", message: "Name is required" });
      setError("external_assessee_email", { type: "manual", message: "Email is required" });
      return;
    }

    const newId = `temp-${Date.now()}`;
    const newExternalAssessee = {
      id: newId,
      assessee_name: name,
      assessee_email: email,
      fromDB: false,
    };
    const existingIndex = externalAssessee.findIndex((a: any) => a.assessee_email === email);

    if (existingIndex >= 0) {
      snack.warning("An assessee with this email already exists in the list");
    } else {
      // Add new external assessee to the list
      const updatedExternalAssessees = [...externalAssessee, newExternalAssessee];
      setValue("external_assessee", updatedExternalAssessees);
      snack.success("External assessee successfully added");
    }

    // Reset form fields
    setValue("external_assessee_name", "");
    setValue("external_assessee_email", "");
  };

  const handleAddAllValidAssessees = () => {
    if (!assessmentResults?.valid_assessee?.length) return;

    if (assignFor === "internal") {
      const newAssessees = [...assessees];
      let addedCount = 0;

      assessmentResults.valid_assessee.forEach(validAssessee => {
        // Check if assessee already exists in table
        const existingIndex = assessees.findIndex(
          (a: Assessee) => a.assessee_nik === validAssessee.assessee_nik
        );

        if (existingIndex < 0) {
          // Create unique ID for new assessee
          const newId = `temp-${Date.now()}-${validAssessee.assessee_nik}`;

          // Add new assessee to the list
          newAssessees.push({
            id: newId,
            assessee_nik: validAssessee.assessee_nik,
            assessee_name: validAssessee.assessee_name,
            assessee_email: validAssessee.assessee_email,
            fromDB: false,
          });

          addedCount++;
        }
      });

      setValue("assessees", newAssessees);
      close();
      setValue("excel_file", null);
      setAssessmentResults(null);

      if (addedCount > 0) {
        snack.success(`Successfully added ${addedCount} assessees`);
      } else {
        snack.warning("All assessees already exist in the list");
      }
    } else {
      // For external assessees
      const newExternalAssessees = [...externalAssessee];
      let addedCount = 0;

      assessmentResults.valid_assessee.forEach(validExternal => {
        // Check if external assessee already exists in table
        const existingIndex = externalAssessee.findIndex(
          (a: any) => a.assessee_email === validExternal.assessee_email
        );

        if (existingIndex < 0) {
          // Create unique ID for new external assessee
          const newId = `temp-ext-${Date.now()}-${validExternal.assessee_email}`;

          // Add new external assessee to the list
          newExternalAssessees.push({
            id: newId,
            assessee_name: validExternal.assessee_name,
            assessee_email: validExternal.assessee_email,
            fromDB: false,
          });

          addedCount++;
        }
      });

      setValue("external_assessee", newExternalAssessees);
      close();
      setValue("excel_file", null);
      setAssessmentResults(null);

      if (addedCount > 0) {
        snack.success(`Successfully added ${addedCount} external assessees`);
      } else {
        snack.warning("All external assessees already exist in the list");
      }
    }
  };

  const handleClosePopover = () => {
    setAnchorEl(null);
    setAssesseeData(null);
    setIsPopoverOpen(false);
  };

  const handleVerifyAssessee = async () => {
    const assessee_nik = getValues("assessee_nik");
    setLoading(true);
    if (!assessee_nik) {
      setError("assessee_nik", { type: "manual", message: "NIK is required" });
      setLoading(false);
      return;
    }
    try {
      const response = await API.post(`batch/darwin-assessee`, {
        assessee_nik,
      });
      const data = response.data.data;

      if (data.valid_assessee && data.valid_assessee.length > 0) {
        setAssesseeData(data.valid_assessee[0]);
        setAnchorEl(assesseeInputRef.current);
        setIsPopoverOpen(true);
      } else {
        snack.error("NIK not valid or not found");
      }
    } catch (error) {
      if (isAxiosError(error)) {
        const data = error.response?.data;
        snack.error(data?.message || "Terjadi kesalahan");
      } else {
        snack.error("Error, check log for details");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleProcessExcel = async () => {
    if (!excelFile) {
      snack.error("Please upload an excel file first");
      return;
    }
    // setLoading(true)
    showLoading();
    try {
      const formData = new FormData();
      formData.append("file", excelFile);
      const endpoint =
        assignFor === "internal" ? "batch/darwin-assessee" : "batch/external-assessee";

      const res = await API.post(endpoint, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      const data = res.data.data;

      setAssessmentResults({
        valid_assessee: data.valid_assessee || [],
        invalid_assessee: data.invalid_assessee || [],
      });

      open();
    } catch (error) {
      if (isAxiosError(error)) {
        const data = error.response?.data;
        snack.error(data?.message || "Terjadi kesalahan");
      } else {
        snack.error("Error, check log for details");
      }
    } finally {
      // setLoading(false);
      hideLoading();
    }
  };

  const handleDeleteAseessee = (id: string) => {
    setValue("deleted_assessees", [...deleted, { id }]);
    const update = assessees.filter((a: Assessee) => a.id !== id);
    setValue("assessees", update);
    snack.info("Assessee marked for deletion");
  };

  const handleFunctionChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    const functionId = event.target.value as string;
    const selectedFunction = FunctionMenu?.data.find((func: any) => func.id === functionId);

    if (selectedFunction) {
      setValue("function_id", functionId);
      setValue("fm_name", selectedFunction.fm_name);
    }
  };

  const handleBusinessUnitChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    const buId = event.target.value as string;
    const selectedBU = BusinessUnit?.data.find((bu: any) => bu.id === buId);

    if (selectedBU) {
      setValue("bu_id", buId);
      setValue("bu_name", selectedBU.bu_name);
    }
  };

  useEffect(() => {
    const fmId = getValues("fm_id");
    const fmName = getValues("fm_name");
    if (fmId && !fmName && FunctionMenu?.data) {
      const sel = FunctionMenu.data.find((f: any) => f.id === fmId);
      if (sel) setValue("fm_name", sel.fm_name);
    }
  }, [FunctionMenu?.data, getValues("fm_id")]);

  const table = useMaterialReactTable({
    columns,
    data: assessees,
    enableRowActions: true,
    positionActionsColumn: "last",
    renderRowActions: row => (
      <Box sx={{ display: "flex", gap: "1rem" }}>
        <Button
          color="error"
          onClick={() => {
            handleDeleteAseessee(row.row.original.id);
          }}
          variant="contained"
          size="small"
        >
          Delete
        </Button>
      </Box>
    ),
  });

  const validAssesseeTable = useMaterialReactTable({
    columns: validAssesseeColumns,
    data: assessmentResults?.valid_assessee || [],
    enablePagination: false,
    enableTopToolbar: false,
    enableBottomToolbar: false,
    enableColumnActions: false,
    enableColumnFilters: false,
    enableSorting: false,
    enableHiding: false,
    enableDensityToggle: false,
    enableFullScreenToggle: false,
    muiTableHeadCellProps: {
      sx: {
        backgroundColor: theme => theme.palette.success.main,
        color: "white",
      },
    },
  });

  const invalidAssesseeTable = useMaterialReactTable({
    columns: invalidAssesseeColumns,
    data: assessmentResults?.invalid_assessee || [],
    enablePagination: false,
    enableTopToolbar: false,
    enableBottomToolbar: false,
    enableColumnActions: false,
    enableColumnFilters: false,
    enableSorting: false,
    enableHiding: false,
    enableDensityToggle: false,
    enableFullScreenToggle: false,
    muiTableHeadCellProps: {
      sx: {
        backgroundColor: theme => theme.palette.primary.main,
        color: "white",
      },
    },
  });

  const externalAssesseeTable = useMaterialReactTable({
    columns: externalColumns,
    data: externalAssessee,
    enableRowActions: true,
    positionActionsColumn: "last",
    renderRowActions: row => (
      <Box sx={{ display: "flex", gap: "1rem" }}>
        <Button
          color="error"
          onClick={async () => {
            const assessee = row.row.original;
            if (assessee.fromDB) {
              // Data comes from database, call delete API
              await handleDeleteAseessee(assessee.id);
            }
            // Update state by removing this assessee from the list
            const updatedExternalAssessees = externalAssessee.filter(
              (a: any) => a.id !== assessee.id
            );
            setValue("external_assessee", updatedExternalAssessees);
          }}
          variant="contained"
          size="small"
        >
          Delete
        </Button>
      </Box>
    ),
  });

  const validExternalAssesseeTable = useMaterialReactTable<Assessee>({
    columns: validExternalColumns,
    data: assessmentResults?.valid_assessee || [],
    enablePagination: false,
    enableTopToolbar: false,
    enableBottomToolbar: false,
    enableColumnActions: false,
    enableColumnFilters: false,
    enableSorting: false,
    enableHiding: false,
    enableDensityToggle: false,
    enableFullScreenToggle: false,
    muiTableHeadCellProps: {
      sx: {
        backgroundColor: theme => theme.palette.success.main,
        color: "white",
      },
    },
  });

  const invalidExternalAssesseeTable = useMaterialReactTable({
    columns: invalidExternalColumns,
    data: assessmentResults?.invalid_assessee || [],
    enablePagination: false,
    enableTopToolbar: false,
    enableBottomToolbar: false,
    enableColumnActions: false,
    enableColumnFilters: false,
    enableSorting: false,
    enableHiding: false,
    enableDensityToggle: false,
    enableFullScreenToggle: false,
    muiTableHeadCellProps: {
      sx: {
        backgroundColor: theme => theme.palette.primary.main,
        color: "white",
      },
    },
  });

  return (
    <>
      <Grid container spacing={2}>
        <Grid size={{ xs: 4 }}>
          <SelectCtrl name="assign_for" control={control} label="Assign For">
            {Scope?.data.map((scope: any) => (
              <MenuItem key={scope.scope_id} value={scope.scope_id}>
                {scope.scope_desc}
              </MenuItem>
            ))}
          </SelectCtrl>
        </Grid>
        <Grid size={{ xs: 4 }}>
          <SelectCtrl
            name="fm_id"
            control={control}
            label="Function"
            rules={{ required: "Function is required" }}
            onChangeOvr={handleFunctionChange}
          >
            {FunctionMenu?.data.map((func: any) => (
              <MenuItem key={func.id} value={func.id}>
                {func.fm_name}
              </MenuItem>
            ))}
          </SelectCtrl>
        </Grid>
        <Grid size={{ xs: 4 }}>
          <SelectCtrl
            name="bu_id"
            control={control}
            label="Business Unit"
            rules={{ required: "Business Unit is required" }}
            // onChangeOvr={handleBusinessUnitChange}
          >
            {BusinessUnit?.data.map((bu: any) => (
              <MenuItem key={bu.id} value={bu.id}>
                {bu.bu_name}
              </MenuItem>
            ))}
          </SelectCtrl>
        </Grid>
      </Grid>
      <Divider sx={{ my: 2 }} />

      {assignFor === "internal" ? (
        <>
          <Typography variant="h6" color="textSecondary" fontWeight={600} gutterBottom>
            Internal Assessee
          </Typography>
          <Stack spacing={2}>
            <Grid container spacing={2} sx={{ alignItems: "center" }}>
              <Grid size={{ xs: 2 }}>
                <Typography color="textSecondary" fontWeight={600}>
                  Input Excel:{" "}
                </Typography>
              </Grid>
              {!excelFile ? (
                <Grid size={{ xs: 4 }}>
                  <Box display="flex" gap={2} alignItems="center">
                    <input
                      type="file"
                      accept=".xlsx, .xls"
                      id="excel-upload"
                      hidden
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setValue("excel_file", file);
                        }
                      }}
                    />
                    <label htmlFor="excel-upload">
                      <Button
                        component="span"
                        variant="contained"
                        startIcon={<GrUpload />}
                        color="success"
                        size="small"
                        sx={{ py: 1, px: 2, whiteSpace: "nowrap" }}
                      >
                        Upload Excel
                      </Button>
                    </label>
                    <Button
                      variant="outlined"
                      color="success"
                      startIcon={<GrDownload />}
                      size="small"
                      sx={{ py: 1, px: 2, whiteSpace: "nowrap" }}
                      href="/internal_assessee.xlsx"
                      download
                    >
                      Template
                    </Button>
                  </Box>
                </Grid>
              ) : (
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Chip
                    label={excelFile.name}
                    onDelete={() => setValue("excel_file", null)}
                    color="primary"
                    variant="outlined"
                  />
                  <Button
                    variant="contained"
                    color="primary"
                    loading={loading}
                    onClick={handleProcessExcel}
                  >
                    Process
                  </Button>
                </Box>
              )}
              {/* <Button variant="outlined" startIcon={<GrDownload />}>
              Download Template
            </Button> */}
            </Grid>
            <Grid container spacing={2} sx={{ alignItems: "center" }}>
              <Grid size={{ xs: 2 }}>
                <Typography color="textSecondary" fontWeight={600}>
                  Input Manual:{" "}
                </Typography>
              </Grid>
              <Grid size={{ xs: 4 }}>
                <TextFieldCtrl
                  name="assessee_nik"
                  control={control}
                  label="NIK"
                  placeholder="Type NIK here ..."
                  rules={{ required: "NIK is required" }}
                  inputRef={assesseeInputRef}
                />
              </Grid>
              <Grid size={{ xs: 4 }}>
                <Button
                  variant="outlined"
                  startIcon={<FaCheck />}
                  onClick={handleVerifyAssessee}
                  loadingPosition="start"
                  loading={loading}
                  color="success"
                >
                  Verify
                </Button>
              </Grid>
            </Grid>
            <Popover
              open={isPopoverOpen}
              anchorEl={anchorEl}
              onClose={handleClosePopover}
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "left",
              }}
              transformOrigin={{
                vertical: "top",
                horizontal: "left",
              }}
            >
              <Box sx={{ p: 2, maxWidth: 400 }}>
                <Typography variant="h6" gutterBottom>
                  Assessee Data
                </Typography>
                {assesseeData && (
                  <Stack spacing={1}>
                    <Typography>
                      <strong>NIK:</strong> {assesseeData.assessee_nik}
                    </Typography>
                    <Typography>
                      <strong>Name:</strong> {assesseeData.assessee_name}
                    </Typography>
                    <Typography>
                      <strong>Email:</strong> {assesseeData.assessee_email}
                    </Typography>
                    <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                      <Button variant="outlined" onClick={handleClosePopover}>
                        Cancel
                      </Button>
                      <Button variant="contained" onClick={handleAddAssessee} color="success">
                        Add
                      </Button>
                    </Stack>
                  </Stack>
                )}
              </Box>
            </Popover>
          </Stack>
          <Box sx={{ mt: 3 }}>
            <Typography color="textSecondary" fontWeight={600} gutterBottom>
              Internal Assessee List
            </Typography>
            {assessees.length > 0 ? (
              <MaterialReactTable table={table} />
            ) : (
              <Typography color="textSecondary">
                No assessee added yet. Please add assessees using the form above.
              </Typography>
            )}
          </Box>
        </>
      ) : (
        <>
          <Typography variant="h6" color="textSecondary" fontWeight={600} gutterBottom>
            External Assessee
          </Typography>
          <Stack spacing={2}>
            <Grid container spacing={2} sx={{ alignItems: "center" }}>
              <Grid size={{ xs: 2 }}>
                <Typography color="textSecondary" fontWeight={600}>
                  Input Excel:{" "}
                </Typography>
              </Grid>
              {!excelFile ? (
                <Grid size={{ xs: 4 }}>
                  <Box display="flex" gap={2} alignItems="center">
                    <input
                      type="file"
                      accept=".xlsx, .xls"
                      id="excel-upload-external"
                      hidden
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setValue("excel_file", file);
                        }
                      }}
                    />
                    <label htmlFor="excel-upload-external">
                      <Button
                        component="span"
                        variant="contained"
                        startIcon={<GrUpload />}
                        size="small"
                        color="success"
                        sx={{ py: 1, px: 2, whiteSpace: "nowrap" }}
                      >
                        Upload Excel
                      </Button>
                    </label>
                    <Button
                      variant="outlined"
                      color="success"
                      startIcon={<GrDownload />}
                      size="small"
                      href="/external_assessee.xlsx"
                      download
                      sx={{ py: 1, px: 2, whiteSpace: "nowrap" }}
                    >
                      Template
                    </Button>
                  </Box>
                </Grid>
              ) : (
                <>
                  <Grid size={{ xs: 4 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <Chip
                        label={excelFile.name}
                        onDelete={() => setValue("excel_file", null)}
                        color="primary"
                        variant="outlined"
                      />
                      <Button
                        variant="contained"
                        color="primary"
                        loading={loading}
                        onClick={handleProcessExcel}
                      >
                        Process
                      </Button>
                    </Box>
                  </Grid>
                </>
              )}
            </Grid>
            <Grid container spacing={2} sx={{ alignItems: "center" }}>
              <Grid size={{ xs: 2 }}>
                <Typography color="textSecondary" fontWeight={600}>
                  Input Manual:{" "}
                </Typography>
              </Grid>
              <Grid size={{ xs: 4 }}>
                <TextFieldCtrl
                  name="external_assessee_name"
                  control={control}
                  label="Name"
                  placeholder="Type Name here ..."
                  rules={{ required: "Name is required" }}
                />
              </Grid>
              <Grid size={{ xs: 4 }}>
                <TextFieldCtrl
                  name="external_assessee_email"
                  control={control}
                  label="Email"
                  placeholder="Type Email here ..."
                  rules={{
                    required: "Email is required",
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: "Invalid email format",
                    },
                  }}
                />
              </Grid>
              <Grid size={{ xs: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<GrAdd />}
                  onClick={handleAddExternalAssessee}
                  loadingPosition="start"
                  loading={loading}
                  color="success"
                >
                  Add
                </Button>
              </Grid>
            </Grid>
          </Stack>
          <Box sx={{ mt: 3 }}>
            <Typography color="textSecondary" fontWeight={600} gutterBottom>
              External Assessee List
            </Typography>
            {externalAssessee.length > 0 ? (
              <MaterialReactTable table={externalAssesseeTable} />
            ) : (
              <Typography color="textSecondary">
                No external assessee added yet. Please add assessees using the form above.
              </Typography>
            )}
          </Box>
        </>
      )}
      <DialogComp
        title="Add New Assessees"
        open={isOpen}
        onClose={close}
        maxWidth="md"
        actions={
          <>
            <Button variant="outlined" onClick={close}>
              Cancel
            </Button>
            <Button
              variant="contained"
              color="success"
              onClick={handleAddAllValidAssessees}
              disabled={!assessmentResults?.valid_assessee?.length}
            >
              Add Valid Assessees
            </Button>
          </>
        }
      >
        <Box sx={{ p: 2 }}>
          {/* Valid Assessees Section */}
          <Typography
            variant="h6"
            sx={{
              color: theme.palette.success.main,
              fontWeight: 600,
              mb: 2,
            }}
          >
            Valid Assessees
          </Typography>
          <Box sx={{ mb: 4 }}>
            {assessmentResults?.valid_assessee && assessmentResults.valid_assessee.length > 0 ? (
              <MaterialReactTable
                table={assignFor === "internal" ? validAssesseeTable : validExternalAssesseeTable}
              />
            ) : (
              <Typography>No valid assessees found</Typography>
            )}
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Invalid Assessees Section */}
          <Typography
            variant="h6"
            sx={{
              color: theme.palette.primary.main,
              fontWeight: 600,
              mb: 1,
            }}
          >
            Invalid Assessees
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
            {assignFor === "internal"
              ? "Please recheck the NIK"
              : "Please recheck the name and email"}
          </Typography>
          <Box sx={{ mb: 4 }}>
            {assessmentResults?.invalid_assessee &&
            assessmentResults.invalid_assessee.length > 0 ? (
              <MaterialReactTable
                table={
                  assignFor === "internal" ? invalidAssesseeTable : invalidExternalAssesseeTable
                }
              />
            ) : (
              <Typography>No invalid assessees found</Typography>
            )}
          </Box>
        </Box>
      </DialogComp>
    </>
  );
};
export default Assignment;
