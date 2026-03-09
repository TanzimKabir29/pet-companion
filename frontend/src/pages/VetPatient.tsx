import { Component, createResource, createSignal, For, Show } from "solid-js";
import { useParams } from "@solidjs/router";
import { shopsApi } from "../api/shops";
import { recordsApi } from "../api/records";
import Modal from "../components/Modal";
import RecordCard from "../components/RecordCard";
import type { MedicalRecord } from "../types";

const VetPatient: Component = () => {
  const params = useParams<{ petId: string }>();
  const [data, { refetch }] = createResource(() => shopsApi.vetPatient(params.petId));
  const [showAddRecord, setShowAddRecord] = createSignal(false);

  return (
    <Show when={!data.loading} fallback={<Loading />}>
      <Show when={data()} fallback={<p class="text-gray-500">Patient not found.</p>}>
        {(d) => (
          <div class="space-y-6">
            {/* Pet Header */}
            <div class="flex items-start gap-5">
              <div class="w-20 h-20 rounded-2xl bg-blue-100 flex items-center justify-center text-5xl flex-shrink-0">
                🐾
              </div>
              <div class="flex-1">
                <div class="flex items-start justify-between">
                  <div>
                    <h1 class="text-2xl font-bold text-gray-900">{d().pet.name}</h1>
                    <p class="text-gray-500 capitalize">
                      {d().pet.species}{d().pet.breed ? ` · ${d().pet.breed}` : ""}
                    </p>
                    <p class="text-sm text-gray-400 mt-0.5">
                      Owner: <span class="font-medium text-gray-600">{d().pet.owner_name ?? "—"}</span>
                    </p>
                  </div>
                  <button class="btn-primary" onClick={() => setShowAddRecord(true)}>
                    + Add Record
                  </button>
                </div>
                <div class="flex gap-2 mt-3 flex-wrap">
                  {d().pet.date_of_birth && (
                    <span class="badge badge-blue">DOB: {d().pet.date_of_birth}</span>
                  )}
                  {d().pet.weight_kg && (
                    <span class="badge badge-green">{String(d().pet.weight_kg)} kg</span>
                  )}
                </div>
              </div>
            </div>

            {/* Medical Records */}
            <div>
              <h2 class="text-lg font-semibold text-gray-900 mb-3">
                Medical History ({d().records.length} records)
              </h2>
              <Show
                when={d().records.length > 0}
                fallback={
                  <div class="card text-center py-10">
                    <div class="text-5xl mb-3">📋</div>
                    <h3 class="font-semibold text-gray-900">No records yet</h3>
                    <p class="text-gray-400 text-sm mt-1">Add the first medical record for this patient</p>
                    <button class="btn-primary mt-4" onClick={() => setShowAddRecord(true)}>
                      Add Record
                    </button>
                  </div>
                }
              >
                <div class="grid gap-4">
                  <For each={d().records as MedicalRecord[]}>
                    {(record) => (
                      <RecordCard record={record} petId={params.petId} />
                    )}
                  </For>
                </div>
              </Show>
            </div>
          </div>
        )}
      </Show>

      <Modal open={showAddRecord()} onClose={() => setShowAddRecord(false)} title="Add Medical Record" size="lg">
        <VetRecordForm
          petId={params.petId}
          onSuccess={() => { setShowAddRecord(false); refetch(); }}
          onCancel={() => setShowAddRecord(false)}
        />
      </Modal>
    </Show>
  );
};

const VetRecordForm: Component<{ petId: string; onSuccess: () => void; onCancel: () => void }> = (props) => {
  const [title, setTitle] = createSignal("");
  const [date, setDate] = createSignal(new Date().toISOString().split("T")[0]);
  const [diagnosis, setDiagnosis] = createSignal("");
  const [treatment, setTreatment] = createSignal("");
  const [notes, setNotes] = createSignal("");
  const [rxName, setRxName] = createSignal("");
  const [rxDosage, setRxDosage] = createSignal("");
  const [rxFreq, setRxFreq] = createSignal("");
  const [rxDur, setRxDur] = createSignal("");
  const [rxInstr, setRxInstr] = createSignal("");
  const [prescriptions, setPrescriptions] = createSignal<any[]>([]);
  const [error, setError] = createSignal("");
  const [loading, setLoading] = createSignal(false);

  const addRx = () => {
    if (!rxName() || !rxDosage() || !rxFreq()) return;
    setPrescriptions([...prescriptions(), {
      medication_name: rxName(), dosage: rxDosage(), frequency: rxFreq(),
      duration: rxDur() || undefined, instructions: rxInstr() || undefined,
    }]);
    setRxName(""); setRxDosage(""); setRxFreq(""); setRxDur(""); setRxInstr("");
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await recordsApi.create(props.petId, {
        title: title(), record_date: date(), diagnosis: diagnosis() || undefined,
        treatment: treatment() || undefined, notes: notes() || undefined,
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
          <input class="input" type="text" placeholder="e.g. Annual wellness exam" value={title()} onInput={(e) => setTitle(e.currentTarget.value)} required />
        </div>
        <div>
          <label class="label">Date *</label>
          <input class="input" type="date" value={date()} onInput={(e) => setDate(e.currentTarget.value)} required />
        </div>
        <div />
        <div class="col-span-2">
          <label class="label">Diagnosis</label>
          <textarea class="input" rows="2" placeholder="Clinical findings and diagnosis..." value={diagnosis()} onInput={(e) => setDiagnosis(e.currentTarget.value)} />
        </div>
        <div class="col-span-2">
          <label class="label">Treatment</label>
          <textarea class="input" rows="2" placeholder="Treatment plan, procedures..." value={treatment()} onInput={(e) => setTreatment(e.currentTarget.value)} />
        </div>
        <div class="col-span-2">
          <label class="label">Clinical Notes</label>
          <textarea class="input" rows="2" placeholder="Additional observations..." value={notes()} onInput={(e) => setNotes(e.currentTarget.value)} />
        </div>
      </div>

      {/* Prescriptions */}
      <div class="border border-gray-200 rounded-lg p-4 space-y-3">
        <h4 class="text-sm font-semibold text-gray-700">Prescriptions</h4>
        <For each={prescriptions()}>
          {(rx, i) => (
            <div class="flex items-center justify-between bg-blue-50 rounded-lg px-3 py-2 text-sm">
              <div>
                <span class="font-medium">{rx.medication_name}</span>
                <span class="text-gray-500"> · {rx.dosage} · {rx.frequency}</span>
                {rx.duration && <span class="text-gray-500"> · {rx.duration}</span>}
                {rx.instructions && <div class="text-gray-400 text-xs">{rx.instructions}</div>}
              </div>
              <button type="button" onClick={() => setPrescriptions(prescriptions().filter((_, idx) => idx !== i()))} class="text-red-400 hover:text-red-600 ml-2">✕</button>
            </div>
          )}
        </For>
        <div class="grid grid-cols-2 gap-2">
          <input class="input col-span-2" type="text" placeholder="Medication name *" value={rxName()} onInput={(e) => setRxName(e.currentTarget.value)} />
          <input class="input" type="text" placeholder="Dosage * (e.g. 10mg)" value={rxDosage()} onInput={(e) => setRxDosage(e.currentTarget.value)} />
          <input class="input" type="text" placeholder="Frequency * (e.g. twice daily)" value={rxFreq()} onInput={(e) => setRxFreq(e.currentTarget.value)} />
          <input class="input" type="text" placeholder="Duration (e.g. 7 days)" value={rxDur()} onInput={(e) => setRxDur(e.currentTarget.value)} />
          <input class="input" type="text" placeholder="Special instructions" value={rxInstr()} onInput={(e) => setRxInstr(e.currentTarget.value)} />
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

const Loading: Component = () => (
  <div class="flex justify-center py-12">
    <div class="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

export default VetPatient;
