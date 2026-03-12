import React, { useState } from 'react';
import {
  AlertTriangle,
  BrainCircuit,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Lightbulb,
  ListTodo,
  Mail,
  Sparkles,
} from 'lucide-react';

const transcriptTemplates = {
  'Product Launch Meeting': `Alex: Thanks everyone. We are launching the new productivity app on April 15.
Priya: The landing page and signup flow are complete.
Jordan: Paid ads will begin one week before launch.
Alex: Great. Priya will finalize QA by April 10.
Jordan: I will share the campaign calendar by Friday.`,
  'Engineering Standup': `Sam: Yesterday I finished the authentication API.
Mia: I am working on frontend integration and should complete it today.
Ravi: I fixed the payment webhook bug and added tests.
Sam: Blockers?
Mia: Need clarification on token refresh logic.
Sam: I will document that by end of day.`,
  'Client Meeting': `Nina: The client wants the dashboard redesign by next month.
Omar: They also asked for CSV export and role-based access.
Nina: Let's send a revised timeline tomorrow.
Omar: I will draft scope options and effort estimates.
Nina: Perfect, I will follow up with the client on Friday.`,
  'Startup Planning': `Founder: Our goal is to reach 1,000 active users in 90 days.
Operations: We need a referral program and better onboarding.
Product: MVP analytics dashboard can be ready in two weeks.
Founder: Good. Product owns dashboard, Ops owns referral plan.
Operations: I will share execution milestones by Monday.`,
  'Marketing Strategy Meeting': `Leah: Q2 focus is brand awareness and webinar signups.
David: We should run LinkedIn thought-leadership ads.
Aisha: Email nurture sequence needs updated copy.
Leah: David owns paid ads plan. Aisha owns email drafts.
David: I will present budget options in the next meeting.`,
};

const flowSteps = [
  { label: 'Meeting Transcript Input', icon: FileText },
  { label: 'AI Summarizes Meeting', icon: BrainCircuit },
  { label: 'Extract Decisions', icon: ClipboardCheck },
  { label: 'Extract Action Items', icon: ListTodo },
  { label: 'Generate Follow-Up Email', icon: Mail },
];

function getOwnerInitials(owner) {
  const cleaned = String(owner || '').trim();
  if (!cleaned) {
    return 'NA';
  }

  const parts = cleaned.split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() || '').join('') || 'NA';
}

function App() {
  const [transcript, setTranscript] = useState('');
  const [activeTemplate, setActiveTemplate] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [copyMessage, setCopyMessage] = useState('');

  const handleGenerate = async () => {
    if (!transcript.trim()) {
      setError('Please paste a meeting transcript first.');
      setResult(null);
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);
    setCopyMessage('');

    try {
      const response = await fetch('http://127.0.0.1:8000/analyze-meeting', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transcript }),
      });

      if (!response.ok) {
        throw new Error('Something went wrong while generating the follow-up.');
      }

      const data = await response.json();
      setResult(data);
    } catch (requestError) {
      setError(requestError.message || 'Unable to connect to the backend.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyEmail = async () => {
    if (!result?.follow_up_email) {
      return;
    }

    await navigator.clipboard.writeText(result.follow_up_email);
    setCopyMessage('Email copied!');
  };

  const parseDeadlineDate = (deadlineText) => {
    const directDate = new Date(deadlineText);
    if (!Number.isNaN(directDate.getTime())) {
      return directDate;
    }

    const currentYear = new Date().getFullYear();
    const withYearDate = new Date(`${deadlineText}, ${currentYear}`);
    if (!Number.isNaN(withYearDate.getTime())) {
      return withYearDate;
    }

    return null;
  };

  const normalizePriority = (priorityValue) => {
    const value = String(priorityValue || '').trim().toLowerCase();
    if (value === 'high' || value === 'medium' || value === 'low') {
      return value;
    }
    return null;
  };

  const getPriorityLevel = (deadline, apiPriority) => {
    const normalizedApiPriority = normalizePriority(apiPriority);
    if (normalizedApiPriority) {
      return normalizedApiPriority;
    }

    const value = String(deadline || '').trim().toLowerCase();

    if (!value || value.includes('not specified')) {
      return 'low';
    }

    if (/\bend of day\b|\beod\b|\basap\b|\burgent\b|\bimmediately\b|\btoday\b|\btonight\b/.test(value)) {
      return 'high';
    }

    if (/\btoday\b|\btomorrow\b/.test(value)) {
      return 'high';
    }

    const daysMatch = value.match(/\b(?:in\s*)?(\d+)\s*day/);
    if (daysMatch) {
      const days = Number(daysMatch[1]);
      if (days <= 2) {
        return 'high';
      }
      if (days <= 7) {
        return 'medium';
      }
    }

    if (/\b(monday|tuesday|wednesday|thursday|friday)\b/.test(value)) {
      return 'medium';
    }

    const parsedDate = parseDeadlineDate(value);
    if (parsedDate) {
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const dueDateStart = new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate());
      const msPerDay = 1000 * 60 * 60 * 24;
      const diffDays = Math.ceil((dueDateStart - todayStart) / msPerDay);

      if (diffDays >= 0 && diffDays <= 2) {
        return 'high';
      }

      if (diffDays >= 0 && diffDays <= 7) {
        return 'medium';
      }
    }

    return 'low';
  };

  const handleTemplateSelect = (templateName) => {
    setTranscript(transcriptTemplates[templateName]);
    setActiveTemplate(templateName);
  };

  const priorityClasses = {
    high: 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200',
    medium: 'bg-amber-100 text-amber-700 ring-1 ring-amber-200',
    low: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
  };

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-12 md:px-6 lg:py-16">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="space-y-3 text-center md:text-left">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 md:text-5xl">Meeting Follow-Up AI</h1>
          <p className="mx-auto max-w-3xl text-sm text-slate-600 md:mx-0 md:text-base">
            Paste a meeting transcript and generate polished follow-up insights, action plans, and communication drafts.
          </p>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft md:p-7">
          <label htmlFor="transcript" className="mb-3 block text-sm font-semibold text-slate-800">
            Meeting transcript
          </label>

          <div className="mb-4 flex flex-wrap gap-2">
            {Object.keys(transcriptTemplates).map((templateName) => {
              const isActive = activeTemplate === templateName;
              return (
                <button
                  key={templateName}
                  type="button"
                  onClick={() => handleTemplateSelect(templateName)}
                  className={`rounded-full px-3.5 py-2 text-xs font-semibold transition-all md:text-sm ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-glowGreen'
                      : 'border border-slate-200 bg-slate-50 text-slate-600 hover:bg-white'
                  }`}
                >
                  {templateName}
                </button>
              );
            })}
          </div>

          <textarea
            id="transcript"
            value={transcript}
            onChange={(event) => setTranscript(event.target.value)}
            placeholder="Paste your meeting transcript here..."
            className="mb-4 h-60 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
          />

          <button
            type="button"
            disabled={loading}
            onClick={handleGenerate}
            className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 px-5 py-3 text-sm font-bold text-white shadow-glowGreen transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70 md:text-base"
          >
            {loading ? 'Generating...' : 'Generate Follow-Up ✨'}
          </button>

          {error ? (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          ) : null}

          {loading ? (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              Analyzing transcript...
            </div>
          ) : null}
        </section>

        {result ? (
          <section className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft md:p-7">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
                {result.meeting_title || 'Meeting Result'}
              </h2>

              <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-3 flex items-center gap-2 text-slate-900">
                    <FileText size={18} className="text-emerald-600" />
                    <h3 className="text-lg font-semibold">Summary</h3>
                  </div>
                  <p className="mb-5 text-sm leading-7 text-slate-600 md:text-base">
                    {result.summary || 'No summary was generated.'}
                  </p>

                  <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Decisions</h4>
                  <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700 md:text-base">
                    {Array.isArray(result.decisions) && result.decisions.length > 0 ? (
                      result.decisions.map((decision, index) => <li key={index}>{decision}</li>)
                    ) : (
                      <li>No explicit decisions captured.</li>
                    )}
                  </ul>
                </article>

                <div className="space-y-4">
                  <article className="rounded-2xl border border-red-100 bg-white p-5 shadow-sm">
                    <div className="mb-3 flex items-center gap-2 text-slate-900">
                      <AlertTriangle size={18} className="text-red-500" />
                      <h3 className="text-lg font-semibold">Project Risks</h3>
                    </div>
                    <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700 md:text-base">
                      {Array.isArray(result.risks) && result.risks.length > 0 ? (
                        result.risks.map((risk, index) => <li key={index}>{risk}</li>)
                      ) : (
                        <li>No major risks identified.</li>
                      )}
                    </ul>
                  </article>

                  <article className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
                    <div className="mb-3 flex items-center gap-2 text-slate-900">
                      <Lightbulb size={18} className="text-blue-500" />
                      <h3 className="text-lg font-semibold">Key Recommendations</h3>
                    </div>
                    <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700 md:text-base">
                      {Array.isArray(result.recommendations) && result.recommendations.length > 0 ? (
                        result.recommendations.map((recommendation, index) => <li key={index}>{recommendation}</li>)
                      ) : (
                        <li>No recommendations were generated.</li>
                      )}
                    </ul>
                  </article>
                </div>
              </div>
            </div>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft md:p-7">
              <div className="mb-4 flex items-center gap-2 text-slate-900">
                <ListTodo size={18} className="text-emerald-600" />
                <h3 className="text-xl font-semibold">Action Items</h3>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="min-w-full text-left text-sm md:text-base">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Owner</th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Task</th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Deadline</th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Priority</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(result.action_items) && result.action_items.length > 0 ? (
                      result.action_items.map((item, index) => {
                        const priorityLevel = getPriorityLevel(item.deadline, item.priority);
                        const priorityLabel = priorityLevel.charAt(0).toUpperCase() + priorityLevel.slice(1);

                        return (
                          <tr key={index} className="border-t border-slate-100 align-top hover:bg-slate-50">
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
                                  {getOwnerInitials(item.owner)}
                                </div>
                                <span className="font-medium text-slate-700">{item.owner || 'Not specified'}</span>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-slate-700">{item.task || 'Not specified'}</td>
                            <td className="px-4 py-4 text-slate-600">{item.deadline || 'Not specified'}</td>
                            <td className="px-4 py-4">
                              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${priorityClasses[priorityLevel]}`}>
                                {priorityLabel}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="4" className="px-4 py-6 text-center text-slate-500">
                          No action items found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {result.follow_up_email ? (
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft md:p-7">
                <div className="mb-4 flex items-center gap-2 text-slate-900">
                  <Mail size={18} className="text-emerald-600" />
                  <h3 className="text-xl font-semibold">Follow-Up Email</h3>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700 md:text-base">{result.follow_up_email}</p>
                </div>

                <button
                  type="button"
                  onClick={handleCopyEmail}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  <Mail size={16} />
                  Copy Email
                </button>
                {copyMessage ? <div className="mt-3 text-sm font-semibold text-emerald-700">{copyMessage}</div> : null}
              </section>
            ) : null}

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft md:p-7">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-xl font-semibold text-slate-900">Automation Flow - Status: ACTIVE</h3>
                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" /> ACTIVE
                </span>
              </div>

              <div className="flex flex-col items-center md:flex-row md:justify-between md:gap-2">
                {flowSteps.map((step, index) => {
                  const Icon = step.icon;
                  const isLast = index === flowSteps.length - 1;

                  return (
                    <React.Fragment key={step.label}>
                      <div className="flex w-full flex-col items-center text-center md:w-auto md:flex-1">
                        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200 shadow-glowGreen animate-pulseSoft">
                          <Icon size={24} />
                        </div>
                        <p className="max-w-[130px] text-xs font-medium text-slate-600 md:text-sm">{step.label}</p>
                      </div>

                      {!isLast ? (
                        <>
                          <div className="my-3 h-8 w-px bg-gradient-to-b from-emerald-300 to-green-500 md:hidden" />
                          <div className="mx-2 hidden h-1 flex-1 rounded-full bg-gradient-to-r from-emerald-300 to-green-500 shadow-glowGreen md:block" />
                        </>
                      ) : null}
                    </React.Fragment>
                  );
                })}
              </div>
            </section>
          </section>
        ) : null}
      </div>
    </main>
  );
}

export default App;
