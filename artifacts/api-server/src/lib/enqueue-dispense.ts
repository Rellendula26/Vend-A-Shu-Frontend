import { getSupabaseAdmin } from "./supabase-admin";
import type { SupabaseDispenseAction } from "./hardware-mapping";

export const DEFAULT_DEVICE_ID = "vend-a-shoe-001";

const ACTIVE_COMMAND_STATUSES = ["pending", "running"] as const;

export function getDeviceId(): string {
  return process.env.DEVICE_ID ?? DEFAULT_DEVICE_ID;
}

export function isHardwareDryRun(): boolean {
  return process.env.HARDWARE_DRY_RUN === "true";
}

export type EnqueueDispenseResult =
  | { ok: true; commandId: string; dryRun?: boolean }
  | { ok: false; reason: "drawer_busy" }
  | { ok: false; reason: "queue_unavailable"; error: unknown };

export async function enqueueDispenseCommand(
  action: SupabaseDispenseAction,
): Promise<EnqueueDispenseResult> {
  if (isHardwareDryRun()) {
    return { ok: true, commandId: "dry-run", dryRun: true };
  }

  const deviceId = getDeviceId();

  try {
    const supabase = getSupabaseAdmin();

    const { data: existing, error: queryError } = await supabase
      .from("device_commands")
      .select("id")
      .eq("device_id", deviceId)
      .eq("action", action)
      .in("status", [...ACTIVE_COMMAND_STATUSES])
      .limit(1);

    if (queryError) {
      return { ok: false, reason: "queue_unavailable", error: queryError };
    }

    if (existing && existing.length > 0) {
      return { ok: false, reason: "drawer_busy" };
    }

    const { data: inserted, error: insertError } = await supabase
      .from("device_commands")
      .insert({
        device_id: deviceId,
        action,
        status: "pending",
      })
      .select("id")
      .single();

    if (insertError || !inserted?.id) {
      return {
        ok: false,
        reason: "queue_unavailable",
        error: insertError ?? new Error("Insert succeeded but no command id returned"),
      };
    }

    return { ok: true, commandId: inserted.id as string };
  } catch (error) {
    return { ok: false, reason: "queue_unavailable", error };
  }
}
