import React, { useState } from 'react';
import { Sliders, Sparkles, Layers, Eye, Zap, Code, RefreshCw, Copy, Check, Sun, Contrast, Palette, Activity } from 'lucide-react';
import { DEFAULT_PARAMS } from './ElectricGazeAscii';

const RENDER_MODES = [
  "characters", "dither", "mosaic", "pixel", "dots", "cross", "diamond",
  "voxel", "lego", "mixed", "lines", "diagonal", "braille", "disco",
  "hexdump", "matrix", "rings", "hearts", "stars", "hexagons",
  "triangles", "bubbles", "hatch", "contour", "halfblocks"
];

const ANIM_STYLES = ["wave", "pulse", "shimmer", "ripple", "flicker"];

export default function ElectricGazeControls({ params, onChange }) {
  const [activeTab, setActiveTab] = useState('mode'); // 'mode' | 'color' | 'pfx' | 'anim' | 'json'
  const [copiedJson, setCopiedJson] = useState(false);
  const [jsonInput, setJsonInput] = useState(JSON.stringify(params, null, 2));

  const updateParam = (key, value) => {
    const updated = { ...params, [key]: value };
    onChange(updated);
    setJsonInput(JSON.stringify(updated, null, 2));
  };

  const updatePfx = (effectKey, property, value) => {
    const updatedPfx = {
      ...params.pfx,
      [effectKey]: {
        ...params.pfx[effectKey],
        [property]: value
      }
    };
    updateParam('pfx', updatedPfx);
  };

  const copyJsonToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(params, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const handleJsonApply = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      onChange(parsed);
    } catch (err) {
      alert("Invalid JSON format: " + err.message);
    }
  };

  return (
    <div className="w-full lg:w-96 bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-4 font-mono text-xs text-slate-200 shadow-xl">
      
      {/* Header & Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-1.5 font-bold text-slate-100 text-sm">
          <Sliders className="w-4 h-4 text-cyan-400" />
          <span>INSPECTOR PANEL</span>
        </div>
        <button
          onClick={() => onChange(DEFAULT_PARAMS)}
          className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-cyan-300 transition-all flex items-center gap-1 text-[11px]"
          title="Reset to default JSON"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Reset
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="grid grid-cols-5 gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[11px]">
        {[
          { id: 'mode', label: 'Mode', icon: Layers },
          { id: 'color', label: 'Color', icon: Palette },
          { id: 'pfx', label: 'PFX', icon: Sparkles },
          { id: 'anim', label: 'Anim', icon: Activity },
          { id: 'json', label: 'JSON', icon: Code },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                if (tab.id === 'json') setJsonInput(JSON.stringify(params, null, 2));
              }}
              className={`py-1.5 rounded flex flex-col items-center gap-1 transition-all ${
                activeTab === tab.id
                  ? 'bg-cyan-600 text-white font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT */}

      {/* 1. RENDER MODE TAB */}
      {activeTab === 'mode' && (
        <div className="flex flex-col gap-4 overflow-y-auto max-h-[480px] pr-1">
          <div>
            <label className="text-slate-400 mb-1.5 block font-bold">Render Mode ({RENDER_MODES.length} styles):</label>
            <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto p-1 bg-slate-950 rounded border border-slate-800">
              {RENDER_MODES.map((mode) => (
                <button
                  key={mode}
                  onClick={() => updateParam('renderMode', mode)}
                  className={`px-2 py-1 rounded text-left truncate transition-all text-[11px] ${
                    params.renderMode === mode
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 font-bold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-slate-400 mb-1 block">Background Mode:</label>
            <select
              value={params.bgMode || 'none'}
              onChange={(e) => updateParam('bgMode', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none"
            >
              <option value="none">None (Transparent / Black)</option>
              <option value="solid">Solid Color</option>
              <option value="original">Original Photo</option>
              <option value="blurred">Blurred Photo Copy</option>
            </select>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Cell Size:</span>
                <span>{params.cellSize}px</span>
              </div>
              <input
                type="range"
                min="3"
                max="24"
                value={params.cellSize || 9}
                onChange={(e) => updateParam('cellSize', parseInt(e.target.value))}
                className="w-full accent-cyan-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Coverage (%):</span>
                <span>{params.coverage}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                value={params.coverage ?? 100}
                onChange={(e) => updateParam('coverage', parseInt(e.target.value))}
                className="w-full accent-cyan-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Density:</span>
                <span>{params.density}</span>
              </div>
              <input
                type="range"
                min="5"
                max="50"
                value={params.density || 20}
                onChange={(e) => updateParam('density', parseInt(e.target.value))}
                className="w-full accent-cyan-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Edge Emphasis:</span>
                <span>{params.edgeEmphasis}</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={params.edgeEmphasis || 0}
                onChange={(e) => updateParam('edgeEmphasis', parseInt(e.target.value))}
                className="w-full accent-cyan-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
            <span className="text-slate-300">Invert Luminance:</span>
            <input
              type="checkbox"
              checked={params.invert || false}
              onChange={(e) => updateParam('invert', e.target.checked)}
              className="w-4 h-4 accent-cyan-500 rounded"
            />
          </div>
        </div>
      )}

      {/* 2. COLOR & TINT TAB */}
      {activeTab === 'color' && (
        <div className="flex flex-col gap-4 overflow-y-auto max-h-[480px] pr-1">
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Brightness:</span>
                <span>{params.brightness}</span>
              </div>
              <input
                type="range"
                min="-100"
                max="100"
                value={params.brightness || 0}
                onChange={(e) => updateParam('brightness', parseInt(e.target.value))}
                className="w-full accent-cyan-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Contrast:</span>
                <span>{params.contrast}</span>
              </div>
              <input
                type="range"
                min="-100"
                max="200"
                value={params.contrast || 158}
                onChange={(e) => updateParam('contrast', parseInt(e.target.value))}
                className="w-full accent-cyan-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Saturation:</span>
                <span>{params.saturation}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="200"
                value={params.saturation ?? 100}
                onChange={(e) => updateParam('saturation', parseInt(e.target.value))}
                className="w-full accent-cyan-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Grayscale:</span>
                <span>{params.grayscale}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={params.grayscale || 0}
                onChange={(e) => updateParam('grayscale', parseInt(e.target.value))}
                className="w-full accent-cyan-500"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800 space-y-3">
            <label className="text-slate-300 font-bold block">Tint & Overlay Blend:</label>
            
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={params.tint || '#3ca6ff'}
                onChange={(e) => updateParam('tint', e.target.value)}
                className="w-8 h-8 rounded border border-slate-700 bg-transparent cursor-pointer"
              />
              <input
                type="text"
                value={params.tint || '#3ca6ff'}
                onChange={(e) => updateParam('tint', e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Tint Opacity:</span>
                <span>{params.tintOpacity}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={params.tintOpacity || 0}
                onChange={(e) => updateParam('tintOpacity', parseInt(e.target.value))}
                className="w-full accent-cyan-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* 3. POST-EFFECTS (PFX) TAB */}
      {activeTab === 'pfx' && (
        <div className="flex flex-col gap-3 overflow-y-auto max-h-[480px] pr-1">
          <label className="text-slate-400 font-bold block">Post-Processing Stack ({Object.keys(params.pfx || {}).length} effects):</label>

          {Object.entries(params.pfx || {}).map(([key, fx]) => (
            <div key={key} className="p-2 bg-slate-950 rounded border border-slate-800 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="capitalize font-bold text-slate-200">{key}:</span>
                <input
                  type="checkbox"
                  checked={fx.enabled}
                  onChange={(e) => updatePfx(key, 'enabled', e.target.checked)}
                  className="w-4 h-4 accent-cyan-500 rounded"
                />
              </div>

              {fx.enabled && (
                <div>
                  <div className="flex justify-between text-[11px] text-slate-400 mb-0.5">
                    <span>Intensity:</span>
                    <span>{fx.intensity}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={fx.intensity}
                    onChange={(e) => updatePfx(key, 'intensity', parseInt(e.target.value))}
                    className="w-full accent-cyan-500"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 4. ANIMATION TAB */}
      {activeTab === 'anim' && (
        <div className="flex flex-col gap-4 overflow-y-auto max-h-[480px] pr-1">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-slate-200 font-bold">Animation Engine:</span>
            <input
              type="checkbox"
              checked={params.animated ?? true}
              onChange={(e) => updateParam('animated', e.target.checked)}
              className="w-4 h-4 accent-cyan-500 rounded"
            />
          </div>

          <div>
            <label className="text-slate-400 mb-1.5 block">Animation Style:</label>
            <div className="grid grid-cols-2 gap-1.5">
              {ANIM_STYLES.map((style) => (
                <button
                  key={style}
                  onClick={() => updateParam('animStyle', style)}
                  className={`px-2.5 py-1.5 rounded capitalize text-left transition-all ${
                    params.animStyle === style
                      ? 'bg-cyan-600 text-white font-bold'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Speed Intensity:</span>
                <span>{params.animSpeed?.intensity}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="200"
                value={params.animSpeed?.intensity ?? 100}
                onChange={(e) => updateParam('animSpeed', { enabled: true, intensity: parseInt(e.target.value) })}
                className="w-full accent-cyan-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Wave / Shimmer Intensity:</span>
                <span>{params.animIntensity?.intensity}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={params.animIntensity?.intensity ?? 60}
                onChange={(e) => updateParam('animIntensity', { enabled: true, intensity: parseInt(e.target.value) })}
                className="w-full accent-cyan-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* 5. RAW JSON EDITOR TAB */}
      {activeTab === 'json' && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Live JSON Configuration:</span>
            <button
              onClick={copyJsonToClipboard}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded text-[11px] flex items-center gap-1"
            >
              {copiedJson ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              {copiedJson ? 'Copied!' : 'Copy JSON'}
            </button>
          </div>

          <textarea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            rows={14}
            className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded font-mono text-[10px] text-emerald-400 leading-relaxed focus:outline-none focus:border-cyan-500"
          />

          <button
            onClick={handleJsonApply}
            className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded flex items-center justify-center gap-1.5 transition-all shadow-md shadow-cyan-600/30"
          >
            <Check className="w-4 h-4" /> APPLY JSON CHANGES
          </button>
        </div>
      )}

    </div>
  );
}
