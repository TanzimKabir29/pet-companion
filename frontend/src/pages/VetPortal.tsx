import { Component, createResource, createSignal, For, Show } from "solid-js";
import { A } from "@solidjs/router";
import { shopsApi } from "../api/shops";

const VetPortal: Component = () => {
  const [patients] = createResource(() => shopsApi.vetPatients());
  const [search, setSearch] = createSignal("");

  const filtered = () =>
    patients()?.filter(
      (p: any) =>
        p.name.toLowerCase().includes(search().toLowerCase()) ||
        p.owner_name.toLowerCase().includes(search().toLowerCase()) ||
        p.species.toLowerCase().includes(search().toLowerCase())
    );

  return (
    <div class="space-y-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">My Patients</h1>
        <p class="text-gray-500 text-sm mt-0.5">
          Pets with medical records you've created or are associated with
        </p>
      </div>

      <div class="relative">
        <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">🔍</span>
        <input
          class="input pl-9"
          type="text"
          placeholder="Search by patient name, species, or owner..."
          value={search()}
          onInput={(e) => setSearch(e.currentTarget.value)}
        />
      </div>

      <Show when={!patients.loading} fallback={<Loading />}>
        <Show
          when={(filtered()?.length ?? 0) > 0}
          fallback={
            <div class="card text-center py-16">
              <div class="text-6xl mb-4">🩺</div>
              <h3 class="font-semibold text-gray-900">No patients yet</h3>
              <p class="text-gray-400 text-sm mt-1">
                {search()
                  ? "No patients match your search"
                  : "Patients will appear here once you create medical records"}
              </p>
            </div>
          }
        >
          <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <For each={filtered()}>
              {(patient: any) => <PatientCard patient={patient} />}
            </For>
          </div>
        </Show>
      </Show>
    </div>
  );
};

const PatientCard: Component<{ patient: any }> = (props) => {
  const p = props.patient;
  return (
    <div class="card hover:shadow-md transition-shadow">
      <div class="flex items-start gap-3">
        {p.photo_url ? (
          <img
            src={p.photo_url}
            alt={p.name}
            class="w-14 h-14 rounded-full object-cover border-2 border-gray-200 flex-shrink-0"
          />
        ) : (
          <div class="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-3xl flex-shrink-0">
            🐾
          </div>
        )}
        <div class="flex-1">
          <h3 class="font-semibold text-gray-900">{p.name}</h3>
          <p class="text-sm text-gray-500 capitalize">
            {p.species}{p.breed ? ` · ${p.breed}` : ""}
          </p>
          <p class="text-xs text-gray-400 mt-1">
            Owner: {p.owner_name} · {p.owner_email}
          </p>
        </div>
      </div>
      <div class="mt-4">
        <A href={`/vet/patients/${p.id}`} class="btn-primary text-sm w-full justify-center">
          View Patient
        </A>
      </div>
    </div>
  );
};

const Loading: Component = () => (
  <div class="flex justify-center py-12">
    <div class="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

export default VetPortal;
