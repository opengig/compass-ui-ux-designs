import type { AppUser } from "@/lib/types";

export const USERS: AppUser[] = [
  {
    id: "user-001",
    name: "Aman Verma",
    email: "aman.verma@compass.in",
    role: "admin",
    siteIds: [], // empty = access to all sites
    isActive: true,
  },
  {
    id: "user-002",
    name: "Priya Sharma",
    email: "priya.sharma@compass.in",
    role: "mapper",
    siteIds: ["site-hyd-hi"],
    isActive: true,
  },
  {
    id: "user-003",
    name: "Vikram Desai",
    email: "vikram.desai@compass.in",
    role: "mapper",
    siteIds: ["site-hyd-hi", "site-blr-wf"],
    isActive: true,
  },
  {
    id: "user-004",
    name: "Sneha Iyer",
    email: "sneha.iyer@compass.in",
    role: "mapper",
    siteIds: ["site-noida-83"],
    isActive: false,
  },
];
