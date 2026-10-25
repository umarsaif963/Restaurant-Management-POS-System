import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Clock, MessageSquare, Send } from 'lucide-react';
import { useSubmitContactMessageMutation } from '@/store/api/publicApi';
import { extractApiError } from '@/services/api';
import { Spinner } from '@/components/ui/Spinner';
import { Reveal } from '@/components/marketing/Reveal';
import { SectionHeading } from '@/components/marketing/SectionHeading';

const NEXT_STEPS = [
  'We read every message ourselves - no ticket queue in between.',
  'You get a real reply, usually within one business day.',
  'If a walkthrough helps, we will set one up on your own data.',
  'Prefer to self-serve? Creating a workspace is free and takes minutes.',
];

export function ContactPage() {
  const [sent, setSent] = useState(false);
  const [submitMessage, { isLoading }] = useSubmitContactMessageMutation();
  const [formError, setFormError] = useState<string | null>(null);
  const [formValues, setFormValues] = useState({ name: '', email: '', company: '', message: '' });

  return (
    <>
      {/* ---------------------------------------------------------------- */}
      {/* Hero                                                              */}
      {/* ---------------------------------------------------------------- */}
      <section className="relative overflow-hidden border-b border-slate-200/70">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,var(--tw-gradient-stops))] from-brand-100/60 via-bone-50 to-bone-50"
        />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <Reveal className="max-w-2xl">
            <span className="eyebrow">
              <MessageSquare className="h-3.5 w-3.5" />
              Contact
            </span>
            <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.06] tracking-[-0.025em] text-ink-950 sm:text-5xl">
              Talk to us.
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-ink-700/80">
              Questions about a rollout, an enterprise setup or a migration? Tell us below - we
              read and answer every message ourselves.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Channels + form                                                   */}
      {/* ---------------------------------------------------------------- */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-5 lg:gap-14">
          {/* Left: how we work */}
          <Reveal className="lg:col-span-2">
            <SectionHeading
              eyebrow="One inbox, real people"
              title="Every message reaches the team that builds it."
              lede="There is no phone tree and no outsourced tier-one queue - the note lands with us, and we answer it ourselves."
            />

            <div className="mt-8 rounded-3xl border border-slate-200/80 bg-bone-100 p-6">
              <p className="flex items-center gap-2 text-sm font-bold text-ink-950">
                <Clock className="h-4 w-4 text-brand-600" />
                What happens next
              </p>
              <ul className="mt-4 space-y-3">
                {NEXT_STEPS.map((step) => (
                  <li
                    key={step}
                    className="flex items-start gap-2.5 text-sm text-ink-700/80"
                  >
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                    {step}
                  </li>
                ))}
              </ul>
              <p className="mt-5 text-xs text-ink-700/60">
                Prefer to explore first?{' '}
                <Link
                  to="/pricing"
                  className="font-semibold text-brand-700 underline-offset-2 hover:underline"
                >
                  See the plans
                </Link>{' '}
                or{' '}
                <Link
                  to="/register"
                  className="font-semibold text-brand-700 underline-offset-2 hover:underline"
                >
                  create a workspace
                </Link>
                .
              </p>
            </div>
          </Reveal>

          {/* Right: form */}
          <Reveal delay={120} className="lg:col-span-3">
            <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-stage ring-1 ring-slate-900/5">
              <div className="border-b border-slate-100 bg-bone-50 px-6 py-5 sm:px-8">
                <p className="text-lg font-bold tracking-tight text-ink-950">Send us a message</p>
                <p className="mt-1 text-sm text-ink-700/70">
                  Tell us about your venue and what you are trying to solve.
                </p>
              </div>

              <div className="p-6 sm:p-8">
                {sent ? (
                  <div className="flex min-h-[360px] flex-col items-center justify-center gap-4 text-center">
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-brand-700 ring-4 ring-brand-50">
                      <Check className="h-7 w-7" />
                    </span>
                    <div>
                      <p className="text-lg font-bold text-ink-950">
                        Thanks - we got your message.
                      </p>
                      <p className="mt-1.5 text-sm text-ink-700/75">
                        We usually reply within one business day.
                      </p>
                    </div>
                    <Link to="/features" className="btn-secondary mt-1">
                      Browse the features meanwhile
                    </Link>
                  </div>
                ) : (
                  <form
                    className="space-y-5"
                    onSubmit={async (event) => {
                      event.preventDefault();
                      setFormError(null);
                      try {
                        await submitMessage(formValues).unwrap();
                        setSent(true);
                      } catch (error) {
                        const { message } = extractApiError(error);
                        setFormError(message);
                      }
                    }}
                  >
                    <div className="grid gap-5 sm:grid-cols-2">
                      <div>
                        <label
                          htmlFor="contact-name"
                          className="block text-sm font-medium text-slate-700"
                        >
                          Name
                        </label>
                        <input
                          id="contact-name"
                          className="input mt-1.5"
                          required
                          autoComplete="name"
                          value={formValues.name}
                          onChange={(event) =>
                            setFormValues((current) => ({ ...current, name: event.target.value }))
                          }
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="contact-email"
                          className="block text-sm font-medium text-slate-700"
                        >
                          Email
                        </label>
                        <input
                          id="contact-email"
                          type="email"
                          className="input mt-1.5"
                          required
                          autoComplete="email"
                          value={formValues.email}
                          onChange={(event) =>
                            setFormValues((current) => ({ ...current, email: event.target.value }))
                          }
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="contact-company"
                        className="block text-sm font-medium text-slate-700"
                      >
                        Company (optional)
                      </label>
                      <input
                        id="contact-company"
                        className="input mt-1.5"
                        autoComplete="organization"
                        value={formValues.company}
                        onChange={(event) =>
                          setFormValues((current) => ({ ...current, company: event.target.value }))
                        }
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="contact-message"
                        className="block text-sm font-medium text-slate-700"
                      >
                        Message
                      </label>
                      <textarea
                        id="contact-message"
                        rows={5}
                        className="input mt-1.5 resize-y"
                        required
                        placeholder="How many venues, what you run today, what you need..."
                        value={formValues.message}
                        onChange={(event) =>
                          setFormValues((current) => ({ ...current, message: event.target.value }))
                        }
                      />
                    </div>

                    {formError ? (
                      <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {formError}
                      </p>
                    ) : null}

                    <button
                      type="submit"
                      className="btn btn-lg group w-full bg-brand-600 text-white shadow-brand-glow hover:bg-brand-500"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Spinner className="h-5 w-5" />
                      ) : (
                        <>
                          Send message
                          <Send className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                        </>
                      )}
                    </button>

                    <p className="text-center text-xs text-ink-700/60">
                      Prefer to try it first?{' '}
                      <Link
                        to="/register"
                        className="font-semibold text-brand-700 underline-offset-2 hover:underline"
                      >
                        Create a workspace
                      </Link>
                    </p>
                  </form>
                )}
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
