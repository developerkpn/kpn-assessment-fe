import { Typography, Button, IconButton } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { useLoading } from "@/providers/LoadingProvider";
import useFetch from "@/hooks/useFetch";
import { useMemo, useState } from "react";
import useDialog from "@/hooks/useDialog";
import StandardTable from "@/components/StandardTable";
import { TableSkeleton } from "@/components/Skeleton";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useForm } from "react-hook-form";
import DialogComp from "@/components/Dialog";
import TextFieldCtrl from "@/components/forms/TextField";
import CheckboxCtrl from "@/components/forms/Checkbox";
import { snack } from "@/providers/SnackbarProvider";
import { isAxiosError } from "axios";
import { FMValues } from "@/types/MasterData";
import useAuthStore from "@/hooks/useAuthStore";
import useAPI from "@/hooks/useAPI";

const FunctionMenu = () => {
  const API = useAPI();
  const user_id = useAuthStore(state => state.user_id);
  const getPermission = useAuthStore(state => state.getPermission);
  const { showLoading, hideLoading } = useLoading();
  const { data: fm, refetch } = useFetch<any>("/function-menu/master");
  const [selected, setSelected] = useState({ id: "", name: "" });
  const [isEdit, setIsEdit] = useState(false);
  const { isOpen: isOpenDelete, open: openDelete, close: closeDelete } = useDialog();
  const { isOpen: isOpenForm, open: openForm, close: closeForm } = useDialog();
  const {
    control,
    reset,
    handleSubmit,
    formState: { isDirty },
  } = useForm({
    defaultValues: {
      fm_code: "",
      fm_name: "",
      created_by: user_id,
      is_active: true,
    },
  });

  const columns: any = useMemo(
    () => [
      {
        header: "Code",
        accessorKey: "fm_code",
        cell: (props: any) => props.getValue(),
      },
      {
        header: "Name",
        accessorKey: "fm_name",
        cell: (props: any) => props.getValue(),
      },
      {
        header: "Active",
        accessorKey: "is_active",
        cell: (props: any) => props.getValue().toString(),
      },
      {
        header: "Action",
        accessorKey: "id",
        meta: { align: "right" },
        cell: (props: any) => {
          const id = props.getValue();
          const name = props.row.original.fm_name;

          return (
            <>
              {getPermission("fupdate", 6) && (
                <IconButton
                  onClick={() => handleOpenForm(props.row.original, id)}
                  aria-label="edit"
                  size="small"
                  edge="end"
                  sx={{ mr: 1 }}
                >
                  <EditIcon />
                </IconButton>
              )}
              {getPermission("fdelete", 6) && (
                <IconButton
                  onClick={() => handleOpenDelete(id, name)}
                  aria-label="delete"
                  color="error"
                  size="small"
                  edge="end"
                >
                  <DeleteIcon />
                </IconButton>
              )}
            </>
          );
        },
      },
    ],
    []
  );

  const handleCloseForm = () => {
    reset();
    closeForm();
  };

  const handleOpenForm = (data?: FMValues, id?: string) => {
    if (data && id) {
      setIsEdit(true);
      setSelected({ id: id, name: data.fm_name });
      reset(
        {
          fm_code: data.fm_code,
          fm_name: data.fm_name,
          is_active: data.is_active,
        },
        { keepDefaultValues: true, keepDirty: true }
      );
    } else {
      setIsEdit(false);
    }
    openForm();
  };

  const handleOpenDelete = (id: string, name: string) => {
    setSelected({ id, name });
    openDelete();
  };

  const handleDelete = async (id: string) => {
    showLoading();
    try {
      const res = await API.delete(`/function-menu/${id}`);
      console.log(res);
      refetch();
      snack.success(res.data?.message);
    } catch (error) {
      if (isAxiosError(error)) {
        const data = error.response?.data;
        snack.error(data.message);
        console.error(error.response);
      } else {
        snack.error("Error, check log for details");
        console.error(error);
      }
    } finally {
      closeDelete();
      hideLoading();
    }
  };

  const onCreate = async (values: FMValues) => {
    console.log("test", values);
    showLoading();
    try {
      const res = await API.post(`/function-menu`, values);
      console.log(res);
      refetch();
      snack.success(`Function Menu created successfully`);
    } catch (error) {
      if (isAxiosError(error)) {
        const data = error.response?.data;
        snack.error(data.message);
        console.error(error.response);
      } else {
        snack.error("Error, check log for details");
        console.error(error);
      }
    } finally {
      handleCloseForm();
      hideLoading();
    }
  };

  const onEdit = async (values: FMValues) => {
    console.log(values);
    showLoading();
    try {
      const res = await API.patch(`/function-menu/${selected.id}`, values);
      console.log(res);
      refetch();
      snack.success(`${res.data.message} ${res.data.fm_code}`);
    } catch (error) {
      if (isAxiosError(error)) {
        const data = error.response?.data;
        snack.error(data.message);
        console.error(error.response);
      } else {
        snack.error("Error, check log for details");
        console.error(error);
      }
    } finally {
      handleCloseForm();
      hideLoading();
    }
  };

  return (
    <>
      <Typography variant="h1" color="primary">
        Function Menu
        {getPermission("fcreate", 6) && (
          <Button
            startIcon={<AddIcon />}
            variant="outlined"
            sx={{ ml: 2 }}
            onClick={() => handleOpenForm()}
          >
            Create Function
          </Button>
        )}
      </Typography>

      {fm ? (
        getPermission("fread", 6) && <StandardTable columns={columns} data={fm?.data} />
      ) : (
        <TableSkeleton column={4} row={2} small />
      )}

      <DialogComp
        title="Delete Function Menu"
        open={isOpenDelete}
        onClose={closeDelete}
        actions={
          <>
            <Button onClick={closeDelete} variant="outlined" color="error">
              Cancel
            </Button>
            <Button onClick={() => handleDelete(selected.id)} variant="contained" color="error">
              Delete
            </Button>
          </>
        }
      >
        <Typography>{`Are you sure you want to delete ${selected.name}?`}</Typography>
      </DialogComp>

      <DialogComp
        title={!isEdit ? "Create Function Menu" : "Edit Function Menu"}
        open={isOpenForm}
        onClose={handleCloseForm}
        actions={
          <>
            <Button onClick={handleCloseForm} variant="outlined">
              Cancel
            </Button>
            <Button
              onClick={!isEdit ? handleSubmit(onCreate) : handleSubmit(onEdit)}
              variant="contained"
              disabled={!isDirty}
            >
              {!isEdit ? "Create" : "Edit"}
            </Button>
          </>
        }
      >
        <TextFieldCtrl
          control={control}
          label="Code"
          name="fm_code"
          rules={{
            required: "Field required",
            maxLength: { value: 5, message: "Max 5 characters allowed" },
          }}
        />
        <TextFieldCtrl
          control={control}
          label="Name"
          name="fm_name"
          rules={{
            required: "Field required",
            maxLength: { value: 100, message: "Max 100 characters allowed" },
          }}
        />
        <CheckboxCtrl name="is_active" control={control} label="Active" />
      </DialogComp>
    </>
  );
};
export default FunctionMenu;
