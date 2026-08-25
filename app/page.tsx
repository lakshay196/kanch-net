import LoginForm from "@/components/LoginForm";

export default function HomePage() {
  return (
    <main className="kn-shell mx-auto flex min-h-screen max-w-md flex-col">
      <div className="kn-login-arch">
        <span className="kn-float-orb kn-float-red" aria-hidden />
        <span className="kn-float-orb kn-float-blue" aria-hidden />
        <h1 className="kn-wordmark relative">Kanch-Net</h1>
        <p className="relative mt-4 max-w-[16rem] text-lg leading-snug text-[#f6efe4]/90">
          Stock. Need. Match.
        </p>
      </div>
      <div className="flex flex-1 flex-col justify-center px-6 py-10">
        <LoginForm />
        <details className="kn-help mt-10 text-[#5c4638]">
          <summary>Demo help</summary>
          <div className="mt-3 space-y-2 text-base">
            <p>9000000001 Ramesh — artisan</p>
            <p>9000000003 Imran — artisan (blue stock)</p>
            <p>9000000030 Buyer</p>
            <p>9000000010 Collector — pickup</p>
            <p>9000000020 Coordinator — staff matching</p>
          </div>
        </details>
      </div>
    </main>
  );
}
