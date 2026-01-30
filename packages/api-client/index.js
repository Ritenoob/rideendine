// Minimal placeholder for shared API client.
module.exports = {
  createClient(baseUrl) {
    return {
      baseUrl,
      async loginCustomer(orderId) {
        const res = await fetch(`${baseUrl}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: "customer", orderId })
        });
        return res.json();
      },
    };
  }
};
