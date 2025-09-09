import React from "react";
import { CardElement } from "@stripe/react-stripe-js";

const StripeForm = React.memo(() => {
  return (
    <div style={{ margin: "20px 0" }}>
      <CardElement
        options={{
          style: {
            base: {
              fontSize: "16px",
              color: "#32325d",
              "::placeholder": { color: "#a0aec0" },
            },
            invalid: { color: "#fa755a" },
          },
        }}
      />
    </div>
  );
});

export default StripeForm;
