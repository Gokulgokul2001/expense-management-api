import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

const INITIAL_FORM = {
  title: "",
  description: "",
  amount: "",
  incomeDate: new Date().toISOString().slice(0, 10),
  source: "SALARY",
};

const INCOME_SOURCES = [
  { value: "SALARY", label: "Salary" },
  { value: "BONUS", label: "Bonus" },
  { value: "FREELANCE", label: "Freelance" },
  { value: "BUSINESS", label: "Business" },
  { value: "INVESTMENT", label: "Investment" },
  { value: "OTHER", label: "Other" },
];

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
    return "Invalid income details. Please check all required fields.";
  }

  if (error?.response?.status === 401) {
    return "Your session has expired. Please log in again.";
  }

  if (error?.response?.status === 403) {
    return "You do not have permission to perform this action.";
  }

  return error?.message || "Something went wrong. Please try again.";
};

function Income() {
  const [incomes, setIncomes] = useState([]);
  const [form, setForm] = useState(INITIAL_FORM);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const loadIncomes = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/api/incomes");

      const data = response.data;
      setIncomes(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIncomes();
  }, []);

  const filteredIncomes = useMemo(() => {
    const query = search.trim().toLowerCase();

    return incomes.filter((income) => {
      const matchesSearch =
        !query ||
        String(income.title || "").toLowerCase().includes(query) ||
        String(income.description || "").toLowerCase().includes(query) ||
        String(income.source || "").toLowerCase().includes(query);

      const matchesSource =
        sourceFilter === "ALL" || income.source === sourceFilter;

      return matchesSearch && matchesSource;
    });
  }, [incomes, search, sourceFilter]);

  const totalIncome = useMemo(
    () =>
      incomes.reduce(
        (total, income) => total + (Number(income.amount) || 0),
        0
      ),
    [incomes]
  );

  const resetForm = () => {
    setForm({
      ...INITIAL_FORM,
      incomeDate: new Date().toISOString().slice(0, 10),
    });
    setEditingId(null);
    setShowForm(false);
  };

  const openAddForm = () => {
    setError("");
    setSuccess("");
    setForm({
      ...INITIAL_FORM,
      incomeDate: new Date().toISOString().slice(0, 10),
    });
    setEditingId(null);
    setShowForm(true);
  };

  const openEditForm = (income) => {
    setError("");
    setSuccess("");

    setForm({
      title: income.title || "",
      description: income.description || "",
      amount: income.amount ?? "",
      incomeDate: income.incomeDate
        ? String(income.incomeDate).slice(0, 10)
        : new Date().toISOString().slice(0, 10),
      source: income.source || "SALARY",
    });

    setEditingId(income.id);
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

    if (!form.title.trim()) {
      setError("Income title is required.");
      return;
    }

    if (!form.amount || Number(form.amount) <= 0) {
      setError("Amount must be greater than zero.");
      return;
    }

    if (!form.incomeDate) {
      setError("Income date is required.");
      return;
    }

    if (!form.source) {
      setError("Income source is required.");
      return;
    }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      amount: Number(form.amount),
      incomeDate: form.incomeDate,
      source: form.source,
    };

    setSaving(true);

    try {
      if (editingId !== null) {
        await api.put(`/api/incomes/${editingId}`, payload);
        setSuccess("Income updated successfully.");
      } else {
        await api.post("/api/incomes", payload);
        setSuccess("Income added successfully.");
      }

      resetForm();
      await loadIncomes();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this income?"
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");
    setDeletingId(id);

    try {
      await api.delete(`/api/incomes/${id}`);
      setSuccess("Income deleted successfully.");
      await loadIncomes();
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
                  className="nav-link active bg-primary text-white rounded"
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
                  className="nav-link text-dark rounded"
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
              <h2 className="fw-bold mb-1">Income</h2>
              <p className="text-muted mb-0">
                Manage and track your income records.
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
              {showForm ? "Cancel" : "Add Income"}
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

          {/* Total income card */}
          <div className="row g-3 mb-4">
            <div className="col-md-6 col-xl-4">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <p className="text-muted mb-2">Total Income</p>
                      <h3 className="fw-bold mb-0">
                        {formatCurrency(totalIncome)}
                      </h3>
                    </div>
                    <div className="rounded-circle bg-success bg-opacity-10 p-3">
                      <i className="bi bi-cash-stack text-success fs-4"></i>
                    </div>
                  </div>
                  <p className="text-muted small mt-3 mb-0">
                    Across {incomes.length} income record
                    {incomes.length === 1 ? "" : "s"}
                  </p>
                </div>
              </div>
            </div>

            <div className="col-md-6 col-xl-4">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <p className="text-muted mb-2">Filtered Records</p>
                      <h3 className="fw-bold mb-0">
                        {filteredIncomes.length}
                      </h3>
                    </div>
                    <div className="rounded-circle bg-primary bg-opacity-10 p-3">
                      <i className="bi bi-list-ul text-primary fs-4"></i>
                    </div>
                  </div>
                  <p className="text-muted small mt-3 mb-0">
                    Matching your current filters
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
                  {editingId !== null ? "Edit Income" : "Add New Income"}
                </h5>
              </div>

              <div className="card-body">
                <form onSubmit={handleSubmit}>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label htmlFor="incomeTitle" className="form-label">
                        Title <span className="text-danger">*</span>
                      </label>
                      <input
                        id="incomeTitle"
                        type="text"
                        name="title"
                        className="form-control"
                        placeholder="e.g. October Salary"
                        value={form.title}
                        onChange={handleChange}
                        maxLength={150}
                        required
                      />
                    </div>

                    <div className="col-md-6">
                      <label htmlFor="incomeAmount" className="form-label">
                        Amount (₹) <span className="text-danger">*</span>
                      </label>
                      <input
                        id="incomeAmount"
                        type="number"
                        name="amount"
                        className="form-control"
                        placeholder="Enter amount"
                        value={form.amount}
                        onChange={handleChange}
                        min="0.01"
                        step="0.01"
                        required
                      />
                    </div>

                    <div className="col-md-6">
                      <label htmlFor="incomeDate" className="form-label">
                        Income Date <span className="text-danger">*</span>
                      </label>
                      <input
                        id="incomeDate"
                        type="date"
                        name="incomeDate"
                        className="form-control"
                        value={form.incomeDate}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className="col-md-6">
                      <label htmlFor="incomeSource" className="form-label">
                        Income Source <span className="text-danger">*</span>
                      </label>
                      <select
                        id="incomeSource"
                        name="source"
                        className="form-select"
                        value={form.source}
                        onChange={handleChange}
                        required
                      >
                        {INCOME_SOURCES.map((source) => (
                          <option key={source.value} value={source.value}>
                            {source.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-12">
                      <label
                        htmlFor="incomeDescription"
                        className="form-label"
                      >
                        Description
                      </label>
                      <textarea
                        id="incomeDescription"
                        name="description"
                        className="form-control"
                        placeholder="Enter an optional description"
                        rows="3"
                        maxLength={1000}
                        value={form.description}
                        onChange={handleChange}
                      ></textarea>
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
                        ) : (
                          editingId !== null
                            ? "Update Income"
                            : "Save Income"
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

          {/* Search and filters */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-7">
                  <label htmlFor="incomeSearch" className="form-label">
                    Search income
                  </label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <i className="bi bi-search"></i>
                    </span>
                    <input
                      id="incomeSearch"
                      type="search"
                      className="form-control"
                      placeholder="Search by title, description, or source"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                </div>

                <div className="col-md-5">
                  <label htmlFor="sourceFilter" className="form-label">
                    Filter by source
                  </label>
                  <select
                    id="sourceFilter"
                    className="form-select"
                    value={sourceFilter}
                    onChange={(e) => setSourceFilter(e.target.value)}
                  >
                    <option value="ALL">All sources</option>
                    {INCOME_SOURCES.map((source) => (
                      <option key={source.value} value={source.value}>
                        {source.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Income table */}
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
              <h5 className="fw-bold mb-0">Income Records</h5>

              <button
                type="button"
                className="btn btn-sm btn-outline-primary"
                onClick={loadIncomes}
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
                    <th>Title</th>
                    <th>Source</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Description</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="text-center py-5">
                        <div
                          className="spinner-border text-primary"
                          role="status"
                        >
                          <span className="visually-hidden">Loading...</span>
                        </div>
                        <p className="text-muted mt-2 mb-0">
                          Loading income records...
                        </p>
                      </td>
                    </tr>
                  ) : filteredIncomes.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-5">
                        <i className="bi bi-inbox fs-1 text-muted"></i>
                        <p className="fw-semibold mt-2 mb-1">
                          No income records found
                        </p>
                        <p className="text-muted mb-0">
                          Add an income record or change your search filters.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredIncomes.map((income) => (
                      <tr key={income.id}>
                        <td className="fw-semibold">{income.title}</td>

                        <td>
                          <span className="badge bg-success bg-opacity-10 text-success">
                            {INCOME_SOURCES.find(
                              (item) => item.value === income.source
                            )?.label || income.source || "-"}
                          </span>
                        </td>

                        <td>{formatDate(income.incomeDate)}</td>

                        <td className="fw-semibold text-success">
                          {formatCurrency(income.amount)}
                        </td>

                        <td>
                          <span
                            className="text-muted"
                            title={income.description || ""}
                          >
                            {income.description
                              ? income.description.length > 40
                                ? `${income.description.slice(0, 40)}...`
                                : income.description
                              : "-"}
                          </span>
                        </td>

                        <td>
                          <div className="d-flex justify-content-center gap-2">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary"
                              title="Edit income"
                              aria-label={`Edit ${income.title}`}
                              onClick={() => openEditForm(income)}
                            >
                              <i className="bi bi-pencil"></i>
                            </button>

                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              title="Delete income"
                              aria-label={`Delete ${income.title}`}
                              disabled={deletingId === income.id}
                              onClick={() => handleDelete(income.id)}
                            >
                              {deletingId === income.id ? (
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

            {!loading && filteredIncomes.length > 0 && (
              <div className="card-footer bg-white text-muted small">
                Showing {filteredIncomes.length} of {incomes.length} records
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default Income;