import { UserStatus } from "@/lib/types";

const MAL_STATUS_MAP: Record<string, UserStatus> = {
  Watching: "WATCHING",
  Reading: "WATCHING",
  Completed: "COMPLETED",
  "On Hold": "DROPPED",
  Dropped: "DROPPED",
  "Plan to Watch": "PLANTOWATCH",
  "Plan to Read": "PLANTOWATCH",
};

export function mapMalStatus(malStatus: string): UserStatus {
  return MAL_STATUS_MAP[malStatus] ?? "PLANTOWATCH";
}
