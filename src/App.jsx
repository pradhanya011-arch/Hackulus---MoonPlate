import { useState } from "react";
import "./App.css";

const menuItems = [
  {
  id: 1,
  name: "Chicken Biryani",
  description: "Fragrant basmati rice with tender chicken",
  price: 120,
  quantity: 20,
  emoji: "🍗",
  category: "Main Course",
},
  {
    id: 2,
    name: "Paneer Butter Masala",
    description: "Creamy tomato gravy with soft paneer",
    price: 100,
    quantity: 15,
    emoji: "🥘",
    category: "Main Course",
  },
  {
    id: 3,
    name: "Veg Fried Rice",
    description: "Fried rice with fresh vegetables",
    price: 80,
    quantity: 30,
    emoji: "🍚",
    category: "Main Course",
  },
  {
    id: 4,
    name: "Chicken 65",
    description: "Crispy, spicy fried chicken",
    price: 90,
    quantity: 40,
    emoji: "🍗",
    category: "Starters",
  },
  {
    id: 5,
    name: "Gobi Manchurian",
    description: "Crispy cauliflower in Manchurian sauce",
    price: 75,
    quantity: 20,
    emoji: "🥦",
    category: "Starters",
  },
  {
    id: 6,
    name: "Masala Dosa",
    description: "Crispy dosa with potato masala",
    price: 60,
    quantity: 15,
    emoji: "🥞",
    category: "South Indian",
  },
  {
    id: 7,
    name: "Parotta",
    description: "Flaky layered South Indian parotta",
    price: 40,
    quantity: 25,
    emoji: "🫓",
    category: "South Indian",
  },
  {
    id: 8,
    name: "Gulab Jamun",
    description: "Soft sweet dumplings in sugar syrup",
    price: 50,
    quantity: 10,
    emoji: "🍮",
    category: "Desserts",
  },
];

function App() {
  const [cart, setCart] = useState({});
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [cartOpen, setCartOpen] = useState(false);

  const addToCart = (id) => {
  const item = menuItems.find((item) => item.id === id);

  if (!item) return;

  setCart((currentCart) => {
    const currentQuantity = currentCart[id] || 0;

    if (currentQuantity >= item.quantity) {
      return currentCart;
    }

    return {
      ...currentCart,
      [id]: currentQuantity + 1,
    };
  });
};

  const removeFromCart = (id) => {
    setCart((currentCart) => {
      const newCart = { ...currentCart };

      if (newCart[id] > 1) {
        newCart[id] -= 1;
      } else {
        delete newCart[id];
      }

      return newCart;
    });
  };

  const filteredItems =
  selectedCategory === "All"
    ? menuItems
    : menuItems.filter((item) => item.category === selectedCategory);

  const cartItems = menuItems.filter((item) => cart[item.id]);

  const totalItems = Object.values(cart).reduce(
    (total, quantity) => total + quantity,
    0
  );

  const totalPrice = cartItems.reduce(
    (total, item) => total + item.price * cart[item.id],
    0
  );

  return (
    <div className="app">
      <header className="header">
        <div className="brand">
          <img
            src="/monoplate-logo.jpg"
            alt="Monoplate logo"
            className="logo"
          />

          <div>
            <h1>MOONPLATE</h1>
            <p>Smart Night Mess</p>
          </div>
        </div>

        <div className="cart-summary">
          <span className="cart-icon">🛒</span>
          <div>
            <strong>{totalItems} items</strong>
            <p>₹{totalPrice}</p>
          </div>
        </div>
      </header>

      <main className="main-content">
        <section className="welcome">
          <p className="small-heading">TONIGHT'S MENU</p>
          <h2>What are you craving?</h2>
          <p>Choose your favourite meals and add them to your plate.</p>
        </section>

          <div className="categories">
  {["All", "Main Course", "Starters", "South Indian", "Desserts"].map(
    (category) => (
      <button
        key={category}
        className={`category ${
          selectedCategory === category ? "active" : ""
        }`}
        onClick={() => setSelectedCategory(category)}
      >
        {category}
      </button>
    )
  )}
</div>
        

        <section className="menu-section">
          <div className="menu-grid">
            {filteredItems.map((item) => (
              <div className="food-card" key={item.id}>
                <div className="food-image">
                  <span>{item.emoji}</span>
                </div>

                <div className="food-info">
                  <span className="food-category">
                    {item.category}
                  </span>

                  <div className="name-row">
  <h3>{item.name}</h3>
  <span className="stock">
  {Math.max(0, (item.quantity ?? 0) - (cart[item.id] || 0))} left
</span>
</div>


                  <div className="food-bottom">
                    <strong className="price">₹{item.price}</strong>

                    <div className="quantity-control">
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="quantity-button"
                      >
                        −
                      </button>

                      <span>{cart[item.id] || 0}</span>

                      <button
                        onClick={() => addToCart(item.id)}
                        className="quantity-button add"
                        disabled={(cart[item.id] || 0) >= (item.quantity ?? 0)}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {totalItems > 0 && (
        <div className="cart-bar">
          <div>
            <strong>{totalItems} items in your plate</strong>
            <span> • ₹{totalPrice}</span>
          </div>

          <button
  className="view-cart"
  onClick={() => setCartOpen(true)}
>
  View Cart →
</button>
        </div>
      )}
          {cartOpen && (
      <div className="cart-overlay">
        <div className="cart-panel">

          <div className="cart-header">
            <h2>Your Plate</h2>

            <button
              className="cart-close"
              onClick={() => setCartOpen(false)}
            >
              ×
            </button>
          </div>

          {Object.keys(cart).length === 0 ? (
            <p>Your plate is empty.</p>
          ) : (
            <div className="cart-items">
              {menuItems
                .filter((item) => cart[item.id] > 0)
                .map((item) => (
                  <div className="cart-item" key={item.id}>
  <div className="cart-item-info">
    <h3>{item.name}</h3>
    <p>₹{item.price} each</p>

    <div className="cart-quantity">
      <button
        onClick={() => removeFromCart(item.id)}
      >
        −
      </button>

      <span>{cart[item.id]}</span>

      <button
        onClick={() => addToCart(item.id)}
        disabled={cart[item.id] >= item.quantity}
      >
        +
      </button>
    </div>
  </div>

  <strong>
    ₹{item.price * cart[item.id]}
  </strong>
</div>
                ))}
            </div>
          )}

          <div className="cart-total">
            <span>Total</span>

            <strong>
              ₹
              {menuItems.reduce(
                (total, item) =>
                  total + item.price * (cart[item.id] || 0),
                0
              )}
            </strong>
          </div>

          <button className="place-order">
            Place Order
          </button>

        </div>
      </div>
    )}
    </div>
    
  );
}

export default App;