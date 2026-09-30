"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createPageFromTemplate } from "@/features/pages/actions";
import { initialCreatePageState } from "@/features/pages/create-page-input";
import {
  PAGE_NAME_MAX_LENGTH,
  slugify,
  SLUG_MAX_LENGTH,
} from "@/features/pages/slug";
import { DEFAULT_TEMPLATE_ID } from "@/features/templates/template-ids";
import type { TemplateOption } from "@/features/templates/templates";

function FieldError({ id, message }: { id: string; message: string | undefined }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="text-sm text-destructive">
      {message}
    </p>
  );
}

export function NewPageForm({ templates }: { templates: TemplateOption[] }) {
  const [state, formAction, pending] = useActionState(
    createPageFromTemplate,
    initialCreatePageState,
  );
  const { errors } = state;

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  // Once the slug is edited by hand it stops following the name.
  const [slugEdited, setSlugEdited] = useState(false);
  const [templateId, setTemplateId] = useState<string>(DEFAULT_TEMPLATE_ID);

  return (
    <form action={formAction} className="max-w-xl space-y-6">
      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium">
          Page name
        </label>
        <Input
          id="name"
          name="name"
          required
          maxLength={PAGE_NAME_MAX_LENGTH}
          value={name}
          onChange={(event) => {
            const value = event.target.value;
            setName(value);
            if (!slugEdited) setSlug(slugify(value));
          }}
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={errors.name ? "name-error" : undefined}
        />
        <FieldError id="name-error" message={errors.name} />
      </div>

      <div className="space-y-2">
        <label htmlFor="slug" className="text-sm font-medium">
          URL slug
        </label>
        <Input
          id="slug"
          name="slug"
          required
          maxLength={SLUG_MAX_LENGTH}
          autoCapitalize="none"
          autoComplete="off"
          spellCheck={false}
          value={slug}
          onChange={(event) => {
            setSlug(event.target.value);
            setSlugEdited(true);
          }}
          aria-invalid={errors.slug ? true : undefined}
          aria-describedby={errors.slug ? "slug-hint slug-error" : "slug-hint"}
        />
        <p id="slug-hint" className="text-sm break-all text-muted-foreground">
          Public URL: <span className="font-mono">/p/{slug || "…"}</span>. Lowercase
          letters, digits and hyphens only.
        </p>
        <FieldError id="slug-error" message={errors.slug} />
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">Template</legend>
        {templates.map((template) => (
          <label
            key={template.id}
            className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 has-[:checked]:border-ring has-[:checked]:bg-accent has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50"
          >
            <input
              type="radio"
              name="templateId"
              value={template.id}
              checked={templateId === template.id}
              onChange={() => setTemplateId(template.id)}
              className="mt-1"
            />
            <span className="space-y-0.5">
              <span className="block text-sm font-medium">{template.name}</span>
              <span className="block text-sm text-muted-foreground">
                {template.description}
              </span>
            </span>
          </label>
        ))}
        <FieldError id="template-error" message={errors.templateId} />
      </fieldset>

      <FieldError id="form-error" message={errors.form} />

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Creating…" : "Create page"}
        </Button>
        <Link href="/dashboard" className={buttonVariants({ variant: "ghost" })}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
