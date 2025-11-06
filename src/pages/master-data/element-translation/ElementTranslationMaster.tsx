import { ElementTranslation, ElementTranslationMaster } from "@/types/MasterData";
import useFetch from "@/hooks/useFetch";
import CustomTable, { CustomTableColumn } from "@/components/CustomTable";
import { Box, IconButton, Dialog, DialogTitle, DialogContent } from "@mui/material";
import { Edit } from "@mui/icons-material";
import { useState, useEffect, useRef } from "react";
import { ModalTranslation } from "./ModalTranslation";

export default function ElementTranslationMasterPage() {
  const { data, refetch } = useFetch<{ data: ElementTranslationMaster[] }>(
    "/languages/elements/master"
  );
  const [selectedRows, setSelectedRows] = useState<ElementTranslationMaster | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const modalRef = useRef<{ isDirty: boolean }>(null);

  // Update selectedRows when data changes (after refetch)
  useEffect(() => {
    if (selectedRows && data?.data) {
      const updatedRow = data.data.find(item => item.element_id === selectedRows.element_id);
      if (updatedRow) {
        setSelectedRows(updatedRow);
      }
    }
  }, [data]);
  
  const column: CustomTableColumn<ElementTranslationMaster>[] = [
    {
      header: "Elements ID",
      accessorKey: "element_id",
    },
    {
      header: "Description",
      accessorKey: "description",
    },
    {
      header: "Action",
      accessorKey: "id",
      Cell: ({ row }) => {
        const data = row.original;
        return (
          <IconButton>
            <Edit
              onClick={e => {
                setSelectedRows(data);
                setOpenDialog(true);
                if (modalRef.current) {
                  modalRef.current.isDirty = false;
                }
              }}
            />
          </IconButton>
        );
      },
    },
  ];
  return (
    <>
      <Box>
        <CustomTable data={data?.data ?? []} columns={column} />
      </Box>
      <Dialog
        open={openDialog}
        onClose={() => {
          setOpenDialog(false);
          if (modalRef.current?.isDirty) {
             refetch();
          }
        }}
        maxWidth="xl"
      >
        <DialogTitle>{selectedRows?.element_id}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 4, minWidth: "80vw" }}>
            <em>{selectedRows?.description}</em>
            <ModalTranslation 
              ref={modalRef}
              data={selectedRows?.subtable ?? []} 
              element_id={selectedRows?.element_id ?? ""}
            />
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
}
