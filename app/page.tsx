import LoginForm from "@/components/LoginForm";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-10">
      <p className="text-sm font-semibold tracking-wide text-[#8b1e14]">
        FIROZABAD GLASS
      </p>
      <h1 className="mt-2 text-4xl font-bold">Kanch-Net</h1>
      <p className="mt-3 text-[#5c4638]">
        Small home piles become one matching buyer order. This is a student demo.
        Money on later screens is fake.
      </p>
      <div className="mt-8 rounded-3xl border border-[#ead9c4] bg-white p-5 shadow-sm">
        <p className="mb-4 text-sm text-[#5c4638]">
          Code is always <strong>1234</strong>
        </p>
        <LoginForm />
      </div>
      <div className="mt-6 space-y-1 text-sm text-[#5c4638]">
        <p>9000000001 family 1 → phone page</p>
        <p>9000000003 family 3 (blue pile) → phone page</p>
        <p>9000000010 collector → pickup</p>
        <p>9000000020 coordinator → matching</p>
        <p>9000000030 buyer → matching</p>
      </div>
    </main>
  );
}
