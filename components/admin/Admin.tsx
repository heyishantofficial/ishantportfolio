'use client';

// heyishant.com/admin: log in, edit, publish.
// Edits are saved on the server as "unpublished changes". Publish turns them into
// one commit on GitHub; Dokploy rebuilds the site, and this page watches
// /cms-version.txt until the new version is live.

import { useCallback, useEffect, useRef, useState } from 'react';
import { SmileyFace } from '@/components/ui';
import { api, ApiError, saveDoc, type CmsState, type DocKey } from './api';
import { CasesEditor, JourneyEditor, SiteEditor } from './DocEditors';
import { CmsContext, type Ctx } from './fields';
import { PostEditor } from './PostEditor';
import { WorkEditor } from './WorkEditor';

const TABS = [
  { id: 'work', label: 'Work' },
  { id: 'writing', label: 'Writing' },
  { id: 'cases', label: 'Case studies' },
  { id: 'journey', label: 'Journey' },
  { id: 'site', label: 'Site text' },
] as const;
type Tab = (typeof TABS)[number]['id'];

type Toast = { id: number; text: string; kind: 'ok' | 'error' };
type Deploy = { id: string; url: string | null; started: number; live: boolean; local: boolean };

function Login({ onIn }: { onIn: () => void }) {
  const [key, setKey] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <main className="cms-login">
      <form
        className="cms-card"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError('');
          try {
            await api('POST', '/login', { key });
            onIn();
          } catch (err) {
            setError((err as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <SmileyFace className="smiley cms-smiley" />
        <h1 className="px">admin</h1>
        <p className="cms-muted">Log in with your password or your media key.</p>
        {/* A username helps password managers file this login. */}
        <input type="text" name="username" autoComplete="username" value="heyishant-admin" readOnly hidden />
        <label className="cms-label" htmlFor="cms-key">
          Password or media key
        </label>
        <input id="cms-key" name="password" type="password" autoComplete="current-password" autoFocus value={key} onChange={(e) => setKey(e.target.value)} />
        {error ? <p className="cms-error">{error}</p> : null}
        <button className="cms-btn" disabled={busy || !key}>
          {busy ? 'Checking…' : 'Log in'}
        </button>
      </form>
    </main>
  );
}

function PublishBar({ state, onPublished, onDiscarded, toast }: { state: CmsState; onPublished: (d: Deploy) => void; onDiscarded: () => void; toast: Ctx['toast'] }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<string[] | null>(null);
  const n = state.pending.count;
  if (!n) return null;

  const publish = async (force = false) => {
    setBusy(true);
    setErrors(null);
    try {
      const r = await api<{ id: string; url: string | null; mode: string; at: string }>('POST', '/publish', { force });
      onPublished({ id: r.id, url: r.url, started: Date.parse(r.at), live: r.mode === 'local', local: r.mode === 'local' });
    } catch (err) {
      if (err instanceof ApiError && Array.isArray(err.data.conflicts)) {
        const files = (err.data.conflicts as string[]).map((f) => `• ${f}`).join('\n');
        if (window.confirm(`These files were also changed on GitHub after you started editing:\n\n${files}\n\nPublish yours anyway? Your version replaces theirs for these files (everything else they changed is kept).`)) {
          setBusy(false);
          return publish(true);
        }
      } else if (err instanceof ApiError && Array.isArray(err.data.errors)) {
        setErrors(err.data.errors as string[]);
        setOpen(true);
      } else toast((err as Error).message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="cms-publish">
      {open ? (
        <div className="cms-publish-list">
          {errors ? (
            <div className="cms-error-box">
              <b>Fix these before publishing:</b>
              <ul>
                {errors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            </div>
          ) : null}
          <b>Unpublished changes</b>
          <ul>
            {state.pending.notes.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
      ) : null}
      <div className="cms-publish-row">
        <button type="button" className="cms-link" onClick={() => setOpen(!open)} aria-expanded={open}>
          <span className="dot" aria-hidden="true" /> {n} unpublished {n === 1 ? 'change' : 'changes'} {open ? '▾' : '▸'}
        </button>
        <div className="cms-row">
          <button
            type="button"
            className="cms-btn ghost small"
            disabled={busy}
            onClick={async () => {
              if (!window.confirm('Throw away every unpublished change? This can’t be undone.')) return;
              await api('POST', '/discard', {});
              onDiscarded();
            }}
          >
            Discard all
          </button>
          <button type="button" className="cms-btn" disabled={busy} onClick={() => publish()}>
            {busy ? 'Publishing…' : state.mode === 'local' ? 'Write to files' : 'Publish'}
          </button>
        </div>
      </div>
    </div>
  );
}

function DeployWatch({ deploy, onClose }: { deploy: Deploy; onClose: () => void }) {
  const [now, setNow] = useState(() => Date.now());
  const [live, setLive] = useState(deploy.live);
  useEffect(() => {
    if (live) return;
    let stop = false;
    const tick = async () => {
      setNow(Date.now());
      try {
        const r = await fetch(`/cms-version.txt?t=${Date.now()}`, { cache: 'no-store' });
        if (r.ok && (await r.text()).trim() === deploy.id) setLive(true);
      } catch {}
    };
    const t = setInterval(() => !stop && tick(), 5000);
    void tick();
    return () => {
      stop = true;
      clearInterval(t);
    };
  }, [deploy.id, live]);
  const secs = Math.round((now - deploy.started) / 1000);
  const slow = secs > 600;
  return (
    <div className={`cms-deploy${live ? ' live' : ''}`} role="status">
      {deploy.local ? (
        <p>
          <b>Written to your local files.</b> Run <code>npm run build</code> to see them, and commit when you’re happy.
        </p>
      ) : live ? (
        <p>
          <b>It’s live ✓</b>{' '}
          <a href="/" target="_blank" rel="noopener">
            Open the site ↗
          </a>
        </p>
      ) : (
        <p>
          <span className="cms-spinner" aria-hidden="true" /> <b>Publishing…</b> The site is rebuilding ({Math.floor(secs / 60)}:{String(secs % 60).padStart(2, '0')}). It usually takes about 3 minutes.
          {slow ? ' This is taking longer than usual: check the deploy log in Dokploy.' : ''}
        </p>
      )}
      {deploy.url ? (
        <a className="cms-muted" href={deploy.url} target="_blank" rel="noopener">
          the commit on GitHub ↗
        </a>
      ) : null}
      <button type="button" className="cms-link" onClick={onClose} aria-label="Hide">
        ✕
      </button>
    </div>
  );
}

export function Admin() {
  const [auth, setAuth] = useState<'checking' | 'out' | 'in'>('checking');
  const [state, setState] = useState<CmsState | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('work');
  const [dirty, setDirty] = useState(false);
  const [version, setVersion] = useState(0);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [deploy, setDeploy] = useState<Deploy | null>(null);
  const toastId = useRef(0);

  const toast = useCallback<Ctx['toast']>((text, kind = 'ok') => {
    const id = ++toastId.current;
    setToasts((t) => [...t, { id, text, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), kind === 'error' ? 9000 : 3500);
  }, []);

  const load = useCallback(async () => {
    try {
      const s = await api<CmsState>('GET', '/state');
      setState(s);
      setLoadError(null);
      return s;
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) setAuth('out');
      else setLoadError((err as Error).message);
      return null;
    }
  }, []);

  useEffect(() => {
    // The tab lives in the address (#writing), so a reload stays put.
    const fromHash = window.location.hash.slice(1);
    // oxlint-disable-next-line react/set-state-in-effect
    if (TABS.some((t) => t.id === fromHash)) setTab(fromHash as Tab);
    api<{ ok: boolean }>('GET', '/session')
      .then(async (s) => {
        if (!s.ok) return setAuth('out');
        setAuth('in');
        const st = await load();
        // Came back while a publish was still rebuilding? Keep watching it.
        if (st?.last && st.last.mode !== 'local' && Date.now() - Date.parse(st.last.at) < 15 * 60_000) {
          const live = await fetch(`/cms-version.txt?t=${Date.now()}`, { cache: 'no-store' })
            .then((r) => (r.ok ? r.text() : ''))
            .catch(() => '');
          if (live.trim() !== st.last.id) setDeploy({ id: st.last.id, url: st.last.url, started: Date.parse(st.last.at), live: false, local: false });
        }
      })
      .catch(() => setAuth('out'));
  }, [load]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const refresh = useCallback(async () => {
    await load();
  }, [load]);

  const save = useCallback<Ctx['save']>(
    async (doc: DocKey, data, note) => {
      if (!state) return false;
      try {
        await saveDoc(doc, data, state.docs[doc].base, note);
        await load();
        toast('Saved. Publish when you’re ready.');
        return true;
      } catch (err) {
        toast((err as Error).message, 'error');
        return false;
      }
    },
    [state, load, toast],
  );

  if (auth === 'checking') return <main className="cms-loading">Loading…</main>;
  if (auth === 'out')
    return (
      <Login
        onIn={() => {
          setAuth('in');
          void load();
        }}
      />
    );

  const switchTab = (t: Tab) => {
    if (t === tab) return;
    if (dirty && !window.confirm('Leave without saving these edits?')) return;
    setDirty(false);
    setTab(t);
    setVersion((v) => v + 1);
    history.replaceState(null, '', `#${t}`);
  };

  return (
    <div className="cms">
      <header className="cms-top">
        <a href="/" className="cms-brand" target="_blank" rel="noopener">
          <SmileyFace className="smiley smiley-sm" />
          <span className="px">admin</span>
        </a>
        <nav className="cms-tabs" aria-label="Sections">
          {TABS.map((t) => (
            <button key={t.id} type="button" aria-current={tab === t.id ? 'page' : undefined} onClick={() => switchTab(t.id)}>
              {t.label}
            </button>
          ))}
        </nav>
        <button
          type="button"
          className="cms-btn ghost small"
          onClick={async () => {
            if (dirty && !window.confirm('Leave without saving these edits?')) return;
            await api('POST', '/logout', {});
            setAuth('out');
            setState(null);
          }}
        >
          Log out
        </button>
      </header>

      {state?.mode === 'local' ? <p className="cms-banner">Local mode: publishing writes into this folder’s files instead of GitHub.</p> : null}
      {deploy ? <DeployWatch key={deploy.id} deploy={deploy} onClose={() => setDeploy(null)} /> : null}

      <main className="cms-main">
        {loadError ? (
          <div className="cms-card cms-error-box">
            <b>Can’t load the content.</b>
            <p>{loadError}</p>
            <button type="button" className="cms-btn" onClick={() => void load()}>
              Try again
            </button>
          </div>
        ) : !state ? (
          <p className="cms-loading">Loading the site’s content…</p>
        ) : (
          <CmsContext.Provider value={{ state, refresh, toast, save }}>
            <div key={`${tab}-${version}`}>
              {tab === 'work' ? <WorkEditor onDirty={setDirty} /> : null}
              {tab === 'writing' ? <PostEditor onDirty={setDirty} /> : null}
              {tab === 'cases' ? <CasesEditor onDirty={setDirty} /> : null}
              {tab === 'journey' ? <JourneyEditor onDirty={setDirty} /> : null}
              {tab === 'site' ? <SiteEditor onDirty={setDirty} /> : null}
            </div>
          </CmsContext.Provider>
        )}
      </main>

      {state ? (
        <PublishBar
          state={state}
          toast={toast}
          onPublished={(d) => {
            setDeploy(d);
            setVersion((v) => v + 1);
            void load();
          }}
          onDiscarded={() => {
            setDirty(false);
            setVersion((v) => v + 1);
            void load();
            toast('Unpublished changes thrown away.');
          }}
        />
      ) : null}

      <div className="cms-toasts" aria-live="polite">
        {toasts.map((t) => (
          <p key={t.id} className={`cms-toast ${t.kind}`}>
            {t.text}
          </p>
        ))}
      </div>
    </div>
  );
}
