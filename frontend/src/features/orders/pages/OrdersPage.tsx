import { useState, type CSSProperties } from 'react';
import { usePermissions } from '@shared/permissions';
import { useOrdersList } from '@features/orders/hooks/useOrdersList';
import { useDeleteOrder } from '@features/orders/hooks/useDeleteOrder';
import { OrderTable } from '@features/orders/components/OrderTable';
import { OrderForm } from '@features/orders/components/OrderForm';
import { IconPlus } from '@shared/ui/icons';
import type { Order } from '@shared/api/types.models';

const pageStyle: CSSProperties = {
  padding: '2rem',
  height: '100%',
  overflow: 'auto',
};

const headerStyle: CSSProperties = {
  fontFamily: 'var(--font-family-base)',
  fontWeight: 800,
  fontSize: '1.5rem',
  color: 'var(--text-primary)',
  marginBottom: '0.5rem',
};

const subStyle: CSSProperties = {
  color: 'var(--text-secondary)',
  marginBottom: '1.5rem',
};

const buttonStyle: CSSProperties = {
  padding: '0.625rem 1.25rem',
  borderRadius: '0.75rem',
  border: '1px solid var(--color-primary-border)',
  backgroundColor: 'var(--color-primary-light)',
  color: 'var(--color-primary)',
  fontSize: '0.8125rem',
  fontWeight: 700,
  cursor: 'pointer',
  transition: 'background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
  fontFamily: 'var(--font-family-base)',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.5rem',
};

export function OrdersPage() {
  const { canManage } = usePermissions();
  const { data: orders = [], isLoading, isError, refetch } = useOrdersList();
  const deleteOrder = useDeleteOrder();

  const [formOpen, setFormOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  const deleteError = deleteOrder.error ? (deleteOrder.error as Error).message : null;

  const handleAdd = () => {
    setEditingOrder(null);
    setFormOpen(true);
  };

  const handleEdit = (order: Order) => {
    setEditingOrder(order);
    setFormOpen(true);
  };

  const handleDelete = (order: Order) => {
    if (order.id != null) {
      deleteOrder.mutate(order.id);
    }
  };

  return (
    <div style={pageStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={headerStyle}>Órdenes</h1>
          <p style={subStyle}>Gestión de órdenes de servicio.</p>
        </div>
        {canManage && (
          <button
            style={buttonStyle}
            onClick={handleAdd}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.15)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; }}
          >
            <IconPlus size={16} />
            Nueva Orden
          </button>
        )}
      </div>

      {deleteError && (
        <div style={{ padding: '0.75rem 1rem', borderRadius: '0.625rem', backgroundColor: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', fontSize: '0.8125rem', marginBottom: '1rem', fontWeight: 600 }}>
          Error al eliminar: {deleteError}
        </div>
      )}

      <OrderTable
        items={orders}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
        canManage={canManage}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <OrderForm
        open={formOpen}
        order={editingOrder}
        onClose={() => setFormOpen(false)}
        onSuccess={() => {
          setEditingOrder(null);
        }}
      />
    </div>
  );
}

export default OrdersPage;
