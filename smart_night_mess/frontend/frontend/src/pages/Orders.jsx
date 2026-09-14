import { useEffect, useState } from "react";

function Orders() {
  const user = JSON.parse(localStorage.getItem("user"));

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payingOrder, setPayingOrder] = useState(null);

  // ========================================
  // FETCH ORDERS
  // ========================================
  const fetchOrders = async () => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/orders/user/${user.id}`,
        {
          credentials: "include",
        }
      );

      const data = await response.json();

      console.log("Orders:", data);

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to fetch orders"
        );
      }

      setOrders(data.orders || []);
    } catch (error) {
      console.error("Fetch orders error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      window.location.href = "/login";
      return;
    }

    fetchOrders();
  }, []);

  // ========================================
  // PAY NOW
  // ========================================
  const payNow = async (order) => {
    try {
      setPayingOrder(order.id);

      // 1. Create Razorpay order
      const response = await fetch(
        `http://localhost:5000/api/payment/create/${order.id}`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      const data = await response.json();

      console.log("Razorpay order:", data);

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to create payment"
        );
      }

      // 2. Check Razorpay
      if (!window.Razorpay) {
        alert(
          "Razorpay is not loaded. Please refresh the page."
        );
        return;
      }

      // 3. Razorpay checkout options
      const options = {
        key: data.key,

        amount: data.amount,

        currency: data.currency || "INR",

        name: "MoonPlate",

        description: `Payment for ${order.order_number}`,

        order_id: data.razorpayOrderId,

        prefill: {
          name: user.name || "",
          email: user.email || "",
        },

        theme: {
          color: "#f5b800",
        },

        // ========================================
        // PAYMENT SUCCESS
        // ========================================
        handler: async function (paymentResponse) {
          console.log(
            "Payment response:",
            paymentResponse
          );

          try {
            // 4. Verify payment with backend
            const verifyResponse = await fetch(
              "http://localhost:5000/api/payment/verify",
              {
                method: "POST",

                headers: {
                  "Content-Type": "application/json",
                },

                credentials: "include",

                body: JSON.stringify({
                  // IMPORTANT: send our MoonPlate order ID
                  orderId: order.id,

                  razorpay_order_id:
                    paymentResponse.razorpay_order_id,

                  razorpay_payment_id:
                    paymentResponse.razorpay_payment_id,

                  razorpay_signature:
                    paymentResponse.razorpay_signature,
                }),
              }
            );

            const verifyData =
              await verifyResponse.json();

            console.log(
              "Payment verification:",
              verifyData
            );

            if (!verifyResponse.ok) {
              throw new Error(
                verifyData.message ||
                  "Payment verification failed"
              );
            }

            // 5. Payment successful
            alert(
              `Payment successful for ${order.order_number}!`
            );

            // 6. Refresh orders
            await fetchOrders();

          } catch (error) {
            console.error(
              "Payment verification error:",
              error
            );

            alert(error.message);
          }
        },
      };

      // 7. Open Razorpay
      const razorpay = new window.Razorpay(options);

      razorpay.on(
        "payment.failed",
        function (response) {
          console.error(
            "Payment failed:",
            response.error
          );

          alert(
            response.error?.description ||
              "Payment failed. Please try again."
          );
        }
      );

      razorpay.open();

    } catch (error) {
      console.error("Payment error:", error);
      alert(error.message);
    } finally {
      setPayingOrder(null);
    }
  };

  // ========================================
  // LOADING
  // ========================================
  if (loading) {
    return (
      <div>
        <h2>Loading orders...</h2>
      </div>
    );
  }

  // ========================================
  // PAGE
  // ========================================
  return (
    <div>
      <h1>My Orders</h1>

      {orders.length === 0 ? (
        <p>No orders yet.</p>
      ) : (
        orders.map((order) => (
          <div key={order.id}>
            <h2>{order.order_number}</h2>

            <p>
              Total: ₹
              {Number(order.total_amount).toFixed(2)}
            </p>

            <p>
              Status: {order.status}
            </p>

            <p>
              {new Date(
                order.created_at
              ).toLocaleString()}
            </p>

            {order.status === "PENDING_PAYMENT" && (
              <button
                onClick={() => payNow(order)}
                disabled={payingOrder === order.id}
              >
                {payingOrder === order.id
                  ? "Opening Payment..."
                  : "Pay Now"}
              </button>
            )}

            {order.status === "PAID" && (
              <p>
                ✅ Payment Successful
              </p>
            )}

            <hr />
          </div>
        ))
      )}
    </div>
  );
}

export default Orders;