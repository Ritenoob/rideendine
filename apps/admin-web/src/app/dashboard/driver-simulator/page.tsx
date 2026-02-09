'use client';

import { useState } from 'react';
import { Play, Square, MapPin } from 'lucide-react';

export default function DriverSimulatorPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [simulatedDrivers, setSimulatedDrivers] = useState(5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Driver Simulator</h1>
        <p className="text-muted mt-1">Test delivery scenarios</p>
      </div>

      <div className="card">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-ink mb-4">Simulation Controls</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-ink mb-2">
                Number of Drivers
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={simulatedDrivers}
                onChange={(e) => setSimulatedDrivers(Number(e.target.value))}
                disabled={isRunning}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-2">
                Speed
              </label>
              <select className="input" disabled={isRunning}>
                <option value="1">1x</option>
                <option value="2">2x</option>
                <option value="5">5x</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3">
            {!isRunning ? (
              <button
                onClick={() => setIsRunning(true)}
                className="btn-primary flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                Start
              </button>
            ) : (
              <button
                onClick={() => setIsRunning(false)}
                className="btn-danger flex items-center gap-2"
              >
                <Square className="w-4 h-4" />
                Stop
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
