import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

const INITIAL_FORM = {
  name: "",
  description: "",
};

const formatDate = (date) => {
  if (!date) return "-";

  const value = String(date);
  const parts = value.slice(0, 10).split("-");

  if (parts.length !== 3) return value;

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
    return "Invalid category details. Please check the fields.";
  }

  if (error?.response?.status === 401) {
    return "Your session has expired. Please log in again.";
  }

  if (error?.response?.status === 403) {
    return "You do not have permission to perform this action.";
  }

  if (error?.response?.status === 404) {
    return "Category not found. Refresh the page and try again.";
  }

  if (error?.response?.status === 409) {
    return "This category already exists or cannot be changed.";
  }

  return error?.message || "Something went wrong. Please try again.";
};

function Categories() {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(INITIAL_FORM);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadCategories = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/api/categories");
      setCategories(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const filteredCategories = useMemo(() => {
    const query = search.trim().toLowerCase();

    return categories.filter((category) => {
      const matchesSearch =
        !query ||
        String(category.name || "").toLowerCase().includes(query) ||
        String(category.description || "").toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && category.active === true) ||
        (statusFilter === "INACTIVE" && category.active === false);

      return matchesSearch && matchesStatus;
    });
  }, [categories, search, statusFilter]);

  const activeCount = categories.filter(
    (category) => category.active === true
  ).length;

  const resetForm = () => {
    setForm(INITIAL_FORM);
    setEditingId(null);
    setShowForm(false);
  };

  const openAddForm = () => {
    setError("");
    setSuccess("");
    setForm(INITIAL_FORM);
    setEditingId(null);
    setShowForm(true);
  };

  const openEditForm = (category) => {
    setError("");
    setSuccess("");

    setForm({
      name: category.name || "",
      description: category.description || "",
    });

    setEditingId(category.id);
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
    const description = form.description.trim();

    if (!name) {
      setError("Category name is required.");
      return;
    }

    const payload = {
      name,
      description,
    };

    setSaving(true);

    try {
      if (editingId !== null) {
        await api.put(`/api/categories/${editingId}`, payload);
        setSuccess("Category updated successfully.");
      } else {
        await api.post("/api/categories", payload);
        setSuccess("Category created successfully.");
      }

      resetForm();
      await loadCategories();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (category) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete the category "${category.name}"?`
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");
    setDeletingId(category.id);

    try {
      await api.delete(`/api/categories/${category.id}`);
      setSuccess("Category deleted successfully.");
      await loadCategories();
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
                  className="nav-link active bg-primary text-white rounded"
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
              <h2 className="fw-bold mb-1">Categories</h2>
              <p className="text-muted mb-0">
                Organize and manage your expense categories.
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
              {showForm ? "Cancel" : "Add Category"}
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
                      <p className="text-muted mb-2">Total Categories</p>
                      <h3 className="fw-bold mb-0">{categories.length}</h3>
                    </div>

                    <div className="rounded-circle bg-primary bg-opacity-10 p-3">
                      <i className="bi bi-tags text-primary fs-4"></i>
                    </div>
                  </div>

                  <p className="text-muted small mt-3 mb-0">
                    All available categories
                  </p>
                </div>
              </div>
            </div>

            <div className="col-md-6 col-xl-4">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <p className="text-muted mb-2">Active Categories</p>
                      <h3 className="fw-bold mb-0">{activeCount}</h3>
                    </div>

                    <div className="rounded-circle bg-success bg-opacity-10 p-3">
                      <i className="bi bi-check-circle text-success fs-4"></i>
                    </div>
                  </div>

                  <p className="text-muted small mt-3 mb-0">
                    Categories marked as active
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
                  {editingId !== null ? "Edit Category" : "Add New Category"}
                </h5>
              </div>

              <div className="card-body">
                <form onSubmit={handleSubmit}>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label htmlFor="categoryName" className="form-label">
                        Category Name <span className="text-danger">*</span>
                      </label>

                      <input
                        id="categoryName"
                        type="text"
                        name="name"
                        className="form-control"
                        placeholder="e.g. Food, Travel, Shopping"
                        value={form.name}
                        onChange={handleChange}
                        maxLength={150}
                        required
                      />
                    </div>

                    <div className="col-12">
                      <label
                        htmlFor="categoryDescription"
                        className="form-label"
                      >
                        Description
                      </label>

                      <textarea
                        id="categoryDescription"
                        name="description"
                        className="form-control"
                        placeholder="Describe what this category is used for"
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
                        ) : editingId !== null ? (
                          "Update Category"
                        ) : (
                          "Save Category"
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
                  <label htmlFor="categorySearch" className="form-label">
                    Search categories
                  </label>

                  <div className="input-group">
                    <span className="input-group-text">
                      <i className="bi bi-search"></i>
                    </span>

                    <input
                      id="categorySearch"
                      type="search"
                      className="form-control"
                      placeholder="Search by name or description"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                    />
                  </div>
                </div>

                <div className="col-md-5">
                  <label htmlFor="statusFilter" className="form-label">
                    Filter by status
                  </label>

                  <select
                    id="statusFilter"
                    className="form-select"
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                  >
                    <option value="ALL">All statuses</option>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Categories table */}
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
              <h5 className="fw-bold mb-0">Category Records</h5>

              <button
                type="button"
                className="btn btn-sm btn-outline-primary"
                onClick={loadCategories}
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
                    <th>Category Name</th>
                    <th>Description</th>
                    <th>Status</th>
                    <th>Created Date</th>
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
                          <span className="visually-hidden">
                            Loading categories...
                          </span>
                        </div>

                        <p className="text-muted mt-2 mb-0">
                          Loading categories...
                        </p>
                      </td>
                    </tr>
                  ) : filteredCategories.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-5">
                        <i className="bi bi-inbox fs-1 text-muted"></i>

                        <p className="fw-semibold mt-2 mb-1">
                          No categories found
                        </p>

                        <p className="text-muted mb-0">
                          Add a category or change your search filters.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredCategories.map((category) => (
                      <tr key={category.id}>
                        <td>{category.id}</td>

                        <td className="fw-semibold">{category.name}</td>

                        <td>
                          <span
                            className="text-muted"
                            title={category.description || ""}
                          >
                            {category.description
                              ? category.description.length > 50
                                ? `${category.description.slice(0, 50)}...`
                                : category.description
                              : "-"}
                          </span>
                        </td>

                        <td>
                          {category.active === true ? (
                            <span className="badge bg-success bg-opacity-10 text-success">
                              Active
                            </span>
                          ) : category.active === false ? (
                            <span className="badge bg-secondary bg-opacity-10 text-secondary">
                              Inactive
                            </span>
                          ) : (
                            <span className="badge bg-light text-dark">
                              Unknown
                            </span>
                          )}
                        </td>

                        <td>{formatDate(category.createdAt)}</td>

                        <td>
                          <div className="d-flex justify-content-center gap-2">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary"
                              title="Edit category"
                              aria-label={`Edit ${category.name}`}
                              onClick={() => openEditForm(category)}
                            >
                              <i className="bi bi-pencil"></i>
                            </button>

                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              title="Delete category"
                              aria-label={`Delete ${category.name}`}
                              disabled={deletingId === category.id}
                              onClick={() => handleDelete(category)}
                            >
                              {deletingId === category.id ? (
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

            {!loading && filteredCategories.length > 0 && (
              <div className="card-footer bg-white text-muted small">
                Showing {filteredCategories.length} of {categories.length}{" "}
                categories
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default Categories;