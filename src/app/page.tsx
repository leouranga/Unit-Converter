import UnitConverter from "@/components/UnitConverter";

export default function Home() {
  return (
    <main className="flex flex-1 justify-center bg-zinc-50 px-4 py-12 font-sans sm:py-20 dark:bg-black">
      <div className="w-full max-w-2xl">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl dark:text-white">
            Unit Converter
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Type in either box and the other one updates as you type.
          </p>
        </header>
        <UnitConverter />
      </div>
    </main>
  );
}
