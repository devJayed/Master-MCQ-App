import Link from 'next/link';
const stats = [
  ['Students', '320'],
  ['Questions', '2,450'],
  ['Published questions', '2,180'],
  ['Tests taken', '5,430'],
];
export default function TeacherDashboard() {
  return (
    <main className="min-h-screen bg-base-200 p-5 md:p-12">
      <div className="mx-auto max-w-6xl">
        <div className="flex justify-between">
          <div>
            <p className="text-[10px] font-bold tracking-widest text-base-content/50">
              JAYED HOSSAIN
            </p>
            <h1 className="font-display text-4xl font-bold">HSC ICT Dashboard</h1>
          </div>
          <Link className="btn btn-outline" href="/student/dashboard">
            Student space
          </Link>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map(([label, value]) => (
            <div className="card bg-base-100 shadow-sm" key={label}>
              <div className="card-body p-5">
                <p className="text-xs text-base-content/60">{label}</p>
                <b className="font-display text-3xl">{value}</b>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <section className="card bg-base-100">
            <div className="card-body">
              <p className="text-xs font-bold tracking-widest text-primary">
                AVERAGE STUDENT SCORE
              </p>
              <h2 className="font-display text-6xl font-bold">74%</h2>
              <progress className="progress progress-primary mt-4" value="74" max="100" />
            </div>
          </section>
          <section className="card bg-base-100">
            <div className="card-body">
              <h2 className="font-display text-2xl font-bold">Weakest topics</h2>
              {[
                ['Logic Gate', '58'],
                ['Number System', '63'],
                ['Networking', '67'],
              ].map(([n, s]) => (
                <p className="flex justify-between border-b border-base-300 py-3 text-sm" key={n}>
                  <span>{n}</span>
                  <b className="text-accent">{s}%</b>
                </p>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
