# Unit Converter

A small unit converter built with Next.js (App Router), TypeScript and Tailwind CSS.
Type in either box and the other one updates as you type.

| Category    | Units                                                  |
| ----------- | ------------------------------------------------------ |
| Length      | kilometres, miles, metres, centimetres, feet, inches   |
| Weight      | kilograms, pounds, grams, ounces                       |
| Temperature | Celsius, Fahrenheit, Kelvin                            |
| Volume      | litres, US gallons, millilitres, US fluid ounces       |
| Speed       | km/h, mph, m/s, knots                                  |

## Getting started

Requires Node.js 22.18 or newer (the tests run TypeScript directly with Node).

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # conversion tests
npm run lint
npm run build
```

## Project structure

```
src/
  app/
    layout.tsx          Root layout, fonts and page metadata
    page.tsx            The page (server component)
    globals.css         Tailwind import and theme colours
  components/
    UnitConverter.tsx   Interactive converter (client component)
  lib/
    conversions.ts      Unit definitions and pure conversion/formatting helpers
    conversions.test.ts Tests (Node's built-in test runner)
```

## Adding a unit

Add an entry to the right category in `src/lib/conversions.ts`. Linear units only
need their size in the category's base unit, e.g. a yard in metres:

```ts
linear({ id: "yd", label: "Yards", singular: "yard", plural: "yards", symbol: "yd" }, 0.9144),
```
