// src/components/HeaderTelemetry.tsx
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { useAppContext } from "../app/AppContext";
import { supabase } from "../lib/supabase";
import {
  LayeredAvatarSVG,
  SikkaCoinIcon,
  UrjaOrbitIcon,
} from "./VectorAssets";

type Telemetry = {
  urja: number;
  sikka: number;
  streak: number;
};

type ProfileTelemetryRow = {
  urja: number | null;
  sikka: number | null;
  streak: number | null;
};

const EMPTY_TELEMETRY: Telemetry = {
  urja: 0,
  sikka: 0,
  streak: 0,
};

function toCount(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.floor(value))
    : 0;
}

function formatCount(value: number): string {
  return new Intl.NumberFormat().format(value);
}

export function HeaderTelemetry() {
  const { user, authStatus } = useAppContext();
  const [telemetry, setTelemetry] = useState<Telemetry>(EMPTY_TELEMETRY);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadTelemetry = useCallback(async () => {
    if (!user?.id || authStatus !== "verified") {
      setTelemetry(EMPTY_TELEMETRY);
      setLoadError(null);
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("urja, sikka, streak")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      setLoadError("Telemetry is temporarily unavailable.");
      return;
    }

    const row = data as ProfileTelemetryRow | null;
    setTelemetry({
      urja: toCount(row?.urja),
      sikka: toCount(row?.sikka),
      streak: toCount(row?.streak),
    });
    setLoadError(null);
  }, [authStatus, user?.id]);

  useEffect(() => {
    if (!user?.id || authStatus !== "verified") {
      setTelemetry(EMPTY_TELEMETRY);
      setLoadError(null);
      return;
    }

    let active = true;

    const refresh = async () => {
      if (active) await loadTelemetry();
    };

    void refresh();

    const channel = supabase
      .channel(`profile-telemetry-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${user.id}`,
        },
        () => {
          void refresh();
        },
      )
      .subscribe();

    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [authStatus, loadTelemetry, user?.id]);

  if (authStatus !== "verified" || !user) {
    return null;
  }

  return (
    <header className="header-telemetry" aria-label="StudyMitra status">
      <div className="header-telemetry__stats">
        <div
          className="header-telemetry__stat"
          aria-label={`Urja: ${formatCount(telemetry.urja)} experience points`}
          title="Urja"
        >
          <UrjaOrbitIcon
            className="header-telemetry__icon"
            aria-hidden="true"
            focusable="false"
          />
          <span aria-hidden="true">{formatCount(telemetry.urja)}</span>
        </div>

        <div
          className="header-telemetry__stat"
          aria-label={`Sikka: ${formatCount(telemetry.sikka)} coins`}
          title="Sikka"
        >
          <SikkaCoinIcon
            className="header-telemetry__icon"
            aria-hidden="true"
            focusable="false"
          />
          <span aria-hidden="true">{formatCount(telemetry.sikka)}</span>
        </div>

        <div
          className="header-telemetry__stat"
          aria-label={`Learning streak: ${formatCount(telemetry.streak)} days`}
          title="Learning streak"
        >
          <span
            className="header-telemetry__flame"
            aria-hidden="true"
          />
          <span aria-hidden="true">{formatCount(telemetry.streak)}</span>
        </div>
      </div>

      <Link
        className="header-telemetry__profile"
        to="/profile"
        aria-label="Open profile"
      >
        <LayeredAvatarSVG
          className="header-telemetry__avatar"
          label=""
          aria-hidden="true"
          focusable="false"
        />
      </Link>

      {loadError && (
        <span className="header-telemetry__sr-only" role="status">
          {loadError}
        </span>
      )}
    </header>
  );
}
