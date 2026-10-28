import type { Role } from "./types";

export const roleLabels: Record<Role, string> = {
  student: "Student",
  teacher: "Instructor",
  admin: "Admin",
  master: "Master user",
};

export const roleDescriptions: Record<Role, string> = {
  student: "Can browse courses, enrol and learn.",
  teacher: "Can create and manage their own courses, view learners and request payouts.",
  admin: "Full access to courses, students, payments and certificates.",
  master: "Full access, including assigning staff roles and managing master users.",
};

export function isAdminRole(role: Role) {
  return role === "admin" || role === "master";
}

export function isTeacherRole(role: Role) {
  return role === "teacher";
}

export function isStaffRole(role: Role) {
  return isAdminRole(role) || isTeacherRole(role);
}

export function roleLabel(role: Role) {
  return roleLabels[role] ?? role;
}

export const adminRoleOptions: { value: Role; label: string; description: string }[] = [
  { value: "teacher", label: "Instructor", description: roleDescriptions.teacher },
  { value: "admin", label: "Admin", description: roleDescriptions.admin },
  { value: "master", label: "Master user", description: roleDescriptions.master },
  { value: "student", label: "Remove staff access", description: roleDescriptions.student },
];
