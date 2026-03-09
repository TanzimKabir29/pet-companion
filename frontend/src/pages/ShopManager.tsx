import { Component, createResource, createSignal, For, Show } from "solid-js";
import { shopsApi } from "../api/shops";
import Modal from "../components/Modal";
import type { ShopService } from "../types";

const ShopManager: Component = () => {
  const [shop, { refetch }] = createResource(() => shopsApi.myShop());
  const [showCreate, setShowCreate] = createSignal(false);
  const [showAddService, setShowAddService] = createSignal(false);
  const [deleteService, setDeleteService] = createSignal<ShopService | null>(null);

  const handleDeleteService = async () => {
    const svc = deleteService();
    if (!svc || !shop()) return;
    await shopsApi.deleteService(shop()!.id, svc.id);
    setDeleteService(null);
    refetch();
  };

  return (
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">My Shop</h1>
          <p class="text-gray-500 text-sm mt-0.5">Manage your shop listing</p>
        </div>
        <Show when={shop()}>
          <button class="btn-primary" onClick={() => setShowAddService(true)}>
            + Add Service
          </button>
        </Show>
      </div>

      <Show when={!shop.loading} fallback={<Loading />}>
        <Show
          when={shop()}
          fallback={
            <div class="card text-center py-16">
              <div class="text-6xl mb-4">🏪</div>
              <h3 class="font-semibold text-gray-900 text-lg">Set up your shop</h3>
              <p class="text-gray-400 text-sm mt-1">
                Create your pet shop listing to appear in the directory
              </p>
              <button class="btn-primary mt-4" onClick={() => setShowCreate(true)}>
                Create My Shop
              </button>
            </div>
          }
        >
          {(s) => (
            <div class="space-y-6">
              {/* Shop info card */}
              <div class="card">
                <div class="flex items-start justify-between">
                  <div>
                    <h2 class="text-xl font-semibold text-gray-900">{s().name}</h2>
                    {s().city && <p class="text-gray-500 text-sm mt-0.5">📍 {s().city}{s().address ? `, ${s().address}` : ""}</p>}
                    {s().description && <p class="text-gray-600 text-sm mt-2">{s().description}</p>}
                    <div class="mt-3 flex gap-3 text-sm text-gray-500 flex-wrap">
                      {s().phone && <span>📞 {s().phone}</span>}
                      {s().website && <span>🌐 {s().website}</span>}
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class={`badge ${s().is_active ? "badge-green" : "badge-yellow"}`}>
                      {s().is_active ? "Active" : "Inactive"}
                    </span>
                    <EditShopButton shop={s()} onSave={refetch} />
                  </div>
                </div>
              </div>

              {/* Services */}
              <div>
                <h2 class="text-lg font-semibold text-gray-900 mb-3">
                  Services & Products ({s().services.length})
                </h2>
                <Show
                  when={s().services.length > 0}
                  fallback={
                    <div class="card text-center py-8 text-gray-400">
                      <p>No services listed yet.</p>
                      <button class="btn-secondary mt-3 text-sm" onClick={() => setShowAddService(true)}>
                        Add First Service
                      </button>
                    </div>
                  }
                >
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <For each={s().services}>
                      {(svc) => (
                        <div class="card flex items-start justify-between">
                          <div>
                            <h3 class="font-medium text-gray-900">{svc.name}</h3>
                            {svc.category && (
                              <span class="badge badge-blue text-xs mt-1">{svc.category}</span>
                            )}
                            {svc.description && (
                              <p class="text-sm text-gray-500 mt-1">{svc.description}</p>
                            )}
                            {svc.price && (
                              <p class="text-sm font-semibold text-gray-900 mt-1">
                                ${Number(svc.price).toFixed(2)}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => setDeleteService(svc)}
                            class="text-gray-400 hover:text-red-500 ml-4 flex-shrink-0"
                          >
                            ✕
                          </button>
                        </div>
                      )}
                    </For>
                  </div>
                </Show>
              </div>
            </div>
          )}
        </Show>
      </Show>

      {/* Create Shop Modal */}
      <Modal open={showCreate()} onClose={() => setShowCreate(false)} title="Create My Shop" size="lg">
        <CreateShopForm
          onSuccess={() => { setShowCreate(false); refetch(); }}
          onCancel={() => setShowCreate(false)}
        />
      </Modal>

      {/* Add Service Modal */}
      <Modal open={showAddService()} onClose={() => setShowAddService(false)} title="Add Service" size="md">
        <Show when={shop()}>
          {(s) => (
            <AddServiceForm
              shopId={s().id}
              onSuccess={() => { setShowAddService(false); refetch(); }}
              onCancel={() => setShowAddService(false)}
            />
          )}
        </Show>
      </Modal>

      {/* Delete Service Confirmation */}
      <Modal open={!!deleteService()} onClose={() => setDeleteService(null)} title="Delete Service" size="sm">
        <p class="text-gray-600">
          Are you sure you want to delete <strong>{deleteService()?.name}</strong>?
        </p>
        <div class="flex gap-3 mt-6">
          <button class="btn-danger flex-1" onClick={handleDeleteService}>Delete</button>
          <button class="btn-secondary flex-1" onClick={() => setDeleteService(null)}>Cancel</button>
        </div>
      </Modal>
    </div>
  );
};

const EditShopButton: Component<{ shop: any; onSave: () => void }> = (props) => {
  const [open, setOpen] = createSignal(false);
  const [name, setName] = createSignal(props.shop.name ?? "");
  const [desc, setDesc] = createSignal(props.shop.description ?? "");
  const [address, setAddress] = createSignal(props.shop.address ?? "");
  const [city, setCity] = createSignal(props.shop.city ?? "");
  const [phone, setPhone] = createSignal(props.shop.phone ?? "");
  const [website, setWebsite] = createSignal(props.shop.website ?? "");
  const [active, setActive] = createSignal(props.shop.is_active);
  const [loading, setLoading] = createSignal(false);

  const handleSave = async (e: Event) => {
    e.preventDefault();
    setLoading(true);
    try {
      await shopsApi.update(props.shop.id, {
        name: name(), description: desc(), address: address(),
        city: city(), phone: phone(), website: website(), is_active: active(),
      });
      setOpen(false);
      props.onSave();
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button class="btn-secondary text-sm" onClick={() => setOpen(true)}>Edit</button>
      <Modal open={open()} onClose={() => setOpen(false)} title="Edit Shop" size="lg">
        <form onSubmit={handleSave} class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div class="col-span-2">
              <label class="label">Shop Name *</label>
              <input class="input" type="text" value={name()} onInput={(e) => setName(e.currentTarget.value)} required />
            </div>
            <div>
              <label class="label">City</label>
              <input class="input" type="text" value={city()} onInput={(e) => setCity(e.currentTarget.value)} />
            </div>
            <div>
              <label class="label">Phone</label>
              <input class="input" type="tel" value={phone()} onInput={(e) => setPhone(e.currentTarget.value)} />
            </div>
            <div class="col-span-2">
              <label class="label">Address</label>
              <input class="input" type="text" value={address()} onInput={(e) => setAddress(e.currentTarget.value)} />
            </div>
            <div class="col-span-2">
              <label class="label">Website</label>
              <input class="input" type="url" value={website()} onInput={(e) => setWebsite(e.currentTarget.value)} />
            </div>
            <div class="col-span-2">
              <label class="label">Description</label>
              <textarea class="input" rows="3" value={desc()} onInput={(e) => setDesc(e.currentTarget.value)} />
            </div>
            <div class="col-span-2 flex items-center gap-2">
              <input type="checkbox" id="active" checked={active()} onChange={(e) => setActive(e.currentTarget.checked)} />
              <label for="active" class="text-sm text-gray-700">Shop is active and visible in directory</label>
            </div>
          </div>
          <div class="flex gap-3 pt-2">
            <button type="submit" class="btn-primary flex-1" disabled={loading()}>{loading() ? "Saving..." : "Save Changes"}</button>
            <button type="button" class="btn-secondary flex-1" onClick={() => setOpen(false)}>Cancel</button>
          </div>
        </form>
      </Modal>
    </>
  );
};

const CreateShopForm: Component<{ onSuccess: () => void; onCancel: () => void }> = (props) => {
  const [name, setName] = createSignal("");
  const [desc, setDesc] = createSignal("");
  const [address, setAddress] = createSignal("");
  const [city, setCity] = createSignal("");
  const [phone, setPhone] = createSignal("");
  const [website, setWebsite] = createSignal("");
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal("");

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await shopsApi.create({
        name: name(), description: desc() || undefined, address: address() || undefined,
        city: city() || undefined, phone: phone() || undefined, website: website() || undefined,
      });
      props.onSuccess();
    } catch (err: any) {
      setError(err.message ?? "Failed to create shop");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} class="space-y-4">
      {error() && <div class="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">{error()}</div>}
      <div class="grid grid-cols-2 gap-4">
        <div class="col-span-2">
          <label class="label">Shop Name *</label>
          <input class="input" type="text" placeholder="Paws & Claws Pet Shop" value={name()} onInput={(e) => setName(e.currentTarget.value)} required />
        </div>
        <div>
          <label class="label">City</label>
          <input class="input" type="text" placeholder="New York" value={city()} onInput={(e) => setCity(e.currentTarget.value)} />
        </div>
        <div>
          <label class="label">Phone</label>
          <input class="input" type="tel" placeholder="+1 555 0100" value={phone()} onInput={(e) => setPhone(e.currentTarget.value)} />
        </div>
        <div class="col-span-2">
          <label class="label">Address</label>
          <input class="input" type="text" placeholder="123 Main St" value={address()} onInput={(e) => setAddress(e.currentTarget.value)} />
        </div>
        <div class="col-span-2">
          <label class="label">Website</label>
          <input class="input" type="url" placeholder="https://yourshop.com" value={website()} onInput={(e) => setWebsite(e.currentTarget.value)} />
        </div>
        <div class="col-span-2">
          <label class="label">Description</label>
          <textarea class="input" rows="3" placeholder="Tell customers about your shop..." value={desc()} onInput={(e) => setDesc(e.currentTarget.value)} />
        </div>
      </div>
      <div class="flex gap-3 pt-2">
        <button type="submit" class="btn-primary flex-1" disabled={loading()}>{loading() ? "Creating..." : "Create Shop"}</button>
        <button type="button" class="btn-secondary flex-1" onClick={props.onCancel}>Cancel</button>
      </div>
    </form>
  );
};

const AddServiceForm: Component<{ shopId: string; onSuccess: () => void; onCancel: () => void }> = (props) => {
  const [name, setName] = createSignal("");
  const [desc, setDesc] = createSignal("");
  const [price, setPrice] = createSignal("");
  const [category, setCategory] = createSignal("");
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal("");

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await shopsApi.addService(props.shopId, {
        name: name(), description: desc() || undefined,
        price: price() ? parseFloat(price()) : undefined,
        category: category() || undefined,
      });
      props.onSuccess();
    } catch (err: any) {
      setError(err.message ?? "Failed to add service");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} class="space-y-4">
      {error() && <div class="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">{error()}</div>}
      <div>
        <label class="label">Service Name *</label>
        <input class="input" type="text" placeholder="Grooming" value={name()} onInput={(e) => setName(e.currentTarget.value)} required />
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="label">Category</label>
          <input class="input" type="text" placeholder="Grooming" value={category()} onInput={(e) => setCategory(e.currentTarget.value)} />
        </div>
        <div>
          <label class="label">Price ($)</label>
          <input class="input" type="number" min="0" step="0.01" placeholder="25.00" value={price()} onInput={(e) => setPrice(e.currentTarget.value)} />
        </div>
      </div>
      <div>
        <label class="label">Description</label>
        <textarea class="input" rows="2" placeholder="What's included..." value={desc()} onInput={(e) => setDesc(e.currentTarget.value)} />
      </div>
      <div class="flex gap-3 pt-2">
        <button type="submit" class="btn-primary flex-1" disabled={loading()}>{loading() ? "Adding..." : "Add Service"}</button>
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

export default ShopManager;
