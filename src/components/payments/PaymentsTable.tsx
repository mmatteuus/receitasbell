import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  SortingState,
  getSortedRowModel,
  VisibilityState,
} from '@tanstack/react-table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Payment } from '@/lib/payments/types';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '../ui/button';
import { StatusBadge } from './StatusBadge';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowUpDown } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { METHOD_LABELS } from '@/pages/admin/payments/constants';
import { buildTenantAdminPath, extractTenantSlugFromPath } from '@/lib/tenant';

interface PaymentsTableProps {
  data: Payment[];
}

function formatPaymentAmount(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatPaymentDate(value: string) {
  return new Date(value).toLocaleDateString('pt-BR');
}

function getPaymentMethodLabel(payment: Payment) {
  return METHOD_LABELS[payment.paymentMethodKey || payment.paymentMethod] || payment.paymentMethod;
}

export function PaymentsTable({ data }: PaymentsTableProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const tenantSlug = extractTenantSlugFromPath(location.pathname);
  const detailsPath = (paymentId: string) => buildTenantAdminPath(`pagamentos/transacoes/${paymentId}`, tenantSlug);
  const [sorting, setSorting] = useState<SortingState>([]);
  const isMobile = useIsMobile();
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const columns = useMemo<ColumnDef<Payment>[]>(
    () => [
      {
        accessorKey: 'id',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
              Payment ID
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => (
          <Button
            variant="link"
            onClick={() => navigate(detailsPath(row.original.id))}
          >
            {row.original.id}
          </Button>
        ),
      },
      {
        accessorKey: 'createdAt',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
              Data
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => formatPaymentDate(row.original.createdAt),
      },
      {
        accessorKey: 'items',
        header: 'Itens',
        cell: ({ row }) => (
          <div className="max-w-[240px] truncate">
            {row.original.items.map((item) => item.title).join(', ')}
          </div>
        ),
      },
      {
        accessorKey: 'payerEmail',
        header: 'Cliente',
      },
      {
        accessorKey: 'paymentMethod',
        header: 'Método',
        cell: ({ row }) => getPaymentMethodLabel(row.original),
      },
      {
        accessorKey: 'totalBRL',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
              Valor
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => <div className="text-right font-medium">{formatPaymentAmount(row.original.totalBRL)}</div>,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <StatusBadge status={row.original.status} statusDetail={row.original.statusDetail} />
        ),
      },
      {
        id: 'actions',
        cell: ({ row }) => (
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(detailsPath(row.original.id))}
          >
            Ver detalhes
          </Button>
        ),
      },
    ],
    [detailsPath, navigate]
  );

  useEffect(() => {
    setColumnVisibility({
      items: !isMobile,
      paymentMethod: !isMobile,
      actions: !isMobile,
    });
  }, [isMobile]);

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
    },
  });

  return (
    <div>
      {isMobile ? (
        <div className="space-y-3">
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => {
              const payment = row.original;
              return (
                <div key={row.id} className="rounded-2xl border bg-card p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => navigate(detailsPath(payment.id))}
                        className="truncate text-left text-sm font-semibold text-primary hover:underline"
                      >
                        {payment.id}
                      </button>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatPaymentDate(payment.createdAt)}
                      </p>
                    </div>
                    <StatusBadge status={payment.status} statusDetail={payment.statusDetail} />
                  </div>

                  <div className="mt-4 grid gap-3 rounded-xl bg-muted/20 p-3 text-sm">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                        Cliente
                      </p>
                      <p className="mt-1 break-all font-medium">{payment.payerEmail}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                          Método
                        </p>
                        <p className="mt-1 font-medium">{getPaymentMethodLabel(payment)}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                          Valor
                        </p>
                        <p className="mt-1 font-medium">{formatPaymentAmount(payment.totalBRL)}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                        Itens
                      </p>
                      <p className="mt-1 text-sm">{payment.items.map((item) => item.title).join(', ')}</p>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    className="mt-3 w-full"
                    onClick={() => navigate(detailsPath(payment.id))}
                  >
                    Ver detalhes
                  </Button>
                </div>
              );
            })
          ) : (
            <div className="rounded-2xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
              Nenhum resultado.
            </div>
          )}
        </div>
      ) : (
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
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
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
      )}

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
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
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
  );
}
