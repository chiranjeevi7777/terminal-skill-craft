import { useState, useEffect } from 'react';

interface Frontmatter {
  name: string;
  description: string;
  risk: string;
  source: string;
  date_added: string;
}

interface Issue {
  type: 'error' | 'warning';
  message: string;
  id: string;
}

const DEFAULT_MARKDOWN_BODY = `## When to Use
- Describe under what circumstances this agent skill should be activated.
- Detail the typical input structure and expected outputs.

## Limitations
- State any boundary conditions or API quotas.
- List scenarios where this skill MUST NOT be invoked.
- Note any warning threshold or safety limit checks.`;

const STARTER_TEMPLATES: Record<string, { frontmatter: Frontmatter; body: string }> = {
  default: {
    frontmatter: {
      name: 'my-custom-skill',
      description: 'A brief description of what this skill accomplishes.',
      risk: 'none',
      source: 'local-author',
      date_added: new Date().toISOString().split('T')[0]
    },
    body: DEFAULT_MARKDOWN_BODY
  },
  offensive: {
    frontmatter: {
      name: 'offensive-recon-skill',
      description: 'An advanced exploration skill for security auditing.',
      risk: 'offensive',
      source: 'security-audit',
      date_added: new Date().toISOString().split('T')[0]
    },
    body: `> AUTHORIZED USE ONLY
> Compliance with local security testing regulations is strictly mandatory.

## When to Use
- Use this skill only during authorized penetration testing phases.
- Target assets within the approved scope boundaries.

## Limitations
- Strictly prohibited on production networks without clear written authorization.
- Stop execution if active protection defenses block requests.`
  },
  critical: {
    frontmatter: {
      name: 'production-db-migrations',
      description: 'Applies critical changes to database schemas.',
      risk: 'critical',
      source: 'database-operations',
      date_added: new Date().toISOString().split('T')[0]
    },
    body: `## When to Use
- Trigger during scheduled database maintenance windows.
- Ensure automated database backups are verified before launching.

## Limitations
- Risk tier critical: Must verify backup logs.
- Do not run when active connection loads exceed 80%.`
  }
};

function App() {
  // App Core State
  const [frontmatter, setFrontmatter] = useState<Frontmatter>(STARTER_TEMPLATES.default.frontmatter);
  const [markdownBody, setMarkdownBody] = useState<string>(STARTER_TEMPLATES.default.body);
  const [drafts, setDrafts] = useState<string[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('default');
  const [toast, setToast] = useState<string | null>(null);

  // Load existing drafts from local storage on startup
  useEffect(() => {
    refreshDraftList();
  }, []);

  const refreshDraftList = () => {
    const list: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('skill_draft_')) {
        list.push(key.replace('skill_draft_', ''));
      }
    }
    setDrafts(list);
  };

  // Auto-save draft on metadata or content change
  useEffect(() => {
    if (frontmatter.name) {
      const draftData = JSON.stringify({ frontmatter, markdownBody });
      localStorage.setItem(`skill_draft_${frontmatter.name}`, draftData);
      refreshDraftList();
    }
  }, [frontmatter, markdownBody]);

  // Load selected draft
  const loadDraft = (name: string) => {
    const raw = localStorage.getItem(`skill_draft_${name}`);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setFrontmatter(parsed.frontmatter);
        setMarkdownBody(parsed.markdownBody);
        showToast(`Loaded draft: ${name}`);
      } catch (e) {
        console.error('Failed to parse draft', e);
      }
    }
  };

  // Delete draft
  const deleteDraft = (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete the draft "${name}"?`)) {
      localStorage.removeItem(`skill_draft_${name}`);
      refreshDraftList();
      showToast(`Deleted draft: ${name}`);
    }
  };

  // Load template
  const loadTemplate = (key: string) => {
    const template = STARTER_TEMPLATES[key];
    if (template) {
      setFrontmatter({ ...template.frontmatter });
      setMarkdownBody(template.body);
      setSelectedTemplate(key);
      showToast(`Loaded ${key} template`);
    }
  };

  // Compile final markdown file contents
  const compileMarkdown = (): string => {
    const safeDesc = (frontmatter.description || '').replace(/"/g, '\\"');
    const safeName = (frontmatter.name || '').trim();
    const safeSource = (frontmatter.source || '').trim();
    const safeDate = (frontmatter.date_added || '').trim();
    const safeRisk = frontmatter.risk;

    return `---
name: ${safeName}
description: "${safeDesc}"
risk: ${safeRisk}
source: ${safeSource}
date_added: ${safeDate}
---

# ${safeName}

${markdownBody}`;
  };

  // Toast Helper
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  // Clipboard Copier
  const copyToClipboard = async () => {
    const text = compileMarkdown();
    try {
      await navigator.clipboard.writeText(text);
      showToast('Copied compiled SKILL.md to clipboard!');
    } catch {
      showToast('Copy failed. Please copy manually from the editor.');
    }
  };

  // Downloader
  const downloadFile = () => {
    const text = compileMarkdown();
    const blob = new Blob([text], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'SKILL.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Downloaded SKILL.md file!');
  };

  // Linter Engine Implementation
  const runLinter = (): Issue[] => {
    const issues: Issue[] = [];

    // Rule 1: Name validation
    if (!frontmatter.name.trim()) {
      issues.push({
        type: 'error',
        message: 'YAML frontmatter "name" property is empty.',
        id: 'err-name-empty'
      });
    } else {
      const slugRegex = /^[a-z0-9-_]+$/;
      if (!slugRegex.test(frontmatter.name)) {
        issues.push({
          type: 'error',
          message: 'Name slug must contain only lowercase letters, numbers, hyphens, and underscores.',
          id: 'err-name-format'
        });
      }
    }

    // Rule 2: Description length boundaries
    const descLength = (frontmatter.description || '').length;
    if (!descLength) {
      issues.push({
        type: 'error',
        message: 'YAML frontmatter "description" is required.',
        id: 'err-desc-empty'
      });
    } else if (descLength > 200) {
      issues.push({
        type: 'error',
        message: `Description exceeds the absolute limit of 200 chars (currently ${descLength} chars).`,
        id: 'err-desc-max'
      });
    } else if (descLength > 100) {
      issues.push({
        type: 'warning',
        message: `Description exceeds recommendation of 100 chars (currently ${descLength} chars).`,
        id: 'warn-desc-length'
      });
    }

    // Rule 3: Heading validation
    const hasWhenToUse = /## When to Use/i.test(markdownBody);
    if (!hasWhenToUse) {
      issues.push({
        type: 'warning',
        message: 'Missing "## When to Use" section. This structure guides universal execution logic.',
        id: 'warn-when-to-use'
      });
    }

    const hasLimitations = /## Limitations/i.test(markdownBody);
    if (!hasLimitations) {
      issues.push({
        type: 'warning',
        message: 'Missing "## Limitations" section. Recommended to outline safety bounds.',
        id: 'warn-limitations'
      });
    }

    // Rule 4: Offensive Warning Disclaimer check
    if (frontmatter.risk === 'offensive') {
      const hasDisclaimer = /AUTHORIZED USE ONLY/i.test(markdownBody);
      if (!hasDisclaimer) {
        issues.push({
          type: 'error',
          message: 'Offensive risk levels must contain the string "AUTHORIZED USE ONLY" in the body.',
          id: 'err-offensive-disclaimer'
        });
      }
    }

    return issues;
  };

  const activeIssues = runLinter();
  const errors = activeIssues.filter(i => i.type === 'error');
  const warnings = activeIssues.filter(i => i.type === 'warning');

  // Basic regex parser for rendering preview markdown cleanly
  const parseMarkdownToHtml = (text: string): string => {
    let html = text;

    // Escapes HTML tags to prevent XSS in rendering
    html = html
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Header conversions
    html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.*?)$/gm, '<h1>$1</h1>');

    // Blockquote conversion
    html = html.replace(/^> (.*?)$/gm, '<blockquote>$1</blockquote>');
    // Group adjacent blockquotes
    html = html.replace(/<\/blockquote>\s*<blockquote>/g, '<br/>');

    // List items conversion
    html = html.replace(/^\s*-\s+(.*?)$/gm, '<li>$1</li>');
    html = html.replace(/^\s*\*\s+(.*?)$/gm, '<li>$1</li>');
    // Wrap adjacent li lists in ul (simple approach)
    html = html.replace(/(<li>.*?<\/li>)+/g, '<ul>$&</ul>');

    // Bold text conversion
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Multi-line code block conversion
    html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');

    // Inline code conversion
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Double line break to paragraphs
    html = html.replace(/\n\n/g, '<br/><br/>');

    return html;
  };

  return (
    <div className="app-container">
      {/* Header Bar */}
      <header className="app-header">
        <div className="header-logo">
          <div className="logo-icon">S</div>
          <div>
            <h1 style={{ fontSize: '1.25rem', margin: 0 }}>SKILL.md Workspace</h1>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Linter & Compiler v1.0</span>
          </div>
        </div>

        <div className="header-actions">
          {/* Draft Dropdown selector */}
          {drafts.length > 0 && (
            <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.25rem' }}>
              <span className="form-label" style={{ whiteSpace: 'nowrap' }}>Load Draft:</span>
              <select
                id="drafts-dropdown"
                className="form-select"
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem', width: '150px' }}
                onChange={(e) => {
                  if (e.target.value) loadDraft(e.target.value);
                }}
                value=""
              >
                <option value="">-- Choose Draft --</option>
                {drafts.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              {frontmatter.name && drafts.includes(frontmatter.name) && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ padding: '0.35rem 0.5rem', fontSize: '0.85rem', backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: 'var(--color-offensive)' }}
                  onClick={(e) => deleteDraft(frontmatter.name, e)}
                  title="Delete current draft"
                >
                  🗑️
                </button>
              )}
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              id="btn-copy"
              className="btn btn-secondary"
              onClick={copyToClipboard}
              title="Copy formatted markdown content to clipboard"
            >
              📋 Copy Markdown
            </button>
            <button
              id="btn-download"
              className="btn btn-primary"
              onClick={downloadFile}
              title="Download content as SKILL.md"
            >
              📥 Download File
            </button>
          </div>
        </div>
      </header>

      {/* Grid Panels */}
      <main className="workspace-grid">
        {/* Panel 1: Frontmatter Form */}
        <section className="panel" aria-label="Frontmatter Controls">
          <div className="panel-header" data-index="1">
            <h2>Frontmatter Configuration</h2>
          </div>
          <div className="panel-body">
            {/* Template Chooser */}
            <div className="form-group">
              <label className="form-label" htmlFor="template-select">Starting Template</label>
              <select
                id="template-select"
                className="form-select"
                value={selectedTemplate}
                onChange={(e) => loadTemplate(e.target.value)}
              >
                <option value="default">Universal Skill (Safe)</option>
                <option value="critical">Critical Database Migration</option>
                <option value="offensive">Offensive Recon (Audit)</option>
              </select>
            </div>

            {/* Widgets Dashboard with Radar Status Ring */}
            <div className="summary-grid">
              <div className="radar-container" title="LINT RADAR SCANNER">
                <div className={`radar-sweep ${errors.length > 0 ? 'error' : (warnings.length > 0 ? 'warning' : 'ok')}`} />
                <span 
                  className="radar-core" 
                  style={{ 
                    color: errors.length > 0 ? 'var(--color-offensive)' : (warnings.length > 0 ? 'var(--color-critical)' : 'var(--color-none)') 
                  }}
                >
                  {errors.length > 0 ? 'ERR' : (warnings.length > 0 ? 'WRN' : 'SYS')}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1 }}>
                <div className="summary-card">
                  <span className={`summary-val ${errors.length > 0 ? 'error' : 'ok'}`}>
                    {errors.length}
                  </span>
                  <span className="summary-lbl">Errors</span>
                </div>
                <div className="summary-card">
                  <span className={`summary-val ${warnings.length > 0 ? 'warning' : 'ok'}`}>
                    {warnings.length}
                  </span>
                  <span className="summary-lbl">Warnings</span>
                </div>
              </div>
            </div>

            {/* Form Inputs */}
            <div className="form-group">
              <label className="form-label" htmlFor="input-name">Skill Name (slug)</label>
              <input
                id="input-name"
                type="text"
                className="form-input"
                value={frontmatter.name}
                onChange={(e) => setFrontmatter({ ...frontmatter, name: e.target.value })}
                placeholder="e.g. clean-code"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="input-desc">
                Description ({frontmatter.description.length}/200 chars)
              </label>
              <textarea
                id="input-desc"
                className="form-textarea"
                value={frontmatter.description}
                onChange={(e) => setFrontmatter({ ...frontmatter, description: e.target.value })}
                placeholder="Brief summary of the skill..."
                rows={3}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="select-risk">Risk Level</label>
              <select
                id="select-risk"
                className="form-select"
                value={frontmatter.risk}
                onChange={(e) => setFrontmatter({ ...frontmatter, risk: e.target.value })}
              >
                <option value="none">none (Totally safe guidance)</option>
                <option value="safe">safe (Normal developer guidance)</option>
                <option value="critical">critical (High safety, warnings budget)</option>
                <option value="offensive">offensive (Penetration auditing)</option>
                <option value="unknown">unknown</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="input-source">Source Name</label>
              <input
                id="input-source"
                type="text"
                className="form-input"
                value={frontmatter.source}
                onChange={(e) => setFrontmatter({ ...frontmatter, source: e.target.value })}
                placeholder="e.g. awesome-skills"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="input-date">Date Added</label>
              <input
                id="input-date"
                type="date"
                className="form-input"
                value={frontmatter.date_added}
                onChange={(e) => setFrontmatter({ ...frontmatter, date_added: e.target.value })}
              />
            </div>

            {/* Quick reset button */}
            <button
              id="btn-reset"
              className="btn btn-secondary"
              style={{ marginTop: 'auto' }}
              onClick={() => {
                if (confirm('Reset to starter default template? All unexported edits will be overwritten.')) {
                  loadTemplate('default');
                }
              }}
            >
              🔄 Reset to Default
            </button>
          </div>
        </section>

        {/* Panel 2: Code Editor & Lint Output */}
        <section className="panel" aria-label="Editor & Console Panel">
          <div className="panel-header" data-index="2">
            <h2>Markdown Body (Instructions)</h2>
          </div>
          <div className="editor-wrapper">
            <textarea
              id="editor-body"
              className="code-textarea"
              value={markdownBody}
              onChange={(e) => setMarkdownBody(e.target.value)}
              placeholder="Write your markdown structure here..."
            />

            {/* Real-time linter console */}
            <div className="linter-console">
              <div className="linter-console-header">
                <span>Linter Rules Console</span>
                <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                  {activeIssues.length === 0 ? '✔️ Clean Build' : `⚠️ ${activeIssues.length} issues detected`}
                </span>
              </div>
              <div className="issues-list" id="linter-console-issues">
                {activeIssues.length === 0 ? (
                  <div style={{ color: 'var(--color-none)', fontSize: '0.9rem', textAlign: 'center', padding: '1rem' }}>
                    🎉 Ready to Publish! Your SKILL.md meets all compliance standards.
                  </div>
                ) : (
                  activeIssues.map((issue) => (
                    <div key={issue.id} className={`issue-item ${issue.type}`}>
                      <span className="issue-icon">{issue.type === 'error' ? '❌' : '⚠️'}</span>
                      <span>{issue.message}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Panel 3: Complied preview */}
        <section className="panel" aria-label="Live HTML Render Preview">
          <div className="panel-header" data-index="3">
            <h2>Live Compiled Preview</h2>
          </div>
          <div className="panel-body" style={{ padding: 0 }}>
            {/* Render Compiled YAML Frontmatter Code Block */}
            <div style={{ padding: '1.5rem 1.5rem 0 1.5rem' }}>
              <span className="form-label" style={{ display: 'block', marginBottom: '0.5rem' }}>Compiled Frontmatter Headers</span>
              <div className="yaml-raw-block" id="compiled-frontmatter">
                {`---
name: ${frontmatter.name}
description: "${frontmatter.description}"
risk: ${frontmatter.risk}
source: ${frontmatter.source}
date_added: ${frontmatter.date_added}
---`}
              </div>
            </div>

            <div className="preview-content" id="preview-html-content">
              <h1>{frontmatter.name || 'Untitled Skill'}</h1>
              <div
                dangerouslySetInnerHTML={{
                  __html: parseMarkdownToHtml(markdownBody)
                }}
              />
            </div>
          </div>
        </section>
      </main>

      {/* Toast popup */}
      {toast && (
        <div className="toast-msg animate-toast" id="app-toast-alert">
          <span>💡</span>
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}

export default App;
