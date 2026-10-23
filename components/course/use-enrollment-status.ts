"use client";

import { useEffect, useState } from "react";

type EnrollmentStatus = {
  authenticated: boolean;
  enrolled: boolean;
};

const EMPTY: EnrollmentStatus = { authenticated: false, enrolled: false };
const cache = new Map<string, Promise<EnrollmentStatus>>();

function loadStatus(courseId: string): Promise<EnrollmentStatus> {
  const cached = cache.get(courseId);
  if (cached) return cached;

  const request = fetch(`/api/enrollment-status?courseId=${encodeURIComponent(courseId)}`, {
    cache: "no-store",
  })
    .then((response) => (response.ok ? (response.json() as Promise<EnrollmentStatus>) : EMPTY))
    .catch(() => EMPTY);

  cache.set(courseId, request);
  return request;
}

export function useEnrollmentStatus(courseId: string) {
  const [status, setStatus] = useState<EnrollmentStatus>(EMPTY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    loadStatus(courseId).then((value) => {
      if (!active) return;
      setStatus(value);
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [courseId]);

  return { ...status, loading };
}
