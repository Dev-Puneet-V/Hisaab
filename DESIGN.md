# DESIGN.md: Hisaab UI/UX guidelines

Give this file to your AI UI tool together with the prompt in PRODUCT.md section 3. **This file overrides the color/token values in that prompt.**

## 1. Who and what
Friends, flatmates, and travel groups in India splitting money. They open the app in a hurry (at a restaurant counter, in a cab, on weak signal). The job of every screen: **add an expense in under 15 seconds, and see clearly who owes whom.**
Visual world: a ledger / khata book. Rows, columns, aligned numbers, quiet confidence. Not a fintech dashboard, not a startup landing page.

## 2. Visual direction
- **One memorable element:** the balance figure. Large, right-aligned, tabular numbers on the group header. Everything else stays quiet.
- **Structure through rows, not cards.** Lists are ruled rows with hairline dividers and section headings. Do not chop everything into identical rounded cards with the same shadow.
- **Hierarchy through size and weight**, not boxes, gradients, or decoration.
- No gradients, glassmorphism, glowing shadows, or decorative illustrations. Icons only when they carry meaning.

### Palette (named, use only these)
| Name | Hex | Use |
|---|---|---|
| Ink | #101828 | Primary text |
| Slate | #667085 | Secondary text |
| Canvas | #F3F4F6 | App background |
| Surface | #FFFFFF | Rows, sheets, inputs |
| Line | #E4E7EC | Dividers, borders |
| Ultramarine | #3B4CCA | Primary actions, links, selected state |
| Owed to you | #0E7A4F | Positive balances |
| You owe | #C0392B | Negative balances |
| Amber | #B7791F | Pending, warnings |

Rules: avoid cream backgrounds with terracotta accents, near-black backgrounds with neon accents, and purple-to-blue gradients. These are the common signs of generated UI. Use pure #000 only if you choose to; Ink above is the default dark.
Contrast at least 4.5:1 for text. Green/red are semantic only and always paired with a sign (+/-) or a word, never color alone.

### Typography
- One family only (e.g. Inter or DM Sans, bundled in the app). Android system font is an acceptable fallback.
- Scale: 12 / 14 / 16 / 20 / 28 / 36. Weights: 400, 600 (700 only for the balance figure).
- **Tabular figures for all money** (`fontVariant: ['tabular-nums']`) so digits line up in columns.
- Sentence case everywhere. No ALL-CAPS tracked labels above headings, no "WORD — fragment" labels, no arrows appended to button text, no middle-dot strings like "A · B · C".
- Do not highlight a single word in a heading with a different color or italic.

### Shape and spacing
- Spacing scale: 4, 8, 12, 16, 24, 32. Screen padding 16.
- Two radii only: 8 (inputs, buttons, chips) and 16 (bottom sheets). Rows have no radius.
- At most one shadow style, used for bottom sheets and the FAB only.
- Touch targets at least 48x48dp.

### Motion
- Only motion that answers a tap: press feedback, sheet open/close, list item added or removed, a short confirmation.
- No entrance animations on every screen, no staggered fade-ups, no hover-style effects.
- Respect the system "reduce motion" setting.

## 3. Screen guidance
- **Groups list:** ruled rows: name on the left, your balance on the right (tabular, colored, with sign). A short line under the name: "3 members, updated 2 min ago". FAB for "New group".
- **Group detail:** top block with the balance figure and a one-line sentence ("You are owed Rs 1,240.00" / "You owe Rs 320.00"). Tabs: Expenses, Balances, Members. Expenses grouped by date with date section headers.
- **Add expense:** amount field first and auto-focused, with a numeric keypad. Then title, "Paid by" (default you), "Split between" (default everyone selected) with a live per-person share shown next to each name. The Save button is fixed at the bottom within thumb reach.
- **Balances:** one row per person: name, amount, and a plain sentence ("Asha owes you Rs 400.00"). "Settle up" is a button on the row.
- **Conflict screen:** two columns "Yours" and "Theirs", with only the changed fields highlighted. Two clear buttons. Explain in one sentence what happened.
- **Sync Inspector:** plain key/value list, monospace is acceptable here, it is a developer screen.

## 4. UX principles
1. **Offline is normal, not an error.** Never block the user for lack of internet. Saving always succeeds immediately.
2. **Be honest about state.** Each item shows its sync state with icon + word: "Saved on this phone", "Syncing", "Synced", "Couldn't sync", "Needs your attention". The global pill and offline banner are quiet, not alarming.
3. **Undo instead of confirm.** Deleting shows a snackbar "Expense deleted. Undo" for ~5 seconds, not a modal "Are you sure?". Use a confirm dialog only for irreversible actions like leaving a group you owe money in.
4. **Fewest taps.** Sensible defaults (you paid, everyone splits). Remember the last group. Primary action reachable by thumb at the bottom.
5. **Numbers first.** Show the amount before the explanation. Always show currency and two decimals. Positive means owed to you.
6. **Forgiving input.** Accept "250", "250.5", and "250.50". Show a clear inline error ("Amount must be more than 0"), not a generic failure. Keep what the user typed.
7. **Every list has three states:** loading (skeleton rows, not a spinner), empty (says what to do), and error (says what happened and offers Retry).
8. **Consistent vocabulary.** Pick one word per concept and keep it everywhere: "Expense", "Settle up", "Group", "Member". The button that says "Save expense" leads to a message that says "Expense saved".

## 5. Writing rules
- Sentence case, plain verbs, active voice, no filler, no exclamation marks, no emoji.
- Buttons name the action: "Add expense", "Settle up", "Join group". Not "Submit" or "OK".
- Errors say what happened and what to do; they never apologize or blame: "Couldn't sync. We'll retry when you're online." / "Invite code not found. Check the 6 characters and try again."
- Empty states invite action: "No expenses yet. Add the first one." Not "Nothing to see here".
- Real sample data in mocks: Indian names, realistic items (Dinner at Truffles, Cab to airport, Groceries), real-looking amounts. Not "Lorem ipsum", "John Doe", or round numbers like 100.00 everywhere.

## 6. Accessibility floor
Screen-reader labels on every touchable, visible focus/pressed state, minimum 48dp targets, contrast 4.5:1, status never by color alone, supports large system fonts (money cells may cap scaling), reduce-motion respected.

## 7. Self-check before handing back UI
- Could this be mistaken for any other finance app screenshot? If yes, simplify toward the ledger idea.
- Is there exactly one memorable element, and is everything else quiet?
- Remove one decoration.
- Delete any all-caps label, gradient, or identical-card grid you find.