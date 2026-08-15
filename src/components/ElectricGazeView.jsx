import React, { useState } from 'react';
import ElectricGazeAscii, { DEFAULT_PARAMS } from './ElectricGazeAscii';
import ElectricGazeControls from './ElectricGazeControls';
import { Eye, Sparkles, Zap, Code, ShieldCheck, HelpCircle, X } from 'lucide-react';

const PRESETS = {
  electric_gaze: DEFAULT_PARAMS,
  matrix_rain: {
    ...DEFAULT_PARAMS,
    renderMode: "matrix",
    bgMode: "solid",
    tint: "#00ff66",
    tintOpacity: 25,
    cellSize: 8,
    pfx: {
      ...DEFAULT_PARAMS.pfx,
      scanLines: { enabled: true, intensity: 60 },
      bloom: { enabled: true, intensity: 45 },
      filmGrain: { enabled: true, intensity: 25 }
    }
  },
  voxel_3d: {
    ...DEFAULT_PARAMS,
    renderMode: "voxel",
    cellSize: 11,
    contrast: 180,
    brightness: 10,
    pfx: {
      ...DEFAULT_PARAMS.pfx,
      vignette: { enabled: true, intensity: 50 },
      chromatic: { enabled: true, intensity: 30 }
    }
  },
  disco_cyber: {
    ...DEFAULT_PARAMS,
    renderMode: "disco",
    cellSize: 10,
    animStyle: "pulse",
    animSpeed: { enabled: true, intensity: 150 },
    pfx: {
      ...DEFAULT_PARAMS.pfx,
      bloom: { enabled: true, intensity: 60 },
      glitch: { enabled: true, intensity: 35 }
    }
  },
  halfblocks_highres: {
    ...DEFAULT_PARAMS,
    renderMode: "halfblocks",
    cellSize: 6,
    contrast: 140,
    edgeEmphasis: 25
  }
};

export default function ElectricGazeView({ onClose }) {
  const [params, setParams] = useState(DEFAULT_PARAMS);
  const [selectedPreset, setSelectedPreset] = useState("electric_gaze");

  const loadPreset = (presetKey) => {
    setSelectedPreset(presetKey);
    setParams(PRESETS[presetKey]);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-xl flex flex-col overflow-y-auto p-4 md:p-6 text-slate-100 font-sans">
      
      {/* Top Navigation Header */}
      <div className="w-full max-w-7xl mx-auto flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-cyan-600/20 border border-cyan-500/40 rounded-xl text-cyan-400">
            <Eye className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black font-mono tracking-tight text-white flex items-center gap-2">
              ELECTRIC GAZE <span className="text-xs font-normal px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">21st.dev ASCII Engine</span>
            </h1>
            <p className="text-xs text-slate-400 font-mono">
              Recreated Canvas2D Raster Pipeline • Speech Synthesizer Talking AI Avatar
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Preset Buttons */}
          <div className="hidden md:flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 font-mono text-xs">
            <span className="px-2 text-slate-400 text-[11px]">Presets:</span>
            {[
              { id: 'electric_gaze', label: 'Electric Gaze' },
              { id: 'matrix_rain', label: 'Matrix Rain' },
              { id: 'voxel_3d', label: 'Voxel 3D' },
              { id: 'disco_cyber', label: 'Disco Cyber' },
              { id: 'halfblocks_highres', label: 'Half Blocks' }
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => loadPreset(p.id)}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  selectedPreset === p.id 
                    ? 'bg-cyan-600 text-white font-bold shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-all"
              title="Close window"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Grid Workspace */}
      <div className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row gap-6 items-start justify-center">
        
        {/* Canvas & Speech Synthesizer Area */}
        <div className="flex-1 w-full">
          <ElectricGazeAscii
            params={params}
            onParamsChange={setParams}
            imageSrc="/ascii-editor/demos/generated/ref-002.webp"
          />
        </div>

        {/* Live Inspector Control Panel */}
        <ElectricGazeControls
          params={params}
          onChange={setParams}
        />

      </div>

    </div>
  );
}
