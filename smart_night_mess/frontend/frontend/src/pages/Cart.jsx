import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Cart() {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));

  const [cartItems, setCartItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingItem, setUpdatingItem] = useState(null);
  const [creatingOrder, setCreatingOrder] = useState(false);

  // Fetch cart
  const fetchCart = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        `http://localhost:5000/api/cart/${user.id}`,
        {
          credentials: "include",
        }
      );

      const data = await response.json();

      console.log("Cart data:", JSON.stringify(data, null, 2));

      if (!response.ok) {
        throw new Error(data.message || "Failed to load cart");
      }

      setCartItems(data.items || []);
      setTotal(Number(data.total || 0));
      setError("");
    } catch (error) {
      console.error(error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    fetchCart();
  }, []);

  // Update quantity
  const updateQuantity = async (foodItemId, quantity) => {
    if (quantity < 1) {
      await removeItem(foodItemId);
      return;
    }

    try {
      setUpdatingItem(foodItemId);

      const response = await fetch(
        `http://localhost:5000/api/cart/${user.id}/${foodItemId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            quantity: quantity,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update quantity");
      }

      await fetchCart();
    } catch (error) {
      console.error(error);
      alert(error.message);
    } finally {
      setUpdatingItem(null);
    }
  };

  // Remove item
  const removeItem = async (foodItemId) => {
    try {
      setUpdatingItem(foodItemId);

      const response = await fetch(
        `http://localhost:5000/api/cart/${user.id}/${foodItemId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to remove item");
      }

      await fetchCart();
    } catch (error) {
      console.error(error);
      alert(error.message);
    } finally {
      setUpdatingItem(null);
    }
  };

  // Clear entire cart
  const clearCart = async () => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/cart/${user.id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to clear cart");
      }

      await fetchCart();
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  };

  // Create order
  const createOrder = async () => {
    if (cartItems.length === 0) {
      alert("Your cart is empty.");
      return;
    }

    try {
      setCreatingOrder(true);

      const response = await fetch(
        `http://localhost:5000/api/orders/from-cart/${user.id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      const data = await response.json();

      console.log("Order created:", data);

      if (!response.ok) {
        throw new Error(data.message || "Failed to create order");
      }

      const orderNumber =
        data.order?.order_number ||
        data.order_number ||
        "Order";

      alert(`${orderNumber} created successfully!`);

      navigate("/orders");
    } catch (error) {
      console.error(error);
      alert(error.message);
    } finally {
      setCreatingOrder(false);
    }
  };

  if (loading) {
    return (
      <div>
        <h2>Loading cart...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h2>Unable to load cart</h2>
        <p>{error}</p>
        <button onClick={fetchCart}>Try Again</button>
      </div>
    );
  }

  return (
    <div>
      <h1>My Cart</h1>

      <button onClick={() => navigate("/")}>
        Continue Shopping
      </button>

      {cartItems.length === 0 ? (
        <div>
          <h2>Your cart is empty</h2>
          <button onClick={() => navigate("/")}>
            Browse Menu
          </button>
        </div>
      ) : (
        <div>
          <h2>Cart Items</h2>

          {cartItems.map((item) => (
            <div key={item.id}>
              <h3>{item.name}</h3>

              <p>Price: ₹{Number(item.price).toFixed(2)}</p>

              <div>
                <button
                  onClick={() =>
                    updateQuantity(
                      item.food_item_id,
                      item.quantity - 1
                    )
                  }
                  disabled={updatingItem === item.food_item_id}
                >
                  −
                </button>

                <span style={{ margin: "0 15px" }}>
                  {item.quantity}
                </span>

                <button
                  onClick={() =>
                    updateQuantity(
                      item.food_item_id,
                      item.quantity + 1
                    )
                  }
                  disabled={updatingItem === item.food_item_id}
                >
                  +
                </button>
              </div>

              <p>
                Subtotal: ₹
                {Number(item.item_total).toFixed(2)}
              </p>

              <button
                onClick={() => removeItem(item.food_item_id)}
                disabled={updatingItem === item.food_item_id}
              >
                Remove
              </button>

              <hr />
            </div>
          ))}

          <h2>
            Total: ₹{Number(total).toFixed(2)}
          </h2>

          <button onClick={clearCart}>
            Clear Cart
          </button>

          <br />
          <br />

          <button
            onClick={createOrder}
            disabled={creatingOrder}
          >
            {creatingOrder ? "Creating Order..." : "Place Order"}
          </button>
        </div>
      )}
    </div>
  );
}

export default Cart;