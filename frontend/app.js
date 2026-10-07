const { memo, useCallback, useEffect, useMemo, useState } = React;

const API = "http://127.0.0.1:8000/api";

async function api(path, options = {}) {
  const token = localStorage.getItem("access");
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API}${path}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const validationMessage =
      typeof data === "object"
        ? Object.values(data).flat().join(" ")
        : "";

    throw new Error(data.detail || validationMessage || "Request failed");
  }

  return data;
}

function Navbar({ cartCount, user, setPage, logout }) {
  return (
    <nav className="navbar navbar-dark bg-dark navbar-expand-lg">
      <div className="container">
        <button
          className="navbar-brand btn btn-link text-white text-decoration-none"
          onClick={() => setPage("home")}
        >
          ShopNest
        </button>

        <div className="d-flex gap-2 align-items-center">
          <button
            className="btn btn-outline-light btn-sm"
            onClick={() => setPage("cart")}
          >
            Cart ({cartCount})
          </button>

          {user ? (
            <>
              <button
                className="btn btn-outline-light btn-sm"
                onClick={() => setPage("orders")}
              >
                Orders
              </button>
              <button className="btn btn-warning btn-sm" onClick={logout}>
                Logout
              </button>
            </>
          ) : (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setPage("login")}
            >
              Login
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}

const ProductCard = memo(function ProductCard({ product, addToCart }) {
  return (
    <div className="col-md-6 col-lg-4 mb-4">
      <div className="card h-100 product-card">
        <img
          className="card-img-top product-img"
          loading="lazy"
          src={
            product.image_url ||
            "https://placehold.co/600x400?text=Product"
          }
          alt={product.name}
        />

        <div className="card-body d-flex flex-column">
          <span className="badge text-bg-secondary align-self-start mb-2">
            {product.category}
          </span>

          <h5>{product.name}</h5>
          <p className="text-muted flex-grow-1">
            {product.description}
          </p>

          <div className="d-flex justify-content-between align-items-center">
            <span className="price">
              ₹{Number(product.price).toLocaleString("en-IN")}
            </span>

            <button
              className="btn btn-dark"
              disabled={!product.stock}
              onClick={() => addToCart(product)}
            >
              {product.stock ? "Add to Cart" : "Out of stock"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

function Home({ user, setPage, refreshCart }) {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const loadProducts = useCallback(async (query = "") => {
    try {
      setLoading(true);
      setError("");

      const data = await api(
        `/products/?search=${encodeURIComponent(query)}`
      );

      setProducts(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts("");
  }, [loadProducts]);

  // Debounced search reduces unnecessary API requests while typing.
  useEffect(() => {
    const timer = setTimeout(() => {
      loadProducts(search);
    }, 350);

    return () => clearTimeout(timer);
  }, [search, loadProducts]);

  const addToCart = useCallback(async (product) => {
    if (!user) {
      setPage("login");
      return;
    }

    try {
      await api("/cart/", {
        method: "POST",
        body: JSON.stringify({
          product_id: product.id,
          quantity: 1
        })
      });

      refreshCart();
      alert("Added to cart");
    } catch (e) {
      alert(e.message);
    }
  }, [user, setPage, refreshCart]);

  return (
    <div className="container py-4">
      <div className="hero p-4 mb-4">
        <h1>Python Full Stack E-Commerce</h1>
        <p className="mb-0">
          React + Bootstrap frontend with Python Django REST APIs.
        </p>
      </div>

      <input
        className="form-control mb-4"
        placeholder="Search products..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <div className="loading">Loading products...</div>
      ) : (
        <div className="row">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              addToCart={addToCart}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Login({ setUser, setPage }) {
  const [registerMode, setRegisterMode] = useState(false);
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: ""
  });
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setError("");

    try {
      const data = registerMode
        ? await api("/auth/register/", {
            method: "POST",
            body: JSON.stringify(form)
          })
        : await api("/auth/token/", {
            method: "POST",
            body: JSON.stringify({
              username: form.username,
              password: form.password
            })
          });

      localStorage.setItem("access", data.access);
      localStorage.setItem("refresh", data.refresh);

      const profile = await api("/auth/profile/");
      setUser(profile);
      setPage("home");
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div className="container py-5" style={{ maxWidth: 520 }}>
      <div className="card p-4">
        <h3>{registerMode ? "Create account" : "Login"}</h3>

        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={submit}>
          <input
            className="form-control mb-3"
            placeholder="Username"
            value={form.username}
            onChange={(e) =>
              setForm({ ...form, username: e.target.value })
            }
            required
          />

          {registerMode && (
            <input
              className="form-control mb-3"
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) =>
                setForm({ ...form, email: e.target.value })
              }
              required
            />
          )}

          <input
            className="form-control mb-3"
            type="password"
            placeholder="Password"
            minLength="6"
            value={form.password}
            onChange={(e) =>
              setForm({ ...form, password: e.target.value })
            }
            required
          />

          <button className="btn btn-dark w-100">
            {registerMode ? "Register" : "Login"}
          </button>
        </form>

        <button
          className="btn btn-link mt-2"
          onClick={() => {
            setRegisterMode(!registerMode);
            setError("");
          }}
        >
          {registerMode
            ? "Already have an account?"
            : "Create an account"}
        </button>
      </div>
    </div>
  );
}

const Cart = memo(function Cart({ refreshCart }) {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const data = await api("/cart/");
      setItems(data);
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const total = useMemo(
    () =>
      items.reduce(
        (sum, item) => sum + Number(item.subtotal),
        0
      ),
    [items]
  );

  async function remove(id) {
    try {
      await api(`/cart/${id}/`, { method: "DELETE" });
      await load();
      refreshCart();
    } catch (e) {
      alert(e.message);
    }
  }

  async function update(id, quantity) {
    try {
      await api(`/cart/${id}/`, {
        method: "PATCH",
        body: JSON.stringify({ quantity })
      });

      await load();
      refreshCart();
    } catch (e) {
      alert(e.message);
    }
  }

  async function checkout() {
    try {
      await api("/checkout/", { method: "POST" });
      await load();
      refreshCart();
      alert("Order placed successfully.");
    } catch (e) {
      alert(e.message);
    }
  }

  return (
    <div className="container py-4">
      <h2>Your Cart</h2>

      {error && <div className="alert alert-danger">{error}</div>}

      {items.map((item) => (
        <div className="card mb-2" key={item.id}>
          <div className="card-body d-flex justify-content-between align-items-center">
            <div>
              <strong>{item.product.name}</strong>
              <div>₹{item.subtotal}</div>
            </div>

            <div className="d-flex gap-2 align-items-center">
              <button
                className="btn btn-outline-secondary"
                disabled={item.quantity <= 1}
                onClick={() =>
                  update(item.id, item.quantity - 1)
                }
              >
                -
              </button>

              <span>{item.quantity}</span>

              <button
                className="btn btn-outline-secondary"
                onClick={() =>
                  update(item.id, item.quantity + 1)
                }
              >
                +
              </button>

              <button
                className="btn btn-outline-danger"
                onClick={() => remove(item.id)}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      ))}

      <div className="card p-3 mt-3">
        <h4>Total: ₹{total.toLocaleString("en-IN")}</h4>

        <button
          className="btn btn-success"
          disabled={!items.length}
          onClick={checkout}
        >
          Checkout
        </button>
      </div>
    </div>
  );
});

function Orders() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    api("/orders/")
      .then(setOrders)
      .catch((e) => alert(e.message));
  }, []);

  return (
    <div className="container py-4">
      <h2>My Orders</h2>

      {orders.map((order) => (
        <div className="card mb-3" key={order.id}>
          <div className="card-body">
            <div className="d-flex justify-content-between">
              <strong>Order #{order.id}</strong>
              <span className="badge text-bg-primary">
                {order.status}
              </span>
            </div>

            <hr />

            {order.items.map((item, index) => (
              <div key={index}>
                {item.product_name} × {item.quantity} — ₹
                {item.price_at_purchase}
              </div>
            ))}

            <hr />

            <strong>Total: ₹{order.total_amount}</strong>
          </div>
        </div>
      ))}
    </div>
  );
}

function App() {
  const [page, setPage] = useState("home");
  const [user, setUser] = useState(null);
  const [cartCount, setCartCount] = useState(0);

  const refreshCart = useCallback(async () => {
    if (!localStorage.getItem("access")) {
      setCartCount(0);
      return;
    }

    try {
      const data = await api("/cart/");
      setCartCount(
        data.reduce((sum, item) => sum + item.quantity, 0)
      );
    } catch {
      setCartCount(0);
    }
  }, []);

  useEffect(() => {
    if (localStorage.getItem("access")) {
      api("/auth/profile/")
        .then(setUser)
        .catch(() => {});
    }

    refreshCart();
  }, [refreshCart]);

  function logout() {
    localStorage.clear();
    setUser(null);
    setCartCount(0);
    setPage("home");
  }

  let content;

  if (page === "login") {
    content = <Login setUser={setUser} setPage={setPage} />;
  } else if (page === "cart") {
    content = <Cart refreshCart={refreshCart} />;
  } else if (page === "orders") {
    content = <Orders />;
  } else {
    content = (
      <Home
        user={user}
        setPage={setPage}
        refreshCart={refreshCart}
      />
    );
  }

  return (
    <>
      <Navbar
        cartCount={cartCount}
        user={user}
        setPage={setPage}
        logout={logout}
      />
      {content}
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
