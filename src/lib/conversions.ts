/**
 * Unit definitions and pure conversion helpers.
 *
 * Every unit converts through its category's base unit (metre, kilogram,
 * degree Celsius, litre, metre per second), so any unit can be converted to
 * any other unit in the same category without a table of pairwise factors.
 *
 * Linear factors use the exact international definitions,
 * e.g. 1 mile = 1609.344 m and 1 pound = 0.45359237 kg.
 */

export type Unit = {
  id: string;
  /** Shown in the unit picker, e.g. "Kilometres". */
  label: string;
  /** Used in sentences: "1 kilometre", "2 kilometres". */
  singular: string;
  plural: string;
  symbol: string;
  toBase: (value: number) => number;
  fromBase: (value: number) => number;
};

export type Category = {
  id: string;
  label: string;
  units: Unit[];
  defaultFrom: string;
  defaultTo: string;
  /** Smallest physically meaningful value, expressed in the base unit. */
  minBase: number;
  minMessage: string;
  /** Formulas for conversions that are not a simple factor, keyed "fromId>toId". */
  formulas?: Record<string, string>;
};

export type ConversionResult =
  | { status: "empty" }
  | { status: "error"; message: string }
  | { status: "ok"; input: number; result: number };

type UnitInfo = Pick<Unit, "id" | "label" | "singular" | "plural" | "symbol">;

/** A unit that is a fixed multiple of the base unit: 1 unit = `factor` base units. */
function linear(info: UnitInfo, factor: number): Unit {
  return { ...info, toBase: (v) => v * factor, fromBase: (v) => v / factor };
}

const NON_NEGATIVE = { minBase: 0, minMessage: "The value can't be negative." };

export const CATEGORIES: Category[] = [
  {
    id: "length",
    label: "Length",
    defaultFrom: "km",
    defaultTo: "mi",
    ...NON_NEGATIVE,
    units: [
      linear({ id: "km", label: "Kilometres", singular: "kilometre", plural: "kilometres", symbol: "km" }, 1000),
      linear({ id: "mi", label: "Miles", singular: "mile", plural: "miles", symbol: "mi" }, 1609.344),
      linear({ id: "m", label: "Metres", singular: "metre", plural: "metres", symbol: "m" }, 1),
      linear({ id: "cm", label: "Centimetres", singular: "centimetre", plural: "centimetres", symbol: "cm" }, 0.01),
      linear({ id: "ft", label: "Feet", singular: "foot", plural: "feet", symbol: "ft" }, 0.3048),
      linear({ id: "in", label: "Inches", singular: "inch", plural: "inches", symbol: "in" }, 0.0254),
    ],
  },
  {
    id: "weight",
    label: "Weight",
    defaultFrom: "kg",
    defaultTo: "lb",
    ...NON_NEGATIVE,
    units: [
      linear({ id: "kg", label: "Kilograms", singular: "kilogram", plural: "kilograms", symbol: "kg" }, 1),
      linear({ id: "lb", label: "Pounds", singular: "pound", plural: "pounds", symbol: "lb" }, 0.45359237),
      linear({ id: "g", label: "Grams", singular: "gram", plural: "grams", symbol: "g" }, 0.001),
      linear({ id: "oz", label: "Ounces", singular: "ounce", plural: "ounces", symbol: "oz" }, 0.028349523125),
    ],
  },
  {
    id: "temperature",
    label: "Temperature",
    defaultFrom: "c",
    defaultTo: "f",
    minBase: -273.15,
    minMessage: "That's below absolute zero (−273.15 °C / −459.67 °F / 0 K).",
    units: [
      {
        id: "c",
        label: "Celsius",
        singular: "degree Celsius",
        plural: "degrees Celsius",
        symbol: "°C",
        toBase: (v) => v,
        fromBase: (v) => v,
      },
      {
        id: "f",
        label: "Fahrenheit",
        singular: "degree Fahrenheit",
        plural: "degrees Fahrenheit",
        symbol: "°F",
        toBase: (v) => ((v - 32) * 5) / 9,
        fromBase: (v) => (v * 9) / 5 + 32,
      },
      {
        id: "k",
        label: "Kelvin",
        singular: "kelvin",
        plural: "kelvins",
        symbol: "K",
        toBase: (v) => v - 273.15,
        fromBase: (v) => v + 273.15,
      },
    ],
    formulas: {
      "c>f": "°F = °C × 9/5 + 32",
      "f>c": "°C = (°F − 32) × 5/9",
      "c>k": "K = °C + 273.15",
      "k>c": "°C = K − 273.15",
      "f>k": "K = (°F − 32) × 5/9 + 273.15",
      "k>f": "°F = (K − 273.15) × 9/5 + 32",
    },
  },
  {
    id: "volume",
    label: "Volume",
    defaultFrom: "l",
    defaultTo: "gal",
    ...NON_NEGATIVE,
    units: [
      linear({ id: "l", label: "Litres", singular: "litre", plural: "litres", symbol: "L" }, 1),
      linear({ id: "gal", label: "US gallons", singular: "US gallon", plural: "US gallons", symbol: "gal" }, 3.785411784),
      linear({ id: "ml", label: "Millilitres", singular: "millilitre", plural: "millilitres", symbol: "mL" }, 0.001),
      linear(
        { id: "floz", label: "US fluid ounces", singular: "US fluid ounce", plural: "US fluid ounces", symbol: "fl oz" },
        0.0295735295625,
      ),
    ],
  },
  {
    id: "speed",
    label: "Speed",
    defaultFrom: "kmh",
    defaultTo: "mph",
    ...NON_NEGATIVE,
    units: [
      linear(
        { id: "kmh", label: "Kilometres per hour", singular: "kilometre per hour", plural: "kilometres per hour", symbol: "km/h" },
        1000 / 3600,
      ),
      linear({ id: "mph", label: "Miles per hour", singular: "mile per hour", plural: "miles per hour", symbol: "mph" }, 0.44704),
      linear(
        { id: "ms", label: "Metres per second", singular: "metre per second", plural: "metres per second", symbol: "m/s" },
        1,
      ),
      linear({ id: "kn", label: "Knots", singular: "knot", plural: "knots", symbol: "kn" }, 1852 / 3600),
    ],
  },
];

export function getCategory(id: string): Category {
  const category = CATEGORIES.find((c) => c.id === id);
  if (!category) throw new Error(`Unknown category: ${id}`);
  return category;
}

export function getUnit(category: Category, id: string): Unit {
  const unit = category.units.find((u) => u.id === id);
  if (!unit) throw new Error(`Unknown unit "${id}" in category "${category.id}"`);
  return unit;
}

export function convert(value: number, from: Unit, to: Unit): number {
  return from === to ? value : to.fromBase(from.toBase(value));
}

/** Whether some negative values are valid for this unit (e.g. °C and °F, but not km or K). */
export function allowsNegative(category: Category, unit: Unit): boolean {
  return unit.toBase(0) > category.minBase;
}

/** Partial input while typing ("", "-", ".") — nothing to convert yet, but not an error. */
const INCOMPLETE = /^[-+]?\.?$/;
const NUMBER = /^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i;
/** Absorbs floating-point error at the boundary, e.g. −459.67 °F → −273.15000000000003 °C. */
const MIN_TOLERANCE = 1e-9;

/** Parses what the user typed and converts it. */
export function convertInput(raw: string, category: Category, from: Unit, to: Unit): ConversionResult {
  // Accept a decimal comma ("1,5") as well: some mobile keypads only offer a comma.
  const text = raw.trim().replace(",", ".");
  if (INCOMPLETE.test(text)) return { status: "empty" };

  const input = Number(text);
  if (!NUMBER.test(text) || !Number.isFinite(input)) {
    return { status: "error", message: "Please enter a valid number." };
  }
  if (from.toBase(input) < category.minBase - MIN_TOLERANCE) {
    return { status: "error", message: category.minMessage };
  }
  return { status: "ok", input, result: convert(input, from, to) };
}

/**
 * Formats a number for an input box without floating-point noise:
 * up to 6 decimal places, or 6 significant digits for values below 1.
 */
export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return "";
  const rounded = Math.abs(value) >= 1 ? Number(value.toFixed(6)) : Number(value.toPrecision(6));
  return String(rounded);
}

const readableFormat = new Intl.NumberFormat("en-US", { maximumFractionDigits: 20 });

/** Same rounding as formatNumber, with thousands separators, for sentences. */
export function formatReadable(value: number): string {
  // Number("…") also turns -0 into 0, so we never show "-0".
  return readableFormat.format(Number(formatNumber(value)));
}

export function unitName(unit: Unit, value: number): string {
  return Math.abs(Number(formatNumber(value))) === 1 ? unit.singular : unit.plural;
}

/** A short hint for how the two units relate, e.g. "1 km = 0.621371 mi". */
export function describeRelation(category: Category, from: Unit, to: Unit): string {
  const formula = category.formulas?.[`${from.id}>${to.id}`];
  if (formula) return formula;
  return `1 ${from.symbol} = ${formatReadable(convert(1, from, to))} ${to.symbol}`;
}
