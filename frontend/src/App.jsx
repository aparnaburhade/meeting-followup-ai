import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BrainCircuit,
  Check,
  CheckCircle2,
  ChevronsUpDown,
  ClipboardCheck,
  FileText,
  ListTodo,
  Loader2,
  Mail,
} from 'lucide-react';

const transcriptTemplates = {
  'Product Launch Meeting': `Alex: Thanks everyone. We are launching the new productivity app on April 15.
Sam: The landing page and signup flow are complete.
Jordan: Paid ads will begin one week before launch.
Alex: Great. Sam will finalize QA by April 10.
Jordan: I will share the campaign calendar by Friday.`,
  'Engineering Standup': `Sam: Yesterday I finished the authentication API.
Chris: I am working on frontend integration and should complete it today.
Taylor: I fixed the payment webhook bug and added tests.
Sam: Blockers?
Chris: Need clarification on token refresh logic.
Sam: I will document that by end of day.`,
  'Client Meeting': `Jordan: The client wants the dashboard redesign by next month.
Tom: They also asked for CSV export and role-based access.
Jordan: Let's send a revised timeline tomorrow.
Tom: I will draft scope options and effort estimates by Thursday.
Jordan: Perfect, I will follow up with the client on Friday.`,
  'Startup Planning': `Alex: Our goal is to reach 1,000 active users in 90 days.
Taylor: We need a referral program and better onboarding.
Chris: MVP analytics dashboard can be ready in two weeks.
Alex: Good. Chris owns dashboard, Taylor owns referral plan.
Taylor: I will share execution milestones by Monday.`,
  'Marketing Strategy Meeting': `Sam: Q2 focus is brand awareness and webinar signups.
Tony: We should run LinkedIn thought-leadership ads.
Jim: Email nurture sequence needs updated copy.
Sam: Tony owns paid ads plan. Jim owns email drafts due Wednesday.
Tony: I will present budget options in the next meeting on Friday.`,
};

const defaultTemplateName = 'Product Launch Meeting';

const flowSteps = [
  { label: 'Meeting Transcript Input', icon: FileText },
  { label: 'AI Summarizes Meeting', icon: BrainCircuit },
  { label: 'Extract Decisions', icon: ClipboardCheck },
  { label: 'Extract Action Items', icon: ListTodo },
  { label: 'Generate Follow-Up Email', icon: Mail },
];

const processingSteps = [
  'Analyzing transcript',
  'Extracting decisions',
  'Detecting project risks',
  'Generating action items',
  'Drafting follow-up email',
];

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function getOwnerInitials(owner) {
  const cleaned = String(owner || '').trim();
  if (!cleaned) return 'NA';
  const parts = cleaned.split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() || '').join('') || 'NA';
}

function App() {
  const [transcript, setTranscript] = useState(transcriptTemplates[defaultTemplateName]);
  const [activeTemplate, setActiveTemplate] = useState(defaultTemplateName);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [isApiLoading, setIsApiLoading] = useState(false);
  const [apiRequestStatus, setApiRequestStatus] = useState('idle');
  const [copyMessage, setCopyMessage] = useState('');

  const [showProcessingPanel, setShowProcessingPanel] = useState(false);
  const [currentProcessingStep, setCurrentProcessingStep] = useState(-1);
  const [completedProcessingCount, setCompletedProcessingCount] = useState(0);

  const finalProcessingStepIndex = processingSteps.length - 1;

  const parseDeadlineDate = (deadlineText) => {
    const directDate = new Date(deadlineText);
    if (!Number.isNaN(directDate.getTime())) return directDate;
    const currentYear = new Date().getFullYear();
    const withYearDate = new Date(`${deadlineText}, ${currentYear}`);
    if (!Number.isNaN(withYearDate.getTime())) return withYearDate;
    return null;
  };

  const normalizePriority = (priorityValue) => {
    const value = String(priorityValue || '').trim().toLowerCase();
    return value === 'high' || value === 'medium' || value === 'low' ? value : null;
  };

  const getPriorityLevel = (deadline, apiPriority) => {
    const normalizedApiPriority = normalizePriority(apiPriority);
    if (normalizedApiPriority) return normalizedApiPriority;

    const value = String(deadline || '').trim().toLowerCase();
    if (!value || value.includes('not specified')) return 'low';

    if (/\bend of day\b|\beod\b|\basap\b|\burgent\b|\bimmediately\b|\btoday\b|\btonight\b/.test(value)) {
      return 'high';
    }
    if (/\btoday\b|\btomorrow\b/.test(value)) return 'high';

    const daysMatch = value.match(/\b(?:in\s*)?(\d+)\s*day/);
    if (daysMatch) {
      const days = Number(daysMatch[1]);
      if (days <= 2) return 'high';
      if (days <= 7) return 'medium';
    }

    if (/\b(monday|tuesday|wednesday|thursday|friday)\b/.test(value)) return 'medium';

    const parsedDate = parseDeadlineDate(value);
    if (parsedDate) {
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const dueDateStart = new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate());
      const diffDays = Math.ceil((dueDateStart - todayStart) / (1000 * 60 * 60 * 24));
      if (diffDays >= 0 && diffDays <= 2) return 'high';
      if (diffDays >= 0 && diffDays <= 7) return 'medium';
    }

    return 'low';
  };

  const runProcessingAnimation = async () => {
    setShowProcessingPanel(true);
    setCompletedProcessingCount(0);

    for (let i = 0; i < finalProcessingStepIndex; i += 1) {
      setCurrentProcessingStep(i);
      await wait(450 + Math.floor(Math.random() * 151));
      setCompletedProcessingCount(i + 1);
    }

    setCurrentProcessingStep(finalProcessingStepIndex);
  };

  const handleGenerate = async () => {
    if (!transcript.trim()) {
      setError('Please paste a meeting transcript first.');
      setResult(null);
      return;
    }

    setIsApiLoading(true);
    setApiRequestStatus('loading');
    setError('');
    setResult(null);
    setCopyMessage('');
    setShowProcessingPanel(true);
    setCurrentProcessingStep(-1);
    setCompletedProcessingCount(0);

    try {
      let responseData = null;
      let responseError = null;

      const fetchPromise = fetch('http://127.0.0.1:8000/analyze-meeting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript }),
      })
        .then(async (response) => {
          if (!response.ok) throw new Error('Something went wrong while generating the follow-up.');
          return response.json();
        })
        .then((data) => {
          responseData = data;
        })
        .catch((requestError) => {
          responseError = requestError;
        });

      await runProcessingAnimation();
      await fetchPromise;

      if (responseError) throw responseError;

      setApiRequestStatus('success');
      setCompletedProcessingCount(processingSteps.length);
      setCurrentProcessingStep(-1);
      await wait(650);
      setShowProcessingPanel(false);
      setResult(responseData);
    } catch (requestError) {
      setApiRequestStatus('error');
      setCurrentProcessingStep(finalProcessingStepIndex);
      setError(requestError.message || 'Unable to connect to the backend.');
    }

    setIsApiLoading(false);
  };

  const handleCopyEmail = async () => {
    if (!result?.follow_up_email) return;
    await navigator.clipboard.writeText(result.follow_up_email);
    setCopyMessage('Email copied!');
  };

  const handleTemplateSelect = (templateName) => {
    setTranscript(transcriptTemplates[templateName]);
    setActiveTemplate(templateName);
  };

  const priorityClasses = {
    high: 'bg-emerald-500 text-white ring-1 ring-emerald-400/70',
    medium: 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200',
    low: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-stone-50 to-white py-8 font-sans sm:py-10 lg:py-14">
      <div className="pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full bg-stone-200/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-20 h-72 w-72 rounded-full bg-stone-100/30 blur-3xl" />

      <div className="relative mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <header className="mb-10 sm:mb-14">
          <nav className="mx-auto flex w-full items-center justify-between rounded-full border border-stone-200 bg-white/90 px-4 py-2.5 shadow-sm backdrop-blur sm:px-6">
            <p className="text-sm font-semibold tracking-tight text-slate-900 sm:text-base">Meeting Follow-Up AI</p>

            <div className="hidden items-center gap-6 text-sm text-slate-600 md:flex">
              <a href="#features" className="transition hover:text-slate-900">Features</a>
              <a href="#demo" className="transition hover:text-slate-900">Demo</a>
              <a href="#how-it-works" className="transition hover:text-slate-900">How it Works</a>
              <a href="#github" className="transition hover:text-slate-900">GitHub</a>
            </div>

            <a
              href="#demo"
              className="inline-flex items-center rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 sm:text-sm"
            >
              Try Demo
            </a>
          </nav>
        </header>

        <section className="mx-auto mb-12 max-w-4xl space-y-5 text-center sm:mb-16 lg:mb-20" id="features">
          <h1 className="font-serif text-4xl leading-tight tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
            The AI meeting assistant that helps you turn conversations into action.
          </h1>
          <p className="mx-auto max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
            Paste a meeting transcript and instantly generate summaries, action items, risks, recommendations, and follow-up emails.
          </p>
          <div className="pt-2 sm:pt-4">
            <a
              href="#demo"
              className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
            >
              Generate Follow-Up ✨
            </a>
          </div>
        </section>

        <section id="demo" className="mb-10 grid grid-cols-1 gap-6 lg:mb-12 lg:grid-cols-2 lg:gap-7">
          <article className="rounded-3xl border border-stone-200 bg-white p-4 shadow-sm sm:p-6 lg:p-7">
            <label htmlFor="transcript" className="mb-4 block text-sm font-semibold text-slate-800">Meeting transcript</label>

            <div className="mb-4 flex flex-wrap gap-2 sm:gap-2.5">
              {Object.keys(transcriptTemplates).map((templateName) => {
                const isActive = activeTemplate === templateName;
                return (
                  <button
                    key={templateName}
                    type="button"
                    onClick={() => handleTemplateSelect(templateName)}
                    className={`w-full rounded-full px-3.5 py-2 text-xs font-medium transition sm:w-auto md:text-sm ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'border border-stone-200 bg-white text-slate-700 hover:bg-stone-50'
                    }`}
                  >
                    {templateName}
                  </button>
                );
              })}
            </div>

            <div className="mb-3 inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              Demo Transcript
            </div>

            <textarea
              id="transcript"
              value={transcript}
              onChange={(event) => setTranscript(event.target.value)}
              placeholder="Paste your meeting transcript here..."
              className="mb-4 h-56 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100 sm:h-64"
            />

            <p className="mb-4 text-xs text-slate-500 md:text-sm">
              This is a demo transcript for testing the AI. You can replace it with your own meeting transcript anytime.
            </p>

            <button
              type="button"
              disabled={isApiLoading}
              onClick={handleGenerate}
              className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:from-emerald-700 hover:to-emerald-600 disabled:cursor-not-allowed disabled:opacity-70 md:text-base"
            >
              {isApiLoading ? 'Generating...' : 'Generate Follow-Up ✨'}
            </button>

            {error ? <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
          </article>

          <article className="rounded-3xl border border-stone-200 bg-white p-4 shadow-sm sm:p-6 lg:p-7">
            <div className="mb-4 flex items-center gap-2">
              <BrainCircuit size={18} className="text-emerald-600" />
              <h2 className="text-lg font-semibold text-slate-900">AI output preview</h2>
            </div>

            {showProcessingPanel ? (
              <div className="space-y-3">
                {processingSteps.map((step, index) => {
                  const isFinalStep = index === finalProcessingStepIndex;
                  const isFailedFinalStep = isFinalStep && apiRequestStatus === 'error';
                  const isCompleted = index < completedProcessingCount;
                  const isCurrent = index === currentProcessingStep;

                  return (
                    <div
                      key={step}
                      className={`flex items-center justify-between rounded-xl border px-4 py-3 transition-all duration-300 ${
                        isFailedFinalStep
                          ? 'border-red-300 bg-red-50'
                          : isCompleted
                            ? 'border-stone-200 bg-white'
                            : isCurrent
                              ? 'border-stone-300 bg-stone-50'
                              : 'border-stone-200 bg-white'
                      }`}
                    >
                      <span className={`text-sm font-medium ${isFailedFinalStep ? 'text-red-700' : 'text-slate-700'}`}>{step}</span>
                      <span className="flex h-6 w-6 items-center justify-center">
                        {isFailedFinalStep ? (
                          <span className="rounded-full bg-red-500 p-1 text-white"><AlertTriangle size={14} /></span>
                        ) : isCompleted ? (
                          <span className="rounded-full bg-emerald-500 p-1 text-white"><Check size={14} /></span>
                        ) : isCurrent ? (
                          <Loader2 size={16} className="animate-spin text-emerald-600" />
                        ) : (
                          <span className="h-2.5 w-2.5 rounded-full bg-stone-300" />
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : result ? (
              <div className="space-y-4">
                <div className="rounded-2xl border border-stone-200 bg-stone-50/60 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Meeting</p>
                  <p className="mt-1 text-base font-semibold text-slate-900">{result.meeting_title || 'Meeting Follow-Up'}</p>
                </div>

                <div className="rounded-2xl border border-stone-200 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Summary Preview</p>
                  <p className="mt-2 line-clamp-5 text-sm leading-7 text-slate-700">{result.summary || 'Summary will appear here once the AI finishes analysis.'}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-stone-200 p-3">
                    <p className="text-xs text-slate-500">Action items</p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">{Array.isArray(result.action_items) ? result.action_items.length : 0}</p>
                  </div>
                  <div className="rounded-xl border border-stone-200 p-3">
                    <p className="text-xs text-slate-500">Recommendations</p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">{Array.isArray(result.recommendations) ? result.recommendations.length : 0}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex h-full min-h-[360px] items-center justify-center rounded-2xl border border-dashed border-stone-300 bg-stone-50/70 p-6 text-center">
                <p className="max-w-xs text-sm leading-7 text-slate-500">
                  Your AI analysis preview will appear here after you generate a follow-up from the transcript.
                </p>
              </div>
            )}
          </article>
        </section>

        {result ? (
          <section className="space-y-6" id="insights">
            <div className="mb-2">
              <h2 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Insights & Action Plan</h2>
              <p className="mt-1 text-sm text-slate-500">Structured output from your transcript with clear next steps.</p>
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <article className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-center gap-2 text-slate-900"><FileText size={18} className="text-emerald-600" /><h3 className="text-2xl font-semibold">Summary</h3></div>
                <p className="mb-5 text-sm leading-7 text-slate-700 md:text-base">{result.summary || 'No summary was generated.'}</p>
                <h4 className="mb-2 text-xl font-semibold text-slate-900">Decisions</h4>
                <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700 md:text-base">{Array.isArray(result.decisions) && result.decisions.length > 0 ? result.decisions.map((decision, index) => <li key={index}>{decision}</li>) : <li>No explicit decisions captured.</li>}</ul>
                {Array.isArray(result.risks) && result.risks.length > 0 ? <><h4 className="mb-2 mt-4 text-xl font-semibold text-slate-900">Risks</h4><ul className="list-disc space-y-1 pl-5 text-sm text-slate-700 md:text-base">{result.risks.map((risk, index) => <li key={index}>{risk}</li>)}</ul></> : null}
              </article>

              <div className="space-y-5">
                <article className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"><div className="mb-3 flex items-center gap-2 text-slate-900"><AlertTriangle size={18} className="text-amber-500" /><h3 className="text-2xl font-semibold">Project Risks</h3></div><ul className="list-disc space-y-1 pl-5 text-sm text-slate-700 md:text-base">{Array.isArray(result.risks) && result.risks.length > 0 ? result.risks.map((risk, index) => <li key={index}>{risk}</li>) : <li>No major risks identified.</li>}</ul></article>
                <article className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"><div className="mb-3 flex items-center gap-2 text-slate-900"><CheckCircle2 size={18} className="text-emerald-500" /><h3 className="text-2xl font-semibold">Key Recommendations</h3></div><ul className="list-disc space-y-1 pl-5 text-sm text-slate-700 md:text-base">{Array.isArray(result.recommendations) && result.recommendations.length > 0 ? result.recommendations.map((recommendation, index) => <li key={index}>{recommendation}</li>) : <li>No recommendations were generated.</li>}</ul></article>
              </div>
            </div>

            <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-6 lg:p-7">
              <div className="mb-4 flex items-center gap-2 text-slate-900"><ListTodo size={18} className="text-emerald-600" /><h3 className="text-2xl font-semibold">Action Items</h3></div>
              <div className="overflow-x-auto rounded-2xl border border-stone-200"><table className="w-full min-w-[680px] text-left text-sm md:text-base"><thead className="bg-stone-50"><tr><th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-700"><span className="inline-flex items-center gap-1">Owner <ChevronsUpDown size={14} /></span></th><th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-700">Task</th><th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-700"><span className="inline-flex items-center gap-1">Deadline <ChevronsUpDown size={14} /></span></th><th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-700"><span className="inline-flex items-center gap-1">Priority <ChevronsUpDown size={14} /></span></th></tr></thead><tbody>{Array.isArray(result.action_items) && result.action_items.length > 0 ? result.action_items.map((item, index) => { const priorityLevel = getPriorityLevel(item.deadline, item.priority); const priorityLabel = priorityLevel.charAt(0).toUpperCase() + priorityLevel.slice(1); return (<tr key={index} className="border-t border-stone-200 align-top hover:bg-stone-50"><td className="px-4 py-5"><div className="flex items-center gap-3"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-500 text-xs font-bold text-white">{getOwnerInitials(item.owner)}</div><span className="font-medium text-slate-700">{item.owner || 'Not specified'}</span></div></td><td className="px-4 py-5 text-slate-700">{item.task || 'Not specified'}</td><td className="px-4 py-5 text-slate-700">{item.deadline || 'Not specified'}</td><td className="px-4 py-5"><span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${priorityClasses[priorityLevel]}`}>{priorityLabel}</span></td></tr>); }) : <tr><td colSpan="4" className="px-4 py-6 text-center text-slate-500">No action items found.</td></tr>}</tbody></table></div>
            </section>

            {result.follow_up_email ? <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-6 lg:p-7"><div className="mb-4 flex items-center gap-2 text-slate-900"><Mail size={18} className="text-emerald-600" /><h3 className="text-2xl font-semibold">Follow-Up Email</h3></div><div className="rounded-2xl border border-stone-200 bg-stone-50 p-5"><p className="whitespace-pre-wrap text-sm leading-7 text-slate-700 md:text-base">{result.follow_up_email}</p></div><button type="button" onClick={handleCopyEmail} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 sm:w-auto"><Mail size={16} />Copy Email</button>{copyMessage ? <div className="mt-3 text-sm font-semibold text-emerald-700">{copyMessage}</div> : null}</section> : null}

            <section id="how-it-works" className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-6 lg:p-7"><div className="mb-6 flex flex-wrap items-center justify-between gap-3"><h3 className="text-xl font-semibold text-slate-900">Automation Flow</h3><span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" /> ACTIVE</span></div><div className="flex flex-col items-center gap-3 lg:flex-row lg:items-start lg:justify-between">{flowSteps.map((step, index) => { const Icon = step.icon; const isLast = index === flowSteps.length - 1; return (<React.Fragment key={step.label}><div className="flex w-full flex-col items-center text-center lg:w-auto lg:flex-1"><div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-600"><Icon size={22} /></div><p className="max-w-[160px] text-xs font-medium text-slate-600 sm:text-sm">{step.label}</p></div>{!isLast ? <><div className="my-2 h-7 w-px bg-gradient-to-b from-stone-300 to-stone-400 lg:hidden" /><div className="mx-2 hidden items-center lg:flex"><div className="h-px w-12 bg-stone-300" /><ArrowRight size={14} className="ml-1 text-stone-400" /></div></> : null}</React.Fragment>); })}</div></section>
          </section>
        ) : null}

        <footer id="github" className="mt-10 pb-2 text-center text-xs text-slate-500 sm:mt-12 sm:text-sm">
          Built for faster meeting follow-through.
        </footer>
      </div>
    </main>
  );
}

export default App;
