
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    getPaginationRowModel,
    useReactTable,
    SortingState,
    getSortedRowModel,
    VisibilityState,
} from "@tanstack/react-table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Payment } from "@/lib/payments/types"
import { useEffect, useMemo, useState } from "react"
import { Button } from "../ui/button"
import { StatusBadge } from "./StatusBadge"
import { useNavigate } from "react-router-dom"
import { ArrowUpDown } from "lucide-react"
import { useIsMobile } from "@/hooks/use-mobile"

interface PaymentsTableProps {
    data: Payment[]
}

export function PaymentsTable({ data }: PaymentsTableProps) {
    const navigate = useNavigate()
    const [sorting, setSorting] = useState<SortingState>([])
    const isMobile = useIsMobile()
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})

    const columns = useMemo<ColumnDef<Payment>[]>(() => [
        {
            accessorKey: "id",
            header: ({ column }) => {
                return (
                  <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                  >
                    Payment ID
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                )
            },
            cell: ({ row }) => (
                <Button variant="link" onClick={() => navigate(`/admin/pagamentos/transacoes/${row.original.id}`)}>
                    {row.original.id}
                </Button>
            )
        },
        {
            accessorKey: "createdAt",
            header: ({ column }) => {
                return (
                  <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                  >
                    Data
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                )
            },
            cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString()
        },
        {
            accessorKey: "items",
            header: "Itens",
            cell: ({ row }) => (
                <div className="max-w-[240px] truncate">
                    {row.original.items.map((item) => item.title).join(", ")}
                </div>
            )
        },
        {
            accessorKey: "payer.email",
            header: "Cliente"
        },
        {
            accessorKey: "paymentMethod",
            header: "Método"
        },
        {
            accessorKey: "totalBRL",
            header: ({ column }) => {
                return (
                  <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                  >
                    Valor
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                )
            },
            cell: ({ row }) => {
                const formatted = new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(row.original.totalBRL)
           
                return <div className="text-right font-medium">{formatted}</div>
            }
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => <StatusBadge status={row.original.status} statusDetail={row.original.statusDetail} />
        },
        {
            id: "actions",
            cell: ({ row }) => (
                <Button variant="outline" size="sm" onClick={() => navigate(`/admin/pagamentos/transacoes/${row.original.id}`)}>
                    Ver detalhes
                </Button>
            )
        }
    ], [navigate])

    useEffect(() => {
        setColumnVisibility({
            items: !isMobile,
            paymentMethod: !isMobile,
            actions: !isMobile,
        })
    }, [isMobile])

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        state: {
            sorting,
            columnVisibility,
        }
    })

    return (
        <div>
            <div className="rounded-md border overflow-x-auto">
                <Table className="min-w-[700px]">
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead key={header.id}>
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                        </TableHead>
                                    )
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    Nenhum resultado.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 py-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="whitespace-nowrap">Linhas por página</span>
                    <Select
                        value={String(table.getState().pagination.pageSize)}
                        onValueChange={(val) => table.setPageSize(Number(val))}
                    >
                        <SelectTrigger className="h-8 w-[70px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {[10, 20, 30, 50].map((size) => (
                                <SelectItem key={size} value={String(size)}>{size}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                        Página {table.getState().pagination.pageIndex + 1} de{" "}
                        {table.getPageCount()}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                    >
                        Anterior
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                    >
                        Próximo
                    </Button>
                </div>
            </div>
        </div>
    )
}
