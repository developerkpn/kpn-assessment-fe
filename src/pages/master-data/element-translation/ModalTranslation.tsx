import { forwardRef, useImperativeHandle, useState, useRef, useMemo, useEffect } from "react";
import CustomTable, { CustomTableColumn, CustomTablePropsRef } from "@/components/CustomTable";
import { ElementTranslation, LanguageMaster } from "@/types/MasterData";
import { createRow, MRT_Row, MRT_TableOptions } from "material-react-table";
import { Box, IconButton, Tooltip, Button, debounce } from "@mui/material";
import { Edit as EditIcon, Delete as DeleteIcon, Translate } from "@mui/icons-material";
import DialogFormConfirmation, {
  RefDialogConfirmation,
} from "@/components/common/DialogFormConfirmation";
import useAPI from "@/hooks/useAPI";
import { snack } from "@/providers/SnackbarProvider";
import { AxiosResponse, isAxiosError } from "axios";
import useFetch from "@/hooks/useFetch";

interface TranslationRefInterface {
  isDirty: boolean;
}

interface TranslationInterface {
  data: ElementTranslation[];
  element_id: string;
  from_data: ElementTranslation | null;
}

interface DeleteConfirmationModalRefInterface {
  openDeleteConfirmModal: (row: MRT_Row<ElementTranslation>) => void;
}

interface DeleteConfirmationProps {
  onDeleteSuccess: (deletedId: string) => void;
  onNo?: () => void;
}

const GenerateAutoTranslation = ({
  language_from,
  language_to,
  desc_from,
  setDesc,
}: {
  language_from: string;
  language_to: string;
  desc_from: string;
  setDesc: (value: string) => void;
}) => {
  const api = useAPI();
  const [loading, setLoading] = useState(false);
  return (
    <IconButton
      onClick={async e => {
        try {
          setLoading(true);
          const { data }: AxiosResponse<{ data: string }> = await api.post("/translation/simple", {
            value: desc_from,
            from: language_from,
            to: language_to,
          });
          setDesc(data.data);
        } catch (error) {
          console.error(error);
          if (isAxiosError(error)) {
            snack.error(error?.response?.data?.message);
          } else {
            snack.error((error as Error).message);
          }
        } finally {
          setLoading(false);
        }
      }}
      loading={loading}
    >
      <Translate />
    </IconButton>
  );
};

const DeleteConfirmationModal = forwardRef<
  DeleteConfirmationModalRefInterface,
  DeleteConfirmationProps
>(({ onDeleteSuccess, onNo }, ref) => {
  const api = useAPI();
  const [data, setData] = useState<MRT_Row<ElementTranslation>>();
  const modalConf = useRef<RefDialogConfirmation>(null);
  useImperativeHandle(ref, () => ({
    openDeleteConfirmModal: row => {
      modalConf.current?.setOpen(true);
      setData(row);
    },
  }));
  const onYes = async () => {
    try {
      const deletedId = data?.original.id;
      await api.delete(`/languages/elements/${deletedId}`);
      modalConf.current?.setOpen(false);
      snack.success("Delete Success");
      onDeleteSuccess(deletedId!);
    } catch (error) {
      console.error(error);
      let errmsg = "";
      if (isAxiosError(error)) {
        errmsg = error.response?.data.message;
      } else {
        errmsg = (error as Error).message;
      }
      snack.error(errmsg);
    }
  };
  const onNomodal = () => {
    if (onNo) {
      onNo();
    }
    modalConf.current?.setOpen(false);
  };

  return (
    <DialogFormConfirmation
      ref={modalConf}
      onYes={onYes}
      onNo={onNomodal}
      Title={
        <h4>
          Delete Translation {data?.original.language_id} - {data?.original.element_id}
        </h4>
      }
      Content={
        <p>
          Are you sure want to delete {data?.original.language_id} - {data?.original.element_id} ?
        </p>
      }
    />
  );
});

export const ModalTranslation = forwardRef<TranslationRefInterface, TranslationInterface>(
  ({ data, element_id, from_data }, ref) => {
    const refTable = useRef<CustomTablePropsRef<ElementTranslation> | null>(null);
    const api = useAPI();
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
    const { data: dtLanguage } = useFetch<{ data: LanguageMaster[] }>("/languages");
    const [isDirty, setIsDirty] = useState(false);
    const [tempData, setTempData] = useState<ElementTranslation[]>(data);
    const [toLang, setToLang] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [onEdit, setOnEdit] = useState(false);
    const DialogDeleteRef = useRef<DeleteConfirmationModalRefInterface | null>(null);
    const openDeleteConfirmModal = (row: MRT_Row<ElementTranslation>) => {
      DialogDeleteRef.current?.openDeleteConfirmModal(row);
    };
    useImperativeHandle(ref, () => ({
      isDirty: isDirty,
    }));

    const existedLang: Set<string> = useMemo(() => {
      const NewExistedLang: Set<string> = new Set();
      tempData.forEach(value => {
        NewExistedLang.add(value.language_id);
      });
      return NewExistedLang;
    }, [tempData]);

    const languageOpt = useMemo(() => {
      return dtLanguage?.data.map(item => {
        return {
          value: item.language_code,
          label: `${item.language_name} (${item.language_name_native}) `,
        };
      });
    }, [dtLanguage]);

    const renderRowActions: MRT_TableOptions<ElementTranslation>["renderRowActions"] = ({
      row,
      table,
    }) => {
      const isMainLanguage = row.original.language_id === "en";
      return (
        <Box sx={{ display: "flex" }}>
          <Tooltip title="Edit">
            <IconButton
              disabled={onEdit}
              onClick={() => {
                setToLang(row.original.language_id);
                table.setEditingRow(row);
                setOnEdit(true);
              }}
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
          {!isMainLanguage && (
            <Tooltip title="Delete">
              <IconButton
                disabled={onEdit}
                color="error"
                onClick={() => {
                  setOnEdit(true);
                  openDeleteConfirmModal(row);
                }}
              >
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      );
    };

    const onEditingRowSave: MRT_TableOptions<ElementTranslation>["onEditingRowSave"] = async ({
      values,
      table,
      row,
    }) => {
      const id = row.original.id;
      setIsSaving(true);
      try {
        await api.put(`/languages/elements/${id}`, {
          description: values.description,
        });

        setTempData(prev =>
          prev.map(item => (item.id === id ? { ...item, description: values.description } : item))
        );

        setIsDirty(true);
        snack.success("Translation updated successfully");
        table.setEditingRow(null);
        setOnEdit(false);
      } catch (error) {
        console.error(error);
        if (isAxiosError(error)) {
          snack.error(error.response?.data.message);
        } else {
          snack.error((error as Error).message);
        }
      } finally {
        setIsSaving(false);
      }
    };
    const onCreatingRowSave: MRT_TableOptions<ElementTranslation>["onCreatingRowSave"] = async ({
      values,
      table,
    }) => {
      if (existedLang.has(values.language_id)) {
        setValidationErrors(prev => ({ ...prev, language_id: "Duplicate language not allowed" }));
        return;
      }

      setIsSaving(true);
      try {
        const result = await api.post("/languages/elements", {
          element_id: element_id,
          language_id: values.language_id,
          description: values.description,
        });

        // Optimistic update: Add new translation to tempData
        const newTranslation = result.data.data;
        const languageInfo = dtLanguage?.data.find(
          lang => lang.language_code === values.language_id
        );

        setTempData(prev => [
          ...prev,
          {
            ...newTranslation,
            language_name: languageInfo?.language_name || "",
            language_name_native: languageInfo?.language_name_native || "",
          },
        ]);

        setIsDirty(true);
        snack.success("Translation created successfully");
        table.setCreatingRow(null);
        setOnEdit(false);
        setValidationErrors({});
      } catch (error) {
        console.error(error);
        if (isAxiosError(error)) {
          snack.error(error.response?.data.message);
        } else {
          snack.error((error as Error).message);
        }
      } finally {
        setIsSaving(false);
      }
    };

    useEffect(() => {
      console.log(validationErrors);
    }, [validationErrors]);

    useEffect(() => {
      console.log("Modal received data:", data);
      setTempData(data);
      // Reset isDirty when fresh data comes from parent
      setIsDirty(false);
    }, [data]);
    const renderTopToolbar: MRT_TableOptions<ElementTranslation>["renderTopToolbarCustomActions"] =
      ({ table }) => {
        return (
          <Button
            variant="contained"
            onClick={() => {
              table.setCreatingRow(true);
              setOnEdit(true);
            }}
          >
            + Add
          </Button>
        );
      };

    const column: CustomTableColumn<ElementTranslation>[] = [
      {
        header: "Language",
        accessorKey: "language_id",
        editVariant: "select",
        editSelectOptions: languageOpt,
        Cell: ({ row }) => {
          const data = row.original;
          return `${data.language_name} (${data.language_name_native})`;
        },
        muiEditTextFieldProps: ({ row }) => ({
          select: true,
          disabled: !!row.original.id, // disable if row has id (editing mode)
          error: !!validationErrors?.language_id,
          helperText: validationErrors?.language_id,
          onChange: e => {
            setToLang(e.target.value);
          },
        }),
      },
      {
        header: "Description",
        accessorKey: "description",
        muiEditTextFieldProps: ({ table, row }) => {
          const fieldRef = useRef<HTMLInputElement | null>(null);
          return {
            ref: fieldRef,
            slotProps: {
              input: {
                endAdornment: !row.original.id && (
                  <>
                    <GenerateAutoTranslation
                      language_from={"en"}
                      language_to={toLang}
                      desc_from={from_data?.description ?? ""}
                      setDesc={(value: string) => {
                        if (refTable.current) {
                          const creatinRow = refTable.current?.GetTableCreatingRow();
                          console.log("creating row :", creatinRow);
                          if (creatinRow) {
                            table.setCreatingRow(null);
                            debounce(() => {
                              table.setCreatingRow(
                                createRow(table, { ...creatinRow._valuesCache, description: value })
                              );
                            }, 100)();
                          }
                        }
                      }}
                    />
                  </>
                ),
              },
            },
          };
        },
      },
    ];
    return (
      <>
        <DeleteConfirmationModal
          ref={DialogDeleteRef}
          onDeleteSuccess={deletedId => {
            // Optimistic update: Remove from tempData
            setTempData(prev => prev.filter(item => item.id !== deletedId));
            setIsDirty(true);
            setOnEdit(false);
          }}
          onNo={() => {
            setOnEdit(false);
          }}
        />
        <CustomTable
          ref={refTable}
          data={tempData}
          columns={column}
          renderRowActions={renderRowActions}
          onEditingRowSave={onEditingRowSave}
          renderTopToolbarCustomActions={renderTopToolbar}
          enableGlobalFilter={false}
          onCreatingRowSave={onCreatingRowSave}
          isLoading={isSaving}
          onEditingRowCancel={() => {
            setOnEdit(false);
          }}
          onCreatingRowCancel={() => {
            setOnEdit(false);
          }}
        />
      </>
    );
  }
);
