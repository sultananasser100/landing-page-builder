import { describe, expect, it } from "@jest/globals";

import { dropIndex, keyboardMoveIndex, moveItem } from "./reorder";

const letters = Object.freeze(["a", "b", "c", "d", "e"]);

describe("moveItem", () => {
  it.each([
    [3, 1, ["a", "d", "b", "c", "e"]], // up
    [1, 3, ["a", "c", "d", "b", "e"]], // down
    [0, 4, ["b", "c", "d", "e", "a"]], // first to last
    [4, 0, ["e", "a", "b", "c", "d"]], // last to first
    [2, 3, ["a", "b", "d", "c", "e"]], // adjacent
  ])("moves index %i to %i", (from, to, expected) => {
    expect(moveItem(letters, from, to)).toEqual(expected);
  });

  it.each([
    [2, 2],
    [-1, 2],
    [2, 5],
    [5, 0],
  ])("returns an unchanged copy for from=%i to=%i", (from, to) => {
    const result = moveItem(letters, from, to);
    expect(result).toEqual(letters);
    expect(result).not.toBe(letters);
  });

  it("never mutates the input", () => {
    moveItem(letters, 0, 4);
    expect(letters).toEqual(["a", "b", "c", "d", "e"]);
  });
});

describe("dropIndex", () => {
  it.each([
    // [from, over, placement, expected final index]
    [3, 1, "before", 1], // drag d above b
    [3, 1, "after", 2], // drag d below b
    [1, 3, "before", 2], // drag b above d
    [1, 3, "after", 3], // drag b below d
    [4, 0, "before", 0], // to the very top
    [0, 4, "after", 4], // to the very bottom
    [2, 1, "after", 2], // just below the row above itself: no move
    [2, 3, "before", 2], // just above the row below itself: no move
    [2, 2, "before", 2], // onto itself
    [2, 2, "after", 2], // onto itself
  ] as const)("from %i over %i %s → %i", (from, over, placement, expected) => {
    expect(dropIndex(from, over, placement)).toBe(expected);
  });

  it("agrees with moveItem for every drop in a five-item list", () => {
    for (let from = 0; from < 5; from++) {
      for (let over = 0; over < 5; over++) {
        for (const placement of ["before", "after"] as const) {
          const result = moveItem(letters, from, dropIndex(from, over, placement));
          // The dragged item always ends up directly before/after the target.
          const moved = letters[from]!;
          const target = letters[over]!;
          if (moved === target) {
            expect(result).toEqual(letters);
          } else {
            const offset = placement === "before" ? 1 : -1;
            expect(result.indexOf(moved) + offset).toBe(result.indexOf(target));
          }
        }
      }
    }
  });
});

describe("keyboardMoveIndex", () => {
  it.each([
    ["ArrowUp", 2, 1],
    ["ArrowDown", 2, 3],
    ["Home", 2, 0],
    ["End", 2, 4],
  ])("%s from %i goes to %i", (key, index, expected) => {
    expect(keyboardMoveIndex(key, index, 5)).toBe(expected);
  });

  it.each([
    ["ArrowUp", 0],
    ["Home", 0],
    ["ArrowDown", 4],
    ["End", 4],
    ["Enter", 2],
    ["a", 2],
  ])("%s at index %i does not move", (key, index) => {
    expect(keyboardMoveIndex(key, index, 5)).toBeNull();
  });

  it("does not move the only item", () => {
    expect(keyboardMoveIndex("ArrowDown", 0, 1)).toBeNull();
    expect(keyboardMoveIndex("End", 0, 1)).toBeNull();
  });
});
