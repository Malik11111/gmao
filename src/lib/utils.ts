import { Location, Prisma } from "@prisma/client";
import clsx, { ClassValue } from "clsx";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export function cn(...values: ClassValue[]) {
  return clsx(values);
}

export function formatDate(value?: Date | string | null) {
  if (!value) {
    return "Non renseignee";
  }

  return format(new Date(value), "dd MMM yyyy", { locale: fr });
}

export function formatDateTime(value?: Date | string | null) {
  if (!value) {
    return "Non renseignee";
  }

  return format(new Date(value), "dd MMM yyyy 'a' HH:mm", { locale: fr });
}

export function formatLocation(location?: Location | null) {
  if (!location) {
    return "Localisation non renseignee";
  }

  return [location.building, location.floor, location.room].filter(Boolean).join(" - ");
}

export function readStringArray(value: Prisma.JsonValue | null | undefined) {
  if (!value || !Array.isArray(value)) {
    return [];
  }

  return value.filter((entry): entry is string => typeof entry === "string");
}
