import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View, TextInput, Pressable, ScrollView, Linking } from "react-native";
import { useEffect, useRef, useState } from "react";
import MapView, { Marker } from "react-native-maps";

export default function App() {
  const socketRef = useRef(null);
  const etaTimerRef = useRef(null);

  const [serverUrl, setServerUrl] = useState("http://localhost:8081");
  const [orderId, setOrderId] = useState("");
  const [status, setStatus] = useState("Not connected");
  const [eta, setEta] = useState("");
  const [orderStatus, setOrderStatus] = useState("");
  const [driverCoords, setDriverCoords] = useState(null);
  const [customerCoords, setCustomerCoords] = useState(null);
  const statusSteps = ["accepted", "preparing", "ready", "picked_up", "delivering", "delivered"];

  useEffect(() => {
    return () => {
      if (socketRef.current) socketRef.current.close();
      if (etaTimerRef.current) clearInterval(etaTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const handleUrl = (event) => {
      const url = event?.url || "";
      const query = url.split("?")[1] || "";
      const params = new URLSearchParams(query);
      const id = params.get("orderId");
      if (id) setOrderId(id);
    };

    Linking.getInitialURL().then((url) => handleUrl({ url })).catch(() => {});
    const sub = Linking.addEventListener("url", handleUrl);
    return () => sub.remove();
  }, []);

  async function startTracking() {
    if (!serverUrl || !orderId) return;
    setStatus("Connecting...");

    try {
      const authRes = await fetch(`${serverUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "customer", orderId }),
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
          const order = msg.data.orders.find((o) => o.id === orderId);
          if (order) {
            setOrderStatus(order.status || "unknown");
            const customer = msg.data.customers.find((c) => c.id === order.customerId);
            const driver = msg.data.drivers.find((d) => d.id === order.driverId);
            if (customer) setCustomerCoords({ lat: customer.lat, lng: customer.lng });
            if (driver) setDriverCoords({ lat: driver.lat, lng: driver.lng });
          }
        }
        if (msg.type === "locations") {
          if (msg.data.orders && msg.data.orders.length) {
            setOrderStatus(msg.data.orders[0].status);
          }
          if (msg.data.drivers && msg.data.drivers.length) {
            const d = msg.data.drivers[0];
            setDriverCoords({ lat: d.lat, lng: d.lng });
          }
        }
      };

      if (etaTimerRef.current) clearInterval(etaTimerRef.current);
      etaTimerRef.current = setInterval(async () => {
        try {
          const res = await fetch(`${serverUrl}/api/orders/eta?orderId=${orderId}`);
          if (!res.ok) return;
          const data = await res.json();
          if (data && data.etaSeconds) {
            setEta(`ETA: ~${Math.max(1, Math.round(data.etaSeconds / 60))} min`);
          }
        } catch (err) {
          // ignore
        }
      }, 8000);
    } catch (err) {
      setStatus("Connection error");
    }
  }

  return (
    <ScrollView style={styles.container}>
      <StatusBar style="auto" />
      <Text style={styles.title}>RideNDine Customer</Text>
      <Text style={styles.subtitle}>Track your order in real time.</Text>

      <Text style={styles.label}>Server URL</Text>
      <TextInput style={styles.input} value={serverUrl} onChangeText={setServerUrl} />

      <Text style={styles.label}>Order ID</Text>
      <TextInput style={styles.input} value={orderId} onChangeText={setOrderId} placeholder="Paste orderId" />

      <Pressable style={styles.button} onPress={startTracking}>
        <Text style={styles.buttonText}>Start Tracking</Text>
      </Pressable>

      <View style={styles.card}>
        <Text style={styles.status}>Status: {status}</Text>
        <Text style={styles.status}>{eta}</Text>
        <Text style={styles.status}>Order Status: {orderStatus}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Timeline</Text>
        {statusSteps.map((step) => {
          const index = statusSteps.indexOf(step);
          const activeIndex = statusSteps.indexOf(orderStatus || "");
          const state = activeIndex > index ? "done" : activeIndex === index ? "active" : "todo";
          return (
            <View key={step} style={styles.timelineRow}>
              <View style={[styles.timelineDot, state === "active" && styles.timelineActive, state === "done" && styles.timelineDone]} />
              <Text style={styles.timelineText}>{step.replace("_", " ")}</Text>
            </View>
          );
        })}
      </View>

      <View style={styles.mapCard}>
        <Text style={styles.label}>Live Map</Text>
        <View style={styles.mapWrapper}>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: 43.2207,
              longitude: -79.7651,
              latitudeDelta: 0.08,
              longitudeDelta: 0.08,
            }}
          >
            {customerCoords && (
              <Marker coordinate={{ latitude: customerCoords.lat, longitude: customerCoords.lng }} title="Customer" />
            )}
            {driverCoords && (
              <Marker coordinate={{ latitude: driverCoords.lat, longitude: driverCoords.lng }} title="Driver" />
            )}
          </MapView>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Driver Coordinates</Text>
        <Text style={styles.status}>
          {driverCoords ? `${driverCoords.lat.toFixed(5)}, ${driverCoords.lng.toFixed(5)}` : "Waiting..."}
        </Text>
        <Text style={styles.label}>Customer Coordinates</Text>
        <Text style={styles.status}>
          {customerCoords ? `${customerCoords.lat.toFixed(5)}, ${customerCoords.lng.toFixed(5)}` : "Waiting..."}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7f4ee",
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#151515",
    marginTop: 20,
  },
  subtitle: {
    color: "#5f5f5f",
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    color: "#5f5f5f",
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 10,
    marginTop: 6,
  },
  button: {
    backgroundColor: "#ff9800",
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  timelineRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 10,
    backgroundColor: "#bbb",
    marginRight: 8,
  },
  timelineActive: {
    backgroundColor: "#ff9800",
  },
  timelineDone: {
    backgroundColor: "#4caf50",
  },
  timelineText: {
    fontSize: 12,
    color: "#333",
  },
  mapCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  mapWrapper: {
    height: 240,
    marginTop: 8,
    borderRadius: 12,
    overflow: "hidden",
  },
  map: {
    width: "100%",
    height: "100%",
  },
  status: {
    fontSize: 13,
    color: "#151515",
  },
});
