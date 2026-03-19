import { EquipmentStatus, RequestStatus, RequestUrgency } from "@prisma/client";
import {
  equipmentStatusLabels,
  equipmentStatusStyles,
  requestStatusLabels,
  requestStatusStyles,
  requestUrgencyLabels,
  requestUrgencyStyles,
} from "@/lib/labels";

type BadgeProps =
  | { kind: "equipment"; value: EquipmentStatus }
  | { kind: "request"; value: RequestStatus }
  | { kind: "urgency"; value: RequestUrgency };

export function StatusBadge(props: BadgeProps) {
  let label: string;
  let style: string;

  if (props.kind === "equipment") {
    label = equipmentStatusLabels[props.value];
    style = equipmentStatusStyles[props.value];
  } else if (props.kind === "request") {
    label = requestStatusLabels[props.value];
    style = requestStatusStyles[props.value];
  } else {
    label = requestUrgencyLabels[props.value];
    style = requestUrgencyStyles[props.value];
  }

  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold ${style}`}>
      {label}
    </span>
  );
}
