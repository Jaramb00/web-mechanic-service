import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/cn';
import { formatTime } from '@/lib/format';
import type { SlotView } from '@/lib/types';

/**
 * TABLA TERMINA — potpisna komponenta sustava.
 *
 * Zauzeti termini se NE skrivaju nego se šrafiraju, kao prekriženi znak. U
 * sezonskoj navali je vidljiva popunjenost dio poruke: posjetitelj mora
 * vidjeti da mjesta nestaju, inače ne razumije zašto da rezervira odmah.
 *
 * Ista komponenta stoji u dvije gustoće: mala i samo za čitanje na naslovnici,
 * velika i odabirna u koraku rezervacije.
 *
 * Tipkovnica: strelice pomiču fokus samo po slobodnim terminima (roving
 * tabindex), Home/End skaču na prvi i zadnji. Zauzeti termini ostaju vidljivi,
 * ali izvan reda za fokus — nema smisla zaustavljati se na onome što se ne može
 * odabrati.
 */
type Props = {
  slots: SlotView[];
  selected?: string | null;
  onSelect?: (startAt: string) => void;
  readOnly?: boolean;
  density?: 'compact' | 'full';
  label: string;
};

export function SlotBoard({
  slots,
  selected = null,
  onSelect,
  readOnly = false,
  density = 'full',
  label,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const selectableIndexes = slots
    .map((slot, index) => (slot.available ? index : -1))
    .filter((index) => index >= 0);
  const [focusIndex, setFocusIndex] = useState<number>(selectableIndexes[0] ?? -1);

  useEffect(() => {
    // Nakon promjene dana fokus se vraća na prvi slobodan termin.
    setFocusIndex(selectableIndexes[0] ?? -1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slots]);

  const moveFocus = useCallback(
    (direction: 1 | -1 | 'first' | 'last') => {
      if (selectableIndexes.length === 0) return;
      const position = selectableIndexes.indexOf(focusIndex);
      let next: number;
      if (direction === 'first') next = selectableIndexes[0];
      else if (direction === 'last') next = selectableIndexes[selectableIndexes.length - 1];
      else {
        const target = Math.min(
          Math.max(position + direction, 0),
          selectableIndexes.length - 1,
        );
        next = selectableIndexes[target];
      }
      setFocusIndex(next);
      const node = containerRef.current?.querySelector<HTMLButtonElement>(`[data-slot-index="${next}"]`);
      node?.focus();
    },
    [focusIndex, selectableIndexes],
  );

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault();
        moveFocus(1);
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault();
        moveFocus(-1);
        break;
      case 'Home':
        event.preventDefault();
        moveFocus('first');
        break;
      case 'End':
        event.preventDefault();
        moveFocus('last');
        break;
      default:
        break;
    }
  }

  const gridClass =
    density === 'compact'
      ? 'grid grid-cols-3 gap-1.5 sm:grid-cols-4'
      : 'grid grid-cols-[repeat(auto-fill,minmax(5.5rem,1fr))] gap-2';

  return (
    <div
      ref={containerRef}
      role={readOnly ? 'list' : 'group'}
      aria-label={label}
      className={gridClass}
      onKeyDown={readOnly ? undefined : handleKeyDown}
    >
      {slots.map((slot, index) => (
        <SlotCell
          key={slot.startAt}
          slot={slot}
          index={index}
          density={density}
          readOnly={readOnly}
          isSelected={selected === slot.startAt}
          isFocusTarget={focusIndex === index}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

function SlotCell({
  slot,
  index,
  density,
  readOnly,
  isSelected,
  isFocusTarget,
  onSelect,
}: {
  slot: SlotView;
  index: number;
  density: 'compact' | 'full';
  readOnly: boolean;
  isSelected: boolean;
  isFocusTarget: boolean;
  onSelect?: (startAt: string) => void;
}) {
  const time = formatTime(slot.startAt);
  const size = density === 'compact' ? 'min-h-11 text-sm' : 'min-h-14 text-base';

  if (readOnly) {
    return (
      <div
        role="listitem"
        className={cn(
          'flex flex-col items-center justify-center rounded-plate border-2 font-bold',
          size,
          slot.available
            ? 'border-go-600 bg-white text-asphalt-950 border-t-[5px]'
            : 'hatched border-asphalt-200 bg-asphalt-50 text-asphalt-500',
        )}
      >
        <span>{time}</span>
        <span className="sr-only">{slot.available ? 'slobodno' : 'zauzeto'}</span>
      </div>
    );
  }

  if (!slot.available) {
    return (
      <div
        aria-hidden="true"
        className={cn(
          'hatched flex items-center justify-center rounded-plate border-2 border-asphalt-200 bg-asphalt-50 font-bold text-asphalt-300',
          size,
        )}
      >
        <span className="line-through decoration-2">{time}</span>
      </div>
    );
  }

  return (
    <button
      type="button"
      data-slot-index={index}
      tabIndex={isFocusTarget ? 0 : -1}
      aria-pressed={isSelected}
      onClick={() => onSelect?.(slot.startAt)}
      className={cn(
        // Jedina animacija u sustavu: promjena boje bez skaliranja, oštra kao
        // promjena znaka na cesti.
        'flex flex-col items-center justify-center rounded-plate border-2 font-bold transition-colors duration-100',
        size,
        isSelected
          ? 'border-asphalt-950 bg-volt-500 text-asphalt-950'
          : 'border-go-600 border-t-[5px] bg-white text-asphalt-950 hover:bg-go-50',
      )}
    >
      <span>{time}</span>
      <span className="sr-only">
        {isSelected ? 'odabrano, ' : ''}slobodno, još {slot.freeBays}{' '}
        {slot.freeBays === 1 ? 'radno mjesto' : 'radna mjesta'}
      </span>
    </button>
  );
}

/** Legenda uz tablu — bez nje šrafura nije samoobjašnjiva. */
export function SlotLegend() {
  return (
    <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-asphalt-700">
      <li className="flex items-center gap-2">
        <span aria-hidden="true" className="h-4 w-6 rounded-[2px] border-2 border-t-[5px] border-go-600 bg-white" />
        Slobodno
      </li>
      <li className="flex items-center gap-2">
        <span aria-hidden="true" className="hatched h-4 w-6 rounded-[2px] border-2 border-asphalt-200 bg-asphalt-50" />
        Zauzeto
      </li>
      <li className="flex items-center gap-2">
        <span aria-hidden="true" className="h-4 w-6 rounded-[2px] border-2 border-asphalt-950 bg-volt-500" />
        Vaš odabir
      </li>
    </ul>
  );
}
