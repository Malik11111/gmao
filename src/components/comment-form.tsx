"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

type CommentFormProps = {
  requestId: string;
};

export function CommentForm({ requestId }: CommentFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const form = formRef.current;
    if (!form || submitting) return;

    const formData = new FormData(form);
    setSubmitting(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setFeedback({ type: "error", text: data.error ?? "Erreur lors de l'envoi." });
      } else {
        setFeedback({ type: "success", text: "Commentaire ajoute." });
        form.reset();
        router.refresh();
      }
    } catch {
      setFeedback({ type: "error", text: "Erreur reseau." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="mt-6 space-y-4">
      <input type="hidden" name="requestId" value={requestId} />
      {feedback ? (
        <div className={`rounded-2xl border px-4 py-3 text-sm ${feedback.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-700"}`}>
          {feedback.text}
        </div>
      ) : null}
      <div className="space-y-2">
        <label className="label" htmlFor="message">
          Ajouter un commentaire
        </label>
        <textarea className="field min-h-32" id="message" name="message" placeholder="Precisions, retour de diagnostic, information au demandeur..." />
      </div>
      <button className="secondary-button" type="submit" disabled={submitting}>
        {submitting ? "Envoi..." : "Envoyer le commentaire"}
      </button>
    </form>
  );
}
