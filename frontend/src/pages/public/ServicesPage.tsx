import { useSeo } from '@/lib/seo';
import { formatPrice } from '@/lib/format';
import { useServices, errorMessage } from '@/features/public/queries';
import { Section, SectionTitle } from '@/components/ui/Section';
import { ButtonLink } from '@/components/ui/Button';
import { ErrorState, LoadingRows } from '@/components/ui/Feedback';
import { ArrowRight } from '@/components/ui/Icon';

export function ServicesPage() {
  useSeo({
    title: 'Usluge',
    description:
      'Zamjena sezonskih guma, montaža i demontaža, balansiranje, popravak i krpanje gume, kontrola tlaka i popravak naplatka.',
    path: '/usluge',
  });

  const { data: services, isLoading, isError, error, refetch } = useServices();

  return (
    <Section tone="white" labelledBy="naslov-usluge">
      <SectionTitle
        id="naslov-usluge"
        level={1}
        description="Sve što radimo, s okvirnim trajanjem i cijenom. Trajanje je važno jer određuje koliko termin zauzima u rasporedu."
      >
        Usluge
      </SectionTitle>

      <div className="mt-8">
        {isLoading ? (
          <LoadingRows rows={6} />
        ) : isError ? (
          <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
        ) : (
          <ul className="space-y-4">
            {services?.map((service) => (
              <li
                key={service.id}
                className="rounded-sign border-2 border-ink-950 bg-white p-5 sm:flex sm:items-start sm:gap-6"
              >
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-extrabold text-ink-950">{service.name}</h3>
                  {service.description ? (
                    <p className="mt-2 max-w-[68ch] text-[1.0625rem] leading-relaxed text-ink-700">
                      {service.description}
                    </p>
                  ) : null}
                </div>
                <div className="mt-4 flex shrink-0 items-center gap-6 border-t border-ink-200 pt-4 sm:mt-0 sm:flex-col sm:items-end sm:gap-1 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
                  <p className="text-2xl font-extrabold tabular-nums text-ink-950">
                    {formatPrice(service.price)}
                  </p>
                  <p className="text-sm tabular-nums text-ink-500">{service.durationMinutes} min</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-8">
        <ButtonLink to="/rezervacija" size="lg">
          Rezerviraj termin
          <ArrowRight size={20} />
        </ButtonLink>
      </div>
    </Section>
  );
}
