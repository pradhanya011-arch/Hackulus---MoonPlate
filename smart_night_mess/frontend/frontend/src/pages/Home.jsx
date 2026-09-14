import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function Home() {
  const [foodItems, setFoodItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addingItem, setAddingItem] = useState(null);

  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    fetch("http://localhost:5000/api/food")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch menu");
        }

        return response.json();
      })
      .then((data) => {
        setFoodItems(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error(error);
        setError("Unable to load menu");
        setLoading(false);
      });
  }, []);

  const addToCart = async (foodItemId) => {
    if (!user) {
      alert("Please login first.");
      return;
    }

    try {
      setAddingItem(foodItemId);

      const response = await fetch(
        "http://localhost:5000/api/cart",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
  user_id: user.id,
  food_item_id: foodItemId,
  quantity: 1,
}),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to add item to cart");
      }

      alert("Item added to cart!");

      console.log("Cart response:", data);
    } catch (error) {
      console.error(error);
      alert(error.message);
    } finally {
      setAddingItem(null);
    }
  };

  if (loading) {
    return <h2>Loading menu...</h2>;
  }

  if (error) {
    return <h2>{error}</h2>;
  }

  return (
    <div>
      <h1>MoonPlate</h1>

      <nav>
        <Link to="/login">Login</Link>{" "}
        <Link to="/register">Register</Link>{" "}
        <Link to="/cart">Cart</Link>{" "}
        <Link to="/orders">Orders</Link>
      </nav>

      <h2>Tonight's Menu</h2>

      {foodItems.length === 0 ? (
        <p>No food available.</p>
      ) : (
        foodItems.map((item) => (
          <div key={item.id}>
            <h3>{item.name}</h3>

            <p>Price: ₹{item.price}</p>

            <p>Available: {item.quantity}</p>

            <button
              onClick={() => addToCart(item.id)}
              disabled={addingItem === item.id}
            >
              {addingItem === item.id
                ? "Adding..."
                : "Add to Cart"}
            </button>

            <hr />
          </div>
        ))
      )}
    </div>
  );
}

export default Home;