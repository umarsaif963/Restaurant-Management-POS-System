import { useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import type { MenuAddOnProfile, MenuItemProfile, MenuItemVariationProfile } from '@restaurant/shared';
import { Modal } from '@/components/ui/Modal';

export interface PickedLine {
  menuItemId: string;
  quantity: number;
  variationId?: string;
  addOnIds: string[];
  notes?: string;
}

interface ItemPickModalProps {
  item: MenuItemProfile | null;
  onClose: () => void;
  onAdd: (line: PickedLine) => void;
}

export function ItemPickModal({ item, onClose, onAdd }: ItemPickModalProps) {
  const [variationId, setVariationId] = useState<string | undefined>(
    item?.variations.find((v) => v.isDefault)?.id ?? undefined,
  );
  const [addOnIds, setAddOnIds] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');

  if (!item) return null;

  const baseCents = Math.round(parseFloat(item.price) * 100);
  const variation = item.variations.find((v) => v.id === variationId);
  const variationCents = variation ? Math.round(parseFloat(variation.priceAdjustment) * 100) : 0;
  const addOnsCents = item.addOns
    .filter((addOn) => addOnIds.includes(addOn.id))
    .reduce((sum, addOn) => sum + Math.round(parseFloat(addOn.price) * 100), 0);
  const unitCents = baseCents + variationCents + addOnsCents;
  const lineCents = unitCents * quantity;

  const toggleAddOn = (addOn: MenuAddOnProfile) => {
    setAddOnIds((current) =>
      current.includes(addOn.id) ? current.filter((id) => id !== addOn.id) : [...current, addOn.id],
    );
  };

  const selectVariation = (candidate: MenuItemVariationProfile) => {
    setVariationId((current) => (current === candidate.id ? undefined : candidate.id));
  };

  return (
    <Modal
      open={item !== null}
      title={item.name}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => onAdd({ menuItemId: item.id, quantity, variationId, addOnIds, notes: notes.trim() || undefined })}
          >
            <Plus className="h-4 w-4" />
            Add to order — ${(lineCents / 100).toFixed(2)}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-slate-500">
          {item.description ?? `Base price $${item.price}${variationCents !== 0 ? ` + $${(variationCents / 100).toFixed(2)}` : ''}.`}
        </p>

        {item.variations.length > 0 && (
          <section>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Size / variation</h4>
            <div className="flex flex-wrap gap-2">
              {item.variations.map((variationOption) => {
                const adjustment = Number(variationOption.priceAdjustment);
                const active = variationId === variationOption.id;
                return (
                  <button
                    key={variationOption.id}
                    type="button"
                    className={active ? 'pill pill-active' : 'pill'}
                    onClick={() => selectVariation(variationOption)}
                  >
                    {variationOption.name}
                    {adjustment !== 0 && (
                      <span className="ml-1 text-xs opacity-70">
                        {adjustment > 0 ? `+$${adjustment.toFixed(2)}` : `-$${Math.abs(adjustment).toFixed(2)}`}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {item.addOns.length > 0 && (
          <section>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Add-ons</h4>
            <div className="flex flex-wrap gap-2">
              {item.addOns.map((addOn) => {
                const active = addOnIds.includes(addOn.id);
                return (
                  <button
                    key={addOn.id}
                    type="button"
                    disabled={!addOn.available}
                    className={active ? 'pill pill-active' : 'pill'}
                    onClick={() => toggleAddOn(addOn)}
                  >
                    {addOn.name}
                    <span className="ml-1 text-xs opacity-70">+${addOn.price}</span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        <section>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Quantity</h4>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="btn-secondary"
              disabled={quantity <= 1}
              onClick={() => setQuantity((current) => Math.max(1, current - 1))}
              aria-label="Decrease quantity"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-10 text-center text-sm font-semibold text-slate-800">{quantity}</span>
            <button
              type="button"
              className="btn-secondary"
              disabled={quantity >= 99}
              onClick={() => setQuantity((current) => Math.min(99, current + 1))}
              aria-label="Increase quantity"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </section>

        <section>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Notes</h4>
          <input
            type="text"
            className="input"
            placeholder="e.g. well done, no onions"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            maxLength={300}
          />
          <p className="mt-2 text-xs text-slate-400">
            Subtotal for line: <span className="font-semibold text-slate-700">${(lineCents / 100).toFixed(2)}</span>
          </p>
        </section>
      </div>
    </Modal>
  );
}