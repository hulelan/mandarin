// Characterizing tests for the "white text on mobile" bug.
//
// Symptom: on a phone whose OS is set to dark mode, text across the app
// appears white-on-white (or white-on-very-light-grey) and is unreadable.
//
// Diagnosis: globals.css flips `--foreground` to #ededed under
// @media (prefers-color-scheme: dark) and applies it via `body { color }`.
// But the UI uses hardcoded LIGHT Tailwind utilities (bg-gray-50, bg-white,
// bg-blue-50, bg-gray-100, etc.) for containers, and leaves many text
// elements with NO explicit text color — so they inherit the near-white
// body color against a light background.
//
// These tests are source-level assertions — no DOM, no Tailwind compile.
// They encode the specific patterns that produce the bug, and will flip
// to passing once we either (a) drop the broken dark-mode override, or
// (b) make every hardcoded light container / every un-colored text node
// theme-aware.

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP = join(__dirname, "..", "app");

const read = (p) => readFileSync(join(APP, p), "utf8");

// ---------------------------------------------------------------------------
// 1. The trigger: globals.css defines dark-mode colors that the rest of the
//    UI does not honor.
// ---------------------------------------------------------------------------
describe("globals.css dark-mode trigger", () => {
  const css = read("globals.css");

  test("defines a prefers-color-scheme: dark block (the trigger)", () => {
    assert.match(
      css,
      /@media\s*\(\s*prefers-color-scheme\s*:\s*dark\s*\)/,
      "globals.css must declare a dark-mode override for this bug to exist",
    );
  });

  test("dark-mode --foreground is near-white", () => {
    // Extract the color inside the dark-mode block.
    const darkBlock = css.match(
      /@media\s*\(\s*prefers-color-scheme\s*:\s*dark\s*\)\s*\{[\s\S]*?--foreground\s*:\s*(#[0-9a-fA-F]{3,8})/,
    );
    assert.ok(darkBlock, "expected --foreground declared in dark block");
    const hex = darkBlock[1].toLowerCase();
    // #ededed → ~93% luminance. Anything >= #a0a0a0 is "near white" for our purposes.
    const avg = (parseInt(hex.slice(1, 3), 16) +
                 parseInt(hex.slice(3, 5), 16) +
                 parseInt(hex.slice(5, 7), 16)) / 3;
    assert.ok(
      avg > 160,
      `dark-mode --foreground is ${hex} (avg=${avg.toFixed(0)}), near-white — this is what bleeds onto light containers`,
    );
  });

  test("body inherits the (dark-mode-flipped) foreground as its text color", () => {
    // This is the propagation mechanism: any descendant without an explicit
    // text color will be rendered in this value.
    assert.match(
      css,
      /body\s*\{[\s\S]*?color\s*:\s*var\(--foreground\)/,
      "body must apply --foreground via `color` for the bleed to happen",
    );
  });

  // CHARACTERIZATION: the FIX must break at least one of the three facts above.
  // Either drop the dark block, stop inheriting it on body, or override every
  // descendant. The simplest fix is dropping the dark block until the UI is
  // actually designed for dark mode.
});

// ---------------------------------------------------------------------------
// 2. The amplifier: the main app chrome hardcodes LIGHT backgrounds. These
//    stay light in dark mode, so near-white inherited text becomes unreadable
//    against them.
// ---------------------------------------------------------------------------
describe("app chrome hardcodes light containers (ignores dark mode)", () => {
  const page = read("page.tsx");

  test("page.tsx root uses bg-gray-50 — a light background that never flips", () => {
    assert.match(
      page,
      /min-h-screen\s+bg-gray-50/,
      "the root container has bg-gray-50 without a dark-mode variant",
    );
    assert.doesNotMatch(
      page,
      /dark:bg-/,
      "no dark: variants anywhere in page.tsx — confirms one-sided theming",
    );
  });

  test("page.tsx header uses bg-white — stays white even when body text is near-white", () => {
    assert.match(page, /<header[^>]*className="[^"]*bg-white/);
  });

  test("page.tsx sticky recording bar uses bg-white", () => {
    assert.match(page, /fixed\s+bottom-0[\s\S]*?bg-white/);
  });
});

// ---------------------------------------------------------------------------
// 3. Inherited-color text: elements that render text WITHOUT an explicit
//    text color, so they take the body's (near-white, in dark mode) color.
//    These are the nodes that actually disappear on a dark-mode phone.
// ---------------------------------------------------------------------------
describe("text elements that inherit near-white in dark mode", () => {
  test("SentenceCard Chinese character span has no explicit text color", () => {
    const src = read("components/SentenceCard.tsx");
    // The span at `text-2xl px-0.5 rounded ${colorClass}` is the one that
    // shows the hanzi. When there are no evaluation results, `colorClass` is
    // an empty string, so the span has NO text color — it inherits body.
    assert.match(
      src,
      /className=\{`text-2xl px-0\.5 rounded \$\{colorClass\}`\}/,
      "the hanzi span relies on a dynamic colorClass that is '' pre-evaluation",
    );
    assert.match(
      src,
      /const colorClass = result \? statusColors\[result\.status\] : "";/,
      "colorClass falls back to empty string — no text color set",
    );
    // Sanity: the container around it is a light-background button
    // (border-gray-200 without bg → inherits page's bg-gray-50; or bg-blue-50
    // when selected). Both are light, so near-white hanzi are invisible.
    assert.match(src, /bg-blue-50|bg-gray-50|border-gray-200/);
  });

  // Strip Tailwind prefixed variants (e.g. placeholder:text-gray-400,
  // hover:text-gray-700, dark:text-white) so we only inspect base utilities.
  // Prefixed variants don't set the element's own resting state color.
  const baseUtilities = (cls) => cls.replace(/[\w-]+:[\w-]+/g, "");

  test("TextInput <textarea> sets no text color and no background", () => {
    const src = read("components/TextInput.tsx");
    const textareaBlock = src.match(/<textarea[\s\S]*?\/>/);
    assert.ok(textareaBlock, "expected a textarea in TextInput");
    const cls = baseUtilities(textareaBlock[0]);
    assert.doesNotMatch(
      cls,
      /\btext-(gray|black|slate|zinc|neutral|stone|foreground)-?\d*/,
      "textarea has no explicit text color — typed text inherits body (near-white in dark)",
    );
    assert.doesNotMatch(
      cls,
      /\bbg-(white|gray-\d+|slate-\d+|background)/,
      "textarea has no explicit background — UA default is white — white-on-white in dark mode",
    );
  });

  test("TextInput number <input>s set no text color", () => {
    const src = read("components/TextInput.tsx");
    const inputs = [...src.matchAll(/<input[\s\S]*?\/>/g)];
    const numberInputs = inputs.filter((m) => /type="number"/.test(m[0]));
    assert.ok(numberInputs.length >= 2, "expected at least the two page-range number inputs");
    for (const m of numberInputs) {
      assert.doesNotMatch(
        baseUtilities(m[0]),
        /\btext-(gray|black|slate|zinc|neutral|stone|foreground)-?\d*/,
        "number input has no explicit text color — typed digits go near-white in dark mode",
      );
    }
  });
});

// ---------------------------------------------------------------------------
// 4. The overall characterization, stated as one contract.
//
//    "Either the app opts out of dark mode entirely, OR every light container
//    and every un-colored text node becomes theme-aware."
//
//    Right now NEITHER is true — hence the bug. This test fails until one
//    side of the OR holds.
// ---------------------------------------------------------------------------
describe("contract: consistent theming across OS color preferences", () => {
  test("app currently violates the contract (will pass once fixed)", () => {
    const css = read("globals.css");
    const hasDarkBlock = /@media\s*\(\s*prefers-color-scheme\s*:\s*dark\s*\)/.test(css);

    // Rough indicator that the UI was designed for dark mode: any `dark:`
    // utility, or an explicit body text color that stays readable on a
    // dark bg.
    const uiFiles = [
      "page.tsx",
      "components/SentenceCard.tsx",
      "components/SentenceList.tsx",
      "components/TextInput.tsx",
      "components/SettingsPanel.tsx",
      "components/RecordButton.tsx",
      "components/VadRecordButton.tsx",
    ];
    const anyDarkVariants = uiFiles.some((f) => /\bdark:/.test(read(f)));

    const optedOutOfDarkMode = !hasDarkBlock;
    const supportsDarkMode = anyDarkVariants;

    assert.ok(
      optedOutOfDarkMode || supportsDarkMode,
      "App defines a dark-mode --foreground but no component uses dark: variants — " +
        "text inherits near-white on hardcoded light backgrounds. " +
        "Fix either by removing the dark block in globals.css or by making the UI dark-aware.",
    );
  });
});
