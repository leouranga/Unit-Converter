import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  CATEGORIES,
  convert,
  convertInput,
  describeRelation,
  formatNumber,
  getCategory,
  getUnit,
  type ConversionResult,
} from "./conversions.ts";

function run(categoryId: string, fromId: string, toId: string, input: string): ConversionResult {
  const category = getCategory(categoryId);
  return convertInput(input, category, getUnit(category, fromId), getUnit(category, toId));
}

/** [category, from, to, typed input, expected output as shown in the "to" box] */
type Case = [string, string, string, string, string];

// Expected values come from the exact definitions, not from the code under test:
// 1 mi = 1.609344 km, 1 lb = 0.45359237 kg, °F = °C × 9/5 + 32, K = °C + 273.15,
// 1 ft = 0.3048 m, 1 in = 2.54 cm, 1 oz = 28.349523125 g, 1 US gal = 3.785411784 L,
// 1 mph = 1.609344 km/h, 1 kn = 1.852 km/h.
const CASES: Record<string, Case[]> = {
  "kilometres → miles": [
    ["length", "km", "mi", "1", "0.621371"],
    ["length", "km", "mi", "5", "3.106856"],
    ["length", "km", "mi", "42.195", "26.218757"],
  ],
  "miles → kilometres": [
    ["length", "mi", "km", "1", "1.609344"],
    ["length", "mi", "km", "26.2", "42.164813"],
    ["length", "mi", "km", "100", "160.9344"],
  ],
  "kilograms → pounds": [
    ["weight", "kg", "lb", "1", "2.204623"],
    ["weight", "kg", "lb", "70", "154.323584"],
    ["weight", "kg", "lb", "0.5", "1.102311"],
  ],
  "pounds → kilograms": [
    ["weight", "lb", "kg", "1", "0.453592"],
    ["weight", "lb", "kg", "200", "90.718474"],
    ["weight", "lb", "kg", "2.2", "0.997903"],
  ],
  "Celsius → Fahrenheit": [
    ["temperature", "c", "f", "0", "32"],
    ["temperature", "c", "f", "100", "212"],
    ["temperature", "c", "f", "37", "98.6"],
  ],
  "Fahrenheit → Celsius": [
    ["temperature", "f", "c", "32", "0"],
    ["temperature", "f", "c", "212", "100"],
    ["temperature", "f", "c", "-40", "-40"],
  ],
  // Extra units
  "metres / feet / inches / centimetres": [
    ["length", "m", "ft", "1", "3.28084"],
    ["length", "ft", "m", "10", "3.048"],
    ["length", "in", "cm", "12", "30.48"],
  ],
  "grams / ounces": [
    ["weight", "oz", "g", "1", "28.349523"],
    ["weight", "g", "oz", "100", "3.527396"],
    ["weight", "kg", "g", "2.5", "2500"],
  ],
  "Kelvin": [
    ["temperature", "c", "k", "0", "273.15"],
    ["temperature", "k", "c", "0", "-273.15"],
    ["temperature", "k", "f", "300", "80.33"],
  ],
  "litres / US gallons / millilitres / US fluid ounces": [
    ["volume", "l", "gal", "1", "0.264172"],
    ["volume", "gal", "l", "1", "3.785412"],
    ["volume", "floz", "ml", "1", "29.57353"],
  ],
  "km/h / mph / m/s / knots": [
    ["speed", "kmh", "mph", "100", "62.137119"],
    ["speed", "mph", "kmh", "60", "96.56064"],
    ["speed", "ms", "kmh", "10", "36"],
  ],
};

for (const [name, cases] of Object.entries(CASES)) {
  describe(name, () => {
    for (const [categoryId, fromId, toId, input, expected] of cases) {
      const category = getCategory(categoryId);
      const [from, to] = [getUnit(category, fromId), getUnit(category, toId)];
      test(`${input} ${from.symbol} = ${expected} ${to.symbol}`, () => {
        const result = run(categoryId, fromId, toId, input);
        assert.equal(result.status, "ok");
        assert.equal(result.status === "ok" && formatNumber(result.result), expected);
      });
    }
  });
}

describe("round trips", () => {
  test("every unit converts to every other unit and back", () => {
    for (const category of CATEGORIES) {
      for (const from of category.units) {
        for (const to of category.units) {
          const back = convert(convert(123.456, from, to), to, from);
          assert.ok(Math.abs(back - 123.456) < 1e-9, `${category.id}: ${from.id} ↔ ${to.id}`);
        }
      }
    }
  });
});

describe("input handling", () => {
  test("empty or half-typed input is not an error", () => {
    for (const input of ["", "  ", "-", ".", "-."]) {
      assert.equal(run("temperature", "c", "f", input).status, "empty", JSON.stringify(input));
    }
  });

  test("text that isn't a number is rejected", () => {
    for (const input of ["abc", "1..2", "12a", "1e999"]) {
      assert.equal(run("length", "km", "mi", input).status, "error", input);
    }
  });

  test("a decimal comma is accepted", () => {
    const result = run("length", "mi", "km", "1,5");
    assert.equal(result.status === "ok" && formatNumber(result.result), "2.414016");
  });

  test("negative lengths, weights, volumes and speeds are rejected", () => {
    assert.equal(run("length", "km", "mi", "-5").status, "error");
    assert.equal(run("weight", "lb", "kg", "-1").status, "error");
    assert.equal(run("volume", "l", "gal", "-1").status, "error");
    assert.equal(run("speed", "mph", "kmh", "-1").status, "error");
  });

  test("temperatures stop at absolute zero, inclusive", () => {
    assert.equal(run("temperature", "c", "f", "-273.15").status, "ok");
    assert.equal(run("temperature", "f", "c", "-459.67").status, "ok");
    assert.equal(run("temperature", "k", "c", "0").status, "ok");
    assert.equal(run("temperature", "c", "f", "-274").status, "error");
    assert.equal(run("temperature", "f", "c", "-460").status, "error");
    assert.equal(run("temperature", "k", "c", "-1").status, "error");
  });
});

describe("formatting", () => {
  test("hides floating-point noise and never shows -0", () => {
    assert.equal(formatNumber(0.1 + 0.2), "0.3");
    assert.equal(formatNumber(98.60000000000001), "98.6");
    assert.equal(formatNumber(-0), "0");
  });

  test("relation hints", () => {
    const length = getCategory("length");
    const temperature = getCategory("temperature");
    assert.equal(describeRelation(length, getUnit(length, "km"), getUnit(length, "mi")), "1 km = 0.621371 mi");
    assert.equal(describeRelation(temperature, getUnit(temperature, "c"), getUnit(temperature, "f")), "°F = °C × 9/5 + 32");
  });
});
