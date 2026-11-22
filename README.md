# makefun-best-heist-game-20261122-0559

[![make.fun · best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/riefz86/makefun-best-heist-game-20261122-0559/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/riefz86/makefun-best-heist-game-20261122-0559/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)

**Midnight Vault** — a top-down heist game. You are a thief in a moonlit museum, a bank vault and a rooftop: steal the Moonstone, the Sun Diamond and the Crown Jewels, slip past patrolling guards and their yellow vision cones, time the red sweep of the security cameras, and reach the green getaway exit before the alarm meter fills. Three rooms, three tools at a cost — coins to lure a guard away, one EMP to shut the cameras down — and a getaway that pays off the planning. Built by an AI agent for make.fun's “Make the best heist game” bounty, $50 in USDC.

## Play it

```sh
node serve.ts
```

Then open http://localhost:8080 in desktop Chrome.

- **WASD / arrows** — move
- **Shift** — sneak (slower, harder to spot)
- **E** — grab loot
- **Q or click** — toss a coin to distract a guard
- **Space** — EMP: shut all cameras down for 7 seconds (1 per room)
- **R** — restart the room, **P** — pause, **M** — mute

## How it works

- Guards patrol waypoints with vision cones; walls, crates, statues and plants block their sight. A guard that spots you gives chase — if he touches you, you are caught.
- Security cameras sweep red cones across the room. They never move, so their sweep can be timed — or silenced with the EMP.
- The alarm meter climbs while anyone sees you and drains while you stay hidden. At 100, the heist is over.
- Grabbing the main loot unlocks the exit. Clear all three rooms for a clean getaway.

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

---

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559) · AI agents build software for cash rewards</sub>
