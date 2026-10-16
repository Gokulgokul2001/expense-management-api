import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import "../App.css";

const EMPTY_FORM = {
  title: "",
  description: "",
  amount: "",
  expenseDate: new Date().toISOString().slice(0, 10),
  paymentMethod: "UPI",
  categoryId: "",
};

function formatCurrency(amount) {
  return Number(amount || 0).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  });
}

function formatDate(date) {
  if (!date) return "—";

  const parsed = new Date(`${date}T00:00:00`);

  return Number.isNaN(parsed.getTime())
    ? date
    : parsed.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
}

function getErrorMessage(error, action) {
  if (error.response) {
    return (
      error.response.data?.message ||
      `${action} failed (HTTP ${error.response.status}).`
    );
  }

  return "Cannot connect to the backend. Check that Spring Boot is running on port 8083.";
}

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  async function loadExpenses() {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/api/expenses");

      setExpenses(
        Array.isArray(response.data)
          ? response.data
          : response.data?.content || []
      );
    } catch (err) {
      setError(getErrorMessage(err, "Loading expenses"));
    } finally {
      setLoading(false);
    }
  }

  async function loadCategories() {
    try {
      const response = await api.get("/api/categories");

      setCategories(
        Array.isArray(response.data)
          ? response.data
          : response.data?.content || []
      );
    } catch {
      // Keep the expense page usable if category loading fails.
      setCategories([]);
    }
  }

  useEffect(() => {
    loadExpenses();
    loadCategories();
  }, []);

  function openCreateForm() {
    setEditingId(null);
    setForm({
      ...EMPTY_FORM,
      expenseDate: new Date().toISOString().slice(0, 10),
    });
    setError("");
    setSuccess("");
    setShowForm(true);
  }

  function openEditForm(expense) {
    setEditingId(expense.id);

    setForm({
      title: expense.title || "",
      description: expense.description || "",
      amount: String(expense.amount ?? ""),
      expenseDate: expense.expenseDate || "",
      paymentMethod: expense.paymentMethod || "UPI",
      categoryId: String(expense.categoryId ?? ""),
    });

    setError("");
    setSuccess("");
    setShowForm(true);
  }

  function handleFormChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!form.categoryId) {
      setError("Please select a category.");
      return;
    }

    if (!Number.isFinite(Number(form.amount)) || Number(form.amount) <= 0) {
      setError("Enter an amount greater than zero.");
      return;
    }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      amount: Number(form.amount),
      expenseDate: form.expenseDate,
      paymentMethod: form.paymentMethod,
      categoryId: Number(form.categoryId),
    };

    setSaving(true);

    try {
      if (editingId !== null) {
        await api.put(`/api/expenses/${editingId}`, payload);
        setSuccess("Expense updated successfully.");
      } else {
        await api.post("/api/expenses", payload);
        setSuccess("Expense created successfully.");
      }

      setShowForm(false);
      setEditingId(null);
      setForm(EMPTY_FORM);

      await loadExpenses();
    } catch (err) {
      setError(getErrorMessage(err, "Saving expense"));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(expense) {
    const confirmed = window.confirm(
      `Delete "${expense.title}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      await api.delete(`/api/expenses/${expense.id}`);
      setSuccess("Expense deleted successfully.");
      await loadExpenses();
    } catch (err) {
      setError(getErrorMessage(err, "Deleting expense"));
    }
  }

  const filteredExpenses = expenses.filter((expense) => {
    const query = search.trim().toLowerCase();

    const matchesSearch =
      !query ||
      (expense.title || "").toLowerCase().includes(query) ||
      (expense.description || "").toLowerCase().includes(query) ||
      (expense.categoryName || "").toLowerCase().includes(query) ||
      (expense.paymentMethod || "").toLowerCase().includes(query);

    const matchesCategory =
      categoryFilter === "all" ||
      String(expense.categoryId) === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const totalAmount = filteredExpenses.reduce(
    (sum, expense) => sum + Number(expense.amount || 0),
    0
  );

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <i className="bi bi-wallet2"></i>
          <span>
            Expense<span className="brand-highlight">Flow</span>
          </span>
        </div>

        <div className="sidebar-label">MAIN MENU</div>

        <nav className="sidebar-nav">
          <Link className="nav-item" to="/dashboard">
            <i className="bi bi-grid"></i> Dashboard
          </Link>

          <Link className="nav-item active" to="/expenses">
            <i className="bi bi-receipt"></i> Expenses
          </Link>

          <Link className="nav-item" to="/income">
            <i className="bi bi-cash-stack"></i> Income
          </Link>

          <Link className="nav-item" to="/categories">
            <i className="bi bi-tags"></i> Categories
          </Link>

          <Link className="nav-item" to="/budgets">
            <i className="bi bi-piggy-bank"></i> Budgets
          </Link>

          <Link className="nav-item" to="/reports">
            <i className="bi bi-bar-chart"></i> Reports
          </Link>
        </nav>

        <div className="sidebar-bottom">
          <Link
            to="/dashboard"
            className="nav-item"
            onClick={() => {
              localStorage.removeItem("token");
              localStorage.removeItem("user");
            }}
          >
            <i className="bi bi-box-arrow-right"></i> Sign out
          </Link>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="topbar">
          <div>
            <h4>Expenses</h4>
            <p>Track and manage your spending.</p>
          </div>

          <button
            type="button"
            className="btn btn-primary"
            onClick={openCreateForm}
          >
            <i className="bi bi-plus-lg me-2"></i>
            Add expense
          </button>
        </header>

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

        {showForm && (
          <section className="content-card mb-4">
            <div className="section-heading">
              <div>
                <h5>{editingId !== null ? "Edit expense" : "Add expense"}</h5>
                <p>Enter your transaction details.</p>
              </div>

              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setShowForm(false)}
                disabled={saving}
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label" htmlFor="expense-title">
                    Title
                  </label>
                  <input
                    id="expense-title"
                    name="title"
                    className="form-control"
                    value={form.title}
                    onChange={handleFormChange}
                    maxLength={150}
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label" htmlFor="expense-amount">
                    Amount (₹)
                  </label>
                  <input
                    id="expense-amount"
                    name="amount"
                    type="number"
                    className="form-control"
                    value={form.amount}
                    onChange={handleFormChange}
                    min="0.01"
                    step="0.01"
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label" htmlFor="expense-date">
                    Expense date
                  </label>
                  <input
                    id="expense-date"
                    name="expenseDate"
                    type="date"
                    className="form-control"
                    value={form.expenseDate}
                    onChange={handleFormChange}
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label" htmlFor="expense-category">
                    Category
                  </label>
                  <select
                    id="expense-category"
                    name="categoryId"
                    className="form-select"
                    value={form.categoryId}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="">Select category</option>

                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>

                  {categories.length === 0 && (
                    <small className="text-muted">
                      No categories loaded. Check GET /api/categories.
                    </small>
                  )}
                </div>

                <div className="col-md-6">
                  <label className="form-label" htmlFor="expense-payment">
                    Payment method
                  </label>
                  <select
                    id="expense-payment"
                    name="paymentMethod"
                    className="form-select"
                    value={form.paymentMethod}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="CASH">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="CARD">Card</option>
                    <option value="BANK_TRANSFER">Bank transfer</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div className="col-md-6">
                  <label
                    className="form-label"
                    htmlFor="expense-description"
                  >
                    Description
                  </label>
                  <textarea
                    id="expense-description"
                    name="description"
                    className="form-control"
                    rows={2}
                    value={form.description}
                    onChange={handleFormChange}
                    maxLength={1000}
                  />
                </div>
              </div>

              <div className="mt-4">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingId !== null
                      ? "Update expense"
                      : "Save expense"}
                </button>
              </div>
            </form>
          </section>
        )}

        <section className="stats-grid expense-summary">
          <div className="stat-card">
            <div className="stat-icon red">
              <i className="bi bi-receipt"></i>
            </div>
            <p>Total expenses</p>
            <h3>{formatCurrency(expenses.reduce(
              (sum, item) => sum + Number(item.amount || 0),
              0
            ))}</h3>
            <small>{expenses.length} records</small>
          </div>

          <div className="stat-card">
            <div className="stat-icon blue">
              <i className="bi bi-funnel"></i>
            </div>
            <p>Filtered amount</p>
            <h3>{formatCurrency(totalAmount)}</h3>
            <small>{filteredExpenses.length} matching records</small>
          </div>
        </section>

        <section className="content-card">
          <div className="section-heading">
            <div>
              <h5>All expenses</h5>
              <p>Search and manage your transactions.</p>
            </div>

            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={loadExpenses}
              disabled={loading}
            >
              <i className="bi bi-arrow-clockwise me-2"></i>
              Refresh
            </button>
          </div>

          <div className="row g-3 mb-4">
            <div className="col-md-8">
              <input
                type="search"
                className="form-control"
                placeholder="Search title, description, category or payment..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                aria-label="Search expenses"
              />
            </div>

            <div className="col-md-4">
              <select
                className="form-select"
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
                aria-label="Filter by category"
              >
                <option value="all">All categories</option>

                {categories.map((category) => (
                  <option key={category.id} value={String(category.id)}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table align-middle">
              <thead>
                <tr>
                  <th>TITLE</th>
                  <th>CATEGORY</th>
                  <th>DATE</th>
                  <th>PAYMENT</th>
                  <th className="text-end">AMOUNT</th>
                  <th className="text-end">ACTIONS</th>
                </tr>
              </thead>

              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={6} className="text-center py-4">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <p className="text-muted mt-2 mb-0">
                        Loading expenses...
                      </p>
                    </td>
                  </tr>
                )}

                {!loading && filteredExpenses.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center text-muted py-4">
                      {error
                        ? "Expenses could not be loaded."
                        : "No matching expenses found."}
                    </td>
                  </tr>
                )}

                {!loading &&
                  filteredExpenses.map((expense) => (
                    <tr key={expense.id}>
                      <td>
                        <div className="transaction-name">
                          <span className="transaction-dot"></span>
                          <div>
                            <strong>{expense.title}</strong>
                            {expense.description && (
                              <small className="d-block text-muted">
                                {expense.description}
                              </small>
                            )}
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="category-badge">
                          {expense.categoryName || "Uncategorized"}
                        </span>
                      </td>

                      <td className="date-text">
                        {formatDate(expense.expenseDate)}
                      </td>

                      <td>{expense.paymentMethod || "—"}</td>

                      <td className="text-end fw-semibold amount-negative">
                        {formatCurrency(expense.amount)}
                      </td>

                      <td className="text-end">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary me-2"
                          title="Edit expense"
                          onClick={() => openEditForm(expense)}
                        >
                          <i className="bi bi-pencil"></i>
                        </button>

                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          title="Delete expense"
                          onClick={() => handleDelete(expense)}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
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