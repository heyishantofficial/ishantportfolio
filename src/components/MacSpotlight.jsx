import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, Folder, Music, FileText, Globe, Sparkles, X } from 'lucide-react';
import NodeIcon from '../os/NodeIcon';
import { getPath, searchNodes } from '../data/ishantOS';
import { playSpotlightSound, playMacClick } from '../utils/macAudioEngine';

// What each node kind is called in the results list.
const GROUP_FOR_KIND = {
  folder: 'FOLDERS',
  text: 'DOCUMENTS',
  project: 'WORK',
  pdf: 'DOCUMENTS',
  mail: 'CONTACT',
  link: 'CONTACT'
};

export default function MacSpotlight({ onClose, onLaunchApp, onOpenNode, isMuted }) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const listRef = useRef(null);

  useEffect(() => {
    playSpotlightSound(isMuted);
  }, [isMuted]);

  // Apps stay searchable alongside the portfolio content — Spotlight should
  // find the Terminal as readily as it finds a case study.
  const apps = useMemo(() => ([
    { id: 'app-finder', title: 'Finder', subtitle: 'Browse everything on this Mac', group: 'APPLICATIONS', icon: Folder, action: () => onLaunchApp('finder') },
    { id: 'app-safari', title: 'Safari', subtitle: "Ishant's internet", group: 'APPLICATIONS', icon: Globe, action: () => onLaunchApp('safari') },
    { id: 'app-notes', title: 'Notes', subtitle: 'Scratchpad', group: 'APPLICATIONS', icon: FileText, action: () => onLaunchApp('notes') },
    { id: 'app-ipod', title: 'Music', subtitle: 'iPod Classic', group: 'APPLICATIONS', icon: Music, action: () => onLaunchApp('ipod') },
    { id: 'app-system', title: 'About This Mac', subtitle: 'System information', group: 'APPLICATIONS', icon: Sparkles, action: () => onLaunchApp('system-info') }
  ]), [onLaunchApp]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const nodeHits = searchNodes(query).slice(0, 14).map((node) => ({
      id: `node-${node.id}`,
      title: node.name,
      // A generic "Text file" says nothing; where it lives says a lot.
      subtitle: node.kind === 'text'
        ? getPath(node.id).slice(1, -1).map((p) => p.name).join(' / ')
        : node.description,
      group: GROUP_FOR_KIND[node.kind] || 'ITEMS',
      node,
      action: () => onOpenNode(node)
    }));

    const appHits = apps.filter(
      (a) => a.title.toLowerCase().includes(q) || a.subtitle.toLowerCase().includes(q)
    );

    return [...nodeHits, ...appHits];
  }, [query, apps, onOpenNode]);

  useEffect(() => { setSelectedIndex(0); }, [query]);

  useEffect(() => {
    listRef.current?.querySelector('[data-selected="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  const run = (item) => {
    if (!item) return;
    playMacClick(isMuted);
    item.action();
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => (results.length ? (i + 1) % results.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => (results.length ? (i - 1 + results.length) % results.length : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      run(results[selectedIndex]);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  // The first hit gets the "TOP HIT" treatment; the rest are grouped by kind.
  const [topHit, ...rest] = results;
  const groups = rest.reduce((acc, item) => {
    (acc[item.group] ||= []).push(item);
    return acc;
  }, {});

  const indexOf = (item) => results.findIndex((r) => r.id === item.id);

  return (
    <div className="fixed inset-0 z-[99990] bg-black/40 backdrop-blur-md flex items-start justify-center pt-24 px-4" onClick={onClose}>
      <div
        className="w-full max-w-xl bg-white/85 dark:bg-slate-900/90 backdrop-blur-3xl rounded-2xl shadow-2xl border border-white/50 dark:border-slate-700/60 overflow-hidden text-slate-800 dark:text-slate-100 font-sans animate-fadeIn select-none"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Spotlight Search"
      >
        <div className="p-3.5 flex items-center gap-3 border-b border-slate-200/60 dark:border-slate-700/60">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search Ishant's Mac"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            aria-label="Search Ishant's Mac"
            className="w-full bg-transparent border-none outline-none text-sm font-medium placeholder:text-slate-400"
          />
          <button onClick={onClose} aria-label="Close search" className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div ref={listRef} className="max-h-80 overflow-y-auto p-2">
          {!query.trim() ? (
            <p className="p-6 text-center text-[11px] text-slate-400">
              Search experience, work, AI projects, documents and apps.
            </p>
          ) : results.length === 0 ? (
            <p className="p-6 text-center text-[11px] text-slate-400">
              No matching items found for &ldquo;{query}&rdquo;.
            </p>
          ) : (
            <>
              <Group label="TOP HIT">
                <Row item={topHit} isSelected={selectedIndex === 0} onHover={() => setSelectedIndex(0)} onRun={() => run(topHit)} />
              </Group>

              {Object.entries(groups).map(([label, items]) => (
                <Group key={label} label={label}>
                  {items.map((item) => {
                    const i = indexOf(item);
                    return (
                      <Row
                        key={item.id}
                        item={item}
                        isSelected={selectedIndex === i}
                        onHover={() => setSelectedIndex(i)}
                        onRun={() => run(item)}
                      />
                    );
                  })}
                </Group>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Group({ label, children }) {
  return (
    <section className="mb-1">
      <h3 className="px-2.5 py-1.5 text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">{label}</h3>
      <div className="space-y-0.5">{children}</div>
    </section>
  );
}

function Row({ item, isSelected, onHover, onRun }) {
  if (!item) return null;
  const FallbackIcon = item.icon;

  return (
    <button
      data-selected={isSelected}
      onMouseEnter={onHover}
      onClick={onRun}
      className={`w-full text-left px-2.5 py-2 rounded-xl flex items-center gap-3 transition-colors ${
        isSelected ? 'bg-[var(--os-accent)] text-white' : 'hover:bg-black/5 dark:hover:bg-white/10'
      }`}
    >
      {item.node ? (
        <NodeIcon node={item.node} size={26} />
      ) : (
        <span className={`w-[26px] h-[26px] rounded-lg flex items-center justify-center shrink-0 ${isSelected ? 'bg-white/20' : 'bg-black/5 dark:bg-white/10'}`}>
          <FallbackIcon className="w-3.5 h-3.5" />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className={`block text-[12px] font-bold truncate ${isSelected ? 'text-white' : 'text-slate-800 dark:text-slate-100'}`}>
          {item.title}
        </span>
        {item.subtitle && (
          <span className={`block text-[10px] truncate ${isSelected ? 'text-white/80' : 'text-slate-500'}`}>
            {item.subtitle}
          </span>
        )}
      </span>
    </button>
  );
}
