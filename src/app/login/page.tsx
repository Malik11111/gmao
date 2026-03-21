import { ArrowRight, KeyRound, ScanLine, Shield, Wrench } from "lucide-react";
import { redirect } from "next/navigation";
import { loginAction } from "@/app/actions";
import { getSessionUser } from "@/lib/session";

type LoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const user = await getSessionUser();

  if (user) {
    redirect("/");
  }

  const params = await searchParams;
  const error = typeof params.error === "string" ? params.error : undefined;
  const email = typeof params.email === "string" ? params.email : "";

  return (
    <div className="min-h-screen flex">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-[55%] relative bg-gradient-to-br from-indigo-950 via-indigo-900 to-violet-900 text-white flex-col justify-between p-12 overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 h-72 w-72 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute bottom-20 right-10 h-96 w-96 rounded-full bg-violet-400/20 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 rounded-full bg-indigo-300/10 blur-2xl" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
              <Wrench className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-indigo-300">Maintenance</p>
              <h1 className="text-xl font-bold">GMAO</h1>
            </div>
          </div>
        </div>

        <div className="relative z-10 max-w-lg">
          <h2 className="text-4xl font-bold leading-tight tracking-tight">
            Signalez, suivez et resolvez les pannes en quelques clics.
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-indigo-200">
            Le personnel scanne un QR code, cree un signalement et le service technique prend en charge l&apos;intervention.
          </p>

          <div className="mt-10 grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-white/10 backdrop-blur p-4 border border-white/10">
              <ScanLine className="h-6 w-6 text-indigo-300" />
              <p className="mt-3 text-sm font-semibold">Scan QR Code</p>
              <p className="mt-1 text-xs text-indigo-300">Identification instantanee</p>
            </div>
            <div className="rounded-xl bg-white/10 backdrop-blur p-4 border border-white/10">
              <Shield className="h-6 w-6 text-indigo-300" />
              <p className="mt-3 text-sm font-semibold">Suivi en temps reel</p>
              <p className="mt-1 text-xs text-indigo-300">Du signalement a la cloture</p>
            </div>
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-sm text-indigo-400">GMAO - Gestion de Maintenance Assistee par Ordinateur</p>
        </div>
      </div>

      {/* Right panel - login form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-white">
              <Wrench className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">Maintenance</p>
              <h1 className="text-xl font-bold text-gray-900">GMAO</h1>
            </div>
          </div>

          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
              <KeyRound className="h-5 w-5" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Connexion</h2>
          </div>
          <p className="text-gray-500 text-sm mb-8">Accedez au portail de gestion de maintenance</p>

          {error ? (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 font-medium">{error}</div>
          ) : null}

          <form action={loginAction} className="space-y-5">
            <div className="space-y-1.5">
              <label className="label" htmlFor="email">
                Adresse email
              </label>
              <input className="field" id="email" name="email" type="email" placeholder="prenom.nom@exemple.fr" defaultValue={email} />
            </div>

            <div className="space-y-1.5">
              <label className="label" htmlFor="password">
                Mot de passe
              </label>
              <input className="field" id="password" name="password" type="password" placeholder="Votre mot de passe" />
            </div>

            <button className="primary-button w-full justify-center" type="submit">
              Se connecter
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
