import SearchForm from '@/components/SearchForm';
import ExploreSection from '@/components/ExploreSection';

export default function HomePage() {
  return (
    <div className="space-y-10">
      {/* Hero */}
      <section className="text-center py-12">
        <h1 className="text-4xl font-bold mb-3">
          ✈️ Pantau Harga Tiket Pesawat
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-lg max-w-xl mx-auto">
          Set harga target, kami yang pantau. Dapat notifikasi langsung saat harga turun.
        </p>
      </section>

      {/* Search Form */}
      <section>
        <SearchForm />
      </section>

      {/* Explore cheapest destinations */}
      <section>
        <h2 className="text-xl font-semibold mb-4">💡 Destinasi Termurah dari Jakarta</h2>
        <ExploreSection origin="CGK" />
      </section>
    </div>
  );
}
