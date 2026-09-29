import { describe, expect, it } from "@jest/globals";

import {
  appendItem,
  canAddItem,
  canRemoveItem,
  removeAt,
  removeItem,
  updateAt,
  updateItem,
} from "./item-list";

const bounds = { min: 1, max: 3 };
const items = Object.freeze([
  { id: "a", title: "A" },
  { id: "b", title: "B" },
]);

describe("bounds", () => {
  it("allows adding below the maximum and removing above the minimum", () => {
    expect(canAddItem(2, bounds)).toBe(true);
    expect(canAddItem(3, bounds)).toBe(false);
    expect(canRemoveItem(2, bounds)).toBe(true);
    expect(canRemoveItem(1, bounds)).toBe(false);
  });
});

describe("items with ids", () => {
  it("appends up to the maximum", () => {
    const three = appendItem(items, { id: "c", title: "C" }, bounds);
    expect(three.map((i) => i.id)).toEqual(["a", "b", "c"]);
    expect(appendItem(three, { id: "d", title: "D" }, bounds)).toEqual(three);
  });

  it("updates only the matching item", () => {
    expect(updateItem(items, "b", { title: "Changed" })).toEqual([
      { id: "a", title: "A" },
      { id: "b", title: "Changed" },
    ]);
  });

  it("removes down to the minimum", () => {
    const one = removeItem(items, "a", bounds);
    expect(one).toEqual([{ id: "b", title: "B" }]);
    expect(removeItem(one, "b", bounds)).toEqual(one);
  });

  it("never mutates the input", () => {
    appendItem(items, { id: "c", title: "C" }, bounds);
    updateItem(items, "a", { title: "x" });
    removeItem(items, "a", bounds);
    expect(items).toEqual([
      { id: "a", title: "A" },
      { id: "b", title: "B" },
    ]);
  });
});

describe("string lists", () => {
  const strings = Object.freeze(["one", "two"]);
  const stringBounds = { min: 0, max: 10 };

  it("updates by index and ignores out-of-range indexes", () => {
    expect(updateAt(strings, 1, "TWO")).toEqual(["one", "TWO"]);
    expect(updateAt(strings, 5, "x")).toEqual(["one", "two"]);
  });

  it("removes by index within bounds", () => {
    expect(removeAt(strings, 0, stringBounds)).toEqual(["two"]);
    expect(removeAt(strings, 9, stringBounds)).toEqual(["one", "two"]);
    expect(removeAt(["only"], 0, { min: 1, max: 10 })).toEqual(["only"]);
  });
});
