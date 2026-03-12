import React, { useState } from 'react';

function App() {
  const [transcript, setTranscript] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [copyMessage, setCopyMessage] = useState('');

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

  const getPriorityLevel = (deadline) => {
    const value = String(deadline || '').trim().toLowerCase();

    if (!value || value.includes('not specified')) {
      return 'low';
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
  };

  const styles = {
    page: {
      minHeight: '100vh',
      margin: 0,
      padding: '40px 20px',
      background: '#f5f7fb',
      fontFamily: 'Arial, sans-serif',
      color: '#1f2937',
    },
    container: {
      maxWidth: '900px',
      margin: '0 auto',
      background: '#ffffff',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)',
    },
    title: {
      marginTop: 0,
      marginBottom: '8px',
      fontSize: '2rem',
    },
    subtitle: {
      marginTop: 0,
      marginBottom: '20px',
      color: '#4b5563',
    },
    label: {
      display: 'block',
      marginBottom: '8px',
      fontWeight: 'bold',
    },
    templateRow: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '8px',
      marginBottom: '14px',
    },
    templateButton: {
      background: '#eef2ff',
      color: '#1e3a8a',
      border: '1px solid #c7d2fe',
      borderRadius: '999px',
      padding: '8px 12px',
      fontSize: '0.9rem',
      cursor: 'pointer',
    },
    textarea: {
      width: '100%',
      minHeight: '220px',
      padding: '14px',
      borderRadius: '12px',
      border: '1px solid #d1d5db',
      fontSize: '1rem',
      resize: 'vertical',
      boxSizing: 'border-box',
      marginBottom: '16px',
    },
    button: {
      background: '#2563eb',
      color: '#ffffff',
      border: 'none',
      borderRadius: '10px',
      padding: '12px 18px',
      fontSize: '1rem',
      cursor: loading ? 'not-allowed' : 'pointer',
      opacity: loading ? 0.7 : 1,
    },
    secondaryButton: {
      marginTop: '12px',
      background: '#111827',
      color: '#ffffff',
      border: 'none',
      borderRadius: '10px',
      padding: '10px 14px',
      fontSize: '0.95rem',
      cursor: 'pointer',
    },
    message: {
      marginTop: '16px',
      padding: '12px 14px',
      borderRadius: '10px',
      background: '#fef3c7',
      color: '#92400e',
    },
    error: {
      marginTop: '16px',
      padding: '12px 14px',
      borderRadius: '10px',
      background: '#fee2e2',
      color: '#b91c1c',
    },
    success: {
      marginTop: '10px',
      color: '#166534',
      fontSize: '0.95rem',
      fontWeight: 'bold',
    },
    resultCard: {
      marginTop: '24px',
      padding: '20px',
      borderRadius: '14px',
      background: '#f9fafb',
      border: '1px solid #e5e7eb',
    },
    sectionTitle: {
      marginBottom: '8px',
    },
    list: {
      paddingLeft: '20px',
    },
    tableWrapper: {
      overflowX: 'auto',
      background: '#ffffff',
      border: '1px solid #e5e7eb',
      borderRadius: '10px',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
    },
    tableHead: {
      background: '#f3f4f6',
    },
    tableHeader: {
      padding: '12px',
      textAlign: 'left',
      borderBottom: '1px solid #e5e7eb',
      fontSize: '0.95rem',
    },
    tableCell: {
      padding: '12px',
      borderBottom: '1px solid #e5e7eb',
      verticalAlign: 'top',
    },
    emailBox: {
      marginTop: '8px',
      padding: '14px',
      background: '#ffffff',
      border: '1px solid #e5e7eb',
      borderRadius: '10px',
    },
    emailText: {
      margin: 0,
      whiteSpace: 'pre-wrap',
      color: '#1f2937',
      lineHeight: 1.5,
    },
    flowSection: {
      marginTop: '20px',
      padding: '20px',
      borderRadius: '14px',
      background: '#f9fafb',
      border: '1px solid #e5e7eb',
    },
    flowTitle: {
      marginTop: 0,
      marginBottom: '14px',
    },
    flowStep: {
      background: '#ffffff',
      border: '1px solid #e5e7eb',
      borderRadius: '10px',
      padding: '12px 14px',
      fontWeight: 500,
    },
    flowArrow: {
      textAlign: 'center',
      color: '#6b7280',
      margin: '6px 0',
      fontSize: '1.1rem',
    },
  };

  return (
    <div style={styles.page}>
      <style>
        {`
          .priority-badge {
            display: inline-block;
            border-radius: 999px;
            padding: 3px 10px;
            font-size: 0.8rem;
            font-weight: 700;
            color: #ffffff;
          }

          .priority-high {
            background: #dc2626;
          }

          .priority-medium {
            background: #f59e0b;
          }

          .priority-low {
            background: #16a34a;
          }
        `}
      </style>
      <div style={styles.container}>
        <h1 style={styles.title}>Meeting Follow-Up AI</h1>
        <p style={styles.subtitle}>
          Paste a meeting transcript, click the button, and get a simple follow-up summary.
        </p>

        <label htmlFor="transcript" style={styles.label}>
          Meeting transcript
        </label>
        <div style={styles.templateRow}>
          {Object.keys(transcriptTemplates).map((templateName) => (
            <button
              key={templateName}
              type="button"
              style={styles.templateButton}
              onClick={() => handleTemplateSelect(templateName)}
            >
              {templateName}
            </button>
          ))}
        </div>
        <textarea
          id="transcript"
          style={styles.textarea}
          placeholder="Paste your meeting transcript here..."
          value={transcript}
          onChange={(event) => setTranscript(event.target.value)}
        />

        <button type="button" style={styles.button} onClick={handleGenerate} disabled={loading}>
          {loading ? 'Generating...' : 'Generate Follow-Up'}
        </button>

        {error ? <div style={styles.error}>{error}</div> : null}
        {loading ? <div style={styles.message}>Analyzing transcript...</div> : null}

        {result ? (
          <>
            <div style={styles.resultCard}>
              <h2 style={styles.sectionTitle}>{result.meeting_title || 'Meeting Result'}</h2>

              {result.summary ? (
                <>
                  <h3 style={styles.sectionTitle}>Summary</h3>
                  <p>{result.summary}</p>
                </>
              ) : null}

              {Array.isArray(result.decisions) && result.decisions.length > 0 ? (
                <>
                  <h3 style={styles.sectionTitle}>Decisions</h3>
                  <ul style={styles.list}>
                    {result.decisions.map((decision, index) => (
                      <li key={index}>{decision}</li>
                    ))}
                  </ul>
                </>
              ) : null}

              {Array.isArray(result.action_items) && result.action_items.length > 0 ? (
                <>
                  <h3 style={styles.sectionTitle}>Action Items</h3>
                  <div style={styles.tableWrapper}>
                    <table style={styles.table}>
                      <thead style={styles.tableHead}>
                        <tr>
                          <th style={styles.tableHeader}>Owner</th>
                          <th style={styles.tableHeader}>Task</th>
                          <th style={styles.tableHeader}>Deadline</th>
                          <th style={styles.tableHeader}>Priority</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.action_items.map((item, index) => (
                          <tr key={index}>
                            <td style={styles.tableCell}>{item.owner || 'Not specified'}</td>
                            <td style={styles.tableCell}>{item.task || 'Not specified'}</td>
                            <td style={styles.tableCell}>{item.deadline || 'Not specified'}</td>
                            <td style={styles.tableCell}>
                              {(() => {
                                const priorityLevel = getPriorityLevel(item.deadline);
                                const priorityLabel =
                                  priorityLevel.charAt(0).toUpperCase() + priorityLevel.slice(1);

                                return (
                                  <span className={`priority-badge priority-${priorityLevel}`}>
                                    {priorityLabel}
                                  </span>
                                );
                              })()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : null}

              {result.follow_up_email ? (
                <>
                  <h3 style={styles.sectionTitle}>Follow-Up Email</h3>
                  <div style={styles.emailBox}>
                    <p style={styles.emailText}>{result.follow_up_email}</p>
                  </div>
                  <button type="button" style={styles.secondaryButton} onClick={handleCopyEmail}>
                    Copy Email
                  </button>
                  {copyMessage ? <div style={styles.success}>{copyMessage}</div> : null}
                </>
              ) : null}
            </div>

            <div style={styles.flowSection}>
              <h3 style={styles.flowTitle}>Automation Flow</h3>
              <div style={styles.flowStep}>1. Meeting Transcript Input</div>
              <div style={styles.flowArrow}>↓</div>
              <div style={styles.flowStep}>2. AI Summarizes Meeting</div>
              <div style={styles.flowArrow}>↓</div>
              <div style={styles.flowStep}>3. Extract Decisions</div>
              <div style={styles.flowArrow}>↓</div>
              <div style={styles.flowStep}>4. Extract Action Items</div>
              <div style={styles.flowArrow}>↓</div>
              <div style={styles.flowStep}>5. Generate Follow-Up Email</div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

export default App;
