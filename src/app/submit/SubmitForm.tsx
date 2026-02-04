"use client";

import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const REQUIRED_FIELDS = ["title", "problem", "who_it_helps", "mvp_scope"] as const;

type FieldKey =
  | "title"
  | "problem"
  | "who_it_helps"
  | "mvp_scope"
  | "success_metric"
  | "constraints"
  | "links"
  | "submitter_email";

type FormState = Record<FieldKey, string>;

type FormErrors = Partial<Record<FieldKey, string>>;

const INITIAL_STATE: FormState = {
  title: "",
  problem: "",
  who_it_helps: "",
  mvp_scope: "",
  success_metric: "",
  constraints: "",
  links: "",
  submitter_email: "",
};

export function SubmitForm() {
  const [values, setValues] = useState<FormState>(INITIAL_STATE);
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "error" | "rejected" | "rate"
  >("idle");

  const requiredSet = useMemo(() => new Set(REQUIRED_FIELDS), []);

  const handleChange = (key: FieldKey, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = () => {
    const nextErrors: FormErrors = {};
    for (const key of REQUIRED_FIELDS) {
      if (!values[key].trim()) {
        nextErrors[key] = "Required";
      }
    }
    if (
      values.submitter_email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.submitter_email)
    ) {
      nextErrors.submitter_email = "Enter a valid email";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!validate()) {
      return;
    }
    setStatus("submitting");

    try {
      const response = await fetch("/api/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        setStatus("success");
        return;
      }

      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      if (response.status === 400 && body?.error === "Content rejected") {
        setStatus("rejected");
        return;
      }
      if (response.status === 429) {
        setStatus("rate");
        return;
      }
      setStatus("error");
    } catch {
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="flex flex-col gap-4 border-2 border-ink bg-paper p-6">
        <p className="text-xs font-mono uppercase tracking-[0.3em] text-ink/70">
          Submission received
        </p>
        <h1 className="font-serif text-4xl font-bold">Your idea has been submitted.</h1>
        <p className="text-base text-ink/70">
          It will appear on the leaderboard after review.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            className={cn(
              "border border-ink px-4 py-2 text-xs font-mono uppercase tracking-[0.2em]",
              "hard-shadow-hover",
            )}
            href="/leaderboard"
          >
            Back to the Leaderboard
          </Link>
          <button
            className="border border-ink px-4 py-2 text-xs font-mono uppercase tracking-[0.2em]"
            onClick={() => {
              setValues(INITIAL_STATE);
              setErrors({});
              setStatus("idle");
            }}
            type="button"
          >
            Submit another
          </button>
        </div>
      </div>
    );
  }

  return (
    <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
      <div className="grid gap-6 lg:grid-cols-2">
        <Field
          label="Idea title"
          required={requiredSet.has("title")}
          error={errors.title}
        >
          <Input
            name="title"
            value={values.title}
            onChange={(event) => handleChange("title", event.target.value)}
            placeholder="Short, memorable headline"
          />
        </Field>
        <Field
          label="Who it helps"
          required={requiredSet.has("who_it_helps")}
          error={errors.who_it_helps}
        >
          <Input
            name="who_it_helps"
            value={values.who_it_helps}
            onChange={(event) => handleChange("who_it_helps", event.target.value)}
            placeholder="Caregivers, new parents, students"
          />
        </Field>
      </div>

      <Field label="Problem" required={requiredSet.has("problem")} error={errors.problem}>
        <Textarea
          name="problem"
          rows={4}
          value={values.problem}
          onChange={(event) => handleChange("problem", event.target.value)}
          placeholder="Describe the pain clearly and concretely."
        />
      </Field>

      <div className="grid gap-6 lg:grid-cols-2">
        <Field
          label="MVP scope"
          required={requiredSet.has("mvp_scope")}
          error={errors.mvp_scope}
        >
          <Textarea
            name="mvp_scope"
            rows={3}
            value={values.mvp_scope}
            onChange={(event) => handleChange("mvp_scope", event.target.value)}
            placeholder="What can be built in 1-2 days?"
          />
        </Field>
        <Field label="Outcome (optional)" error={errors.success_metric}>
          <Textarea
            name="success_metric"
            rows={3}
            value={values.success_metric}
            onChange={(event) => handleChange("success_metric", event.target.value)}
            placeholder="What would make this feel helpful?"
          />
        </Field>
      </div>

      <Field label="Constraints" error={errors.constraints}>
        <Textarea
          name="constraints"
          rows={3}
          value={values.constraints}
          onChange={(event) => handleChange("constraints", event.target.value)}
          placeholder="Do not do list, boundaries, exclusions."
        />
      </Field>

      <Field label="Links" error={errors.links}>
        <Textarea
          name="links"
          rows={3}
          value={values.links}
          onChange={(event) => handleChange("links", event.target.value)}
          placeholder="Optional references, examples, or resources."
        />
      </Field>

      <Field label="Email (optional)" error={errors.submitter_email}>
        <Input
          name="submitter_email"
          type="email"
          value={values.submitter_email}
          onChange={(event) => handleChange("submitter_email", event.target.value)}
          placeholder="you@example.com"
        />
      </Field>

      {status === "rejected" && (
        <p className="border border-accent bg-paper p-3 text-sm text-accent">
          Content rejected. Please remove any spam or unsafe content and try again.
        </p>
      )}
      {status === "rate" && (
        <p className="border border-accent bg-paper p-3 text-sm text-accent">
          Too many submissions. Please try again in about an hour.
        </p>
      )}
      {status === "error" && (
        <p className="border border-accent bg-paper p-3 text-sm text-accent">
          Something went wrong. Please try again.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" disabled={status === "submitting"}>
          {status === "submitting" ? "Submitting..." : "Submit idea"}
        </Button>
        <p className="text-xs font-mono uppercase tracking-[0.3em] text-ink/60">
          Required fields marked
          <span className="ml-2 text-accent">*</span>
        </p>
      </div>
    </form>
  );
}

type FieldProps = {
  label: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
};

function Field({ label, required, error, children }: FieldProps) {
  return (
    <label className="flex flex-col gap-2 text-sm text-ink">
      <span className="flex items-center gap-2 font-mono uppercase tracking-[0.2em] text-xs text-ink/70">
        {label}
        {required ? <span className="text-accent">*</span> : null}
      </span>
      {children}
      {error ? <span className="text-xs text-accent">{error}</span> : null}
    </label>
  );
}
