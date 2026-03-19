import {
  EquipmentStatus,
  RequestIssueType,
  RequestStatus,
  RequestUrgency,
  Role,
} from "@prisma/client";

export const roleLabels: Record<Role, string> = {
  USER: "Personnel",
  TECHNICIAN: "Technicien",
  MANAGER: "Responsable technique",
  ADMIN: "Administrateur",
};

export const equipmentStatusLabels: Record<EquipmentStatus, string> = {
  IN_SERVICE: "En service",
  OUT_OF_ORDER: "En panne",
  IN_REPAIR: "En reparation",
  OUT_OF_SERVICE: "Hors service",
  RETIRED: "Reforme",
};

export const requestIssueTypeLabels: Record<RequestIssueType, string> = {
  COMPLETE_FAILURE: "Panne complete",
  MALFUNCTION: "Dysfonctionnement",
  ABNORMAL_NOISE: "Bruit anormal",
  LEAK: "Fuite",
  BREAKAGE: "Casse / deterioration",
  OTHER: "Autre",
};

export const requestUrgencyLabels: Record<RequestUrgency, string> = {
  NORMAL: "Normale",
  URGENT: "Urgente",
  CRITICAL: "Tres urgente",
};

export const requestStatusLabels: Record<RequestStatus, string> = {
  NEW: "Nouvelle",
  ACKNOWLEDGED: "Prise en compte",
  WAITING: "En attente",
  IN_PROGRESS: "En cours",
  DONE: "Terminee",
  CLOSED: "Cloturee",
  REJECTED: "Rejetee",
};

export const equipmentStatusStyles: Record<EquipmentStatus, string> = {
  IN_SERVICE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  OUT_OF_ORDER: "bg-red-50 text-red-700 border-red-200",
  IN_REPAIR: "bg-amber-50 text-amber-700 border-amber-200",
  OUT_OF_SERVICE: "bg-gray-100 text-gray-600 border-gray-200",
  RETIRED: "bg-gray-100 text-gray-500 border-gray-200",
};

export const requestStatusStyles: Record<RequestStatus, string> = {
  NEW: "bg-blue-50 text-blue-700 border-blue-200",
  ACKNOWLEDGED: "bg-indigo-50 text-indigo-700 border-indigo-200",
  WAITING: "bg-amber-50 text-amber-700 border-amber-200",
  IN_PROGRESS: "bg-orange-50 text-orange-700 border-orange-200",
  DONE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  CLOSED: "bg-gray-100 text-gray-600 border-gray-200",
  REJECTED: "bg-red-50 text-red-700 border-red-200",
};

export const requestUrgencyStyles: Record<RequestUrgency, string> = {
  NORMAL: "bg-gray-100 text-gray-600 border-gray-200",
  URGENT: "bg-amber-50 text-amber-700 border-amber-200",
  CRITICAL: "bg-red-50 text-red-700 border-red-200",
};

export const equipmentStatusOptions = Object.entries(equipmentStatusLabels).map(
  ([value, label]) => ({ value: value as EquipmentStatus, label }),
);

export const requestIssueTypeOptions = Object.entries(requestIssueTypeLabels).map(
  ([value, label]) => ({ value: value as RequestIssueType, label }),
);

export const requestUrgencyOptions = Object.entries(requestUrgencyLabels).map(
  ([value, label]) => ({ value: value as RequestUrgency, label }),
);

export const requestStatusOptions = Object.entries(requestStatusLabels).map(
  ([value, label]) => ({ value: value as RequestStatus, label }),
);
