const https = require("https");

// Check if Planes page loads and Stripe keys are present
https.get("https://websitedelega.netlify.app/planes", (res) => {
  let d = "";
  res.on("data", (c) => d += c);
  res.on("end", () => {
    console.log("Status:", res.statusCode);
    console.log("Length:", d.length);
    console.log("Contains 'Planes':", d.includes("Planes"));
    console.log("Contains 'price_1':", d.includes("price_1"));
    console.log("Contains 'checkout':", d.includes("checkout"));
    console.log("Contains 'stripe':", d.includes("stripe"));
  });
});
