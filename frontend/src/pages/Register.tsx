import { Component, createSignal, For } from "solid-js";
import { useNavigate, A } from "@solidjs/router";
import { authApi } from "../api/auth";
import { useAuth } from "../stores/auth";
import type { UserType } from "../types";

const userTypes: { value: UserType; label: string; desc: string; emoji: string }[] = [
  { value: "owner", label: "Pet Owner", desc: "Manage your pets' health & wellbeing", emoji: "🐾" },
  { value: "vet", label: "Veterinarian", desc: "Access patient records & add prescriptions", emoji: "🩺" },
  { value: "shop", label: "Pet Shop", desc: "Manage your shop listing", emoji: "🏪" },
];

const Register: Component = () => {
  const [fullName, setFullName] = createSignal("");
  const [email, setEmail] = createSignal("");
  const [password, setPassword] = createSignal("");
  const [phone, setPhone] = createSignal("");
  const [userType, setUserType] = createSignal<UserType>("owner");
  const [error, setError] = createSignal("");
  const [loading, setLoading] = createSignal(false);
  const { actions } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setError("");
    if (password().length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.register({
        email: email(),
        password: password(),
        full_name: fullName(),
        user_type: userType(),
        phone: phone() || undefined,
      });
      actions.setAuth(res.token, res.user);
      navigate("/");
    } catch (err: any) {
      setError(err.message ?? "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-blue-100 p-4">
      <div class="w-full max-w-lg">
        <div class="text-center mb-8">
          <div class="text-6xl mb-3">🐾</div>
          <h1 class="text-3xl font-bold text-gray-900">Create Account</h1>
          <p class="text-gray-500 mt-1">Join PetCompanion today</p>
        </div>

        <div class="card">
          <form onSubmit={handleSubmit} class="space-y-5">
            {error() && (
              <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error()}
              </div>
            )}

            {/* Account Type */}
            <div>
              <label class="label">I am a...</label>
              <div class="grid grid-cols-3 gap-2">
                <For each={userTypes}>
                  {(type) => (
                    <button
                      type="button"
                      onClick={() => setUserType(type.value)}
                      class={`p-3 rounded-lg border-2 text-center transition-all ${
                        userType() === type.value
                          ? "border-primary-500 bg-primary-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div class="text-2xl mb-1">{type.emoji}</div>
                      <div class="text-xs font-medium text-gray-900">{type.label}</div>
                      <div class="text-xs text-gray-400 mt-0.5 leading-tight">{type.desc}</div>
                    </button>
                  )}
                </For>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="col-span-2">
                <label class="label" for="fullName">Full Name</label>
                <input
                  id="fullName"
                  type="text"
                  class="input"
                  placeholder="Jane Doe"
                  value={fullName()}
                  onInput={(e) => setFullName(e.currentTarget.value)}
                  required
                />
              </div>

              <div class="col-span-2">
                <label class="label" for="email">Email</label>
                <input
                  id="email"
                  type="email"
                  class="input"
                  placeholder="you@example.com"
                  value={email()}
                  onInput={(e) => setEmail(e.currentTarget.value)}
                  required
                />
              </div>

              <div>
                <label class="label" for="phone">Phone (optional)</label>
                <input
                  id="phone"
                  type="tel"
                  class="input"
                  placeholder="+1 555 0100"
                  value={phone()}
                  onInput={(e) => setPhone(e.currentTarget.value)}
                />
              </div>

              <div>
                <label class="label" for="password">Password</label>
                <input
                  id="password"
                  type="password"
                  class="input"
                  placeholder="Min. 8 characters"
                  value={password()}
                  onInput={(e) => setPassword(e.currentTarget.value)}
                  required
                  minlength="8"
                />
              </div>
            </div>

            <button
              type="submit"
              class="btn-primary w-full py-2.5"
              disabled={loading()}
            >
              {loading() ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <p class="text-center text-sm text-gray-500 mt-4">
            Already have an account?{" "}
            <A href="/login" class="text-primary-600 font-medium hover:underline">
              Sign in
            </A>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
