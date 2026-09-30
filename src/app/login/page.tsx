"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { login } from "@/api/auth";
import { getErrorMessage, getFieldErrors } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BrandLogo } from "@/components/layout/brand-logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { FullScreenLoader, useAuthState } from "@/components/layout/auth-guard";
import { Field } from "@/components/shared/page-parts";

const schema = z.object({
  email: z.string().min(1, "Inserisci l'email").email("Email non valida"),
  password: z.string().min(1, "Inserisci la password"),
  remember: z.boolean(),
});
type Values = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const auth = useAuthState();
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { email: "", password: "", remember: true } });

  useEffect(() => {
    if (auth === "in") router.replace("/");
  }, [auth, router]);

  if (auth !== "out") return <FullScreenLoader />;

  async function onSubmit(values: Values) {
    setFormError(null);
    try {
      await login(values.email, values.password, values.remember);
      router.replace("/");
    } catch (error) {
      const fields = getFieldErrors(error);
      if (fields.email) setError("email", { message: fields.email });
      else setFormError(getErrorMessage(error, "Accesso non riuscito."));
    }
  }

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      <ThemeToggle className="absolute top-3 right-3" />
      <div className="w-full max-w-sm">
        <div className="mb-6 flex justify-center">
          <BrandLogo className="h-40" priority />
        </div>
        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="flex flex-col gap-4 rounded-2xl border bg-card p-5 shadow-sm"
        >
          <div>
            <h1 className="text-xl font-semibold">Accedi</h1>
            <p className="text-sm text-muted-foreground">Entra per gestire gli appuntamenti.</p>
          </div>

          {formError ? (
            <div role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {formError}
            </div>
          ) : null}

          <Field label="Email" htmlFor="email" error={errors.email?.message}>
            <Input
              id="email"
              type="email"
              autoComplete="username"
              inputMode="email"
              autoCapitalize="none"
              aria-invalid={!!errors.email}
              {...register("email")}
            />
          </Field>

          <Field label="Password" htmlFor="password" error={errors.password?.message}>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                aria-invalid={!!errors.password}
                className="pr-12"
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Nascondi password" : "Mostra password"}
                className="absolute top-0 right-0 flex h-11 w-11 items-center justify-center text-muted-foreground md:h-9"
              >
                {showPassword ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
              </button>
            </div>
          </Field>

          <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
            <input type="checkbox" className="size-5 accent-[var(--primary)]" {...register("remember")} />
            Ricordami su questo dispositivo
          </label>

          <Button type="submit" size="lg" disabled={isSubmitting}>
            {isSubmitting ? "Accesso in corso…" : "Accedi"}
          </Button>
        </form>
      </div>
    </div>
  );
}
