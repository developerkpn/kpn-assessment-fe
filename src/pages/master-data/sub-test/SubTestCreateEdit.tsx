import {Button, Typography, Box, IconButton, Autocomplete, TextField, Grid2 as Grid} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
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
import { isAxiosError } from "axios";
import { TimePicker } from "@mui/x-date-pickers";
import dayjs, { Dayjs } from "dayjs";
import moment from 'moment';
import VisibilityIcon from "@mui/icons-material/Visibility";

const SubTestCreateEdit = () => {
    const { id } = useParams();
    const isEdit = Boolean(id);
    const API = useAPI();
    const { showLoading, hideLoading } = useLoading();
    const navigate = useNavigate();
    const { data: test, refetch: refetchTest } = useFetch<any>(isEdit ? `/subtest/${id}` : null);
    const { data: availableSeries, refetch: refetchAvailableSeries } = useFetch<{ data: any[] }>(
        isEdit ? `/subtest/${id}/series-available` : null
    );
    const { data: allSeries } = useFetch<{ data: any[] }>(!isEdit ? `/series/active` : null);
    const { data: criteria } = useFetch<any>(`/criteria`)
    const { isOpen: isOpenDelete, open: openDelete, close: closeDelete } = useDialog();
    const { isOpen: isOpenForm, open: openForm, close: closeForm } = useDialog();
    const [selectedRows, setSelectedRows] = useState({});
    const [selectedTest, setSelectedTest] = useState<{ id: string; series_name: string } | null>(null);

    const {
        control,
        handleSubmit,
        reset
    } = useForm({
        defaultValues: {
            subtest_name: "",
            subtest_code: "",
            duration: dayjs("2022-01-01T00:00:00"),
            criteria_id: "",
            is_active: true,
            subtests: []
        }
    });

    useEffect(() => {
        if (!test) return;
        if (isEdit && test) {
            // Ubah subtest_duration (format "hh:mm:ss") menjadi objek dayjs
            const parsedDuration: Dayjs = test?.data.subtest_duration
                ? dayjs(`2022-01-01T${test.data.subtest_duration}`)
                : dayjs("2022-01-01T00:00:00");

            reset({
                subtest_name: test?.data.subtest_name,
                subtest_code: test?.data.subtest_code,
                is_active: test?.data.is_active,
                duration: parsedDuration,
                criteria_id: test?.data.criteria_id,
            });
        }
    }, [isEdit, test, reset]);

    // Fungsi untuk format objek dayjs menjadi string "HH:mm:ss"
    const formatDuration = (dayjsValue: Dayjs) => {
        if (!dayjsValue || !dayjsValue.isValid()) return "00:00:00";
        return `${String(dayjsValue.hour()).padStart(2, "0")}:${String(dayjsValue.minute()).padStart(2, "0")}:${String(dayjsValue.second()).padStart(2, "0")}`;
    };

    const allChildColumns: MRT_ColumnDef<any>[] = useMemo(
        () => [
            {
                header: "Name",
                accessorKey: "series_name",
                muiTableHeadCellProps: { align: "center" },
                muiTableBodyCellProps: { align: "center" },
            },
            {
                header: "Code",
                accessorKey: "series_code",
                muiTableHeadCellProps: { align: "center" },
                muiTableBodyCellProps: { align: "center" },
            },
            {
                header: "Total Question",
                accessorKey: "question_count",
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
                    return value ? moment(value).format("MMMM DD, YYYY hh:mm A") : '';
                }
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
                    return (
                        <Box sx={{ display: "flex", justifyContent: "center" }}>
                            <IconButton
                                onClick={() => navigate(`/admin/subtest/detail/${id}`)}
                                aria-label="edit"
                                size="small">
                                <VisibilityIcon />
                            </IconButton>
                        </Box>
                    )
                }
            },
        ],
        []
    );

    const selectedColumns: MRT_ColumnDef<any>[] = useMemo(
        () => [
            {
                header: "Name",
                accessorKey: "series_name",
                muiTableHeadCellProps: { align: "center" },
                muiTableBodyCellProps: { align: "center" },
            },
            {
                header: "Code",
                accessorKey: "series_code",
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
                    return value ? moment(value).format("MMMM DD, YYYY hh:mm A") : '';
                }
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
                    const series_name = row.original.series_name;
                    return (
                        <Box sx={{ display: "flex", justifyContent: "center", gap: "8px" }}>
                            <IconButton
                                onClick={() => navigate(`/admin/series/detail/${id}`)}
                                aria-label="edit"
                                size="small">
                                <VisibilityIcon />
                            </IconButton>
                            <IconButton color="error" onClick={() => handleOpenDelete(id, series_name)}>
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
                header: "Series",
                accessorKey: "series_name",
                muiTableHeadCellProps: { align: "center" },
                muiTableBodyCellProps: { align: "center" },
            },
            {
                header: "Code",
                accessorKey: "series_code",
                muiTableHeadCellProps: { align: "center" },
                muiTableBodyCellProps: { align: "center" },
            },
            {
                header: "Total Question",
                accessorKey: "question_count",
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
                    return value ? moment(value).format("MMMM DD, YYYY hh:mm A") : '';
                }
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
                    return (
                        <Box sx={{ display: "flex", justifyContent: "center", gap: "8px" }}>
                            <IconButton
                                onClick={() => navigate(`/admin/series/detail/${id}`)}
                                aria-label="edit"
                                size="small">
                                <VisibilityIcon />
                            </IconButton>
                        </Box>
                    )
                }
            },
        ],
        []
    );

    // Tabel yang sudah dipilih (saat edit)
    const selectedTable = useMaterialReactTable({
        columns: selectedColumns,
        data: test?.data.series ?? [],
        getRowId: (row) => row.id,
        enablePagination: true,
        enableRowSelection: false,
        enableColumnFilters: true,
        enableSorting: true,
        enableRowActions: false,
    });

    // Tabel subtest yang masih bisa dipilih (saat edit)
    const availableTable = useMaterialReactTable({
        columns: availableColumns,
        data: availableSeries?.data ?? [],
        getRowId: (row) => row.id,
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
        data: allSeries?.data ?? [],
        getRowId: (row) => row.id,
        enablePagination: true,
        enableRowSelection: true,
        enableColumnFilters: true,
        enableSorting: true,
        onRowSelectionChange: setSelectedRows,
        state: { rowSelection: selectedRows },
    });

    const handleCloseForm = () => {
        reset();
        closeForm();
    };

// Update the handleOpenForm logic for edit mode
    const handleOpenForm = () => {
        openForm()
    };

    const handleOpenDelete = (id: string, series_name: string) => {
        setSelectedTest({ id, series_name });
        openDelete();
    };

    const onSubmit = async (values: any) => {
        showLoading();
        try {
            const payload: any = {
                subtest_name: values.subtest_name,
                subtest_code: values.subtest_code,
                // Ubah key duration menjadi subtest_duration dengan format hh:mm:ss
                subtest_duration: formatDuration(values.duration),
                criteria_id: values.criteria_id,
                is_active: values.is_active,
                series: Object.keys(selectedRows).map((id) => ({
                    series_id: id
                })),
                is_duration: values.is_duration ?? false,
                is_criteria: values.is_criteria ?? false,
                is_mandatory: values.is_mandatory ?? false,
                intro_desc: values.intro_desc ?? "",
                subtest_desc: values.subtest_desc ?? "",
                series_example_id: values.series_example_id ?? null,
                is_example_answer_shown: values.is_example_answer_shown ?? null,
                language_id: values.language_id ?? "en",
            };

            if (isEdit) {
                await API.patch(`/subtest/${id}`, payload);
                snack.success("Test berhasil diperbarui");
                navigate(-1);
            } else {
                delete payload.is_active;
                await API.post("/subtest", payload);
                snack.success("Test berhasil dibuat");
                navigate(-1);
            }
            refetchTest();
        } catch {
            snack.error("Terjadi kesalahan");
        } finally {
            handleCloseForm();
            hideLoading();
        }
    };

    const handleDelete = async (id: string, detailId: string) => {
        showLoading();
        try {
            const res = await API.delete(`/test/${id}/subtest/${detailId}`);
            refetchTest();
            refetchAvailableSeries();
            snack.success(res.data?.message);
        } catch (error) {
            if (isAxiosError(error)) {
                const data = error.response?.data;
                snack.error(data?.message || "Terjadi kesalahan");
            } else {
                snack.error("Error, check log for details");
            }
        } finally {
            handleCloseForm();
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
                    {isEdit ? "Edit" : "New"} Sub Test
                </Typography>
            </Box>

            <Grid container spacing={2}>
                <Grid size={3}>
                    <TextFieldCtrl name="subtest_name" control={control} label="Name" rules={{ required: "Field required" }} />
                </Grid>
                <Grid size={3}>
                    <TextFieldCtrl name="subtest_code" control={control} label="Code" rules={{ required: "Field required" }} />
                </Grid>
                <Grid size={3}>
                    <Controller
                        name="duration"
                        control={control}
                        rules={{ required: "Duration is required" }}
                        render={({ field, fieldState }) => (
                            <TimePicker
                                label="Duration (hh:mm:ss)"
                                value={field.value}
                                onChange={field.onChange}
                                views={["hours", "minutes", "seconds"]}
                                format="HH:mm:ss"
                                ampm={false}
                                slotProps={{
                                    textField: {
                                        fullWidth: true,
                                        variant: "outlined",
                                        error: !!fieldState.error,
                                        helperText: fieldState.error?.message,
                                    },
                                }}
                            />
                        )}
                    />
                </Grid>
                <Grid size={3}>
                    <Controller
                        name="criteria_id"
                        control={control}
                        rules={{ required: "Criteria is required" }}
                        render={({ field, fieldState }) => {
                            // Mencari opsi yang sesuai dengan nilai field
                            const selectedOption =
                                criteria?.data?.find((c: any) => c.value_id === field.value) || null;

                            return (
                                <Autocomplete
                                    disablePortal
                                    options={criteria?.data || []}
                                    getOptionLabel={(option) => `${option.value_name} (${option.value_code})`}
                                    value={selectedOption}
                                    onChange={(_, newValue) =>
                                        field.onChange(newValue ? newValue.value_id : null)
                                    }
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Criteria"
                                            error={!!fieldState.error}
                                            helperText={fieldState.error?.message}
                                        />
                                    )}
                                />
                            );
                        }}
                    />
                </Grid>
            </Grid>

            {isEdit ? (
                <>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <CheckboxCtrl name="is_active" control={control} label="Active" />
                        <Typography variant="h6">Taken Series</Typography>
                        <MaterialReactTable table={selectedTable} />
                        <Typography variant="h6">Available Series</Typography>
                        <MaterialReactTable table={availableTable} />
                    </Box>
                </>
            ) : (
                <>
                    <Typography variant="h6">Series</Typography>
                    <MaterialReactTable table={allTable} />
                </>
            )}

            <Box textAlign="right" mt={4}>
                <Button
                    variant="contained"
                    onClick={handleOpenForm}
                >
                    Save
                </Button>
            </Box>

            <DialogComp
                title={isEdit ? "Edit Sub Test" : "Create Sub Test"}
                open={isOpenForm}
                onClose={closeForm}
                actions={[
                    <Button onClick={closeForm} variant="outlined" color="error" key="cancel">
                        Cancel
                    </Button>,
                    <Button
                        onClick={handleSubmit(onSubmit)}
                        variant="contained"
                        color="primary"
                        key="submit"
                    >
                        {isEdit ? "Edit" : "Create"}
                    </Button>,
                ]}
            >
                <Typography>{`Apakah Anda yakin ingin ${isEdit ? "mengedit" : "membuat"} Test?`}</Typography>
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
                            <Button onClick={() => handleDelete(id!, selectedTest?.id)} variant="contained" color="error">
                                Delete
                            </Button>
                        )}
                    </>
                }
            >
                {selectedTest && (
                    <Typography>{`Are you sure you want to delete ${selectedTest.series_name}?`}</Typography>
                )}
            </DialogComp>
        </>
    );
};

export default SubTestCreateEdit;
