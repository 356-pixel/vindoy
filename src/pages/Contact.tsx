import { useState } from "react";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { toast } from "sonner";
import { sanitize } from "@/lib/storage";

const MAX = { name: 80, email: 120, subject: 120, message: 2000 };

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sent, setSent] = useState(false);

  function update<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const name = form.name.trim();
    const email = form.email.trim();
    const subject = form.subject.trim();
    const message = form.message.trim();
    if (!name) return toast.error("Please add your name");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return toast.error("Please enter a valid email");
    if (!subject) return toast.error("Please add a subject");
    if (!message) return toast.error("Please add a message");
    if (
      name.length > MAX.name ||
      email.length > MAX.email ||
      subject.length > MAX.subject ||
      message.length > MAX.message
    )
      return toast.error("Inputs are too long");

    // Sanitize (basic) and pretend-send
    const payload = {
      name: sanitize(name),
      email: sanitize(email),
      subject: sanitize(subject),
      message: sanitize(message),
    };
    void payload;
    setSent(true);
    setForm({ name: "", email: "", subject: "", message: "" });
    toast.success("Message received — we'll be in touch");
  }

  return (
    <Layout>
      <SEO
        title="Contact · Vindoy"
        description="Get in touch with the Vindoy team."
      />
      <section className="container max-w-2xl py-12">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Contact us
        </h1>
        <p className="mt-3 text-muted-foreground">
          Questions, feedback, or partnership ideas? Drop us a note.
        </p>

        <form
          onSubmit={onSubmit}
          className="mt-8 space-y-5 rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8"
          noValidate
        >
          {[
            { k: "name", label: "Name", type: "text" },
            { k: "email", label: "Email", type: "email" },
            { k: "subject", label: "Subject", type: "text" },
          ].map((f) => (
            <div key={f.k}>
              <label
                htmlFor={f.k}
                className="mb-2 block text-sm font-medium"
              >
                {f.label}
              </label>
              <input
                id={f.k}
                type={f.type}
                required
                maxLength={MAX[f.k as keyof typeof MAX]}
                value={form[f.k as keyof typeof form]}
                onChange={(e) => update(f.k as keyof typeof form, e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          ))}
          <div>
            <label htmlFor="message" className="mb-2 block text-sm font-medium">
              Message
            </label>
            <textarea
              id="message"
              required
              rows={6}
              maxLength={MAX.message}
              value={form.message}
              onChange={(e) => update("message", e.target.value)}
              className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <button
            type="submit"
            className="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90 sm:w-auto"
          >
            Send message
          </button>
          {sent && (
            <p className="text-sm text-muted-foreground">
              Thanks — we received your message.
            </p>
          )}
        </form>
      </section>
    </Layout>
  );
}
