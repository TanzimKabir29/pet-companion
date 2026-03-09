import { Component } from "solid-js";
import { A } from "@solidjs/router";
import type { Pet } from "../types";

interface PetCardProps {
  pet: Pet;
  onDelete?: (pet: Pet) => void;
}

const speciesEmoji: Record<string, string> = {
  dog: "🐶",
  cat: "🐱",
  bird: "🐦",
  rabbit: "🐰",
  fish: "🐟",
  hamster: "🐹",
  reptile: "🦎",
};

function getSpeciesEmoji(species: string) {
  return speciesEmoji[species.toLowerCase()] ?? "🐾";
}

const PetCard: Component<PetCardProps> = (props) => {
  const age = () => {
    if (!props.pet.date_of_birth) return null;
    const dob = new Date(props.pet.date_of_birth);
    const now = new Date();
    const years = now.getFullYear() - dob.getFullYear();
    const months = now.getMonth() - dob.getMonth();
    if (years === 0) return `${months} mo`;
    if (months < 0) return `${years - 1} yr`;
    return `${years} yr`;
  };

  return (
    <div class="card hover:shadow-md transition-shadow group">
      <div class="flex items-start gap-4">
        {/* Avatar */}
        <div class="flex-shrink-0">
          {props.pet.photo_url ? (
            <img
              src={props.pet.photo_url}
              alt={props.pet.name}
              class="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
            />
          ) : (
            <div class="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-3xl border-2 border-gray-200">
              {getSpeciesEmoji(props.pet.species)}
            </div>
          )}
        </div>

        {/* Info */}
        <div class="flex-1 min-w-0">
          <div class="flex items-start justify-between">
            <div>
              <h3 class="font-semibold text-gray-900 text-lg">{props.pet.name}</h3>
              <p class="text-sm text-gray-500 capitalize">
                {props.pet.species}
                {props.pet.breed ? ` · ${props.pet.breed}` : ""}
                {age() ? ` · ${age()}` : ""}
              </p>
            </div>
          </div>

          <div class="mt-3 flex items-center gap-2 flex-wrap">
            {props.pet.gender && (
              <span class="badge badge-blue capitalize">{props.pet.gender}</span>
            )}
            {props.pet.weight_kg && (
              <span class="badge badge-green">{props.pet.weight_kg} kg</span>
            )}
            {props.pet.color && (
              <span class="badge badge-yellow capitalize">{props.pet.color}</span>
            )}
          </div>

          <div class="mt-4 flex items-center gap-2">
            <A href={`/pets/${props.pet.id}`} class="btn-primary text-xs px-3 py-1.5">
              View Details
            </A>
            {props.onDelete && (
              <button
                onClick={() => props.onDelete!(props.pet)}
                class="btn-secondary text-xs px-3 py-1.5"
              >
                Delete
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PetCard;
