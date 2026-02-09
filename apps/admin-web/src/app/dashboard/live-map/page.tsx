'use client';

import { useState } from 'react';
import { Map, Navigation, Package } from 'lucide-react';

export default function LiveMapPage() {
  const [activeOrders] = useState(0);
  const [activeDrivers] = useState(0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Live Delivery Map</h1>
        <p className="text-muted mt-1">Real-time delivery tracking</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted">Active Orders</p>
              <p className="text-xl font-bold text-ink">{activeOrders}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-50">
              <Navigation className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted">Active Drivers</p>
              <p className="text-xl font-bold text-ink">{activeDrivers}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-50">
              <Map className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-muted">Avg Delivery Time</p>
              <p className="text-xl font-bold text-ink">0 min</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="h-[600px] flex items-center justify-center bg-gray-50 rounded-lg">
          <div className="text-center">
            <Map className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-muted">Map integration coming soon</p>
          </div>
        </div>
      </div>
    </div>
  );
}
