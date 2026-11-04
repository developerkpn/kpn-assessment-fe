import { Box, Button, Container, IconButton, MenuItem, Typography } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useForm } from "react-hook-form";
import TextFieldCtrl from "@/components/forms/TextField";
import CheckboxCtrl from "@/components/forms/Checkbox";
import SelectCtrl from "@/components/forms/Select";
import useFetch from "@/hooks/useFetch";
import { useLoading } from "@/providers/LoadingProvider";
import { snack } from "@/providers/SnackbarProvider";
import { AxiosResponse, isAxiosError } from "axios";
import useAPI from "@/hooks/useAPI";
import { useEffect, useMemo, useState } from "react";
import { TableSkeleton } from "@/components/Skeleton";
import { BUValues, ScopeValues } from "@/types/MasterData";
import { PasswordWithEye } from "@/components/forms/PasswordWithEye";
import AutoCompleteComp from "@/components/forms/AutoCompleteComp";

type FetchFromDarwin = {
  fullname: string;
  email: string;
  username: string;
};

interface CreateAdminForm {
  username: string;
  fullname: string;
  bu_id: { value: string; label: string }[];
  scope: { value: string; label: string }[];
  email: string;
  password: string;
  is_active: boolean;
  role_id: string;
  created_by: string;
  from_darwin: boolean;
  nik: string;
}

const CreateAdmin = () => {
  const API = useAPI();
  const { id } = useParams();
  const navigate = useNavigate();
  const [loadingCheck, setLoadingCheck] = useState(false);
  const { showLoading, hideLoading } = useLoading();
  const { data: role } = useFetch<any>("/admin/role");
  const { data: adminData, loading } = useFetch<any>(id ? `/admin/${id}` : null);
  const { data: bu_data } = useFetch<{ message: string; data: BUValues[] }>("/bu/active");
  const { data: scope_data } = useFetch<{ data: ScopeValues[] }>("/scope");
  const bu_opt = useMemo(() => {
    if (!bu_data?.data) {
      return [];
    }
    return bu_data.data.map(item => ({
      value: item.bu_code,
      label: item.bu_name,
    }));
  }, [bu_data]);

  const scope_opt = useMemo(() => {
    if (!scope_data?.data) {
      return [];
    }
    return scope_data.data.map(item => ({
      value: item.scope_id,
      label: item.scope_desc,
    }));
  }, [bu_data]);

  const isEditMode = !!id;

  const {
    control,
    handleSubmit,
    reset,
    watch,
    getValues,
    setValue,
    formState: { dirtyFields, isDirty },
  } = useForm<CreateAdminForm>({
    defaultValues: {
      username: "",
      fullname: "",
      bu_id: [],
      scope: [],
      email: "",
      password: "",
      is_active: true,
      role_id: "",
      created_by: "",
      from_darwin: false,
      nik: "",
    },
  });

  useEffect(() => {
    if (adminData?.data && isEditMode) {
      reset({
        nik: adminData.data.nik ?? "",
        username: adminData.data.username || "",
        fullname: adminData.data.fullname || "",
        email: adminData.data.email || "",
        is_active: adminData.data.is_active ?? true,
        role_id: adminData.data.role_id || "",
        created_by: adminData.data.created_by || "",
        bu_id: adminData.data.bu_id || [],
        scope: adminData.data.scope || [],
        from_darwin: adminData.data.from_darwin || false,
      });
    }
  }, [adminData, isEditMode, reset]);

  const onSubmit = async (values: any) => {
    showLoading();
    try {
      const endpoint = isEditMode ? `/admin/${id}` : `/admin`;
      const method = isEditMode ? "patch" : "post";
      if (isEditMode && !dirtyFields.password) {
        delete values.password;
      }
      let payload = {
        ...values,
        bu_id: values.bu_id.map((value: any) => value.value),
        scope: values.scope.map((value: any) => value.value),
      };
      if (isEditMode && !dirtyFields.bu_id) {
        delete payload.bu_id;
      }
      if (isEditMode && !dirtyFields.scope) {
        delete payload.scope;
      }
      const res = await API[method](endpoint, payload);
      snack.success(`${res.data.message}`);
      navigate("/admin/accounts");
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
      hideLoading();
    }
  };

  const checkDarwin = async () => {
    const nik = getValues("nik");
    try {
      setLoadingCheck(true);
      const { data }: AxiosResponse<{ data: FetchFromDarwin }> = await API.get(
        "/admin/darwin/" + nik
      );
      if (data.data) {
        (Object.keys(data.data) as (keyof FetchFromDarwin)[]).forEach(key => {
          setValue(key, data.data[key]);
        });
        setValue("from_darwin", true);
      }
    } catch (error) {
      console.error(error);
      if (isAxiosError(error)) {
        snack.error(error.response?.data.message);
      } else {
        snack.error((error as Error).message);
      }
    } finally {
      setLoadingCheck(false);
    }
  };

  const resetField = () => {
    reset({
      username: "",
      fullname: "",
      bu_id: [],
      scope: [],
      email: "",
      password: "",
      is_active: true,
      role_id: "",
      created_by: "",
      from_darwin: false,
      nik: "",
    });
  };

  if (loading) {
    <Container maxWidth="sm">
      <TableSkeleton column={4} row={2} small />
    </Container>;
  }

  return (
    <>
      <Box sx={{ display: "flex", alignItems: "center", mb: 2, gap: 1 }}>
        <IconButton onClick={() => navigate(-1)}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h2" color="primary" mb={0}>
          {isEditMode ? "Edit Admin" : "New Admin"}
        </Typography>
      </Box>

      <Container maxWidth="sm">
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            <TextFieldCtrl
              noMargin
              control={control}
              name="nik"
              label="NIK Darwin"
              readOnly={!!id}
            />
            {!id && (
              <Button
                variant="outlined"
                onClick={() => {
                  checkDarwin();
                }}
                loading={loadingCheck}
              >
                Check
              </Button>
            )}
            {!id && (
              <Button
                onClick={() => {
                  resetField();
                }}
              >
                Reset
              </Button>
            )}
          </Box>
          <TextFieldCtrl
            control={control}
            name="username"
            label="Username"
            readOnly={isEditMode || watch("from_darwin")}
            rules={{
              required: "This field is required",
            }}
          />
          <TextFieldCtrl
            control={control}
            readOnly={watch("from_darwin")}
            name="fullname"
            label="Full Name"
            rules={{
              required: "This field is required",
            }}
          />
          <TextFieldCtrl
            control={control}
            name="email"
            label="Email"
            readOnly={isEditMode || watch("from_darwin")}
            rules={{
              required: "This field is required",
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: "invalid email address",
              },
            }}
          />
          <AutoCompleteComp
            control={control}
            multiple
            name="bu_id"
            label="Business Unit"
            rules={{ required: "Field required" }}
            options={bu_opt}
          ></AutoCompleteComp>

          <AutoCompleteComp
            control={control}
            multiple
            name="scope"
            label="Scope"
            rules={{ required: "Field required" }}
            options={scope_opt}
          ></AutoCompleteComp>
          <SelectCtrl
            name="role_id"
            label="Role"
            control={control}
            rules={{
              required: "This field is required",
            }}
          >
            {role ? (
              role.data.map((data: any) => (
                <MenuItem key={data.id} value={data.id}>
                  {data.role_name}
                </MenuItem>
              ))
            ) : (
              <MenuItem value="" disabled>
                Loading...
              </MenuItem>
            )}
          </SelectCtrl>
          <Box sx={{ display: "flex", gap: 1 }}>
            <PasswordWithEye control={control} name="password" label="Password" />
            <Button
              onClick={() => {
                const random = "Kpn#" + Math.floor(100 + Math.random() * 99).toString();
                setValue("password", random);
              }}
            >
              Random
            </Button>
          </Box>
          <CheckboxCtrl
            name="is_active"
            control={control}
            label="Active"
            noMargin
            disabled={isEditMode}
          />
        </Box>
        <Box sx={{ textAlign: "right" }}>
          <Button variant="contained" onClick={handleSubmit(onSubmit)}>
            {isEditMode ? "Update" : "Submit"}
          </Button>
        </Box>
      </Container>
    </>
  );
};
export default CreateAdmin;
