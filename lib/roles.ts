import type { Role } from "./types";

export const roleLabels: Record<Role, string> = {
  student: "Student",
  teacher: "Instructor",
  admin: "Admin",
  super_admin: "Super admin",
};

export const roleDescriptions: Record<Role, string> = {
  student: "Can browse courses, enrol and learn.",
  teacher: "Can create and manage their own courses, view learners and request payouts.",
  admin: "Can manage courses, students, payments and certificates.",
  super_admin: "Full access, including assigning teacher and admin roles.",
};

export function isAdminRole(role: Role) {
  return role === "admin" || role === "super_admin";
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
  { value: "super_admin", label: "Super admin", description: roleDescriptions.super_admin },
  { value: "student", label: "Remove staff access", description: roleDescriptions.student },
];
