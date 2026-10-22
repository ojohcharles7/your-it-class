import { createSupabaseAdminClient } from "./supabase/admin";
import { isSupabaseAdminConfigured } from "./env";

export const EXAM_GRACE_SECONDS = 20;

type SessionRow = { id: string; started_at: string };

function secondsLeft(startedAt: string, timeLimitMin: number) {
  const deadline = new Date(startedAt).getTime() + timeLimitMin * 60_000;
  return Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
}

async function findSession(userId: string, examId: string) {
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from("exam_sessions")
    .select("id, started_at")
    .eq("user_id", userId)
    .eq("exam_id", examId)
    .maybeSingle();
  return (data as SessionRow | null) ?? null;
}

export async function getOrCreateExamSession(userId: string, examId: string, timeLimitMin: number) {
  if (!isSupabaseAdminConfigured) return null;

  const admin = createSupabaseAdminClient();
  let session = await findSession(userId, examId);

  if (session && secondsLeft(session.started_at, timeLimitMin) <= 0) {
    const { data } = await admin
      .from("exam_sessions")
      .update({ started_at: new Date().toISOString() })
      .eq("id", session.id)
      .select("id, started_at")
      .maybeSingle();
    session = (data as SessionRow | null) ?? session;
  }

  if (!session) {
    const { data, error } = await admin
      .from("exam_sessions")
      .insert({ user_id: userId, exam_id: examId })
      .select("id, started_at")
      .maybeSingle();

    session = (data as SessionRow | null) ?? null;

    if (error && !session) {
      session = await findSession(userId, examId);
    }
  }

  if (!session) return null;

  return {
    id: session.id,
    startedAt: session.started_at,
    secondsRemaining: secondsLeft(session.started_at, timeLimitMin),
  };
}

export async function validateExamSession(
  userId: string,
  examId: string,
  sessionId: string,
  timeLimitMin: number,
): Promise<"ok" | "missing" | "expired"> {
  if (!isSupabaseAdminConfigured) return "missing";

  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from("exam_sessions")
    .select("id, started_at")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .eq("exam_id", examId)
    .maybeSingle();

  if (!data) return "missing";

  const elapsedSeconds = (Date.now() - new Date(data.started_at as string).getTime()) / 1000;
  if (elapsedSeconds > timeLimitMin * 60 + EXAM_GRACE_SECONDS) {
    await admin.from("exam_sessions").delete().eq("id", sessionId);
    return "expired";
  }

  return "ok";
}

export async function clearExamSession(userId: string, examId: string) {
  if (!isSupabaseAdminConfigured) return;
  const admin = createSupabaseAdminClient();
  await admin.from("exam_sessions").delete().eq("user_id", userId).eq("exam_id", examId);
}
