import { TableSkeleton } from "@/components/Skeleton.tsx";
import useAPI from "@/hooks/useAPI.tsx";
import useAuthStore from "@/hooks/useAuthStore.tsx";
import useFetch from "@/hooks/useFetch.tsx";
import { snack } from "@/providers/SnackbarProvider.tsx";
import theme from "@/theme";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  Box,
  Button,
  IconButton,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { isAxiosError } from "axios";
import { useState } from "react";

interface UniversalLinkRow {
  id: string;
  link_name: string;
  slug: string;
  is_active: boolean;
}

const UniversalLinks = () => {
  const API = useAPI();
  const getPermission = useAuthStore(state => state.getPermission);
  const { data: links, refetch, loading } = useFetch<{ data: UniversalLinkRow[] }>("/universal-link");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [saving, setSaving] = useState(false);

  const linkUrl = (row: UniversalLinkRow) => `${window.location.origin}/join/${row.slug}`;

  const showError = (error: unknown) => {
    if (isAxiosError(error)) {
      snack.error(error.response?.data?.message || "Terjadi kesalahan");
    } else {
      snack.error("Error, check log for details");
    }
  };

  const handleCreate = async () => {
    if (!name.trim() || !slug.trim()) {
      snack.warning("Name and slug are required");
      return;
    }
    setSaving(true);
    try {
      await API.post("/universal-link", { link_name: name.trim(), slug: slug.trim() });
      snack.success("Universal link created");
      setName("");
      setSlug("");
      refetch();
    } catch (error) {
      showError(error);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (row: UniversalLinkRow) => {
    try {
      await API.patch(`/universal-link/${row.id}`, { is_active: !row.is_active });
      refetch();
    } catch (error) {
      showError(error);
    }
  };

  const handleDelete = async (row: UniversalLinkRow) => {
    try {
      await API.delete(`/universal-link/${row.id}`);
      snack.success("Universal link deleted");
      refetch();
    } catch (error) {
      showError(error);
    }
  };

  const handleCopy = async (row: UniversalLinkRow) => {
    try {
      await navigator.clipboard.writeText(linkUrl(row));
      snack.success("Link copied");
    } catch {
      snack.error("Failed to copy link");
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
      <Box sx={{ mb: 1 }}>
        <Typography variant="h1" color="primary">
          Universal Link
        </Typography>
      </Box>
      <Typography variant="body2" sx={{ mb: 3, color: "text.secondary" }}>
        Shareable login links for external assessees (e.g. mass hiring campaigns). Anyone with the
        link can enter their email; only emails already assigned to a batch can register or log in.
      </Typography>

      {getPermission("fcreate", 22) && (
        <Box sx={{ display: "flex", gap: 1, mb: 3, maxWidth: 700 }}>
          <TextField
            label="Name"
            size="small"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="CG Mass Hiring July"
            fullWidth
          />
          <TextField
            label="Slug"
            size="small"
            value={slug}
            onChange={e => setSlug(e.target.value.toLowerCase())}
            placeholder="cg-july-2026"
            fullWidth
          />
          <Button variant="contained" onClick={handleCreate} loading={saving}>
            Add
          </Button>
        </Box>
      )}

      {loading ? (
        <TableSkeleton column={4} row={2} small />
      ) : (
        getPermission("fread", 22) && (
        <Box sx={{ flex: 1, minWidth: 0, overflow: "auto" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Link</TableCell>
                <TableCell align="center">Active</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(links?.data ?? []).map(row => (
                <TableRow key={row.id}>
                  <TableCell>{row.link_name}</TableCell>
                  <TableCell sx={{ fontFamily: "monospace", fontSize: "0.8rem" }}>
                    {linkUrl(row)}
                  </TableCell>
                  <TableCell align="center">
                    <Switch
                      size="small"
                      checked={row.is_active}
                      disabled={!getPermission("fupdate", 22)}
                      onChange={() => handleToggle(row)}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Copy link" placement="top" arrow>
                      <IconButton size="small" onClick={() => handleCopy(row)}>
                        <ContentCopyIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {getPermission("fdelete", 22) && (
                      <Tooltip title="Delete" placement="top" arrow>
                        <IconButton size="small" color="error" onClick={() => handleDelete(row)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {(links?.data ?? []).length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ color: "text.secondary" }}>
                    No universal links yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Box>
        )
      )}
    </Box>
  );
};

export default UniversalLinks;
