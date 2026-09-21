import { useMemo, useState } from 'react';
import { Building2, LayoutGrid, Pencil, Plus, RotateCw, Trash2 } from 'lucide-react';
import type { RestaurantTableProfile, TableSectionProfile, UserRole } from '@restaurant/shared';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { TableFormModal } from '@/components/tables/TableFormModal';
import { SectionFormModal } from '@/components/tables/SectionFormModal';
import {
  useDeleteSectionMutation,
  useDeleteTableMutation,
  useListSectionsQuery,
  useListTablesQuery,
} from '@/store/api/tableApi';
import { useAppSelector } from '@/store/hooks';
import { useToast } from '@/hooks/useToast';
import { TABLE_STATUS_BADGE, TABLE_STATUS_LABELS } from '@/constants/table';

const MANAGER_ROLES: readonly UserRole[] = ['ADMIN', 'MANAGER'];

function TableTile({
  table,
  canManage,
  onEdit,
  onDelete,
}: {
  table: RestaurantTableProfile;
  canManage: boolean;
  onEdit: (table: RestaurantTableProfile) => void;
  onDelete: (table: RestaurantTableProfile) => void;
}) {
  return (
    <div className="group relative rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition hover:border-brand-300">
      <div className="flex items-start justify-between gap-2">
        <p className="text-lg font-bold text-slate-800">
          {String(table.tableNumber).padStart(2, '0')}
        </p>
        {canManage && (
          <div className="flex gap-1 opacity-0 transition group-hover:opacity-100">
            <button
              type="button"
              onClick={() => onEdit(table)}
              className="rounded p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              title="Edit table"
              aria-label={`Edit table ${table.tableNumber}`}
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(table)}
              className="rounded p-1 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
              title="Delete table"
              aria-label={`Delete table ${table.tableNumber}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
      <p className="mt-0.5 truncate text-xs text-slate-500">{table.name ?? `Table ${String(table.tableNumber).padStart(2, '0')}`}</p>
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="text-[11px] text-slate-400">Seats {table.capacity}</span>
        <Badge variant={TABLE_STATUS_BADGE[table.status]}>{TABLE_STATUS_LABELS[table.status]}</Badge>
      </div>
    </div>
  );
}

export function TablesPage() {
  const toast = useToast();
  const currentUser = useAppSelector((state) => state.auth.user);
  const canManage = currentUser ? MANAGER_ROLES.includes(currentUser.role) : false;

  const { data: sections, isLoading: loadingSections, isError: sectionsError, refetch: refetchSections } = useListSectionsQuery();
  const { data: tables, isLoading: loadingTables, isError: tablesError, refetch: refetchTables } = useListTablesQuery();
  const [deleteTable, { isLoading: deletingTable }] = useDeleteTableMutation();
  const [deleteSection, { isLoading: deletingSection }] = useDeleteSectionMutation();

  const [tableModalOpen, setTableModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<RestaurantTableProfile | null>(null);
  const [sectionModalOpen, setSectionModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<TableSectionProfile | null>(null);
  const [tableToDelete, setTableToDelete] = useState<RestaurantTableProfile | null>(null);
  const [sectionToDelete, setSectionToDelete] = useState<TableSectionProfile | null>(null);

  const grouped = useMemo(() => {
    const map = new Map<string | null, RestaurantTableProfile[]>();
    for (const table of tables ?? []) {
      const key = table.sectionId ?? null;
      const list = map.get(key) ?? [];
      list.push(table);
      map.set(key, list);
    }
    return map;
  }, [tables]);

  const loading = loadingSections || loadingTables;
  const error = sectionsError || tablesError;

  async function handleDeleteTable() {
    if (!tableToDelete) return;
    try {
      await deleteTable(tableToDelete.id).unwrap();
      toast.success('Table deleted', `Table ${tableToDelete.tableNumber} removed from the floor plan.`);
      setTableToDelete(null);
    } catch {
      toast.error('Could not delete table', 'The operation failed. Please try again.');
    }
  }

  async function handleDeleteSection() {
    if (!sectionToDelete) return;
    try {
      await deleteSection(sectionToDelete.id).unwrap();
      toast.success('Section deleted', `${sectionToDelete.name} has been removed.`);
      setSectionToDelete(null);
    } catch {
      toast.error('Could not delete section', 'Ensure the section contains no tables first.');
    }
  }

  const openCreateTable = () => {
    setEditingTable(null);
    setTableModalOpen(true);
  };

  const openEditTable = (table: RestaurantTableProfile) => {
    setEditingTable(table);
    setTableModalOpen(true);
  };

  const openCreateSection = () => {
    setEditingSection(null);
    setSectionModalOpen(true);
  };

  const openEditSection = (section: TableSectionProfile) => {
    setEditingSection(section);
    setSectionModalOpen(true);
  };

  return (
    <div>
      <PageHeader
        title="Tables"
        description="Floor plan — sections, seating and table status."
        actions={
          canManage && (
            <div className="flex gap-2">
              <button type="button" className="btn-secondary" onClick={openCreateSection}>
                <Plus className="h-4 w-4" />
                Add section
              </button>
              <button type="button" className="btn-primary" onClick={openCreateTable}>
                <Plus className="h-4 w-4" />
                Add table
              </button>
            </div>
          )
        }
      />

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-6 w-6 text-slate-400" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <p className="text-sm text-slate-500">Could not load the floor plan.</p>
          <button type="button" className="btn-secondary" onClick={() => { refetchSections(); refetchTables(); }}>
            <RotateCw className="h-4 w-4" />
            Retry
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {(sections ?? []).map((section) => (
            <Card
              key={section.id}
              title={section.name}
              icon={<Building2 className="h-4 w-4 text-brand-500" />}
              actions={
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500">
                    {section.tableCount} {section.tableCount === 1 ? 'table' : 'tables'}
                  </span>
                  {canManage && (
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => openEditSection(section)}
                        className="rounded p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                        title="Edit section"
                        aria-label={`Edit section ${section.name}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setSectionToDelete(section)}
                        className="rounded p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                        title="Delete section"
                        aria-label={`Delete section ${section.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              }
            >
              {grouped.get(section.id)?.length ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                  {grouped.get(section.id)!.map((table) => (
                    <TableTile
                      key={table.id}
                      table={table}
                      canManage={canManage}
                      onEdit={openEditTable}
                      onDelete={setTableToDelete}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">No tables in this section yet.</p>
              )}
            </Card>
          ))}

          {(grouped.get(null)?.length ?? 0) > 0 && (
            <Card title="Unassigned tables" icon={<LayoutGrid className="h-4 w-4 text-slate-400" />}>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                {grouped.get(null)!.map((table) => (
                  <TableTile
                    key={table.id}
                    table={table}
                    canManage={canManage}
                    onEdit={openEditTable}
                    onDelete={setTableToDelete}
                  />
                ))}
              </div>
            </Card>
          )}

          {(sections ?? []).length === 0 && !tables?.length && (
            <EmptyState
              icon={<LayoutGrid className="h-6 w-6" />}
              title="No tables yet"
              description="Add a section and a few tables to start planning the floor."
              action={
                canManage ? (
                  <button type="button" className="btn-primary" onClick={openCreateSection}>
                    <Plus className="h-4 w-4" />
                    Add section
                  </button>
                ) : undefined
              }
            />
          )}
        </div>
      )}

      <TableFormModal
        open={tableModalOpen}
        table={editingTable}
        sections={sections ?? []}
        onClose={() => setTableModalOpen(false)}
      />

      <SectionFormModal open={sectionModalOpen} section={editingSection} onClose={() => setSectionModalOpen(false)} />

      <ConfirmDialog
        open={tableToDelete !== null}
        title="Delete table"
        message={
          tableToDelete
            ? `Delete table ${tableToDelete.tableNumber}? It cannot be deleted if it has order history.`
            : ''
        }
        confirmLabel="Delete"
        busy={deletingTable}
        onCancel={() => setTableToDelete(null)}
        onConfirm={handleDeleteTable}
      />

      <ConfirmDialog
        open={sectionToDelete !== null}
        title="Delete section"
        message={
          sectionToDelete
            ? `Delete the "${sectionToDelete.name}" section? Sections that still contain tables cannot be deleted.`
            : ''
        }
        confirmLabel="Delete"
        busy={deletingSection}
        onCancel={() => setSectionToDelete(null)}
        onConfirm={handleDeleteSection}
      />
    </div>
  );
}