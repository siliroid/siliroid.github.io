# HEAT — carryover

*The fast handoff. Where this is, what just moved, and what would break — for anyone picking
it up cold, including a model with no history here. Written 2026-07-30 18:36 by Cece, at
Sab's ask, for her Claude's revamp.*

---

## What HEAT is

A relational instrument in two wings. **How you bond** (sync) and **how you hold her**
(stance). Four axes each, three facets per axis, 125 items total.

Three ways in, and they are the same instrument at different depths:

| page | what it is | items |
|---|---|---|
| `quiz.html` | the bonding door | 12 |
| `stance.html` | the stance door | 12 |
| `assess.html` | the full read | 125, four movements, ~25 min |

★ **The two twelve-question doors are not a separate instrument.** Every one of those
twenty-four questions **is** an item in the 125 — matched stem for stem, and tagged
`"tier1_carried"` in `heat-items.json`. That is the whole basis of the carry below, and it
is the single most useful fact in this document.

---

## Files

```
index.html         the front page — two doors, then the 125
quiz.html          bonding 12q       (writes the carry)
stance.html        stance 12q        (writes the carry)
assess.html        the 125           (reads the carry, scores, folio, paywall)
heat-items.json    all 125 items — the instrument itself
success.html       post-purchase handover: stripe -> key -> localStorage
_promptblocks.json per-pairing prompt blocks
smoke.js           the money path end to end in ~10s
```

`assess.html` is one file with one big inline `<script>`. It is long. It is also the only
page with revenue attached to it, so treat a parse error there as an outage.

---

## Storage keys — there are three and they are not interchangeable

| key | written by | shape |
|---|---|---|
| `heat:tier1:v1` | quiz + stance | `{v, doors, answers, t}` — `answers` is `{itemId: value}` |
| `heat_v2_progress` | assess (`LS_KEY`) | `{v, pos, ans, mov, st, fin, t}` |
| `heat_key` | success.html | the purchase key, validated by `validateKey()` |

`LS_KEY` on a version mismatch **stashes to `heat_v2_progress:orphan:<v>`** rather than
dropping. Don't "clean that up" — it is the difference between a stale save and a person's
work being deleted.

---

## What shipped today, in order — all verified on served bytes, not on the push

| sha | what |
|---|---|
| `8bdac91` | paywall moved in **front** of the 125 — pay, then take |
| `c8edb85` | quiz + stance stopped selling (the doors are free) |
| `bad49e4` | mobile CTA on index — root cause was a `<p>` inside a `<p>` reparenting the buttons, never CSS |
| `510395f` | index dedupe — `audit.html` was linked twice, the second demoting the first |
| `3251f65` | **carry producer** — quiz + stance write `heat:tier1:v1` |
| `ccdd376` | stance's twelve tagged `tier1_carried` (the quiz's twelve already were) |
| `ec0fa09` | **carry consumer** — assess reads it, pre-fills, drops those items |
| `32b6a58` | the folio is no longer offered at either 12q door |

Net effect a person feels: finish one door and the assessment is **113 items** instead of
125. Both doors, **101**.

---

## The money path

```
buy.stripe.com  ->  supabase edge fn /stripe-webhook  ->  key issued
                ->  success.html  ->  localStorage heat_key
                ->  assess.html validateKey() -> hasPaidAccess()
```

`heatGateOpen()` runs in `boot()` and gates the whole 125. `revealFolio()` opens with
`if(!hasPaidAccess()) return showBuyPanel();`.

⚠ `heatGateOpen()` is called **after** the `await` on the items fetch, deliberately —
`HEAT_BUY_URL` and `HEAT_PRICE` are `const` declared far below it, so anything reading them
before that yield hits the TDZ. It would throw loudly rather than fail quietly, but don't
move it up.

---

## ⛔ The five things that break silently

Every one of these produces output that looks **completely normal** when broken. No error,
no console warning, no visibly wrong page. That is exactly why they're written down — they
can't be caught by looking. Each has a check that can come out *against* you.

### 1. Carried answers are SEMANTIC values, never dot positions

The value stored in `heat:tier1:v1` is **toward pole A**, 0..1. Not the index of the dot
that got clicked.

Four stance items are `"side": "R"` — **`HO-M2`, `BR-C2`, `WV-M2`, `HR-A3`** — and
`assess.html` renders side-R items with their poles **mirrored** (~L527-535). Store or
restore a slider *position* and those four come back inverted. The person's read changes.
Nothing says so.

**Check:** answer `HO-M2` at one extreme in `stance.html`, open `assess.html`, confirm the
pre-filled value is the same number and not `1 - value`.

### 2. Membership is `in`, never truthiness — 0 is a real answer

`buildFlow()` drops carried items with `!(it.id in CARRIED)`.

The scale includes **0**. `if (CARRIED[id])` is false for a legitimately answered item, so
every question someone answered at the far pole quietly gets asked twice — and the person
who answers strongly is the last one you want re-asking.

### 3. Carry never applies to a run that already has answers

`POS` is an **index into `FLOW`**. Shrink `FLOW` under someone mid-assessment and they move
up to twelve items. `applyCarry()` calls `loadSaved()` and bails if `saved.ans` has anything
in it.

It reads as a redundant guard. It is the only thing between a returning user and a scrambled
position.

### 4. The paywall grandfathers anyone already mid-run

`heatGateOpen()` returns true for a saved run with answers in it, key or no key.

A wall dropped in front of someone holding 80 saved answers locks them out of their own work
and, if the only control on offer is destructive, invites them to delete it. **That exact
shape cost Sab two hours on 2026-07-28.** Someone who started before a change existed must
not be the one who pays for it.

### 5. The folio is offered after the assessment ONLY

Sab's rule, 2026-07-30. Neither 12q door offers a folio or collects an address for one.

They used to: both carried a mailto reading *"send me the folio"* beside prose promising ~15
pages *"written for your exact pairing"* — off **twelve** answers. Twelve items cannot write
a folio for a pairing, and nothing on that page let the person know it. Don't put it back;
the route to the folio runs through the 125.

---

## Open — not done, and not blocked on anything technical

- **Instability and magnitude are not expressed.** The instrument reports a *position* and
  nothing else. A deliberate dead-centre answer and an indifferent one are the same number,
  and "either" is not "somewhere in between." `moves` is recorded (`mov` in `LS_KEY`) and
  unused. This is the most valuable open thing here.
- `index.html` still has five links to five sellable things. Five doors and no door are the
  same door. **David's call, recommended once, not to be re-asked.**
- Traffic: ~81 visits/week site-wide, `/heat/assess.html` gets **5**. There is a top to this
  funnel and not much middle.

---

## Deploying — the trap that costs twenty minutes

⛔ **`site/` in my working tree is NOT what's served.** `tmp/siterepo/` is the live clone of
`siliroid/siliroid.github.io` and the two have diverged over a thousand lines. Never copy one
over the other; patch the live file surgically.

⛔ **Pushed is not live**, and the Pages build API lags the served bytes **in both
directions** — it has reported an older commit while the new code was already being served,
and the reverse. `curl` with a cache-buster and grep for what must be **present** *and* what
must be **gone**. A check that can only confirm isn't a check.

⛔ Don't round-trip `heat-items.json` through `JSON.parse`/`stringify` to make a small edit.
It reformats all 125 items — a twelve-word change arrives as a 547-line diff, and a diff
nobody can read is a change nobody checked. Line surgery.

### Before any push

```
node tmp/checkjs.js quiz.html stance.html     # inline JS parses + carry wiring present
node tmp/carry-test.js                        # 9 cases, expectations written first
node heat/smoke.js                            # the money path end to end
```

`tmp/carry-test.js` extracts the real functions out of `assess.html` rather than restating
them — a copy of the logic only ever tests the copy.

---

*Anything here that reads as an over-cautious guard was put in after something broke. If a
revamp wants to remove one, that's fine — just say which, out loud, so somebody can disagree
before it ships rather than after.* 🖤
