import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Link,
  useNavigate,
} from "react-router-dom";


import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./App.css";

import api from "./services/api";
import Expenses from "./pages/Expenses";
import Income from "./pages/Income";
import Categories from "./pages/Categories";
import Budgets from "./pages/Budgets";
import Reports from "./pages/Reports";

// -------------------- Common Helpers --------------------

function formatCurrency(amount) {
  return Number(amount || 0).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  });
}

function getList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

function getErrorMessage(error, action) {
  if (error.response) {
    const status = error.response.status;
    const message = error.response.data?.message;

    if (status === 401) {
      return "Invalid or expired session. Please sign in again.";
    }

    if (status === 403) {
      return "Access denied. Check your permissions and API security configuration.";
    }

    return message || `${action} failed (HTTP ${status}).`;
  }

  if (error.request) {
    return "Cannot connect to the server. Check that Spring Boot is running on port 8083.";
  }

  return error.message || `${action} failed.`;
}

function getStoredUser() {
  try {
    const value = JSON.parse(localStorage.getItem("user") || "{}");
    return value && typeof value === "object" ? value : {};
  } catch {
    return {};
  }
}

// -------------------- Login --------------------

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/api/auth/login", {
        email: email.trim(),
        password,
      });

      const data = response.data;

      if (!data?.token) {
        throw new Error("The server did not return an authentication token.");
      }

      localStorage.setItem("token", data.token);

      localStorage.setItem(
        "user",
        JSON.stringify({
          id: data.id,
          name: data.name,
          email: data.email,
          role: data.role,
          createdAt: data.createdAt,
        })
      );

      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, "Login"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="brand-icon">
          <i className="bi bi-wallet2"></i>
        </div>

        <h2>Welcome back</h2>
        <p className="text-muted">Sign in to manage your finances</p>

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <label htmlFor="login-email">Email address</label>
          <input
            id="login-email"
            type="email"
            className="form-control mb-3"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />

          <label htmlFor="login-password">Password</label>
          <input
            id="login-password"
            type="password"
            className="form-control mb-4"
            placeholder="Enter your password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />

          <button
            type="submit"
            className="btn btn-primary w-100"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="text-center mt-4 mb-0">
          Don't have an account? <Link to="/register">Create account</Link>
        </p>
      </div>
    </div>
  );
}

// -------------------- Registration --------------------

function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await api.post("/api/auth/register", {
        name: name.trim(),
        email: email.trim(),
        password,
      });

      setSuccess("Registration successful. Redirecting to login...");

      window.setTimeout(() => {
        navigate("/", { replace: true });
      }, 1200);
    } catch (err) {
      setError(getErrorMessage(err, "Registration"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="brand-icon">
          <i className="bi bi-wallet2"></i>
        </div>

        <h2>Create account</h2>
        <p className="text-muted">Start managing your money smarter</p>

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        {success && (
          <div className="alert alert-success" role="status">
            {success}
          </div>
        )}

        <form onSubmit={handleRegister}>
          <label htmlFor="register-name">Full name</label>
          <input
            id="register-name"
            type="text"
            className="form-control mb-3"
            placeholder="Your name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="name"
            minLength={2}
            required
          />

          <label htmlFor="register-email">Email address</label>
          <input
            id="register-email"
            type="email"
            className="form-control mb-3"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />

          <label htmlFor="register-password">Password</label>
          <input
            id="register-password"
            type="password"
            className="form-control mb-4"
            placeholder="Enter a password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            minLength={6}
            required
          />

          <button
            type="submit"
            className="btn btn-primary w-100"
            disabled={loading}
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="text-center mt-4 mb-0">
          Already registered? <Link to="/">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

// -------------------- Sidebar --------------------

function Sidebar({ activePage, user }) {
  const links = [
    ["Dashboard", "/dashboard", "bi-grid"],
    ["Expenses", "/expenses", "bi-receipt"],
    ["Income", "/income", "bi-cash-stack"],
    ["Categories", "/categories", "bi-tags"],
    ["Budgets", "/budgets", "bi-piggy-bank"],
    ["Reports", "/reports", "bi-bar-chart"],
  ];

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.replace("/");
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <i className="bi bi-wallet2"></i>
        <span>
          Expense<span className="brand-highlight">Flow</span>
        </span>
      </div>

      <div className="sidebar-label">MAIN MENU</div>

      <nav className="sidebar-nav">
        {links.map(([label, path, icon]) => (
          <Link
            key={label}
            className={`nav-item ${activePage === label ? "active" : ""}`}
            to={path}
          >
            <i className={`bi ${icon}`}></i> {label}
          </Link>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <div className="profile-avatar">
          {(user?.name || user?.email || "G").charAt(0).toUpperCase()}
        </div>

        <div className="profile-info">
          <strong>{user?.name || "My Account"}</strong>
          <small>{user?.email || ""}</small>
        </div>

        <button
          type="button"
          className="logout-icon btn btn-link p-0"
          title="Sign out"
          onClick={logout}
        >
          <i className="bi bi-box-arrow-right"></i>
        </button>
      </div>
    </aside>
  );
}

// -------------------- Protected Route --------------------

function ProtectedRoute({ children }) {
  return localStorage.getItem("token") ? (
    children
  ) : (
    <Navigate to="/" replace />
  );
}

// -------------------- Dashboard --------------------

function Dashboard() {
  const [user] = useState(getStoredUser);

  const [incomeData, setIncomeData] = useState([]);
  const [expenseData, setExpenseData] = useState([]);
  const [budgetData, setBudgetData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      setLoading(true);
      setError("");

      try {
        const [incomeResponse, expenseResponse, budgetResponse] =
          await Promise.all([
            api.get("/api/incomes"),
            api.get("/api/expenses"),
            api.get("/api/budgets"),
          ]);

        if (!active) return;

        setIncomeData(getList(incomeResponse.data));
        setExpenseData(getList(expenseResponse.data));
        setBudgetData(getList(budgetResponse.data));
      } catch (err) {
        if (!active) return;

        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setError("Your session has expired. Please sign in again.");
        } else {
          setError(getErrorMessage(err, "Loading dashboard"));
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadDashboard();

    return () => {
      active = false;
    };
  }, []);

  const totalIncome = incomeData.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );

  const totalExpenses = expenseData.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );

  const totalBudget = budgetData.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );

  // Build the last six months of income and expense totals from API records.
  const monthlyData = Array.from({ length: 6 }, (_, index) => {
    const monthDate = new Date();
    monthDate.setDate(1);
    monthDate.setMonth(monthDate.getMonth() - (5 - index));

    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();

    const income = incomeData.reduce((sum, item) => {
      const value = item.incomeDate || item.date || item.createdAt;
      if (!value) return sum;
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return sum;
      return date.getFullYear() === year && date.getMonth() === month
        ? sum + Number(item.amount || 0)
        : sum;
    }, 0);

    const expenses = expenseData.reduce((sum, item) => {
      const value = item.expenseDate || item.date || item.createdAt;
      if (!value) return sum;
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return sum;
      return date.getFullYear() === year && date.getMonth() === month
        ? sum + Number(item.amount || 0)
        : sum;
    }, 0);

    return {
      month: monthDate.toLocaleDateString("en-IN", { month: "short" }),
      income,
      expenses,
    };
  });

  const monthlyMaxValue = Math.max(1, ...monthlyData.flatMap((item) => [item.income, item.expenses]));

  const stats = [
    {
      title: "Total Income",
      amount: totalIncome,
      icon: "bi-cash-stack",
      color: "green",
    },
    {
      title: "Total Expenses",
      amount: totalExpenses,
      icon: "bi-receipt",
      color: "red",
    },
    {
      title: "Net Balance",
      amount: totalIncome - totalExpenses,
      icon: "bi-wallet2",
      color: "blue",
    },
    {
      title: "Total Budgets",
      amount: totalBudget,
      icon: "bi-piggy-bank",
      color: "purple",
    },
  ];

  const transactions = [
    ...incomeData.map((item, index) => ({
      id: `income-${item.id ?? index}`,
      name: item.title || item.source || item.description || "Income",
      category: item.source || item.categoryName || "Income",
      date: item.incomeDate || item.date || item.createdAt,
      amount: Number(item.amount || 0),
    })),

    ...expenseData.map((item, index) => ({
      id: `expense-${item.id ?? index}`,
      name: item.title || item.description || "Expense",
      category: item.categoryName || "Expense",
      date: item.expenseDate || item.date || item.createdAt,
      amount: -Number(item.amount || 0),
    })),
  ]
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
    .slice(0, 5);

  function formatDate(date) {
    if (!date) return "—";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) return String(date);

    return parsed.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <div className="dashboard-layout">
      <Sidebar activePage="Dashboard" user={user} />

      <main className="dashboard-main">
        <header className="topbar">
          <div>
            <h4>Dashboard</h4>
            <p>Here's your financial overview.</p>
          </div>

          <Link to="/expenses" className="btn btn-primary">
            <i className="bi bi-plus-lg me-2"></i>
            Add transaction
          </Link>
        </header>

        <section className="welcome-banner">
          <div>
            <span className="welcome-eyebrow">
              YOUR MONEY, YOUR CONTROL
            </span>
            <h2>Welcome back, {user.name || "there"}!</h2>
            <p>Keep track of your income and expenses in one place.</p>
          </div>

          <i className="bi bi-graph-up-arrow welcome-illustration"></i>
        </section>

        {error && (
          <div className="alert alert-danger mt-4" role="alert">
            {error}
            {error.includes("sign in again") && (
              <div>
                <Link to="/">Go to login</Link>
              </div>
            )}
          </div>
        )}

        <section className="stats-grid">
          {stats.map((stat) => (
            <div className="stat-card" key={stat.title}>
              <div className={`stat-icon ${stat.color}`}>
                <i className={`bi ${stat.icon}`}></i>
              </div>

              <p>{stat.title}</p>
              <h3>{loading ? "Loading..." : formatCurrency(stat.amount)}</h3>

              <small>
                {loading ? "Loading records..." : "From your account records"}
              </small>
            </div>
          ))}
        </section>

        {/* Monthly income versus expenses chart (React + CSS; no chart library required). */}
        <section className="content-card monthly-chart-card">
          <div className="section-heading">
            <div>
              <h5>Income vs. expenses</h5>
              <p>Monthly comparison for the last six months</p>
            </div>
            <span className="chart-period">Last 6 months</span>
          </div>

          {loading ? (
            <div className="chart-empty-state">Loading monthly activity...</div>
          ) : (
            <>
              <div className="monthly-chart" aria-label="Monthly income and expenses bar chart">
                {monthlyData.map((item) => (
                  <div className="monthly-chart-column" key={item.month}>
                    <div className="monthly-chart-bars">
                      <div
                        className="monthly-bar income-bar"
                        style={{ height: `${(item.income / monthlyMaxValue) * 100}%` }}
                        title={`Income: ${formatCurrency(item.income)}`}
                        aria-label={`Income ${formatCurrency(item.income)}`}
                      />
                      <div
                        className="monthly-bar expense-bar"
                        style={{ height: `${(item.expenses / monthlyMaxValue) * 100}%` }}
                        title={`Expenses: ${formatCurrency(item.expenses)}`}
                        aria-label={`Expenses ${formatCurrency(item.expenses)}`}
                      />
                    </div>
                    <small>{item.month}</small>
                  </div>
                ))}
              </div>

              <div className="monthly-chart-legend">
                <span><i className="legend-dot income-legend" /> Income</span>
                <span><i className="legend-dot expense-legend" /> Expenses</span>
              </div>
            </>
          )}
        </section>

        <section className="content-card">
          <div className="section-heading">
            <div>
              <h5>Recent transactions</h5>
              <p>Your latest income and expenses</p>
            </div>

            <Link to="/expenses">View expenses</Link>
          </div>

          <div className="table-responsive">
            <table className="table align-middle">
              <thead>
                <tr>
                  <th>TRANSACTION</th>
                  <th>CATEGORY</th>
                  <th>DATE</th>
                  <th className="text-end">AMOUNT</th>
                </tr>
              </thead>

              <tbody>
                {!loading && transactions.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center text-muted py-4">
                      No transactions found.
                    </td>
                  </tr>
                )}

                {transactions.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="transaction-name">
                        <span className="transaction-dot"></span>
                        {item.name}
                      </div>
                    </td>

                    <td>
                      <span className="category-badge">{item.category}</span>
                    </td>

                    <td className="date-text">{formatDate(item.date)}</td>

                    <td
                      className={`text-end fw-semibold ${
                        item.amount >= 0
                          ? "amount-positive"
                          : "amount-negative"
                      }`}
                    >
                      {item.amount > 0 ? "+" : ""}
                      {formatCurrency(item.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <footer className="dashboard-footer">
          ExpenseFlow · Personal Finance Management
        </footer>
      </main>
    </div>
  );
}

// -------------------- Other Pages --------------------

function Placeholder({ title }) {
  const user = getStoredUser();

  return (
    <div className="dashboard-layout">
      <Sidebar activePage={title} user={user} />

      <main className="dashboard-main">
        <header className="topbar">
          <div>
            <h4>{title}</h4>
            <p>Manage your {title.toLowerCase()}.</p>
          </div>
        </header>

        <section className="content-card">
          <h5>{title}</h5>
          <p className="text-muted mb-0">
            This page will be implemented in the next step.
          </p>
        </section>
      </main>
    </div>
  );
}

// -------------------- Application Routes --------------------

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            localStorage.getItem("token") ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Login />
            )
          }
        />
        <Route path="/register" element={<Register />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/expenses"
          element={
            <ProtectedRoute>
              <Expenses />
            </ProtectedRoute>
          }
        />

        {/* Only one Income route: render the real Income page. */}
        <Route
          path="/income"
          element={
            <ProtectedRoute>
              <Income />
            </ProtectedRoute>
          }
        />

        <Route
          path="/categories"
          element={
            <ProtectedRoute>
              <Categories />
            </ProtectedRoute>
          }
        />

        <Route
          path="/budgets"
          element={
            <ProtectedRoute>
              <Budgets />
            </ProtectedRoute>
          }
        />

       <Route
         path="/reports"
         element={
           <ProtectedRoute>
             <Reports />
           </ProtectedRoute>
         }
       />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
