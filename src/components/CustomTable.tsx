import {
  Box,
  Chip,
  SxProps,
  Theme,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  MaterialReactTable,
  MRT_ColumnDef,
  MRT_TableOptions,
  MRT_Row,
  useMaterialReactTable,
  MaterialReactTableProps,
  MRT_RowData,
  MRT_TableProps,
  MRT_EditActionButtons,
} from "material-react-table";
import { ReactNode, useMemo, forwardRef, useImperativeHandle, Ref, useState } from "react";
import { TableSkeleton } from "./Skeleton";
import { RowSelectionState } from "@tanstack/react-table";

export interface CustomTableColumn<T extends Record<string, any> = {}> extends MRT_ColumnDef<T> {
  renderCell?: (row: T) => ReactNode;
  renderChip?: (
    value: any,
    row: T
  ) => {
    label: string;
    color?: "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning";
    variant?: "filled" | "outlined";
  };
  width?: string | number;
}

export interface CustomTablePropsRef<T extends MRT_RowData> {
  GetSelectedData: () => RowSelectionState;
  GetTableCreatingRow: () => MRT_Row<T> | null;
  GetTableEditingRow: () => MRT_Row<T> | null;
}

export interface CustomTableProps<T extends Record<string, any> = {}> {
  columns: CustomTableColumn<T>[];
  data: T[];
  isLoading?: boolean;
  showSkeleton?: boolean;
  skeletonRows?: number;
  skeletonColumns?: number;
  idAccessor?: keyof T | ((row: T) => string);
  enablePagination?: boolean;
  enableSorting?: boolean;
  enableFilters?: boolean;
  enableGlobalFilter?: boolean;
  enableColumnFilters?: boolean;
  enableRowSelection?: boolean | ((row: MRT_Row<T>) => boolean);
  enableFullScreenToggle?: boolean;
  enableDensityToggle?: boolean;
  enableHiding?: boolean;
  stickyHeader?: boolean;
  searchPlaceholder?: string;
  defaultSortingField?: keyof T;
  defaultSortingDirection?: "asc" | "desc";
  tableContainerSx?: SxProps<Theme>;
  hasPermission?: boolean;
  emptyStateMessage?: string;
  tableHeight?: string | number;
  tableWidth?: string | number;
  onRowClick?: (row: T) => void;
  enableFacetedValues?: boolean;
  renderRowActions?: MRT_TableOptions<T>["renderRowActions"];
  onEditingRowSave?: MRT_TableOptions<T>["onEditingRowSave"];
  renderTopToolbarCustomActions?: MRT_TableOptions<T>["renderTopToolbarCustomActions"];
  onCreatingRowSave?: MRT_TableOptions<T>["onCreatingRowSave"];
  onEditingRowCancel?: MRT_TableOptions<T>["onEditingRowCancel"];
  onCreatingRowCancel?: MRT_TableOptions<T>["onCreatingRowCancel"];
}

const CustomTable = forwardRef(
  <T extends Record<string, any> = {}>(
    {
      columns,
      data,
      isLoading = false,
      showSkeleton = true,
      skeletonRows = 2,
      skeletonColumns = 4,
      idAccessor = "id",
      enablePagination = true,
      enableSorting = true,
      enableFilters = true,
      enableGlobalFilter = true,
      enableColumnFilters = false,
      enableRowSelection = false,
      enableFullScreenToggle = false,
      enableDensityToggle = false,
      enableHiding = false,
      stickyHeader = true,
      searchPlaceholder = "Search...",
      defaultSortingField,
      defaultSortingDirection = "desc",
      tableContainerSx,
      hasPermission = true,
      emptyStateMessage = "No data available",
      tableHeight = "calc(100vh - 200px)",
      tableWidth = "100%",
      onRowClick,
      enableFacetedValues = false,
      renderRowActions,
      onEditingRowSave,
      renderTopToolbarCustomActions,
      onCreatingRowSave,
      onEditingRowCancel,
      onCreatingRowCancel,
    }: CustomTableProps<T>,
    ref: Ref<CustomTablePropsRef<T>>
  ) => {
    const [creatingRow, setCreatingRow] = useState<MRT_Row<T> | null>(null);
    const [editingRow, setEditingRow] = useState<MRT_Row<T> | null>(null);
    // Transform our custom columns to MRT_ColumnDef columns
    const transformedColumns: MRT_ColumnDef<T>[] = useMemo(
      () =>
        columns.map(column => {
          const baseColumn: MRT_ColumnDef<T> = { ...column };

          // Remove custom properties that are not part of MRT_ColumnDef
          delete (baseColumn as any).renderCell;
          delete (baseColumn as any).renderChip;
          delete (baseColumn as any).width;

          // Add cell renderer based on renderCell or renderChip property
          if (column.renderCell || column.renderChip) {
            baseColumn.Cell = ({ row }) => {
              if (column.renderCell) {
                return column.renderCell(row.original);
              }
              if (column.renderChip && column.accessorKey) {
                const value = row.original[column.accessorKey as keyof T];
                const chipProps = column.renderChip(value, row.original);
                return (
                  <Chip
                    label={chipProps.label}
                    color={chipProps.color || "default"}
                    variant={chipProps.variant || "outlined"}
                    size="small"
                    sx={{ minWidth: "90px" }}
                  />
                );
              }
              return null;
            };
          }

          // Apply width if specified
          if (column.width) {
            baseColumn.size = typeof column.width === "number" ? column.width : undefined;
            baseColumn.muiTableHeadCellProps = {
              ...baseColumn.muiTableHeadCellProps,
              sx: {
                ...(typeof baseColumn.muiTableHeadCellProps === "object" &&
                baseColumn.muiTableHeadCellProps?.sx
                  ? baseColumn.muiTableHeadCellProps.sx
                  : {}),
                width: column.width,
              },
            };
          }

          return baseColumn;
        }),
      [columns]
    );

    // Configure the initial table state
    const initialState = useMemo(() => {
      const state: any = {
        showGlobalFilter: enableGlobalFilter,
        density: "comfortable",
        showColumnFilters: enableColumnFilters,
      };

      if (defaultSortingField) {
        state.sorting = [
          {
            id: defaultSortingField as string,
            desc: defaultSortingDirection === "desc",
          },
        ];
      }

      return state;
    }, [enableGlobalFilter, defaultSortingField, defaultSortingDirection]);

    // Configure the table options
    const tableOptions: MRT_TableOptions<T> = {
      columns: transformedColumns,
      data,
      getRowId: row => {
        if (typeof idAccessor === "function") {
          return idAccessor(row);
        }
        return String(row[idAccessor]);
      },
      positionGlobalFilter: "left",
      enablePagination,
      enableSorting,
      enableRowSelection,
      enableFullScreenToggle,
      enableDensityToggle,
      enableHiding,
      enableFilters,
      enableGlobalFilter,
      enableColumnFilters,
      globalFilterFn: "fuzzy",
      enableStickyHeader: stickyHeader,
      enableFilterMatchHighlighting: true,
      enableFacetedValues,
      muiTableContainerProps: {
        sx: {
          maxHeight: tableHeight,
          width: tableWidth,
          overflowY: "auto",
          "&::-webkit-scrollbar": {
            width: "8px",
          },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "#ccc",
            borderRadius: "4px",
          },
          "&::-webkit-scrollbar-track": {
            backgroundColor: "#f1f1f1",
          },
          "&::-webkit-scrollbar-thumb:hover": {
            backgroundColor: "#aaa",
            width: "8px",
          },
          ...tableContainerSx,
        },
      },
      muiTableHeadProps: {
        sx: {
          "& tr th": {
            position: "sticky",
            backgroundColor: theme => theme.palette.primary.dark,
            color: "white",
          },
        },
      },
      muiTablePaperProps: {
        elevation: 0,
        sx: {
          borderRadius: "8px",
          border: "1px solid #e0e0e0",
          overflow: "hidden",
        },
      },
      muiTableProps: {
        sx: {
          tableLayout: "fixed",
          width: "100%",
        },
      },
      muiTableBodyRowProps: ({ row }) => ({
        sx: {
          backgroundColor: row.index % 2 === 0 ? "white" : "#f9f9f9",
          cursor: onRowClick ? "pointer" : "default",
        },
        onClick: onRowClick ? () => onRowClick(row.original) : undefined,
      }),

      initialState,
      muiSearchTextFieldProps: {
        variant: "outlined",
        size: "small",
        placeholder: searchPlaceholder,
        sx: {
          width: "300px",
          marginLeft: "auto",
          marginRight: "16px",
          marginBottom: "8px",
          "& .MuiOutlinedInput-root": {
            borderRadius: "8px",
            "& fieldset": {
              borderColor: "#e0e0e0",
            },
            "&.Mui-focused fieldset": {
              borderColor: theme => theme.palette.primary.main,
            },
          },
        },
      },
      muiTopToolbarProps: {
        sx: {
          backgroundColor: theme => theme.palette.background.paper,
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
        },
      },
      muiEditTextFieldProps: {
        multiline: true,
        minRows: 3, // start height
        maxRows: 6, // prevent overgrowth
        sx: {
          whiteSpace: "pre-wrap",
          wordWrap: "break-word",
        },
      },
      enableEditing: !!renderRowActions,
      enableRowActions: !!renderRowActions,
      renderRowActions: renderRowActions,
      onEditingRowSave: onEditingRowSave,
      renderTopToolbarCustomActions: renderTopToolbarCustomActions,
      renderEditRowDialogContent: ({ table, row, internalEditComponents }) => (
        <>
          <DialogTitle variant="h3">{row.original.id ? "Edit" : "Create"}</DialogTitle>
          <DialogContent sx={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {internalEditComponents} {/* or render custom edit components here */}
          </DialogContent>
          <DialogActions>
            <MRT_EditActionButtons variant="text" table={table} row={row} />
          </DialogActions>
        </>
      ),
      createDisplayMode: "row",
      editDisplayMode: "row",
      onCreatingRowSave: onCreatingRowSave,
      onEditingRowCancel: onEditingRowCancel,
      onCreatingRowCancel: onCreatingRowCancel,
      onCreatingRowChange: setCreatingRow,
      onEditingRowChange: setEditingRow,
      state: {
        editingRow: editingRow,
        creatingRow: creatingRow,
      },
      // muiSelectCheckboxProps: {
      //   sx: {
      //     color: theme => theme.palette.primary.contrastText,
      //   },
      // },
    };

    const table = useMaterialReactTable(tableOptions);

    //exposed method to get selected table
    useImperativeHandle(ref, () => {
      return {
        GetSelectedData: () => {
          return table.getState().rowSelection;
        },
        GetTableEditingRow: () => {
          return table.getState()?.editingRow;
        },
        GetTableCreatingRow: () => {
          return table.getState()?.creatingRow;
        },
      };
    });

    // Render loading state or empty state
    if (isLoading || !data || data.length === 0) {
      if (isLoading && showSkeleton) {
        return <TableSkeleton column={skeletonColumns} row={skeletonRows} small />;
      }

      if (!data || data.length === 0) {
        return (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>{emptyStateMessage}</Box>
        );
      }
    }

    return hasPermission ? <MaterialReactTable table={table} /> : null;
  }
);
export default CustomTable as <T extends Record<string, any> = {}>(
  props: CustomTableProps<T> & { ref?: React.Ref<CustomTablePropsRef<T>> }
) => React.ReactElement;
