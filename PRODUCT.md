# Hisaab: Offline-first shared expense splitter

Goal: learn real offline-first engineering (outbox, idempotency, cursors, conflicts, tombstones, backoff) by shipping a production app in one week.
Correctness rule: after any chaos test, every device and the server must show identical expenses and identical balances.

## 1. Features (frozen scope)

### In
1. **Auth**: register, login, logout. JWT access token (short) + refresh token (rotating).
2. **Groups**: create a group, join by 6-character invite code, leave a group.
3. **Members**: list members, remove a member (creator only).
4. **Expenses**: title, amount (integer paise), payer, participants, date. Equal split only. Edit and delete.
5. **Settle up**: record a payment "A paid B amount".
6. **Balances**: per member net balance, plus "who owes whom" for the current user. Always derived from expenses and payments, never stored.
7. **Offline-first**: every screen works with no internet. All writes go to local SQLite first.
8. **Sync**: local changes reach the server and other devices' changes arrive, automatically and manually. How is your design.
9. **Sync status**: per-item badge (pending / synced / failed / conflict), global status pill, offline banner.
10. **Conflicts**: concurrent offline edits to the same expense must never silently lose data. The user is told and can choose. Mechanism is your design.
11. **Realtime updates**: when online, changes from other members show up quickly. Correctness must not depend on this working.
12. **Sync Inspector (debug screen)**: shows pending changes, last sync time, last error, and has "Sync now". Add whatever your design needs.

### Out (do not build)
Receipts/photos, multi-currency, uneven splits, debt simplification, push notifications, social login, iOS, avatars, charts, dark mode (optional last).

### Money
Store amounts as integers (paise), never floats. Rounding rules are yours to decide and document.

## 2. Screens

| # | Screen | Purpose |
|---|---|---|
| 1 | Login / Register | Email + password. Link between the two. |
| 2 | Groups list | All groups, your net balance per group, FAB to create/join. |
| 3 | Create / Join group | Name field; or 6-char code field. |
| 4 | Group detail | Header with group name + balance summary. Tabs: Expenses, Balances, Members. |
| 5 | Add / Edit expense | Title, amount, paid by, split among (checkboxes), date, preview of each share. |
| 6 | Expense detail | Full info, per-person shares, sync badge, Edit/Delete, conflict banner if any. |
| 7 | Conflict resolution | Side by side: "Your version" vs "Server version". Buttons: Keep server, Re-apply mine. |
| 8 | Settle up | Pick who pays whom, amount prefilled with suggested balance. |
| 9 | Sync Inspector | Debug and learning dashboard. |
| 10 | Settings | Account, logout, Sync Inspector link, app version. |

Global UI: connectivity banner ("Offline: changes will sync later"), sync pill in the app bar (Synced / Syncing n / Offline / Error), pull-to-refresh on lists, empty and error states on every list.

## 3. UI prompt (paste into your AI tool)

```
Design a React Native (TypeScript, no UI kit) UI for "Hisaab", an offline-first shared expense splitter for Android. I will wire logic myself, so build presentational components and screens with typed props and mock data only. No business logic, no networking.

DESIGN TOKENS: follow DESIGN.md exactly (palette, type, shape, motion, copy rules). Put tokens in src/theme/tokens.ts.

COMPONENTS (src/components)
- Atoms: AppText, Button (primary/secondary/danger, loading, disabled), TextField (label, error, helper), Badge, Avatar-less Initials circle, Divider.
- Molecules: SyncBadge (pending/synced/failed/conflict with icon + label, never color alone), SyncPill (app bar: Synced/Syncing n/Offline/Error), OfflineBanner, AmountText (paise integer -> "Rs 1,234.50", green for positive, red for negative), ExpenseRow, MemberRow, BalanceRow, EmptyState (icon, title, action), ErrorState (message, retry).
- Organisms: GroupCard, ExpenseList, BalanceList, MemberList, SplitPicker (checkbox list with live per-person share preview).

SCREENS (src/screens), each with loading, empty, and error variants driven by props:
1. LoginScreen, RegisterScreen
2. GroupsScreen: list of GroupCard (name, member count, your balance), FAB, pull-to-refresh
3. CreateJoinGroupScreen: two segments, "Create" and "Join with code"
4. GroupDetailScreen: header, top tabs (Expenses, Balances, Members), FAB "Add expense"
5. ExpenseFormScreen: add/edit modes, amount keypad-friendly input, split preview
6. ExpenseDetailScreen: shares table, SyncBadge, conflict banner
7. ConflictScreen: two cards "Your version" / "Server version" with changed fields highlighted, two buttons
8. SettleUpScreen
9. SyncInspectorScreen: key/value rows (pending ops, last sync, cursor, last error), buttons "Sync now" and a "Simulate failure" switch
10. SettingsScreen

RULES
- Mobile-first, single column, works at 360dp width.
- Every list: skeleton loading, empty state, error state with retry.
- Accessibility: accessibilityRole and labels on all touchables, contrast >= 4.5:1, status never conveyed by color alone.
- Use React Navigation types (stack + bottom/top tabs) but leave navigation wiring as TODO.
- Provide a mocks/ folder with realistic sample data (3 groups, 12 expenses, 1 conflict, 2 pending items).
- Output files only; one component per file; named exports; StyleSheet.create.
```