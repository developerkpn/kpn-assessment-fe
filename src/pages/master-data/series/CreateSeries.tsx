import SelectCtrl from "@/components/forms/Select";
import TextFieldCtrl from "@/components/forms/TextField";
import QuestionCard, { QuestionData } from "@/components/question/QuestionCard";
import useAPI from "@/hooks/useAPI";
import useDialog from "@/hooks/useDialog";
import useFetch from "@/hooks/useFetch";
import { useLoading } from "@/providers/LoadingProvider";
import { snack } from "@/providers/SnackbarProvider";
import { ArrowBack, Visibility } from "@mui/icons-material";
import { Box, Chip, Grid2 as Grid, IconButton, MenuItem, Modal, Typography } from "@mui/material";
import { Create } from "@refinedev/mui";
import { useForm } from "@refinedev/react-hook-form";
import { isAxiosError } from "axios";
import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_ColumnDef,
} from "material-react-table";
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import parse from "html-react-parser";

const CreateSeries: React.FC = () => {
  const {
    refineCore: { formLoading },
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    getValues,
    formState: { isSubmitting },
  } = useForm<any>({
    defaultValues: {
      series_name: "",
      series_code: "",
      category_id: [],
    },
    mode: "onChange",
  });

  const { open: openModal, isOpen: isOpenModal, close: closeModal } = useDialog();

  const navigate = useNavigate();
  const API = useAPI();
  const { id: id_series } = useParams();
  const { showLoading, hideLoading } = useLoading();
  const [selectedQuestion, setSelectedQuestion] = useState<QuestionData | null>(null);
  const { data: categories } = useFetch<{
    data: { id: string; category_code: string; category_name: string }[];
  }>("/category/active");
  const { data: question } = useFetch<any>("/question");
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const handleCategoryChange = (_: any, value: any[]) => {
    setValue(
      "category_id",
      value.map(v => v.value)
    );
  };

  const categoriesOptions = useMemo(() => {
    if (!categories?.data) {
      return [];
    }
    return categories.data.map(item => {
      return {
        value: item.id,
        label: `${item.category_code} - ${item.category_name}`,
      };
    });
  }, [categories]);

  const filteredQuestions = useMemo(() => {
    const selectedCategories = getValues("category_id");
    if (!Array.isArray(selectedCategories)) return [];

    return question?.data.filter((q: any) => selectedCategories.includes(q.category_id)) || [];
  }, [watch("category_id"), question]);

  const columns: MRT_ColumnDef<any>[] = useMemo(
    () => [
      {
        header: "Question",
        accessorKey: "q_input_text",
        Cell: ({ row }) => {
          return (
            <div style={{ maxHeight: "10rem", overflow: "auto" }}>
              {row.original.q_input_text ? (
                parse(row.original.q_input_text)
              ) : (
                <Typography color="text.secondary" fontStyle="italic">
                  no text
                </Typography>
              )}
            </div>
          );
        },
      },
      {
        header: "Created By",
        accessorKey: "created_by",
      },
      {
        header: "Created Date",
        accessorKey: "created_date",
      },
      {
        header: "Actions",
        enableColumnActions: false,
        enableSorting: false,
        enableResizing: false,
        size: 50,
        Cell: ({ row }) => (
          <IconButton onClick={() => handleOpenModal(row.original)}>
            <Visibility />
          </IconButton>
        ),
      },
    ],
    []
  );

  const onSubmit = async (data: any) => {
    try {
      showLoading();
      const payload = {
        series_name: data.series_name,
        series_code: data.series_code,
        questions: Object.keys(rowSelection).map(id => ({
          question_id: id,
        })),
      };
      console.log("Payload: ", JSON.stringify(payload, null, 2));
      if (!id_series) {
        await API.post("/series", payload);
        snack.success("Series created successfully");
      } else {
        await API.patch(`/series/${id_series}`, payload);
        snack.success("Series updated successfully");
      }
      reset();
      setRowSelection({});
      navigate("/admin/series");
    } catch (error) {
      console.error(error);
      snack.error("Failed to create series");
    } finally {
      hideLoading();
    }
  };

  const table = useMaterialReactTable({
    columns,
    data: filteredQuestions,
    getRowId: row => row.id,
    state: {
      rowSelection,
    },
    onRowSelectionChange: setRowSelection,
    enablePagination: true,
    enableColumnFilters: true,
    enableSorting: true,
    enableRowSelection: true,
  });

  const handleOpenModal = (row: any) => {
    setSelectedQuestion(row);
    openModal();
  };

  useEffect(() => {
    if (!id_series) return;
    (async () => {
      try {
        const { data } = await API.get(`/series/create/${id_series}`);
        const series_dt = data.data;
        let question_id_parsetable: { [k: string]: boolean } = {};
        series_dt.questions_id.map((value: string) => {
          question_id_parsetable[value] = true;
        });
        setRowSelection(question_id_parsetable);
        reset({
          series_name: series_dt.series_name,
          series_code: series_dt.series_code,
          category_id: series_dt.category_id,
          question_id: series_dt.questions_id,
        });
      } catch (error) {
        console.error(error);
        if (isAxiosError(error)) {
          snack.error(`Failed to fetch series data: ${error.response?.data.message}`);
        }
      }
    })();
  }, [id_series]);

  useEffect(() => {
    const currentCats: string[] = getValues("category_id") || [];
    if (!question) return;
    setRowSelection(prev => {
      let result: any = {};
      const selectedRows = Object.keys(prev).map(key => {
        const question_data = question.data.find((q: any) => q.id == key);
        return question_data;
      });
      for (const dt of selectedRows) {
        if (currentCats.includes(dt.category_id)) {
          result[dt.id] = true;
        }
      }
      return result;
    });
  }, [watch("category_id")]);

  return (
    <Create
      title={
        <Typography variant="h6" fontWeight="600">
          Create a New Series
        </Typography>
      }
      isLoading={formLoading}
      saveButtonProps={{
        onClick: handleSubmit(onSubmit),
        disabled: isSubmitting,
      }}
      goBack={<IconButton children={<ArrowBack />} onClick={() => navigate(-1)} />}
    >
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 4 }}>
          <TextFieldCtrl
            control={control}
            name="series_name"
            label="Series Name"
            rules={{
              required: true,
              maxLength: { value: 255, message: "Max 255 characters allowed" },
            }}
            placeholder="Input series name here"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <TextFieldCtrl
            control={control}
            name="series_code"
            label="Series Code"
            rules={{
              required: true,
              maxLength: { value: 16, message: "Max 16 characters allowed" },
            }}
            placeholder="Input series code here"
            toUpperCase={true}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <SelectCtrl
            name="category_id"
            control={control}
            label="Category"
            multiple={true}
            onChangeOvr={handleCategoryChange}
            renderValue={selected => (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                {selected.map((value: string) => {
                  const category = categoriesOptions.find(option => option.value === value);
                  return (
                    <Chip
                      key={value}
                      label={category?.label}
                      size="small"
                      onMouseDown={e => e.stopPropagation()}
                      onDelete={e => {
                        e.stopPropagation();
                        const newValue = selected.filter((v: string) => v !== value);
                        setValue("category_id", newValue);
                      }}
                      sx={{ color: "text.primary" }}
                    />
                  );
                })}
              </Box>
            )}
          >
            {categoriesOptions.map(option => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </SelectCtrl>
        </Grid>
      </Grid>
      <Box mt={2}>
        <MaterialReactTable table={table} />
      </Box>
      <Modal
        keepMounted
        open={isOpenModal}
        onClose={closeModal}
        sx={{
          alignContent: "center",
          justifySelf: "center",
          width: "80%",
          maxWidth: "sm",
        }}
      >
        <Box
          sx={{
            maxWidth: "sm",
            maxHeight: "90vh",
            bgcolor: "background.paper",
            borderRadius: 1,
            p: 2,
            overflow: "auto",
          }}
        >
          <QuestionCard questionData={selectedQuestion} />
        </Box>
      </Modal>
    </Create>
  );
};
export default CreateSeries;
