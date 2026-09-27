"""Phone and desktop acceptance for Bober Bridge Rush br3b."""
import json
import pathlib
import sys
import time

from playwright.sync_api import sync_playwright

URL = "http://127.0.0.1:8792/?v=br3b"
OUT = pathlib.Path(r"C:\Users\calle\AppData\Local\Temp")
fails = []
GUNS = ["bow", "long", "smg", "shot", "gerald", "log", "rocket", "flame", "party", "sap"]
STARTERS = ["bow", "smg", "shot", "log"]


def check(cond, msg):
    if not cond:
        fails.append(msg)
        print("FAIL", msg)
    else:
        print("ok", msg)


def rects(page):
    return page.evaluate(
        """() => {
          const ids = ["level-name","bober-run","btn-pause","bar","chip","tip","squad-banner","flash"];
          const out = [];
          for (const id of ids) {
            const el = document.getElementById(id);
            if (!el) continue;
            const s = getComputedStyle(el);
            if (s.display === "none" || s.visibility === "hidden") continue;
            const r = el.getBoundingClientRect();
            if (r.width < 2 || r.height < 2) continue;
            out.push({ id, x: r.x, y: r.y, w: r.width, h: r.height, r: r.right, b: r.bottom });
          }
          return out;
        }"""
    )


def overlaps(boxes):
    bad = []
    for i in range(len(boxes)):
        for j in range(i + 1, len(boxes)):
            a, b = boxes[i], boxes[j]
            if a["id"] == "bar" and b["id"] in ("level-name", "bober-run"):
                continue
            if b["id"] == "bar" and a["id"] in ("level-name", "bober-run"):
                continue
            hit = a["x"] < b["r"] - 2 and a["r"] > b["x"] + 2 and a["y"] < b["b"] - 2 and a["b"] > b["y"] + 2
            if hit:
                bad.append(a["id"] + "/" + b["id"])
    return bad


def canvas_fill(page):
    return page.evaluate(
        """() => {
          const r = document.getElementById("c").getBoundingClientRect();
          return {
            w: r.width, h: r.height,
            iw: window.innerWidth, ih: window.innerHeight,
            dx: Math.abs(r.width - window.innerWidth),
            dy: Math.abs(r.height - window.innerHeight)
          };
        }"""
    )


def note_console(errors, msg):
    if msg.type != "error":
        return
    loc = ""
    try:
        loc = str((msg.location or {}).get("url") or "")
    except Exception:
        loc = ""
    blob = (msg.text + " " + loc).lower()
    if "favicon" in blob:
        return
    errors.append("console " + msg.text)


def begin(page):
    page.evaluate("() => { __bridge.hold(true); __bridge.skipIntro(); }")


def main():
    errors = []
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="chrome", args=["--disable-http-cache"])
        page = browser.new_page(viewport={"width": 390, "height": 844}, device_scale_factor=2)
        page.set_default_timeout(180000)
        page.on("pageerror", lambda err: errors.append("pageerror " + str(err)))
        page.on("console", lambda msg: note_console(errors, msg))

        page.goto(URL, wait_until="domcontentloaded")
        page.wait_for_function("window.__bridge && window.__bridge.ready", timeout=20000)
        page.evaluate("() => localStorage.removeItem('bober_bridge_v1')")
        page.reload(wait_until="domcontentloaded")
        page.wait_for_function("window.__bridge && window.__bridge.ready")
        page.locator("#build-tag").wait_for()
        page.screenshot(path=str(OUT / "bbr-phone-title.png"))
        check(page.locator("#build-tag").inner_text().strip() == "br3b", "build tag br3b")
        check(page.locator("#tagline").inner_text().strip() == "Plug the Drain.", "tagline")
        check("THE DAM RUNS DRY" in page.locator(".eyebrow").inner_text(), "chapter")
        check("Fan game. Unofficial." in page.locator("#fan-line").inner_text(), "fan line")
        check(page.locator("#btn-start").inner_text().strip() == "HOLD THE BRIDGE", "start label")
        check("$BOBER" in page.locator("#bober-total").inner_text(), "title currency")
        href = page.locator("#btn-home").get_attribute("href")
        check(href == "https://ccosma1.github.io/green-home-games/", "home link")
        check(page.locator("#lv-1-1").is_enabled(), "1-1 open")
        check(page.locator("#lv-1-2").is_disabled(), "1-2 locked")
        check(page.locator("#lv-1-3").is_disabled(), "1-3 locked")
        check("LOCK" in page.locator("#lv-1-2").inner_text(), "padlock")

        t0 = time.perf_counter()
        page.locator("#btn-start").click()
        page.wait_for_function("window.__bridge.mode() === 'intro' || window.__bridge.mode() === 'run'")
        intro = page.evaluate(
            """() => ({
              mode: __bridge.mode(),
              name: document.getElementById('intro-name').textContent,
              line: document.getElementById('intro-line').textContent
            })"""
        )
        print("intro", intro)
        check(intro["name"] == "1-1 PINE BRIDGE", "intro name")
        check("three inches" in intro["line"], "intro line")
        page.evaluate("() => __bridge.skipIntro()")
        page.wait_for_function("window.__bridge.mode() === 'run'")
        load_s = time.perf_counter() - t0
        print(f"load-to-run {load_s:.2f}s")
        check(load_s < 5, f"under 5s ({load_s:.2f})")
        page.evaluate("() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))")
        page.screenshot(path=str(OUT / "bbr-phone-run.png"))

        fill = canvas_fill(page)
        print("fill", fill)
        check(fill["dx"] <= 1 and fill["dy"] <= 1, "phone canvas fills")
        pause = page.locator("#btn-pause").bounding_box()
        check(pause and abs(pause["width"] - 44) <= 1.5 and abs(pause["height"] - 44) <= 1.5, "pause 44px")
        bad = overlaps(rects(page))
        print("overlap", bad, rects(page))
        check(not bad, "phone hud overlap " + ",".join(bad))
        check(page.locator("#chip-family").inner_text().strip() == "ARROWS", "family tag")
        check("Twig Crossbow" in page.locator("#chip-name").inner_text(), "starter name")

        page.evaluate("() => __bridge.hold(true)")
        report = page.evaluate("() => __bridge.selfTest()")
        print("selfTest", json.dumps(report))
        check(report["fails"] == [], "selfTest " + "; ".join(report["fails"]))
        check(report["soldier"] <= 2500, "soldier tris")
        check(report["bober"] <= 5000, "bober tris")
        check(report["boss"] <= 6000, "boss tris")

        steer = page.evaluate(
            """() => {
              __bridge.hold(true);
              __bridge.start('1-1');
              __bridge.skipIntro();
              const mpp = __bridge.mpp();
              const before = __bridge.snapshot().x;
              __bridge.drag(140);
              __bridge.step(1.2);
              const after = __bridge.snapshot();
              return { mpp, before, x: after.x, target: after.target, half: after.half };
            }"""
        )
        print("steer", steer)
        expect = steer["before"] + 140 * steer["mpp"]
        check(steer["mpp"] > 0.005, "mpp")
        check(abs(steer["x"] - expect) < 0.35 or abs(steer["x"] - steer["target"]) < 0.2, "drag 1:1")
        check(abs(steer["x"]) <= steer["half"] - 0.2, "inside rails")

        keys = page.evaluate(
            """() => {
              __bridge.start('1-1');
              __bridge.skipIntro();
              __bridge.setAxis(1);
              __bridge.step(0.4);
              const right = __bridge.snapshot().x;
              __bridge.setAxis(-1);
              __bridge.step(0.8);
              const left = __bridge.snapshot().x;
              __bridge.setAxis(0);
              return { right, left };
            }"""
        )
        print("keys", keys)
        check(keys["right"] > 0.5, "key right")
        check(keys["left"] < keys["right"] - 0.5, "key left")

        gate = page.evaluate(
            """() => {
              __bridge.start('1-1');
              __bridge.skipIntro();
              return __bridge.damageGate(6);
            }"""
        )
        print("gate", gate)
        check(gate == "+6", "gate grew to +6")

        crate = page.evaluate(
            """() => {
              __bridge.start('1-1');
              __bridge.skipIntro();
              const hp = __bridge.hurtCrate(120);
              const mid = __bridge.snapshot().crateHp;
              __bridge.hurtCrate(9999);
              __bridge.step(0.4);
              const done = __bridge.snapshot();
              return { hp, mid, weapon: done.weapon, color: done.color, tier: done.tier, family: done.family };
            }"""
        )
        print("crate", crate)
        check(crate["mid"] == 360, "crate hp counts down")
        check(crate["weapon"] == "smg" and crate["color"] == "#F5C400" and crate["family"] == "BULLETS", "smg swap keeps tier")

        rack = page.evaluate(
            """() => {
              __bridge.start('1-1');
              __bridge.skipIntro();
              __bridge.forceRack();
              __bridge.step(0.12);
              const sn = __bridge.snapshot();
              return { weapon: sn.weapon, tier: sn.tier, rack: sn.rack };
            }"""
        )
        print("rack", rack)
        check(rack["weapon"] == "shot" and rack["tier"] == 1 and rack["rack"] == "standard", "standard rack shotgun")

        page.evaluate(
            """() => {
              __bridge.start('1-1');
              __bridge.skipIntro();
              __bridge.setSquad(60);
              __bridge.spawnPack('clog', 130, 1e9, 1);
              __bridge.spawnPack('suds', 68, 1e9, 1);
              __bridge.spawnPack('hauler', 2, 1e9, 1);
              __bridge.hold(false);
            }"""
        )
        page.wait_for_timeout(2500)
        bench = page.evaluate(
            """() => {
              const fps = __bridge.fps();
              const calls = __bridge.calls();
              const enemies = __bridge.snapshot().enemies;
              __bridge.hold(true);
              const t0 = performance.now();
              __bridge.killAll();
              return { fps, calls, enemies, hitch: performance.now() - t0, left: __bridge.snapshot().enemies };
            }"""
        )
        print("bench", bench)
        check(bench["enemies"] >= 190, "200 live before clear")
        check(bench["fps"] >= 50, "fps " + str(round(bench["fps"])))
        check(bench["calls"] <= 70, "draws " + str(bench["calls"]))
        check(bench["hitch"] < 40, "mass death hitch " + str(round(bench["hitch"])))
        check(bench["left"] == 0, "killall cleared")

        page.evaluate(
            """() => {
              __bridge.hold(true);
              __bridge.start('1-3');
              __bridge.skipIntro();
              __bridge.spawnPack('clog', 260, 1e9, 1);
              __bridge.hold(false);
            }"""
        )
        page.wait_for_timeout(2000)
        peak = page.evaluate(
            """() => {
              const fps = __bridge.fps();
              const calls = __bridge.calls();
              const enemies = __bridge.snapshot().enemies;
              __bridge.hold(true);
              __bridge.killAll();
              return { fps, calls, enemies };
            }"""
        )
        print("peak", peak)
        check(peak["enemies"] >= 250, "260 live")
        check(peak["fps"] >= 45, "peak fps " + str(round(peak["fps"])))
        check(peak["calls"] <= 70, "peak draws " + str(peak["calls"]))

        lost = page.evaluate(
            """() => {
              __bridge.start('1-1');
              __bridge.skipIntro();
              __bridge.setSquad(0);
              return { mode: __bridge.mode(), text: document.getElementById('result-title').textContent };
            }"""
        )
        print("lose", lost)
        check(lost["mode"] == "lose" and lost["text"] == "The dam crew needs you!", "lose copy")

        page.evaluate("() => localStorage.removeItem('bober_bridge_v1')")
        page.reload(wait_until="domcontentloaded")
        page.wait_for_function("window.__bridge && window.__bridge.ready")
        won = page.evaluate(
            """() => {
              __bridge.hold(true);
              __bridge.start('1-1');
              __bridge.skipIntro();
              __bridge.debugWin();
              const bark = __bridge.snapshot().bark;
              __bridge.step(1);
              const raw = localStorage.getItem('bober_bridge_v1');
              return {
                mode: __bridge.mode(),
                title: document.getElementById('result-title').textContent,
                earn: document.getElementById('result-earn').textContent,
                next: document.getElementById('btn-next').textContent,
                stars: document.querySelectorAll('#stars i.on').length,
                bark,
                save: raw
              };
            }"""
        )
        print("win", won["title"], won["earn"], won["next"], won["bark"])
        check(won["mode"] == "win" and won["title"] == "BRIDGE HELD!", "win title")
        check("324" in won["earn"], "earned 324")
        check(won["stars"] == 3, "3 stars")
        check(won["next"].strip() == "Next", "next label")
        check("FIRST NOTICE" in won["bark"], "baron leaves")
        saved = json.loads(won["save"])
        check(saved["bober"] == 324 and saved["v"] == 2, "save shape")
        check("long" in saved["unlocked"] and "rocket" not in saved["unlocked"], "1-1 unlocks")
        page.screenshot(path=str(OUT / "bbr-phone-win.png"))

        page.locator("#btn-next").click()
        page.wait_for_function("window.__bridge.mode() === 'intro'")
        nxt = page.locator("#intro-name").inner_text()
        print("next level", nxt)
        check(nxt.strip() == "1-2 SPILLWAY BRIDGE", "next starts 1-2")
        page.evaluate("() => __bridge.skipIntro()")

        page.reload(wait_until="domcontentloaded")
        page.wait_for_function("window.__bridge && window.__bridge.ready")
        kept = page.evaluate("() => document.getElementById('bober-total').textContent")
        print("reload", kept)
        check(kept.strip() == "$BOBER 324", "currency survives reload")
        check(page.locator("#lv-1-2").is_enabled(), "1-2 unlocked after clear")
        check(page.locator("#lv-1-3").is_disabled(), "1-3 still locked")

        levels = page.evaluate(
            """() => {
              __bridge.hold(true);
              const out = {};
              for (const id of ['1-1', '1-2', '1-3']) {
                __bridge.start(id);
                __bridge.skipIntro();
                const sn = __bridge.snapshot();
                out[id] = { river: sn.river, kinds: sn.kinds.slice(), rack: sn.rack, banner: sn.banner, slots: sn.slots.slice(), boss: sn.level };
              }
              return out;
            }"""
        )
        print("levels", json.dumps(levels))
        check(levels["1-1"]["river"] == 0, "river 1-1")
        check(abs(levels["1-2"]["river"] + 0.3) < 0.001, "river 1-2")
        check(abs(levels["1-3"]["river"] + 0.6) < 0.001, "river 1-3")
        check(levels["1-1"]["kinds"] == ["weapon", "weapon"], "1-1 crates")
        for kind in ("weapon", "volunteer", "forged", "duck"):
            check(kind in levels["1-2"]["kinds"], "1-2 has " + kind)
        check(levels["1-2"]["rack"] == "mixed", "mixed rack")
        for kind in ("tier", "mystery", "volunteer", "forged", "weapon"):
            check(kind in levels["1-3"]["kinds"], "1-3 has " + kind)
        check(levels["1-3"]["rack"] == "family" and levels["1-3"]["banner"] == "BULLETS", "family rack")

        forged = page.evaluate(
            """() => {
              __bridge.start('1-2');
              __bridge.skipIntro();
              const kinds = __bridge.snapshot().kinds;
              const idx = kinds.indexOf('forged');
              __bridge.openCrate(idx);
              __bridge.step(0.25);
              const sn = __bridge.snapshot();
              return { idx, clog: sn.counts[0], n: sn.n };
            }"""
        )
        print("forged", forged)
        check(forged["clog"] >= 15, "forged ambush")

        mystery = page.evaluate(
            """() => {
              __bridge.start('1-3');
              __bridge.skipIntro();
              const kinds = __bridge.snapshot().kinds;
              __bridge.openCrate(kinds.indexOf('tier'));
              __bridge.step(0.25);
              const tier = __bridge.snapshot().tier;
              __bridge.openCrate(kinds.indexOf('mystery'));
              __bridge.step(0.9);
              const sn = __bridge.snapshot();
              return { tier, weapon: sn.weapon, gold: sn.gold };
            }"""
        )
        print("mystery", mystery)
        check(mystery["tier"] == 2, "tier crate")
        check(mystery["weapon"] in ["bow", "smg", "shot", "log"], "mystery stays unlocked")

        bosses = page.evaluate(
            """() => {
              const out = {};
              __bridge.start('1-2');
              __bridge.skipIntro();
              __bridge.killBoss();
              const tubBark = __bridge.snapshot().bark;
              __bridge.step(1);
              out.tub = { title: document.getElementById('result-title').textContent, bark: tubBark };
              __bridge.start('1-3');
              __bridge.skipIntro();
              __bridge.killBoss();
              const gBark = __bridge.snapshot().bark;
              __bridge.step(1);
              out.grunk = { title: document.getElementById('result-title').textContent, bark: gBark };
              return out;
            }"""
        )
        print("bosses", bosses)
        check(bosses["tub"]["title"] == "BRIDGE HELD!", "big tub falls")
        check(bosses["grunk"]["title"] == "DAM HELD!" and "PLAN" in bosses["grunk"]["bark"], "grunk falls")

        guns = page.evaluate(
            """() => {
              __bridge.hold(true);
              __bridge.start('1-1');
              __bridge.skipIntro();
              const order = [];
              let spin = 0;
              let foam = -1;
              for (let i = 0; i < 10; i++) {
                const sn = __bridge.snapshot();
                order.push(sn.weapon);
                if (sn.weapon === 'gerald') {
                  __bridge.spawnPack('clog', 6, 500, 1);
                  __bridge.step(0.7);
                  spin = __bridge.snapshot().spin;
                  __bridge.killAll();
                }
                if (sn.weapon === 'flame') {
                  __bridge.spawnPack('suds', 1, 0, 1);
                  __bridge.spawnPack('leaf', 4, 0, 1);
                  __bridge.step(1.4);
                  const mid = __bridge.snapshot();
                  foam = mid.foam;
                  __bridge.killAll();
                }
                __bridge.cycleGun();
              }
              const stayed = __bridge.snapshot().weapon;
              return { order, spin, foam, stayed };
            }"""
        )
        print("guns", guns)
        check(guns["order"] == GUNS, "ten guns cycle")
        check(guns["spin"] > 0.6, "gerald spins up")
        check(guns["foam"] == 0, "flamer strips foam")

        page.evaluate("() => { __bridge.start('1-1'); __bridge.skipIntro(); __bridge.hold(true); }")
        for gun in ("bow", "long", "gerald", "rocket", "flame", "party", "sap", "shot"):
            page.evaluate(
                """(id) => {
                  while (__bridge.snapshot().weapon !== id) __bridge.cycleGun();
                  __bridge.spawnPack('clog', 5, 80, 1);
                  __bridge.step(0.45);
                }""",
                gun,
            )
            page.evaluate("() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))")
            page.screenshot(path=str(OUT / ("bbr-gun-" + gun + ".png")))
            page.evaluate("() => __bridge.killAll()")

        page.evaluate("() => { __bridge.start('1-1'); __bridge.skipIntro(); }")
        quiet = page.evaluate("() => __bridge.snapshot().weapon")
        page.keyboard.press("g")
        still = page.evaluate("() => __bridge.snapshot().weapon")
        check(quiet == still, "G ignored until the overlay")
        page.keyboard.press("f")
        page.keyboard.press("g")
        cycled = page.evaluate("() => __bridge.snapshot().weapon")
        print("hotkey", quiet, still, cycled)
        check(cycled == "long", "G cycles while the overlay is on")
        page.keyboard.press("t")
        tier = page.evaluate("() => __bridge.snapshot()")
        check(tier["tier"] == 2 and tier["weapon"] == "long", "T adds a tier")

        for lid, shot in (("1-1", "bbr-river-11.png"), ("1-2", "bbr-river-12.png"), ("1-3", "bbr-river-13.png")):
            page.evaluate(
                """(id) => { __bridge.start(id); __bridge.skipIntro(); __bridge.hold(true); }""",
                lid,
            )
            page.evaluate("() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))")
            page.screenshot(path=str(OUT / shot))

        still = page.evaluate(
            """() => {
              __bridge.hold(true);
              __bridge.start('1-1');
              __bridge.skipIntro();
              const log = [];
              for (let s = 0; s < 14; s++) {
                __bridge.rush(8);
                const sn = __bridge.snapshot();
                log.push({ t: (s + 1) * 8, n: sn.n, dist: Math.round(sn.dist), end: sn.ended, w: sn.weapon });
                if (sn.ended) break;
              }
              return log;
            }"""
        )
        print("still")
        for row in still:
            print(" ", row)
        check(still[-1]["end"] == "lose", "standing still loses 1-1")

        bot = page.evaluate(
            """() => {
              __bridge.hold(true);
              __bridge.start('1-1');
              __bridge.skipIntro();
              __bridge.setBot(true);
              const log = [];
              for (let s = 0; s < 16; s++) {
                __bridge.rush(10);
                const sn = __bridge.snapshot();
                log.push({ t: (s + 1) * 10, n: sn.n, dist: Math.round(sn.dist), e: sn.enemies, w: sn.weapon, hp: Math.round(sn.bossHp), end: sn.ended, kills: sn.kills });
                if (sn.ended) break;
              }
              return log;
            }"""
        )
        print("bot")
        for row in bot:
            print(" ", row)
        check(bot[-1]["end"] == "win" and bot[-1]["n"] > 0, "bot held the bridge")

        page.evaluate(
            """() => localStorage.setItem('bober_bridge_v1', JSON.stringify({
              v: 1, bober: 77, stars: {'1-1': 2}, levelsCleared: {'1-1': true}, settings: { mute: false, tipSeen: true }
            }))"""
        )
        page.reload(wait_until="domcontentloaded")
        page.wait_for_function("window.__bridge && window.__bridge.ready")
        migrated = page.evaluate("() => JSON.parse(localStorage.getItem('bober_bridge_v1'))")
        shown = page.locator("#bober-total").inner_text()
        print("migrate", shown, migrated.get("unlocked"))
        check(shown.strip() == "$BOBER 77", "v1 keeps currency")
        check(migrated["v"] == 2 and "long" in migrated["unlocked"], "v1 grows unlocks")
        check(page.locator("#lv-1-2").is_enabled(), "migrated 1-2 opens")

        page.evaluate("() => localStorage.setItem('bober_bridge_v1', JSON.stringify({ v: 9, bober: 5 }))")
        page.reload(wait_until="domcontentloaded")
        page.wait_for_function("window.__bridge && window.__bridge.ready")
        fresh = page.locator("#bober-total").inner_text()
        check(fresh.strip() == "$BOBER 0", "unknown save resets")

        desk = browser.new_page(viewport={"width": 1440, "height": 900}, device_scale_factor=1)
        desk.set_default_timeout(60000)
        desk.on("pageerror", lambda err: errors.append("desk " + str(err)))
        desk.on("console", lambda msg: note_console(errors, msg))
        desk.goto(URL, wait_until="domcontentloaded")
        desk.wait_for_function("window.__bridge && window.__bridge.ready")
        desk.screenshot(path=str(OUT / "bbr-desk-title.png"))
        desk.locator("#btn-start").click()
        desk.wait_for_function("window.__bridge.mode() === 'intro' || window.__bridge.mode() === 'run'")
        desk.evaluate("() => __bridge.skipIntro()")
        desk.wait_for_function("window.__bridge.mode() === 'run'")
        desk.evaluate("() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))")
        desk.screenshot(path=str(OUT / "bbr-desk-run.png"))
        dfill = canvas_fill(desk)
        print("desk fill", dfill)
        check(dfill["dx"] <= 1 and dfill["dy"] <= 1, "desk canvas fills")
        dbad = overlaps(rects(desk))
        print("desk overlap", dbad)
        check(not dbad, "desk hud overlap " + ",".join(dbad))
        body = (page.inner_text("body") + " " + desk.inner_text("body")).lower()
        needles = (
            "rat " + "baron",
            "bog " + "rat",
            "beetle " + "shell",
            "otter " + "brute",
            "mud" + "rot",
            "twig " + "pistol",
            "zom" + "bie",
            "wal" + "let",
            "meta" + "mask",
            "last" + " z",
        )
        for word in needles:
            check(word not in body, "page hides a blocked name")

        browser.close()

    print("console", errors[:8], "count", len(errors))
    real = [e for e in errors if "favicon" not in e.lower()]
    check(not real, "console errors " + " | ".join(real[:4]))
    if fails:
        print("PLAYTEST_FAIL", len(fails))
        for item in fails:
            print(" -", item)
        sys.exit(1)
    print("PLAYTEST_OK")


if __name__ == "__main__":
    main()
