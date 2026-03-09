import { Component, createResource, createSignal, For, Show } from "solid-js";
import { petsApi } from "../api/pets";
import PetCard from "../components/PetCard";
import Modal from "../components/Modal";
import type { Pet } from "../types";

const Pets: Component = () => {
  const [pets, { refetch }] = createResource(() => petsApi.list());
  const [showCreate, setShowCreate] = createSignal(false);
  const [deleteTarget, setDeleteTarget] = createSignal<Pet | null>(null);
  const [deleting, setDeleting] = createSignal(false);

  const handleDelete = async () => {
    const pet = deleteTarget();
    if (!pet) return;
    setDeleting(true);
    try {
      await petsApi.delete(pet.id);
      setDeleteTarget(null);
      refetch();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">My Pets</h1>
          <p class="text-gray-500 text-sm mt-0.5">Manage your pets' profiles</p>
        </div>
        <button class="btn-primary" onClick={() => setShowCreate(true)}>
          + Add Pet
        </button>
      </div>

      <Show when={!pets.loading} fallback={<Loading />}>
        <Show
          when={(pets()?.length ?? 0) > 0}
          fallback={
            <div class="card text-center py-16">
              <div class="text-6xl mb-4">🐾</div>
              <h3 class="font-semibold text-gray-900 text-lg">No pets yet</h3>
              <p class="text-gray-400 mt-1">Add your first pet to get started</p>
              <button class="btn-primary mt-4" onClick={() => setShowCreate(true)}>
                Add Your First Pet
              </button>
            </div>
          }
        >
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <For each={pets()}>
              {(pet) => (
                <PetCard
                  pet={pet}
                  onDelete={(p) => setDeleteTarget(p)}
                />
              )}
            </For>
          </div>
        </Show>
      </Show>

      {/* Create Pet Modal */}
      <Modal
        open={showCreate()}
        onClose={() => setShowCreate(false)}
        title="Add New Pet"
        size="lg"
      >
        <CreatePetForm
          onSuccess={() => {
            setShowCreate(false);
            refetch();
          }}
          onCancel={() => setShowCreate(false)}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={!!deleteTarget()}
        onClose={() => setDeleteTarget(null)}
        title="Delete Pet"
        size="sm"
      >
        <p class="text-gray-600">
          Are you sure you want to delete <strong>{deleteTarget()?.name}</strong>? This
          will permanently remove all their records and notes.
        </p>
        <div class="flex gap-3 mt-6">
          <button class="btn-danger flex-1" onClick={handleDelete} disabled={deleting()}>
            {deleting() ? "Deleting..." : "Delete"}
          </button>
          <button class="btn-secondary flex-1" onClick={() => setDeleteTarget(null)}>
            Cancel
          </button>
        </div>
      </Modal>
    </div>
  );
};

interface CreatePetFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const CreatePetForm: Component<CreatePetFormProps> = (props) => {
  const [name, setName] = createSignal("");
  const [species, setSpecies] = createSignal("dog");
  const [breed, setBreed] = createSignal("");
  const [dob, setDob] = createSignal("");
  const [weight, setWeight] = createSignal("");
  const [gender, setGender] = createSignal("male");
  const [color, setColor] = createSignal("");
  const [microchip, setMicrochip] = createSignal("");
  const [notes, setNotes] = createSignal("");
  const [error, setError] = createSignal("");
  const [loading, setLoading] = createSignal(false);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await petsApi.create({
        name: name(),
        species: species(),
        breed: breed() || undefined,
        date_of_birth: dob() || undefined,
        weight_kg: weight() ? parseFloat(weight()) : undefined,
        gender: gender() || undefined,
        color: color() || undefined,
        microchip_id: microchip() || undefined,
        notes: notes() || undefined,
      });
      props.onSuccess();
    } catch (err: any) {
      setError(err.message ?? "Failed to create pet");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} class="space-y-4">
      {error() && (
        <div class="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
          {error()}
        </div>
      )}

      <div class="grid grid-cols-2 gap-4">
        <div class="col-span-2">
          <label class="label">Name *</label>
          <input class="input" type="text" placeholder="Buddy" value={name()} onInput={(e) => setName(e.currentTarget.value)} required />
        </div>

        <div>
          <label class="label">Species *</label>
          <select class="input" value={species()} onChange={(e) => setSpecies(e.currentTarget.value)}>
            <option value="dog">Dog</option>
            <option value="cat">Cat</option>
            <option value="bird">Bird</option>
            <option value="rabbit">Rabbit</option>
            <option value="fish">Fish</option>
            <option value="hamster">Hamster</option>
            <option value="reptile">Reptile</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label class="label">Breed</label>
          <input class="input" type="text" placeholder="Labrador" value={breed()} onInput={(e) => setBreed(e.currentTarget.value)} />
        </div>

        <div>
          <label class="label">Date of Birth</label>
          <input class="input" type="date" value={dob()} onInput={(e) => setDob(e.currentTarget.value)} />
        </div>

        <div>
          <label class="label">Weight (kg)</label>
          <input class="input" type="number" step="0.1" min="0" placeholder="10.5" value={weight()} onInput={(e) => setWeight(e.currentTarget.value)} />
        </div>

        <div>
          <label class="label">Gender</label>
          <select class="input" value={gender()} onChange={(e) => setGender(e.currentTarget.value)}>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>

        <div>
          <label class="label">Color</label>
          <input class="input" type="text" placeholder="Golden" value={color()} onInput={(e) => setColor(e.currentTarget.value)} />
        </div>

        <div class="col-span-2">
          <label class="label">Microchip ID</label>
          <input class="input" type="text" placeholder="985112345678901" value={microchip()} onInput={(e) => setMicrochip(e.currentTarget.value)} />
        </div>

        <div class="col-span-2">
          <label class="label">Notes</label>
          <textarea class="input" rows="2" placeholder="Any additional notes..." value={notes()} onInput={(e) => setNotes(e.currentTarget.value)} />
        </div>
      </div>

      <div class="flex gap-3 pt-2">
        <button type="submit" class="btn-primary flex-1" disabled={loading()}>
          {loading() ? "Adding..." : "Add Pet"}
        </button>
        <button type="button" class="btn-secondary flex-1" onClick={props.onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
};

const Loading: Component = () => (
  <div class="flex justify-center py-12">
    <div class="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

export default Pets;
