import {
  Component,
  createResource,
  createSignal,
  For,
  Match,
  Show,
  Switch,
} from "solid-js";
import { useParams, useNavigate, A } from "@solidjs/router";
import { petsApi } from "../api/pets";
import { recordsApi } from "../api/records";
import { notesApi } from "../api/notes";
import { useAuth } from "../stores/auth";
import RecordCard from "../components/RecordCard";
import Modal from "../components/Modal";
import type { AnalyzedMedicalRecord, MedicalRecord, WellbeingNote } from "../types";

type Tab = "records" | "notes" | "info";

const PetDetail: Component = () => {
  const params = useParams<{ petId: string }>();
  const navigate = useNavigate();
  const { state } = useAuth();
  const [tab, setTab] = createSignal<Tab>("records");

  const [pet, { refetch: refetchPet }] = createResource(() => petsApi.get(params.petId));
  const [records, { refetch: refetchRecords }] = createResource(() =>
    recordsApi.list(params.petId)
  );
  const [notes, { refetch: refetchNotes }] = createResource(() =>
    notesApi.list(params.petId)
  );

  const [showAddRecord, setShowAddRecord] = createSignal(false);
  const [showAddNote, setShowAddNote] = createSignal(false);
  const [showAnalyze, setShowAnalyze] = createSignal(false);
  const [showEditPet, setShowEditPet] = createSignal(false);
  const [deleteRecord, setDeleteRecord] = createSignal<MedicalRecord | null>(null);

  const handleDeleteRecord = async () => {
    const r = deleteRecord();
    if (!r) return;
    await recordsApi.delete(params.petId, r.id);
    setDeleteRecord(null);
    refetchRecords();
  };

  const isOwner = () => state.user?.user_type === "owner";
  const isVet = () => state.user?.user_type === "vet";

  return (
    <Show when={!pet.loading} fallback={<Loading />}>
      <Show when={pet()} fallback={<p class="text-gray-500">Pet not found.</p>}>
        {(p) => (
          <div class="space-y-6">
            {/* Header */}
            <div class="flex items-start gap-5">
              <div class="flex-shrink-0">
                {p().photo_url ? (
                  <img
                    src={p().photo_url!}
                    alt={p().name}
                    class="w-24 h-24 rounded-2xl object-cover border-2 border-gray-200"
                  />
                ) : (
                  <div class="w-24 h-24 rounded-2xl bg-primary-100 flex items-center justify-center text-5xl border-2 border-gray-200">
                    🐾
                  </div>
                )}
              </div>
              <div class="flex-1">
                <div class="flex items-start justify-between">
                  <div>
                    <h1 class="text-2xl font-bold text-gray-900">{p().name}</h1>
                    <p class="text-gray-500 capitalize">
                      {p().species}{p().breed ? ` · ${p().breed}` : ""}
                      {p().gender ? ` · ${p().gender}` : ""}
                    </p>
                  </div>
                  <Show when={isOwner()}>
                    <button class="btn-secondary text-sm" onClick={() => setShowEditPet(true)}>
                      Edit
                    </button>
                  </Show>
                </div>
                <div class="flex gap-2 mt-3 flex-wrap">
                  {p().date_of_birth && (
                    <span class="badge badge-blue">DOB: {p().date_of_birth}</span>
                  )}
                  {p().weight_kg && (
                    <span class="badge badge-green">{String(p().weight_kg)} kg</span>
                  )}
                  {p().color && (
                    <span class="badge badge-yellow capitalize">{p().color}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div class="border-b border-gray-200">
              <nav class="-mb-px flex gap-6">
                <TabBtn active={tab() === "records"} onClick={() => setTab("records")}>
                  Medical Records
                </TabBtn>
                <Show when={isOwner() || isVet()}>
                  <TabBtn active={tab() === "notes"} onClick={() => setTab("notes")}>
                    Wellbeing Notes
                  </TabBtn>
                </Show>
                <TabBtn active={tab() === "info"} onClick={() => setTab("info")}>
                  Pet Info
                </TabBtn>
              </nav>
            </div>

            {/* Tab Content */}
            <Switch>
              <Match when={tab() === "records"}>
                <div class="space-y-4">
                  <div class="flex items-center justify-between">
                    <p class="text-sm text-gray-500">
                      {records()?.length ?? 0} record(s)
                    </p>
                    <div class="flex gap-2">
                      <Show when={isOwner()}>
                        <button
                          class="btn-secondary text-sm"
                          onClick={() => setShowAnalyze(true)}
                        >
                          📷 Analyze Photo
                        </button>
                      </Show>
                      <button
                        class="btn-primary text-sm"
                        onClick={() => setShowAddRecord(true)}
                      >
                        + Add Record
                      </button>
                    </div>
                  </div>

                  <Show when={!records.loading} fallback={<Loading />}>
                    <Show
                      when={(records()?.length ?? 0) > 0}
                      fallback={
                        <EmptyState
                          emoji="📋"
                          title="No medical records yet"
                          desc="Add the first medical record for this pet"
                        />
                      }
                    >
                      <div class="grid gap-4">
                        <For each={records()}>
                          {(record) => (
                            <RecordCard
                              record={record}
                              petId={params.petId}
                              onDelete={(r) => setDeleteRecord(r)}
                            />
                          )}
                        </For>
                      </div>
                    </Show>
                  </Show>
                </div>
              </Match>

              <Match when={tab() === "notes"}>
                <div class="space-y-4">
                  <div class="flex items-center justify-between">
                    <p class="text-sm text-gray-500">
                      {notes()?.length ?? 0} note(s)
                    </p>
                    <Show when={isOwner()}>
                      <button
                        class="btn-primary text-sm"
                        onClick={() => setShowAddNote(true)}
                      >
                        + Add Note
                      </button>
                    </Show>
                  </div>
                  <Show when={!notes.loading} fallback={<Loading />}>
                    <Show
                      when={(notes()?.length ?? 0) > 0}
                      fallback={
                        <EmptyState
                          emoji="📝"
                          title="No wellbeing notes yet"
                          desc="Track your pet's daily health and mood"
                        />
                      }
                    >
                      <div class="space-y-3">
                        <For each={notes()}>
                          {(note) => <NoteCard note={note} onDelete={() => {
                            notesApi.delete(params.petId, note.id).then(() => refetchNotes());
                          }} />}
                        </For>
                      </div>
                    </Show>
                  </Show>
                </div>
              </Match>

              <Match when={tab() === "info"}>
                <PetInfoTab pet={p()} />
              </Match>
            </Switch>
          </div>
        )}
      </Show>

      {/* Add Record Modal */}
      <Modal open={showAddRecord()} onClose={() => setShowAddRecord(false)} title="Add Medical Record" size="lg">
        <AddRecordForm
          petId={params.petId}
          onSuccess={() => { setShowAddRecord(false); refetchRecords(); }}
          onCancel={() => setShowAddRecord(false)}
        />
      </Modal>

      {/* Analyze Photo Modal */}
      <Modal open={showAnalyze()} onClose={() => setShowAnalyze(false)} title="Analyze Medical Record Photo" size="lg">
        <AnalyzePhotoForm
          petId={params.petId}
          onSuccess={() => { setShowAnalyze(false); refetchRecords(); }}
          onCancel={() => setShowAnalyze(false)}
        />
      </Modal>

      {/* Add Note Modal */}
      <Modal open={showAddNote()} onClose={() => setShowAddNote(false)} title="Add Wellbeing Note" size="md">
        <AddNoteForm
          petId={params.petId}
          onSuccess={() => { setShowAddNote(false); refetchNotes(); }}
          onCancel={() => setShowAddNote(false)}
        />
      </Modal>

      {/* Delete Record Confirmation */}
      <Modal open={!!deleteRecord()} onClose={() => setDeleteRecord(null)} title="Delete Record" size="sm">
        <p class="text-gray-600">Are you sure you want to delete this medical record? This cannot be undone.</p>
        <div class="flex gap-3 mt-6">
          <button class="btn-danger flex-1" onClick={handleDeleteRecord}>Delete</button>
          <button class="btn-secondary flex-1" onClick={() => setDeleteRecord(null)}>Cancel</button>
        </div>
      </Modal>
    </Show>
  );
};

const TabBtn: Component<{ active: boolean; onClick: () => void; children: any }> = (props) => (
  <button
    onClick={props.onClick}
    class={`pb-3 text-sm font-medium border-b-2 transition-colors ${
      props.active
        ? "border-primary-500 text-primary-600"
        : "border-transparent text-gray-500 hover:text-gray-700"
    }`}
  >
    {props.children}
  </button>
);

const PetInfoTab: Component<{ pet: any }> = (props) => {
  const fields = [
    { label: "Species", value: props.pet.species },
    { label: "Breed", value: props.pet.breed },
    { label: "Gender", value: props.pet.gender },
    { label: "Color", value: props.pet.color },
    { label: "Date of Birth", value: props.pet.date_of_birth },
    { label: "Weight", value: props.pet.weight_kg ? `${props.pet.weight_kg} kg` : undefined },
    { label: "Microchip ID", value: props.pet.microchip_id },
    { label: "Notes", value: props.pet.notes },
  ];

  return (
    <div class="card">
      <dl class="divide-y divide-gray-100">
        <For each={fields.filter((f) => f.value)}>
          {(field) => (
            <div class="py-3 grid grid-cols-3 gap-4">
              <dt class="text-sm font-medium text-gray-500">{field.label}</dt>
              <dd class="text-sm text-gray-900 col-span-2 capitalize">{field.value}</dd>
            </div>
          )}
        </For>
      </dl>
    </div>
  );
};

const NoteCard: Component<{ note: WellbeingNote; onDelete: () => void }> = (props) => (
  <div class="card">
    <div class="flex items-start justify-between">
      <div class="flex-1">
        <div class="flex gap-2 flex-wrap mb-2">
          {props.note.mood && <span class="badge badge-blue">😊 {props.note.mood}</span>}
          {props.note.energy_level && <span class="badge badge-green">⚡ {props.note.energy_level}</span>}
          {props.note.appetite && <span class="badge badge-yellow">🍖 {props.note.appetite}</span>}
        </div>
        <p class="text-gray-700 text-sm">{props.note.note}</p>
        <time class="text-xs text-gray-400 mt-2 block">
          {new Date(props.note.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
        </time>
      </div>
      <button onClick={props.onDelete} class="text-gray-400 hover:text-red-500 ml-4 text-lg">✕</button>
    </div>
  </div>
);

const AddRecordForm: Component<{ petId: string; onSuccess: () => void; onCancel: () => void }> = (props) => {
  const [title, setTitle] = createSignal("");
  const [date, setDate] = createSignal(new Date().toISOString().split("T")[0]);
  const [diagnosis, setDiagnosis] = createSignal("");
  const [treatment, setTreatment] = createSignal("");
  const [notes, setNotes] = createSignal("");
  const [vetName, setVetName] = createSignal("");
  const [rxName, setRxName] = createSignal("");
  const [rxDosage, setRxDosage] = createSignal("");
  const [rxFreq, setRxFreq] = createSignal("");
  const [rxDur, setRxDur] = createSignal("");
  const [prescriptions, setPrescriptions] = createSignal<any[]>([]);
  const [error, setError] = createSignal("");
  const [loading, setLoading] = createSignal(false);

  const addRx = () => {
    if (!rxName() || !rxDosage() || !rxFreq()) return;
    setPrescriptions([...prescriptions(), {
      medication_name: rxName(), dosage: rxDosage(), frequency: rxFreq(), duration: rxDur() || undefined,
    }]);
    setRxName(""); setRxDosage(""); setRxFreq(""); setRxDur("");
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await recordsApi.create(props.petId, {
        title: title(), record_date: date(), diagnosis: diagnosis() || undefined,
        treatment: treatment() || undefined, notes: notes() || undefined,
        vet_name: vetName() || undefined,
        prescriptions: prescriptions().length > 0 ? prescriptions() : undefined,
      });
      props.onSuccess();
    } catch (err: any) {
      setError(err.message ?? "Failed to add record");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} class="space-y-4">
      {error() && <div class="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">{error()}</div>}
      <div class="grid grid-cols-2 gap-4">
        <div class="col-span-2">
          <label class="label">Title *</label>
          <input class="input" type="text" placeholder="Annual checkup" value={title()} onInput={(e) => setTitle(e.currentTarget.value)} required />
        </div>
        <div>
          <label class="label">Record Date *</label>
          <input class="input" type="date" value={date()} onInput={(e) => setDate(e.currentTarget.value)} required />
        </div>
        <div>
          <label class="label">Veterinarian</label>
          <input class="input" type="text" placeholder="Dr. Smith" value={vetName()} onInput={(e) => setVetName(e.currentTarget.value)} />
        </div>
        <div class="col-span-2">
          <label class="label">Diagnosis</label>
          <textarea class="input" rows="2" placeholder="Diagnosis..." value={diagnosis()} onInput={(e) => setDiagnosis(e.currentTarget.value)} />
        </div>
        <div class="col-span-2">
          <label class="label">Treatment</label>
          <textarea class="input" rows="2" placeholder="Treatment plan..." value={treatment()} onInput={(e) => setTreatment(e.currentTarget.value)} />
        </div>
        <div class="col-span-2">
          <label class="label">Notes</label>
          <textarea class="input" rows="2" placeholder="Additional notes..." value={notes()} onInput={(e) => setNotes(e.currentTarget.value)} />
        </div>
      </div>

      {/* Prescriptions */}
      <div class="border border-gray-200 rounded-lg p-4 space-y-3">
        <h4 class="text-sm font-semibold text-gray-700">Prescriptions</h4>
        <For each={prescriptions()}>
          {(rx, i) => (
            <div class="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 text-sm">
              <span>{rx.medication_name} · {rx.dosage} · {rx.frequency}{rx.duration ? ` · ${rx.duration}` : ""}</span>
              <button type="button" onClick={() => setPrescriptions(prescriptions().filter((_, idx) => idx !== i()))} class="text-red-400 hover:text-red-600 ml-2">✕</button>
            </div>
          )}
        </For>
        <div class="grid grid-cols-2 gap-2">
          <input class="input col-span-2" type="text" placeholder="Medication name" value={rxName()} onInput={(e) => setRxName(e.currentTarget.value)} />
          <input class="input" type="text" placeholder="Dosage (e.g. 10mg)" value={rxDosage()} onInput={(e) => setRxDosage(e.currentTarget.value)} />
          <input class="input" type="text" placeholder="Frequency (e.g. 2x daily)" value={rxFreq()} onInput={(e) => setRxFreq(e.currentTarget.value)} />
          <input class="input col-span-2" type="text" placeholder="Duration (e.g. 7 days)" value={rxDur()} onInput={(e) => setRxDur(e.currentTarget.value)} />
          <button type="button" class="btn-secondary col-span-2 text-sm" onClick={addRx}>+ Add Prescription</button>
        </div>
      </div>

      <div class="flex gap-3 pt-2">
        <button type="submit" class="btn-primary flex-1" disabled={loading()}>{loading() ? "Saving..." : "Save Record"}</button>
        <button type="button" class="btn-secondary flex-1" onClick={props.onCancel}>Cancel</button>
      </div>
    </form>
  );
};

const AnalyzePhotoForm: Component<{ petId: string; onSuccess: () => void; onCancel: () => void }> = (props) => {
  const [file, setFile] = createSignal<File | null>(null);
  const [analyzed, setAnalyzed] = createSignal<AnalyzedMedicalRecord | null>(null);
  const [photoUrl, setPhotoUrl] = createSignal<string | null>(null);
  const [date, setDate] = createSignal(new Date().toISOString().split("T")[0]);
  const [analyzing, setAnalyzing] = createSignal(false);
  const [saving, setSaving] = createSignal(false);
  const [error, setError] = createSignal("");

  const handleAnalyze = async () => {
    if (!file()) return;
    setError(""); setAnalyzing(true);
    try {
      const res = await recordsApi.analyzePhoto(props.petId, file()!);
      setAnalyzed(res.analyzed);
      setPhotoUrl(res.photo_url);
      if (res.analyzed.record_date) setDate(res.analyzed.record_date);
    } catch (err: any) {
      setError(err.message ?? "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSave = async () => {
    const a = analyzed();
    if (!a) return;
    setSaving(true);
    try {
      const record = await recordsApi.create(props.petId, {
        title: a.title,
        diagnosis: a.diagnosis,
        treatment: a.treatment,
        notes: a.notes,
        record_date: date(),
        vet_name: a.vet_name,
        prescriptions: a.prescriptions,
      });
      if (photoUrl() && record.id) {
        // Photo is already saved; just attach the URL
      }
      props.onSuccess();
    } catch (err: any) {
      setError(err.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div class="space-y-4">
      {error() && <div class="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">{error()}</div>}

      <Show when={!analyzed()}>
        <div class="text-center py-6">
          <div class="text-5xl mb-3">📷</div>
          <h3 class="font-semibold text-gray-900">Upload a medical record photo</h3>
          <p class="text-gray-400 text-sm mt-1">
            Our AI will analyze the photo and extract the medical information for you.
          </p>
          <div class="mt-4 space-y-3">
            <label class="block">
              <input
                type="file"
                accept="image/*"
                class="hidden"
                onChange={(e) => setFile(e.currentTarget.files?.[0] ?? null)}
              />
              <span class="btn-secondary cursor-pointer">
                {file() ? file()!.name : "Choose Photo"}
              </span>
            </label>
            <Show when={file()}>
              <button class="btn-primary block mx-auto" onClick={handleAnalyze} disabled={analyzing()}>
                {analyzing() ? "Analyzing..." : "Analyze with AI"}
              </button>
            </Show>
          </div>
        </div>
      </Show>

      <Show when={analyzed()}>
        {(a) => (
          <div class="space-y-3">
            <div class="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-lg text-sm">
              ✓ Analysis complete. Review and confirm the extracted information below.
            </div>
            <div class="grid grid-cols-2 gap-3 text-sm">
              <div class="col-span-2"><span class="font-medium">Title:</span> {a().title}</div>
              {a().diagnosis && <div class="col-span-2"><span class="font-medium">Diagnosis:</span> {a().diagnosis}</div>}
              {a().treatment && <div class="col-span-2"><span class="font-medium">Treatment:</span> {a().treatment}</div>}
              {a().vet_name && <div><span class="font-medium">Vet:</span> {a().vet_name}</div>}
              <div>
                <label class="label">Record Date</label>
                <input class="input" type="date" value={date()} onInput={(e) => setDate(e.currentTarget.value)} />
              </div>
              <Show when={a().prescriptions.length > 0}>
                <div class="col-span-2">
                  <p class="font-medium mb-1">Prescriptions ({a().prescriptions.length}):</p>
                  <For each={a().prescriptions}>
                    {(rx) => (
                      <div class="bg-gray-50 rounded px-3 py-1.5 text-sm mb-1">
                        {rx.medication_name} · {rx.dosage} · {rx.frequency}
                        {rx.duration ? ` · ${rx.duration}` : ""}
                      </div>
                    )}
                  </For>
                </div>
              </Show>
            </div>
            <div class="flex gap-3 pt-2">
              <button class="btn-primary flex-1" onClick={handleSave} disabled={saving()}>
                {saving() ? "Saving..." : "Save Record"}
              </button>
              <button class="btn-secondary flex-1" onClick={props.onCancel}>Cancel</button>
            </div>
          </div>
        )}
      </Show>
    </div>
  );
};

const AddNoteForm: Component<{ petId: string; onSuccess: () => void; onCancel: () => void }> = (props) => {
  const [note, setNote] = createSignal("");
  const [mood, setMood] = createSignal("");
  const [energy, setEnergy] = createSignal("");
  const [appetite, setAppetite] = createSignal("");
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal("");

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await notesApi.create(props.petId, {
        note: note(), mood: mood() || undefined,
        energy_level: energy() || undefined, appetite: appetite() || undefined,
      });
      props.onSuccess();
    } catch (err: any) {
      setError(err.message ?? "Failed to add note");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} class="space-y-4">
      {error() && <div class="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">{error()}</div>}
      <div class="grid grid-cols-3 gap-3">
        <div>
          <label class="label">Mood</label>
          <select class="input" value={mood()} onChange={(e) => setMood(e.currentTarget.value)}>
            <option value="">—</option>
            <option>Happy</option><option>Calm</option><option>Anxious</option>
            <option>Sad</option><option>Playful</option>
          </select>
        </div>
        <div>
          <label class="label">Energy</label>
          <select class="input" value={energy()} onChange={(e) => setEnergy(e.currentTarget.value)}>
            <option value="">—</option>
            <option>High</option><option>Normal</option><option>Low</option><option>Very Low</option>
          </select>
        </div>
        <div>
          <label class="label">Appetite</label>
          <select class="input" value={appetite()} onChange={(e) => setAppetite(e.currentTarget.value)}>
            <option value="">—</option>
            <option>Good</option><option>Normal</option><option>Poor</option><option>None</option>
          </select>
        </div>
      </div>
      <div>
        <label class="label">Note *</label>
        <textarea class="input" rows="4" placeholder="How is your pet feeling today?" value={note()} onInput={(e) => setNote(e.currentTarget.value)} required />
      </div>
      <div class="flex gap-3">
        <button type="submit" class="btn-primary flex-1" disabled={loading()}>{loading() ? "Saving..." : "Save Note"}</button>
        <button type="button" class="btn-secondary flex-1" onClick={props.onCancel}>Cancel</button>
      </div>
    </form>
  );
};

const EmptyState: Component<{ emoji: string; title: string; desc: string }> = (props) => (
  <div class="card text-center py-10">
    <div class="text-5xl mb-3">{props.emoji}</div>
    <h3 class="font-semibold text-gray-900">{props.title}</h3>
    <p class="text-gray-400 text-sm mt-1">{props.desc}</p>
  </div>
);

const Loading: Component = () => (
  <div class="flex justify-center py-12">
    <div class="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

export default PetDetail;
