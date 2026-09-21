import { IS_DEMO } from '@/config/site';

const ACCOUNTS = [
  { role: 'Administrator', email: 'admin@demo.local' },
  { role: 'Majstor', email: 'majstor@demo.local' },
  { role: 'Skladištar', email: 'skladiste@demo.local' },
  { role: 'Kupac', email: 'ivan@demo.local' },
];

/**
 * Demo pristupni podaci, vidljivi samo dok je `IS_DEMO` uključen.
 *
 * Ovo je namjerno na stranici: klijent na prezentaciji mora moći ući u svaku
 * ulogu bez da traži lozinku. U produkciji se `IS_DEMO` gasi i blok nestaje.
 */
export function DemoAccounts() {
  if (!IS_DEMO) return null;

  return (
    <aside className="mt-6 rounded-control border-2 border-volt-600 bg-volt-100 p-4">
      <h2 className="text-sm font-extrabold uppercase tracking-wide text-asphalt-950">
        Demo pristup
      </h2>
      <p className="mt-1 text-sm text-asphalt-700">
        Lozinka za sve račune: <code className="font-bold">Demo1234!</code>
      </p>
      <ul className="mt-3 divide-y divide-volt-600/40">
        {ACCOUNTS.map((account) => (
          <li key={account.email} className="flex items-baseline justify-between gap-3 py-1.5 text-sm">
            <span className="font-semibold text-asphalt-950">{account.role}</span>
            <code className="text-asphalt-700">{account.email}</code>
          </li>
        ))}
      </ul>
    </aside>
  );
}
