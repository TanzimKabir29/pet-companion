import { Component } from "solid-js";
import { A } from "@solidjs/router";
import type { MedicalRecord } from "../types";

interface RecordCardProps {
  record: MedicalRecord;
  petId: string;
  onDelete?: (record: MedicalRecord) => void;
}

const RecordCard: Component<RecordCardProps> = (props) => {
  const formattedDate = () =>
    new Date(props.record.record_date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  return (
    <div class="card hover:shadow-md transition-shadow">
      <div class="flex items-start justify-between gap-4">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 flex-wrap mb-1">
            <span class={`badge ${props.record.record_source === "in_app" ? "badge-blue" : "badge-purple"}`}>
              {props.record.record_source === "in_app" ? "In-App" : "Photo Upload"}
            </span>
            <time class="text-xs text-gray-400">{formattedDate()}</time>
          </div>

          <h3 class="font-semibold text-gray-900 mt-1">{props.record.title}</h3>

          {props.record.vet_name && (
            <p class="text-sm text-gray-500 mt-0.5">
              Dr. {props.record.vet_name}
            </p>
          )}

          {props.record.diagnosis && (
            <p class="text-sm text-gray-600 mt-2 line-clamp-2">
              <span class="font-medium">Diagnosis:</span> {props.record.diagnosis}
            </p>
          )}

          {(props.record.photo_urls as string[])?.length > 0 && (
            <p class="text-xs text-gray-400 mt-2">
              📎 {(props.record.photo_urls as string[]).length} photo(s) attached
            </p>
          )}
        </div>
      </div>

      <div class="mt-4 flex items-center gap-2">
        <A
          href={`/pets/${props.petId}/records/${props.record.id}`}
          class="btn-primary text-xs px-3 py-1.5"
        >
          View Record
        </A>
        {props.onDelete && (
          <button
            onClick={() => props.onDelete!(props.record)}
            class="btn-secondary text-xs px-3 py-1.5"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
};

export default RecordCard;
