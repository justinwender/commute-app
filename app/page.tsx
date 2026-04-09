"use client";

import { useState, useEffect, useCallback } from "react";
import { DATA, type Origin, type Weather, type Route, type DotColor } from "./data";
import type { ConditionsResponse, LineCondition } from "./types";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

function Dots({ count, color }: { count: number; color: DotColor }) {
  return (
    <div className="dots">
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className={`dot${i < count ? ` on-${color}` : ""}`} />
      ))}
    </div>
  );
}

function RouteCard({
  route,
  liveConditions,
}: {
  route: Route;
  liveConditions: Record<string, LineCondition> | null;
}) {
  const badgeClass =
    route.badge === "best" ? "badge-best" : route.badge === "ok" ? "badge-ok" : "badge-bad";
  const badgeText =
    route.badge === "best" ? "recommended" : route.badge === "ok" ? "viable" : "avoid";

  const factors = { ...route.factors };

  // Merge live conditions for relevant lines
  if (liveConditions) {
    const lines = extractLines(route.name);
    const primaryLine = lines[0];
    const cond = primaryLine ? liveConditions[primaryLine] : null;

    if (cond) {
      if (factors["Reliability"]) {
        factors["Reliability"] = {
          ...factors["Reliability"],
          dots: cond.reliabilityDots,
          color: cond.reliabilityColor,
        };
      }
      if (factors["Crowding"]) {
        factors["Crowding"] = {
          ...factors["Crowding"],
          dots: cond.crowdingDots,
          color: cond.crowdingColor,
        };
      }
      if (cond.estTimeDelta && factors["Est. time"]) {
        factors["Est. time"] = {
          ...factors["Est. time"],
          val: `${factors["Est. time"].val} ${cond.estTimeDelta}`,
          color: cond.estTimeDelta.includes("suspended") ? "red" as DotColor : "amber" as DotColor,
        };
      }
    }
  }

  return (
    <div className={`route-card${route.badge === "best" ? " best" : ""}`}>
      <div className="route-header">
        <div>
          <div className="route-name">
            <span className="rank">{route.rank}.</span>
            {route.name}
          </div>
          <div className="route-desc">{route.desc}</div>
        </div>
        <span className={`badge ${badgeClass}`}>{badgeText}</span>
      </div>
      <div className="factors">
        {Object.entries(factors).map(([key, factor]) => (
          <div key={key} className="factor">
            <div className="factor-label">{key}</div>
            <div
              className="factor-val"
              style={
                factor.dots === null && factor.val.includes("+ delays")
                  ? { color: "var(--color-text-warning)" }
                  : factor.dots === null && factor.val.includes("suspended")
                  ? { color: "var(--color-text-danger)" }
                  : undefined
              }
            >
              {factor.val}
            </div>
            {factor.dots != null && <Dots count={factor.dots} color={factor.color} />}
          </div>
        ))}
      </div>
      {route.note && (
        <>
          <div className="divider" />
          <div className="note">{route.note}</div>
        </>
      )}
    </div>
  );
}

function extractLines(routeName: string): string[] {
  const lines: string[] = [];
  const linePatterns = ["7", "E", "C", "R", "W", "B", "D", "F", "M"];
  for (const l of linePatterns) {
    if (routeName.includes(l)) lines.push(l);
  }
  return lines;
}

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray.buffer as ArrayBuffer;
}

export default function Home() {
  const [origin, setOrigin] = useState<Origin>("hy");
  const [weather, setWeather] = useState<Weather>("good");
  const [conditions, setConditions] = useState<ConditionsResponse | null>(null);
  const [showPushPrompt, setShowPushPrompt] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);

  const fetchConditions = useCallback(async () => {
    try {
      const res = await fetch("/api/alerts");
      if (!res.ok) return;
      const data: ConditionsResponse = await res.json();
      const updatedAt = new Date(data.updatedAt).getTime();
      const thirtyMinAgo = Date.now() - 30 * 60 * 1000;
      if (updatedAt < thirtyMinAgo) {
        setConditions(null);
        return;
      }
      setConditions(data);
    } catch {
      // Silently fall back to static values
    }
  }, []);

  useEffect(() => {
    fetchConditions();
    const interval = setInterval(fetchConditions, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchConditions]);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

    navigator.serviceWorker.register("/sw.js").then(() => {
      if (Notification.permission === "granted") {
        setPushEnabled(true);
        resubscribeSilently();
      } else if (Notification.permission === "default") {
        const timer = setTimeout(() => setShowPushPrompt(true), 3000);
        return () => clearTimeout(timer);
      }
    });
  }, []);

  async function resubscribeSilently() {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
      await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });
    } catch {
      // Silent re-subscribe failure is ok
    }
  }

  async function enablePush() {
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setShowPushPrompt(false);
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
      await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });
      setPushEnabled(true);
      setShowPushPrompt(false);
    } catch {
      setShowPushPrompt(false);
    }
  }

  const routes = DATA[origin][weather];

  return (
    <>
      <h1>Commute route comparison</h1>
      <p className="subtitle">
        Hudson Yards (34th St) or Port Authority → 594 Broadway, SoHo
      </p>

      {conditions?.banner && conditions.banner.length > 0 && (
        <div className="alert-banner">
          {"⚠ "}
          {conditions.banner.map((a, i) => (
            <span key={i}>
              {a.line} train: {a.description}
              {i < conditions.banner!.length - 1 ? " · " : ""}
            </span>
          ))}
          {" "}
          <a href="https://new.mta.info/" target="_blank" rel="noopener noreferrer">
            MTA status →
          </a>
        </div>
      )}

      {showPushPrompt && !pushEnabled && (
        <div className="push-prompt">
          <span>Enable alerts for delays on your routes</span>
          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            <button onClick={enablePush}>Enable</button>
            <button className="dismiss" onClick={() => setShowPushPrompt(false)}>
              ✕
            </button>
          </div>
        </div>
      )}

      <p className="section-label">Starting point</p>
      <div className="origin-tabs">
        <div
          className={`tab${origin === "hy" ? " active" : ""}`}
          onClick={() => setOrigin("hy")}
        >
          Hudson Yards (34th St)
        </div>
        <div
          className={`tab${origin === "pa" ? " active" : ""}`}
          onClick={() => setOrigin("pa")}
        >
          Port Authority
        </div>
      </div>

      <p className="section-label">Weather</p>
      <div className="weather-toggle">
        <div
          className={`wtab${weather === "good" ? " active" : ""}`}
          onClick={() => setWeather("good")}
        >
          Good weather
        </div>
        <div
          className={`wtab${weather === "bad" ? " active" : ""}`}
          onClick={() => setWeather("bad")}
        >
          Bad weather
        </div>
      </div>

      <div>
        {routes.map((route, i) => (
          <RouteCard
            key={`${origin}-${weather}-${i}`}
            route={route}
            liveConditions={conditions?.conditions || null}
          />
        ))}
      </div>

      {conditions?.updatedAt && (
        <p className="updated-at">
          Live data updated {new Date(conditions.updatedAt).toLocaleTimeString()}
        </p>
      )}
    </>
  );
}
