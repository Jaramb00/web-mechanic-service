import { useSeo } from '@/lib/seo';
import { formatPrice } from '@/lib/format';
import { useServices, errorMessage } from '@/features/public/queries';
import { Section, SectionTitle } from '@/components/ui/Section';
import { DataTable, Td, Th, Tr } from '@/components/ui/Table';
import { Alert, ErrorState, LoadingRows } from '@/components/ui/Feedback';
import { ButtonLink } from '@/components/ui/Button';

export function PricingPage() {
  useSeo({
    title: 'Cjenik',
    description:
      'Cjenik vulkanizerskih usluga: zamjena sezonskih guma, balansiranje, popravak gume, hotel za gume i ostalo.',
    path: '/cjenik',
  });

  const { data: services, isLoading, isError, error, refetch } = useServices();

  return (
    <Section tone="white" labelledBy="naslov-cjenik">
      <SectionTitle id="naslov-cjenik"
        level={1}>Cjenik</SectionTitle>

      <Alert tone="info" className="mt-6">
        Cijene vrijede za osobna vozila i standardne dimenzije. Za terenska i dostavna
        vozila, niske profile i alu naplatke cijena se dogovara na licu mjesta. Reći ćemo
        je prije nego što počnemo raditi.
      </Alert>

      <div className="mt-6">
        {isLoading ? (
          <LoadingRows rows={8} />
        ) : isError ? (
          <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
        ) : (
          <DataTable
            caption="Cjenik usluga s trajanjem i cijenom"
            head={
              <>
                <Th>Usluga</Th>
                <Th align="right">Trajanje</Th>
                <Th align="right">Cijena</Th>
              </>
            }
          >
            {services?.map((service) => (
              <Tr key={service.id}>
                <Td>
                  <span className="font-bold text-asphalt-950">{service.name}</span>
                  {service.description ? (
                    <span className="mt-0.5 block max-w-[60ch] text-sm text-asphalt-500">
                      {service.description}
                    </span>
                  ) : null}
                </Td>
                <Td align="right" numeric className="whitespace-nowrap text-asphalt-700">
                  {service.durationMinutes} min
                </Td>
                <Td align="right" numeric className="whitespace-nowrap text-lg">
                  {formatPrice(service.price)}
                </Td>
              </Tr>
            ))}
          </DataTable>
        )}
      </div>

      <p className="mt-6 max-w-[68ch] text-[0.9375rem] text-asphalt-500">
        Cijene su izražene u eurima s uključenim PDV-om. Cjenik je informativan i podložan
        promjeni; mjerodavan je iznos dogovoren prije izvođenja usluge.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <ButtonLink to="/rezervacija" size="lg">
          Rezerviraj termin
        </ButtonLink>
        <ButtonLink to="/ponuda-guma" variant="outline" size="lg">
          Ponuda guma i dijelova
        </ButtonLink>
      </div>
    </Section>
  );
}
