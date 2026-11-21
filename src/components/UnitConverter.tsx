"use client";

import { useId, useState } from "react";
import {
  CATEGORIES,
  type Category,
  type Unit,
  allowsNegative,
  convertInput,
  describeRelation,
  formatNumber,
  formatReadable,
  getUnit,
  unitName,
} from "@/lib/conversions";

type Side = "from" | "to";

export default function UnitConverter() {
  const [category, setCategory] = useState<Category>(CATEGORIES[0]);

  return (
    <div>
      <div role="group" aria-label="Type of conversion" className="mb-6 flex flex-wrap justify-center gap-2">
        {CATEGORIES.map((c) => {
          const active = c.id === category.id;
          return (
            <button
              key={c.id}
              type="button"
              aria-pressed={active}
              onClick={() => setCategory(c)}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 ${
                active
                  ? "border-indigo-600 bg-indigo-600 text-white"
                  : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-500 dark:hover:text-white"
              }`}
            >
              {c.label}
            </button>
          );
        })}
      </div>

      {/* Keyed by category so switching resets the units and value to that category's defaults. */}
      <Converter key={category.id} category={category} />
    </div>
  );
}

function Converter({ category }: { category: Category }) {
  const [fromId, setFromId] = useState(category.defaultFrom);
  const [toId, setToId] = useState(category.defaultTo);
  // The box the user last typed in is the source; the other box is computed from it.
  const [source, setSource] = useState<{ side: Side; text: string }>({ side: "from", text: "1" });
  const messageId = useId();

  const units: Record<Side, Unit> = { from: getUnit(category, fromId), to: getUnit(category, toId) };
  const target: Side = source.side === "from" ? "to" : "from";
  const conversion = convertInput(source.text, category, units[source.side], units[target]);
  const computed = conversion.status === "ok" ? formatNumber(conversion.result) : "";
  const textFor = (side: Side) => (side === source.side ? source.text : computed);

  function swapUnits() {
    setFromId(toId);
    setToId(fromId);
  }

  const panelProps = (side: Side) => ({
    text: textFor(side),
    unit: units[side],
    units: category.units,
    invalid: side === source.side && conversion.status === "error",
    allowNegative: allowsNegative(category, units[side]),
    messageId,
    onTextChange: (text: string) => setSource({ side, text }),
  });

  return (
    <section
      aria-label={`${category.label} converter`}
      className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="grid items-center gap-3 sm:grid-cols-[1fr_auto_1fr]">
        <ValuePanel label="From" onUnitChange={setFromId} {...panelProps("from")} />
        <button
          type="button"
          onClick={swapUnits}
          title="Swap units"
          aria-label={`Swap units: convert ${units.to.label.toLowerCase()} to ${units.from.label.toLowerCase()}`}
          className="mx-auto grid size-10 place-items-center rounded-full border border-zinc-200 bg-white text-zinc-600 transition-colors hover:border-indigo-400 hover:text-indigo-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-indigo-400 dark:hover:text-indigo-300"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="size-5 rotate-90 sm:rotate-0"
          >
            <path d="M5 8h14m-4-4 4 4-4 4M19 16H5m4-4-4 4 4 4" />
          </svg>
        </button>
        <ValuePanel label="To" onUnitChange={setToId} {...panelProps("to")} />
      </div>

      <div id={messageId} aria-live="polite" className="mt-6 min-h-7 text-center text-lg">
        {conversion.status === "ok" && (
          <p className="text-zinc-700 dark:text-zinc-300">
            {formatReadable(conversion.input)} {unitName(units[source.side], conversion.input)} ={" "}
            <span className="font-semibold text-zinc-950 dark:text-white">
              {formatReadable(conversion.result)} {unitName(units[target], conversion.result)}
            </span>
          </p>
        )}
        {conversion.status === "error" && <p className="text-red-600 dark:text-red-400">{conversion.message}</p>}
        {conversion.status === "empty" && <p className="text-zinc-400 dark:text-zinc-500">Enter a value to convert.</p>}
      </div>
      <p className="mt-1 text-center text-sm text-zinc-500 dark:text-zinc-400">
        {describeRelation(category, units.from, units.to)}
      </p>
    </section>
  );
}

type ValuePanelProps = {
  label: string;
  text: string;
  unit: Unit;
  units: Unit[];
  invalid: boolean;
  allowNegative: boolean;
  messageId: string;
  onTextChange: (text: string) => void;
  onUnitChange: (unitId: string) => void;
};

function ValuePanel({
  label,
  text,
  unit,
  units,
  invalid,
  allowNegative,
  messageId,
  onTextChange,
  onUnitChange,
}: ValuePanelProps) {
  const inputId = useId();
  const selectId = useId();

  return (
    <div
      className={`min-w-0 rounded-xl border bg-zinc-50 p-4 transition-colors focus-within:ring-2 dark:bg-zinc-950 ${
        invalid
          ? "border-red-400 focus-within:ring-red-500/20 dark:border-red-500/70"
          : "border-zinc-200 focus-within:border-indigo-500 focus-within:ring-indigo-500/20 dark:border-zinc-800"
      }`}
    >
      <label
        htmlFor={inputId}
        className="text-xs font-medium tracking-wide text-zinc-500 uppercase dark:text-zinc-400"
      >
        {label}
      </label>
      <input
        id={inputId}
        type="text"
        // iOS's decimal keypad has no minus key, so use the full keyboard where negatives are valid.
        inputMode={allowNegative ? "text" : "decimal"}
        autoComplete="off"
        spellCheck={false}
        placeholder="0"
        value={text}
        onChange={(e) => onTextChange(e.target.value)}
        aria-invalid={invalid}
        aria-describedby={messageId}
        className="mt-1 block w-full min-w-0 bg-transparent text-3xl font-semibold tracking-tight text-zinc-900 tabular-nums outline-none placeholder:text-zinc-300 dark:text-zinc-50 dark:placeholder:text-zinc-700"
      />
      <label htmlFor={selectId} className="sr-only">
        {label} unit
      </label>
      <select
        id={selectId}
        value={unit.id}
        onChange={(e) => onUnitChange(e.target.value)}
        className="mt-3 block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
      >
        {units.map((u) => (
          <option key={u.id} value={u.id}>
            {u.label} ({u.symbol})
          </option>
        ))}
      </select>
    </div>
  );
}
