import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSeo } from '@/lib/seo';
import { formatPrice } from '@/lib/format';
import { useCategories, useProducts, errorMessage } from '@/features/public/queries';
import { useAuth } from '@/features/auth/useAuth';
import { Section, SectionTitle } from '@/components/ui/Section';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Pagination } from '@/components/ui/Pagination';
import { Alert, EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback';
import { Search, Tire } from '@/components/ui/Icon';
import { ReserveDialog } from '@/features/reservations/ReserveDialog';
import type { ProductView } from '@/lib/types';
import { cn } from '@/lib/cn';

export function CatalogPage() {
  useSeo({
    title: 'Ponuda guma i dijelova',
    description:
      'Gume, ventili, vijci i potrošni materijal na zalihi. Provjerite dostupnost i rezervirajte za preuzimanje u servisu.',
    path: '/ponuda-guma',
  });

  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(0);
  const [reserving, setReserving] = useState<ProductView | null>(null);

  const { data: categories } = useCategories();
  const { data, isLoading, isError, error, refetch } = useProducts({ q: query, category, page });

  function submitSearch(event: React.FormEvent) {
    event.preventDefault();
    setQuery(search.trim());
    setPage(0);
  }

  return (
    <Section tone="white" labelledBy="naslov-ponuda">
      <SectionTitle
        id="naslov-ponuda"
        level={1}
        description="Prikazana je raspoloživa količina — ono što je već rezervirano ne broji se kao dostupno."
      >
        Ponuda guma i dijelova
      </SectionTitle>

      <form onSubmit={submitSearch} className="mt-8 flex flex-wrap gap-2" role="search">
        <label htmlFor="pretraga-artikala" className="sr-only">
          Pretraži artikle
        </label>
        <div className="relative min-w-0 flex-1">
          <Search
            size={20}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-500"
          />
          <input
            id="pretraga-artikala"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Dimenzija, npr. 205/55 R16 — ili naziv"
            className="min-h-11 w-full rounded-plate border-2 border-ink-300 bg-white pl-10 pr-3 text-[0.9375rem] placeholder:text-ink-500 hover:border-ink-500 focus:border-signal-700"
          />
        </div>
        <Button type="submit" variant="secondary">
          Traži
        </Button>
      </form>

      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Filtar po kategoriji">
        <CategoryChip active={category === ''} onClick={() => { setCategory(''); setPage(0); }}>
          Sve
        </CategoryChip>
        {categories?.map((entry) => (
          <CategoryChip
            key={entry.code}
            active={category === entry.code}
            onClick={() => {
              setCategory(entry.code);
              setPage(0);
            }}
          >
            {entry.name}
          </CategoryChip>
        ))}
      </div>

      <div className="mt-8">
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} className="h-40" />
            ))}
          </div>
        ) : isError ? (
          <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
        ) : (data?.content.length ?? 0) === 0 ? (
          <EmptyState
            icon={<Tire size={40} />}
            title="Nema artikala za taj upit"
            description="Pokušajte s drugom dimenzijom ili poništite filtar. Ako tražite nešto određeno, nazovite nas — možemo naručiti."
            action={
              <Button
                variant="outline"
                onClick={() => {
                  setSearch('');
                  setQuery('');
                  setCategory('');
                  setPage(0);
                }}
              >
                Poništi filtre
              </Button>
            }
          />
        ) : (
          <>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data?.content.map((product) => (
                <ProductPlate
                  key={product.id}
                  product={product}
                  canReserve={Boolean(user)}
                  onReserve={() => setReserving(product)}
                />
              ))}
            </ul>

            <div className="mt-8">
              <Pagination
                page={data!.page}
                totalPages={data!.totalPages}
                totalElements={data!.totalElements}
                onChange={setPage}
                label="artikala"
              />
            </div>
          </>
        )}
      </div>

      {!user ? (
        <Alert tone="info" className="mt-8">
          Za rezervaciju artikla potrebna je prijava.{' '}
          <Link to="/prijava" className="font-bold underline">
            Prijavite se
          </Link>{' '}
          ili{' '}
          <Link to="/registracija" className="font-bold underline">
            otvorite račun
          </Link>
          .
        </Alert>
      ) : null}

      <div className="mt-8">
        <ButtonLink to="/rezervacija" size="lg">
          Rezerviraj termin za montažu
        </ButtonLink>
      </div>

      <ReserveDialog product={reserving} onClose={() => setReserving(null)} />
    </Section>
  );
}

function CategoryChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'min-h-9 rounded-plate border-2 px-3 text-sm font-semibold transition-colors duration-100',
        active
          ? 'border-ink-950 bg-signal-700 text-white'
          : 'border-ink-300 bg-white text-ink-700 hover:border-signal-700 hover:text-signal-700',
      )}
    >
      {children}
    </button>
  );
}

function ProductPlate({
  product,
  canReserve,
  onReserve,
}: {
  product: ProductView;
  canReserve: boolean;
  onReserve: () => void;
}) {
  const soldOut = product.availableQuantity <= 0;

  return (
    <li className="flex flex-col rounded-sign border-2 border-ink-950 bg-white">
      <div className="flex-1 p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-signal-700">
          {product.categoryName}
        </p>
        <h3 className="mt-1.5 text-[1.0625rem] font-extrabold leading-snug text-ink-950">
          {product.name}
        </h3>
        <p className="mt-1 text-sm text-ink-500">
          {product.manufacturer ?? '—'}
          {product.tireSize ? ` · ${product.tireSize}` : ''}
        </p>
        <p className="mt-0.5 text-xs tabular-nums text-ink-300">{product.sku}</p>
      </div>

      <div className="flex items-end justify-between gap-3 border-t-2 border-ink-950 bg-ink-50 p-4">
        <div>
          <p className="text-xl font-extrabold tabular-nums text-ink-950">
            {formatPrice(product.salePrice)}
          </p>
          <p
            className={cn(
              'mt-0.5 text-sm font-semibold tabular-nums',
              soldOut ? 'text-stop-600' : 'text-go-600',
            )}
          >
            {soldOut ? 'Nema na zalihi' : `${product.availableQuantity} kom dostupno`}
          </p>
        </div>
        <Button
          size="sm"
          variant={soldOut ? 'ghost' : 'primary'}
          disabled={soldOut || !canReserve}
          onClick={onReserve}
        >
          Rezerviraj
        </Button>
      </div>
    </li>
  );
}
