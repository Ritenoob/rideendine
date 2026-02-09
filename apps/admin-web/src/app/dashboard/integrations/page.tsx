'use client';

import { FileText, ExternalLink } from 'lucide-react';

export default function IntegrationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Integrations</h1>
        <p className="text-muted mt-1">Third-party integration logs (Cooco, Mealbridge)</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-blue-50">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-ink">Cooco Integration</h3>
                <p className="text-sm text-muted">Restaurant partner platform</p>
              </div>
            </div>
            <div className="text-sm text-muted">
              <p>Status: <span className="text-green-600 font-semibold">Active</span></p>
              <p className="mt-2">Last sync: N/A</p>
            </div>
            <button className="btn-secondary mt-4 flex items-center gap-2">
              <ExternalLink className="w-4 h-4" />
              View Logs
            </button>
          </div>
        </div>

        <div className="card">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-purple-50">
                <FileText className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-ink">Mealbridge Integration</h3>
                <p className="text-sm text-muted">Menu sync platform</p>
              </div>
            </div>
            <div className="text-sm text-muted">
              <p>Status: <span className="text-yellow-600 font-semibold">Pending</span></p>
              <p className="mt-2">Last sync: N/A</p>
            </div>
            <button className="btn-secondary mt-4 flex items-center gap-2">
              <ExternalLink className="w-4 h-4" />
              View Logs
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="p-6 text-center text-muted">
          No recent integration activity
        </div>
      </div>
    </div>
  );
}
