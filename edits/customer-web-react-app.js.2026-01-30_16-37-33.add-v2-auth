const { useEffect, useRef, useState } = React;

function CustomerApp() {
  const mapRef = useRef(null);
  const driverMarkerRef = useRef(null);
  const customerMarkerRef = useRef(null);
  const socketRef = useRef(null);

  const [serverUrl, setServerUrl] = useState("http://localhost:8081");
  const [orderId, setOrderId] = useState("");
  const [status, setStatus] = useState("Not connected");
  const [eta, setEta] = useState("");
  const [orderStatus, setOrderStatus] = useState("");

  useEffect(() => {
    const map = L.map("map").setView([43.2207, -79.7651], 12);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors"
    }).addTo(map);
    mapRef.current = map;
    return () => map.remove();
  }, []);

  function updateMarkers(order, data) {
    const map = mapRef.current;
    if (!map || !order) return;

    const customer = data.customers.find(c => c.id === order.customerId);
    const driver = data.drivers.find(d => d.id === order.driverId);

    if (customer) {
      if (customerMarkerRef.current) map.removeLayer(customerMarkerRef.current);
      customerMarkerRef.current = L.circleMarker([customer.lat, customer.lng], {
        radius: 7,
        color: "#1565c0",
        fillColor: "#1565c0",
        fillOpacity: 0.9,
      }).addTo(map);
    }

    if (driver) {
      if (!driverMarkerRef.current) {
        driverMarkerRef.current = L.circleMarker([driver.lat, driver.lng], {
          radius: 9,
          color: "#fb8c00",
          fillColor: "#fb8c00",
          fillOpacity: 1,
        }).addTo(map);
      } else {
        driverMarkerRef.current.setLatLng([driver.lat, driver.lng]);
      }
    }
  }

  async function startTracking() {
    if (!serverUrl || !orderId) return;
    setStatus("Connecting...");

    try {
      const authRes = await fetch(`${serverUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "customer", orderId })
      });
      const auth = await authRes.json();
      if (!auth.token) {
        setStatus("Auth failed");
        return;
      }

      const wsUrl = serverUrl.replace(/^http/, "ws") + `/?token=${auth.token}`;
      socketRef.current = new WebSocket(wsUrl);

      socketRef.current.onopen = () => setStatus("Connected");
      socketRef.current.onerror = () => setStatus("Connection error");

      socketRef.current.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.type === "init") {
          const order = msg.data.orders.find(o => o.id === orderId);
          if (order) {
            setOrderStatus(order.status || "unknown");
            updateMarkers(order, msg.data);
          }
        }
        if (msg.type === "locations") {
          if (msg.data.orders && msg.data.orders.length) {
            setOrderStatus(msg.data.orders[0].status);
          }
          if (msg.data.drivers && msg.data.drivers.length && driverMarkerRef.current) {
            const d = msg.data.drivers[0];
            driverMarkerRef.current.setLatLng([d.lat, d.lng]);
          }
        }
      };

      // ETA polling
      setInterval(async () => {
        const res = await fetch(`${serverUrl}/api/orders/eta?orderId=${orderId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data && data.etaSeconds) {
          setEta(`ETA: ~${Math.max(1, Math.round(data.etaSeconds / 60))} min`);
        }
      }, 8000);

    } catch (err) {
      setStatus("Connection error");
    }
  }

  return (
    <>
      <div className="panel">
        <h2>Customer</h2>
        <div className="small">Track your order in real time.</div>
        <div className="label">Server URL</div>
        <input value={serverUrl} onChange={(e) => setServerUrl(e.target.value)} />
        <div className="label">Order ID</div>
        <input value={orderId} onChange={(e) => setOrderId(e.target.value)} placeholder="Paste orderId" />
        <button onClick={startTracking}>Start Tracking</button>
        <div className="status">{status}</div>
        <div className="status">{eta}</div>
        <div className="status">Status: {orderStatus}</div>
      </div>
      <div id="map"></div>
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<CustomerApp />);
