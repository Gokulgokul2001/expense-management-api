import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

const INITIAL_FORM = {
  name: "",
  amount: "",
  startDate: new Date().toISOString().slice(0, 10),
  endDate: new Date().toISOString().slice(0, 10),
  categoryId: "",
};

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);

const formatDate = (date) => {
  if (!date) return "-";

  const parts = String(date).slice(0, 10).split("-");

  if (parts.length !== 3) return date;

  return `${parts[2]}-${parts[1]}-${parts[0]}`;
};

const getErrorMessage = (error) => {
  const data = error?.response?.data;

  if (typeof data === "string" && data.trim()) {
    return data;
  }

  if (data?.message) {
    return data.message;
  }

  if (data?.errors && typeof data.errors === "object") {
    return Object.values(data.errors).join(", ");
  }

  if (data?.fieldErrors && typeof data.fieldErrors === "object") {
    return Object.values(data.fieldErrors).join(", ");
  }

  if (error?.response?.status === 400) {
    return "Invalid budget details. Check the name, amount, and dates.";
  }

  if (error?.response?.status === 401) {
    return "Your session has expired. Please log in again.";
  }

  if (error?.response?.status === 403) {
    return "You do not have permission to perform this action.";
  }

  if (error?.response?.status === 404) {
    return "The budget or category was not found.";
  }

  if (error?.response?.status === 409) {
    return "This budget cannot be saved because it conflicts with existing data.";
  }

  return error?.message || "Something went wrong. Please try again.";
};

function Budgets() {
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(INITIAL_FORM);

  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const [budgetResponse, categoryResponse] = await Promise.all([
        api.get("/api/budgets"),
        api.get("/api/categories"),
      ]);

      setBudgets(
        Array.isArray(budgetResponse.data) ? budgetResponse.data : []
      );

      setCategories(
        Array.isArray(categoryResponse.data) ? categoryResponse.data : []
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredBudgets = useMemo(() => {
    const query = search.trim().toLowerCase();

    return budgets.filter((budget) => {
      const matchesSearch =
        !query ||
        String(budget.name || "").toLowerCase().includes(query) ||
        String(budget.categoryName || "").toLowerCase().includes(query);

      const matchesCategory =
        categoryFilter === "ALL" ||
        String(budget.categoryId ?? "") === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [budgets, search, categoryFilter]);

  const totalBudget = useMemo(
    () =>
      budgets.reduce(
        (total, budget) => total + (Number(budget.amount) || 0),
        0
      ),
    [budgets]
  );

  const resetForm = () => {
    setForm({
      ...INITIAL_FORM,
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date().toISOString().slice(0, 10),
    });

    setEditingId(null);
    setShowForm(false);
  };

  const openAddForm = () => {
    setError("");
    setSuccess("");

    setForm({
      ...INITIAL_FORM,
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date().toISOString().slice(0, 10),
    });

    setEditingId(null);
    setShowForm(true);
  };

  const openEditForm = (budget) => {
    setError("");
    setSuccess("");

    setForm({
      name: budget.name || "",
      amount: budget.amount ?? "",
      startDate: budget.startDate
        ? String(budget.startDate).slice(0, 10)
        : "",
      endDate: budget.endDate
        ? String(budget.endDate).slice(0, 10)
        : "",
      categoryId:
        budget.categoryId === null || budget.categoryId === undefined
          ? ""
          : String(budget.categoryId),
    });

    setEditingId(budget.id);
    setShowForm(true);

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const name = form.name.trim();
    const amount = Number(form.amount);

    if (name.length < 2 || name.length > 150) {
      setError("Budget name must be between 2 and 150 characters.");
      return;
    }

    if (!form.amount || !Number.isFinite(amount) || amount <= 0) {
      setError("Budget amount must be greater than zero.");
      return;
    }

    if (!form.startDate || !form.endDate) {
      setError("Start date and end date are required.");
      return;
    }

    if (form.endDate < form.startDate) {
      setError("End date cannot be earlier than the start date.");
      return;
    }

    const payload = {
      name,
      amount,
      startDate: form.startDate,
      endDate: form.endDate,
      categoryId: form.categoryId ? Number(form.categoryId) : null,
    };

    setSaving(true);

    try {
      if (editingId !== null) {
        await api.put(`/api/budgets/${editingId}`, payload);
        setSuccess("Budget updated successfully.");
      } else {
        await api.post("/api/budgets", payload);
        setSuccess("Budget created successfully.");
      }

      resetForm();
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (budget) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete the budget "${budget.name}"?`
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");
    setDeletingId(budget.id);

    try {
      await api.delete(`/api/budgets/${budget.id}`);
      setSuccess("Budget deleted successfully.");
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="container-fluid py-4">
      <div className="row g-4">
        {/* Sidebar */}
        <aside className="col-lg-2">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h5 className="fw-bold mb-4">ExpenseFlow</h5>

              <nav className="nav flex-column gap-2">
                <Link
                  to="/dashboard"
                  className="nav-link text-dark rounded"
                >
                  <i className="bi bi-grid me-2"></i>
                  Dashboard
                </Link>

                <Link
                  to="/expenses"
                  className="nav-link text-dark rounded"
                >
                  <i className="bi bi-wallet2 me-2"></i>
                  Expenses
                </Link>

                <Link
                  to="/income"
                  className="nav-link text-dark rounded"
                >
                  <i className="bi bi-cash-stack me-2"></i>
                  Income
                </Link>

                <Link
                  to="/categories"
                  className="nav-link text-dark rounded"
                >
                  <i className="bi bi-tags me-2"></i>
                  Categories
                </Link>

                <Link
                  to="/budgets"
                  className="nav-link active bg-primary text-white rounded"
                >
                  <i className="bi bi-piggy-bank me-2"></i>
                  Budgets
                </Link>

                <Link
                  to="/reports"
                  className="nav-link text-dark rounded"
                >
                  <i className="bi bi-bar-chart me-2"></i>
                  Reports
                </Link>
              </nav>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="col-lg-10">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
            <div>
              <h2 className="fw-bold mb-1">Budgets</h2>
              <p className="text-muted mb-0">
                Plan and manage your spending limits.
              </p>
            </div>

            <button
              type="button"
              className="btn btn-primary"
              onClick={showForm ? resetForm : openAddForm}
            >
              <i
                className={`bi ${
                  showForm ? "bi-x-lg" : "bi-plus-lg"
                } me-2`}
              ></i>
              {showForm ? "Cancel" : "Add Budget"}
            </button>
          </div>

          {/* Notifications */}
          {error && (
            <div className="alert alert-danger alert-dismissible" role="alert">
              <strong>Error:</strong> {error}

              <button
                type="button"
                className="btn-close"
                aria-label="Close"
                onClick={() => setError("")}
              ></button>
            </div>
          )}

          {success && (
            <div className="alert alert-success alert-dismissible" role="alert">
              {success}

              <button
                type="button"
                className="btn-close"
                aria-label="Close"
                onClick={() => setSuccess("")}
              ></button>
            </div>
          )}

          {/* Summary cards */}
          <div className="row g-3 mb-4">
            <div className="col-md-6 col-xl-4">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <p className="text-muted mb-2">Total Budget</p>
                      <h3 className="fw-bold mb-0">
                        {formatCurrency(totalBudget)}
                      </h3>
                    </div>

                    <div className="rounded-circle bg-primary bg-opacity-10 p-3">
                      <i className="bi bi-piggy-bank text-primary fs-4"></i>
                    </div>
                  </div>

                  <p className="text-muted small mt-3 mb-0">
                    Combined amount across all budgets
                  </p>
                </div>
              </div>
            </div>

            <div className="col-md-6 col-xl-4">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <p className="text-muted mb-2">Budget Records</p>
                      <h3 className="fw-bold mb-0">{budgets.length}</h3>
                    </div>

                    <div className="rounded-circle bg-success bg-opacity-10 p-3">
                      <i className="bi bi-list-check text-success fs-4"></i>
                    </div>
                  </div>

                  <p className="text-muted small mt-3 mb-0">
                    Total configured budgets
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Add/Edit form */}
          {showForm && (
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-header bg-white py-3">
                <h5 className="fw-bold mb-0">
                  {editingId !== null ? "Edit Budget" : "Create Budget"}
                </h5>
              </div>

              <div className="card-body">
                <form onSubmit={handleSubmit}>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label htmlFor="budgetName" className="form-label">
                        Budget Name <span className="text-danger">*</span>
                      </label>

                      <input
                        id="budgetName"
                        type="text"
                        name="name"
                        className="form-control"
                        placeholder="e.g. October Travel Budget"
                        value={form.name}
                        onChange={handleChange}
                        minLength={2}
                        maxLength={150}
                        required
                      />
                    </div>

                    <div className="col-md-6">
                      <label htmlFor="budgetAmount" className="form-label">
                        Budget Amount (₹){" "}
                        <span className="text-danger">*</span>
                      </label>

                      <input
                        id="budgetAmount"
                        type="number"
                        name="amount"
                        className="form-control"
                        placeholder="Enter budget amount"
                        value={form.amount}
                        onChange={handleChange}
                        min="0.01"
                        step="0.01"
                        required
                      />
                    </div>

                    <div className="col-md-6">
                      <label htmlFor="startDate" className="form-label">
                        Start Date <span className="text-danger">*</span>
                      </label>

                      <input
                        id="startDate"
                        type="date"
                        name="startDate"
                        className="form-control"
                        value={form.startDate}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className="col-md-6">
                      <label htmlFor="endDate" className="form-label">
                        End Date <span className="text-danger">*</span>
                      </label>

                      <input
                        id="endDate"
                        type="date"
                        name="endDate"
                        className="form-control"
                        value={form.endDate}
                        min={form.startDate || undefined}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className="col-12">
                      <label htmlFor="categoryId" className="form-label">
                        Category
                      </label>

                      <select
                        id="categoryId"
                        name="categoryId"
                        className="form-select"
                        value={form.categoryId}
                        onChange={handleChange}
                      >
                        <option value="">No category</option>

                        {categories.map((category) => (
                          <option
                            key={category.id}
                            value={String(category.id)}
                          >
                            {category.name}
                          </option>
                        ))}
                      </select>

                      <div className="form-text">
                        Optionally assign this budget to a category.
                      </div>
                    </div>

                    <div className="col-12 d-flex gap-2">
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={saving}
                      >
                        {saving ? (
                          <>
                            <span
                              className="spinner-border spinner-border-sm me-2"
                              aria-hidden="true"
                            ></span>
                            Saving...
                          </>
                        ) : editingId !== null ? (
                          "Update Budget"
                        ) : (
                          "Save Budget"
                        )}
                      </button>

                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={resetForm}
                        disabled={saving}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Search and category filter */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-7">
                  <label htmlFor="budgetSearch" className="form-label">
                    Search budgets
                  </label>

                  <div className="input-group">
                    <span className="input-group-text">
                      <i className="bi bi-search"></i>
                    </span>

                    <input
                      id="budgetSearch"
                      type="search"
                      className="form-control"
                      placeholder="Search by budget or category name"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                    />
                  </div>
                </div>

                <div className="col-md-5">
                  <label htmlFor="categoryFilter" className="form-label">
                    Filter by category
                  </label>

                  <select
                    id="categoryFilter"
                    className="form-select"
                    value={categoryFilter}
                    onChange={(event) =>
                      setCategoryFilter(event.target.value)
                    }
                  >
                    <option value="ALL">All categories</option>

                    {categories.map((category) => (
                      <option
                        key={category.id}
                        value={String(category.id)}
                      >
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Budget table */}
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
              <h5 className="fw-bold mb-0">Budget Records</h5>

              <button
                type="button"
                className="btn btn-sm btn-outline-primary"
                onClick={loadData}
                disabled={loading}
              >
                <i className="bi bi-arrow-clockwise me-1"></i>
                Refresh
              </button>
            </div>

            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>ID</th>
                    <th>Budget Name</th>
                    <th>Category</th>
                    <th>Amount</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="7" className="text-center py-5">
                        <div
                          className="spinner-border text-primary"
                          role="status"
                        >
                          <span className="visually-hidden">
                            Loading budgets...
                          </span>
                        </div>

                        <p className="text-muted mt-2 mb-0">
                          Loading budgets...
                        </p>
                      </td>
                    </tr>
                  ) : filteredBudgets.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-5">
                        <i className="bi bi-inbox fs-1 text-muted"></i>

                        <p className="fw-semibold mt-2 mb-1">
                          No budgets found
                        </p>

                        <p className="text-muted mb-0">
                          Add a budget or change your search filters.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredBudgets.map((budget) => (
                      <tr key={budget.id}>
                        <td>{budget.id}</td>

                        <td className="fw-semibold">{budget.name}</td>

                        <td>
                          {budget.categoryName || (
                            <span className="text-muted">No category</span>
                          )}
                        </td>

                        <td className="fw-semibold text-primary">
                          {formatCurrency(budget.amount)}
                        </td>

                        <td>{formatDate(budget.startDate)}</td>

                        <td>{formatDate(budget.endDate)}</td>

                        <td>
                          <div className="d-flex justify-content-center gap-2">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary"
                              title="Edit budget"
                              aria-label={`Edit ${budget.name}`}
                              onClick={() => openEditForm(budget)}
                            >
                              <i className="bi bi-pencil"></i>
                            </button>

                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              title="Delete budget"
                              aria-label={`Delete ${budget.name}`}
                              disabled={deletingId === budget.id}
                              onClick={() => handleDelete(budget)}
                            >
                              {deletingId === budget.id ? (
                                <span className="spinner-border spinner-border-sm"></span>
                              ) : (
                                <i className="bi bi-trash"></i>
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {!loading && filteredBudgets.length > 0 && (
              <div className="card-footer bg-white text-muted small">
                Showing {filteredBudgets.length} of {budgets.length} budgets
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default Budgets;