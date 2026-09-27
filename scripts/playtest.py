"""Phone and desktop acceptance for Bober Bridge Rush br0."""
import json
import pathlib
import sys
import time

from playwright.sync_api import sync_playwright

URL = "http://127.0.0.1:8792/?v=br0"
OUT = pathlib.Path(r"C:\Users\calle\AppData\Local\Temp")
fails = []


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


def main():
    errors = []
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="chrome", args=["--disable-http-cache"])
        page = browser.new_page(viewport={"width": 390, "height": 844}, device_scale_factor=2)
        page.on("pageerror", lambda err: errors.append("pageerror " + str(err)))
        page.on("console", lambda msg: note_console(errors, msg))

        t0 = time.perf_counter()
        page.goto(URL, wait_until="domcontentloaded")
        page.wait_for_function("window.__bridge && window.__bridge.ready", timeout=20000)
        page.locator("#build-tag").wait_for()
        page.screenshot(path=str(OUT / "bbr-phone-title.png"))
        check(page.locator("#build-tag").inner_text().strip() == "br0", "build tag br0")
        check("Fan game. Unofficial." in page.locator("#fan-line").inner_text(), "fan line")
        check(page.locator("#btn-start").inner_text().strip() == "HOLD THE BRIDGE", "start label")
        check("$BOBER" in page.locator("#bober-total").inner_text(), "title currency")
        href = page.locator("#btn-home").get_attribute("href")
        check(href == "https://ccosma1.github.io/green-home-games/", "home link")

        page.locator("#btn-start").click()
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

        page.evaluate("() => __bridge.hold(true)")
        report = page.evaluate("() => __bridge.selfTest()")
        print("selfTest", json.dumps(report))
        check(report["fails"] == [], "selfTest " + "; ".join(report["fails"]))
        check(report["soldier"] <= 350, "soldier tris")
        check(report["bober"] <= 5000, "bober tris")
        check(report["boss"] <= 6000, "boss tris")

        steer = page.evaluate(
            """() => {
              __bridge.hold(true);
              __bridge.start();
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
              __bridge.start();
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
              __bridge.start();
              const label = __bridge.damageGate(6);
              return label;
            }"""
        )
        print("gate", gate)
        check(gate == "+6", "gate grew to +6")

        crate = page.evaluate(
            """() => {
              __bridge.start();
              const hp = __bridge.hurtCrate(120);
              __bridge.step(0.05);
              const mid = __bridge.snapshot().crateHp;
              __bridge.hurtCrate(9999);
              __bridge.step(0.4);
              const done = __bridge.snapshot();
              return { hp, mid, weapon: done.weapon, color: done.color, tier: done.tier };
            }"""
        )
        print("crate", crate)
        check(crate["mid"] == 360, "crate hp counts down")
        check(crate["weapon"] == "smg" and crate["color"] == "#F5C400", "smg tracer swap")

        rack = page.evaluate(
            """() => {
              __bridge.start();
              __bridge.forceRack();
              __bridge.step(0.12);
              return __bridge.snapshot();
            }"""
        )
        print("rack", rack["weapon"], rack["tier"])
        check(rack["weapon"] == "shot", "rack pick shotgun")

        page.evaluate(
            """() => {
              __bridge.start();
              __bridge.setSquad(60);
              __bridge.spawnPack('rat', 130, 1e9, 1);
              __bridge.spawnPack('beetle', 68, 1e9, 1);
              __bridge.spawnPack('brute', 2, 1e9, 1);
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
        check(bench["calls"] <= 60, "draws " + str(bench["calls"]))
        check(bench["hitch"] < 40, "mass death hitch " + str(round(bench["hitch"])))
        check(bench["left"] == 0, "killall cleared")

        lost = page.evaluate(
            """() => {
              __bridge.start();
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
              __bridge.start();
              __bridge.debugWin();
              __bridge.step(1);
              const raw = localStorage.getItem('bober_bridge_v1');
              return {
                mode: __bridge.mode(),
                title: document.getElementById('result-title').textContent,
                earn: document.getElementById('result-earn').textContent,
                next: document.getElementById('btn-next').textContent,
                stars: document.querySelectorAll('#stars i.on').length,
                save: raw
              };
            }"""
        )
        print("win", won)
        check(won["mode"] == "win" and won["title"] == "BRIDGE HELD!", "win title")
        check("324" in won["earn"], "earned 324")
        check(won["stars"] == 3, "3 stars")
        check("Level 1-2 coming soon" in won["next"], "next label")
        saved = json.loads(won["save"])
        check(saved["bober"] == 324 and saved["v"] == 1, "save shape")
        page.screenshot(path=str(OUT / "bbr-phone-win.png"))
        page.reload(wait_until="domcontentloaded")
        page.wait_for_function("window.__bridge && window.__bridge.ready")
        kept = page.evaluate("() => document.getElementById('bober-total').textContent")
        print("reload", kept)
        check(kept.strip() == "$BOBER 324", "currency survives reload")

        bot = page.evaluate(
            """() => {
              __bridge.hold(true);
              __bridge.start();
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
        check(bot[-1]["end"] == "win", "bot held the bridge")

        desk = browser.new_page(viewport={"width": 1440, "height": 900}, device_scale_factor=1)
        desk.on("pageerror", lambda err: errors.append("desk " + str(err)))
        desk.on("console", lambda msg: note_console(errors, msg))
        desk.goto(URL, wait_until="domcontentloaded")
        desk.wait_for_function("window.__bridge && window.__bridge.ready")
        desk.locator("#btn-start").click()
        desk.wait_for_function("window.__bridge.mode() === 'run'")
        desk.evaluate("() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))")
        desk.screenshot(path=str(OUT / "bbr-desk-run.png"))
        dfill = canvas_fill(desk)
        print("desk fill", dfill)
        check(dfill["dx"] <= 1 and dfill["dy"] <= 1, "desk canvas fills")
        dbad = overlaps(rects(desk))
        print("desk overlap", dbad)
        check(not dbad, "desk hud overlap " + ",".join(dbad))
        body = desk.inner_text("body").lower()
        needles = ("zom" + "bie", "wal" + "let", "meta" + "mask", "last" + " z")
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
