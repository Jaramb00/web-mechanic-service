import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatPrice } from '@/lib/format';
import { errorMessage, useCategories } from '@/features/public/queries';
import type { PageResponse, ProductStockView } from '@/lib/types';
import { SectionHeader } from '@/components/layout/PortalLayout';
import { Button } from '@/components/ui/Button';
import { SelectField, TextAreaField, TextField } from '@/components/ui/Field';
import { DataTable, Td, Th, Tr } from '@/components/ui/Table';
import { Alert, EmptyState, ErrorState, LoadingRows } from '@/components/ui/Feedback';
import { Pagination } from '@/components/ui/Pagination';
import { AlertTriangle, Box, Search } from '@/components/ui/Icon';
import { cn } from '@/lib/cn';

type Operation = 'receive' | 'issue' | 'adjust';

const OPERATION_LABELS: Record<Operation, string> = {
  receive: 'Zaprimanje',
  issue: 'Izdavanje',
  adjust: 'Korekcija na stvarno stanje',
};

export default function WarehouseStock() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(0);
  const [active, setActive] = useState<ProductStockView | null>(null);
  const [operation, setOperation] = useState<Operation>('receive');
  const [amount, setAmount] = useState(1);
  const [note, setNote] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  const { data: categories } = useCategories();

  const params = new URLSearchParams({ page: String(page), size: '20', onlyActive: 'true' });
  if (query) params.set('q', query);
  if (category) params.set('category', category);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['warehouse', 'products', query, category, page],
    queryFn: () => api.get<PageResponse<ProductStockView>>(`/api/warehouse/products?${params}`),
  });

  const submit = useMutation({
    mutationFn: () => {
      if (!active) throw new Error('Artikl nije odabran.');
      if (operation === 'adjust') {
        return api.post<void>('/api/warehouse/stock/adjust', {
          productId: active.id,
          newQuantity: amount,
          note,
        });
      }
      return api.post<void>(`/api/warehouse/stock/${operation}`, {
        productId: active.id,
        quantity: amount,
        note: note || null,
      });
    },
    onSuccess: () => {
      setNotice(`${OPERATION_LABELS[operation]} je zabilježeno u knjizi prometa.`);
      setActive(null);
      setAmount(1);
      setNote('');
      void queryClient.invalidateQueries({ queryKey: ['warehouse'] });
      void queryClient.invalidateQueries({ queryKey: ['products'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
  });

  function openOperation(product: ProductStockView, kind: Operation) {
    setActive(product);
    setOperation(kind);
    setAmount(kind === 'adjust' ? product.physicalQuantity : 1);
    setNote('');
  }

  return (
    <>
      <SectionHeader
        title="Zaliha"
        description="Količine se mijenjaju isključivo kroz ove radnje — svaka ostavlja zapis u knjizi prometa."
        action={
          <Link to="/skladiste/promet" className="font-semibold text-signal-700">
            Povijest prometa
          </Link>
        }
      />

      {notice ? <Alert tone="success" className="mb-5">{notice}</Alert> : null}

      <form
        role="search"
        className="mb-5 flex flex-wrap gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          setQuery(search.trim());
          setPage(0);
        }}
      >
        <div className="relative min-w-0 flex-1 sm:max-w-sm">
          <label htmlFor="pretraga-zalihe" className="sr-only">
            Pretraži artikle
          </label>
          <Search size={20} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
          <input
            id="pretraga-zalihe"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Naziv, šifra ili dimenzija"
            className="min-h-11 w-full rounded-plate border-2 border-ink-300 bg-white pl-10 pr-3 text-[0.9375rem] hover:border-ink-500 focus:border-signal-700"
          />
        </div>
        <div className="w-full sm:w-52">
          <SelectField
            label=""
            aria-label="Kategorija"
            value={category}
            onChange={(event) => {
              setCategory(event.target.value);
              setPage(0);
            }}
          >
            <option value="">Sve kategorije</option>
            {categories?.map((entry) => (
              <option key={entry.code} value={entry.code}>
                {entry.name}
              </option>
            ))}
          </SelectField>
        </div>
        <Button type="submit" variant="secondary" className="self-end">
          Traži
        </Button>
      </form>

      {isLoading ? (
        <LoadingRows rows={6} />
      ) : isError ? (
        <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
      ) : (data?.content.length ?? 0) === 0 ? (
        <EmptyState icon={<Box size={40} />} title="Nema artikala" description="Promijenite pretragu ili kategoriju." />
      ) : (
        <>
          <DataTable
            caption="Stanje zalihe po artiklima"
            head={
              <>
                <Th>Artikl</Th>
                <Th align="right">Fizički</Th>
                <Th align="right">Rezervirano</Th>
                <Th align="right">Dostupno</Th>
                <Th align="right">Min.</Th>
                <Th align="right">Nabavna</Th>
                <Th align="right">Prodajna</Th>
                <Th><span className="sr-only">Radnje</span></Th>
              </>
            }
          >
            {data?.content.map((product) => (
              <Tr key={product.id} className={product.lowStock ? 'bg-work-100/60' : undefined}>
                <Td>
                  <span className="flex items-center gap-2 font-bold text-ink-950">
                    {product.lowStock ? (
                      <AlertTriangle size={16} className="shrink-0 text-work-600" />
                    ) : null}
                    {product.name}
                  </span>
                  <span className="mt-0.5 block text-xs tabular-nums text-ink-500">
                    {product.sku}
                    {product.tireSize ? ` · ${product.tireSize}` : ''}
                  </span>
                </Td>
                <Td align="right" numeric>{product.physicalQuantity}</Td>
                <Td align="right" numeric className="text-ink-500">{product.reservedQuantity}</Td>
                <Td
                  align="right"
                  numeric
                  className={cn('text-base', product.lowStock ? 'text-stop-600' : 'text-go-600')}
                >
                  {product.availableQuantity}
                </Td>
                <Td align="right" numeric className="text-ink-500">{product.minQuantity}</Td>
                <Td align="right" numeric className="text-ink-500">{formatPrice(product.purchasePrice)}</Td>
                <Td align="right" numeric>{formatPrice(product.salePrice)}</Td>
                <Td align="right">
                  <div className="flex justify-end gap-1">
                    <Button size="sm" variant="ghost" onClick={() => openOperation(product, 'receive')}>
                      Primka
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => openOperation(product, 'issue')}>
                      Izdatnica
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => openOperation(product, 'adjust')}>
                      Korekcija
                    </Button>
                  </div>
                </Td>
              </Tr>
            ))}
          </DataTable>

          <div className="mt-6">
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

      {active ? (
        <section className="fixed inset-x-0 bottom-0 z-30 border-t-4 border-ink-950 bg-white p-4 shadow-[0_-8px_24px_rgba(13,17,23,0.12)]">
          <div className="mx-auto w-full max-w-3xl">
            <h2 className="text-lg font-extrabold text-ink-950">
              {OPERATION_LABELS[operation]} — {active.name}
            </h2>
            <p className="mt-0.5 text-sm tabular-nums text-ink-500">
              Trenutno: {active.physicalQuantity} kom, rezervirano {active.reservedQuantity} kom
            </p>

            {submit.isError ? (
              <Alert tone="error" title="Radnja nije izvršena" className="mt-3">
                {errorMessage(submit.error)}
              </Alert>
            ) : null}

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <TextField
                label={operation === 'adjust' ? 'Novo stvarno stanje' : 'Količina'}
                type="number"
                min={operation === 'adjust' ? 0 : 1}
                value={amount}
                hint={
                  operation === 'adjust'
                    ? 'Ne može biti manje od rezervirane količine.'
                    : undefined
                }
                onChange={(event) => setAmount(Math.max(0, Number(event.target.value) || 0))}
              />
              <TextAreaField
                label={operation === 'adjust' ? 'Razlog korekcije' : 'Napomena'}
                required={operation === 'adjust'}
                hint={operation === 'adjust' ? 'Obavezno — korekcija bez razloga je rupa u evidenciji.' : 'Npr. broj primke.'}
                value={note}
                onChange={(event) => setNote(event.target.value)}
              />
            </div>

            <div className="mt-3 flex gap-2">
              <Button
                disabled={operation === 'adjust' && note.trim() === ''}
                loading={submit.isPending}
                onClick={() => submit.mutate()}
              >
                Potvrdi
              </Button>
              <Button variant="ghost" onClick={() => setActive(null)}>
                Odustani
              </Button>
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
