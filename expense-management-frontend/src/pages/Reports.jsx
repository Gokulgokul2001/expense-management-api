import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

const today = new Date();

const getLocalDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getMonthStart = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
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

  if (typeof data === "string" && data.trim()) return data;
  if (data?.message) return data.message;

  if (data?.errors && typeof data.errors === "object") {
    return Object.values(data.errors).join(", ");
  }

  if (data?.fieldErrors && typeof data.fieldErrors === "object") {
    return Object.values(data.fieldErrors).join(", ");
  }

  if (error?.response?.status === 400) {
    return "Invalid report filters. Please check the selected dates.";
  }

  if (error?.response?.status === 401) {
    return "Your session has expired. Please log in again.";
  }

  if (error?.response?.status === 403) {
    return "You do not have permission to access these reports.";
  }

  return error?.message || "Unable to load the report. Please try again.";
};

function Reports() {
  const [startDate, setStartDate] = useState(getMonthStart(today));
  const [endDate, setEndDate] = useState(getLocalDate(today));

  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);

  const [dateReport, setDateReport] = useState(null);
  const [monthlyReport, setMonthlyReport] = useState(null);
  const [categoryReports, setCategoryReports] = useState([]);
  const [budgetReports, setBudgetReports] = useState([]);

  const [loadingDate, setLoadingDate] = useState(false);
  const [loadingMonth, setLoadingMonth] = useState(false);
  const [loadingOther, setLoadingOther] = useState(true);

  const [dateError, setDateError] = useState("");
  const [monthError, setMonthError] = useState("");
  const [otherError, setOtherError] = useState("");

  const [dateLoaded, setDateLoaded] = useState(false);
  const [monthLoaded, setMonthLoaded] = useState(false);

  const loadDateReport = useCallback(async () => {
    if (!startDate || !endDate) {
      setDateError("Please select both start and end dates.");
      return;
    }

    if (startDate > endDate) {
      setDateError("Start date cannot be later than end date.");
      return;
    }

    setLoadingDate(true);
    setDateError("");

    try {
      const response = await api.get("/api/reports/date-range", {
        params: { startDate, endDate },
      });

      setDateReport(response.data);
      setDateLoaded(true);
    } catch (error) {
      setDateError(getErrorMessage(error));
    } finally {
      setLoadingDate(false);
    }
  }, [startDate, endDate]);

  const loadMonthlyReport = useCallback(async () => {
    setLoadingMonth(true);
    setMonthError("");

    try {
      const response = await api.get("/api/reports/monthly", {
        params: {
          year: Number(selectedYear),
          month: Number(selectedMonth),
        },
      });

      setMonthlyReport(response.data);
      setMonthLoaded(true);
    } catch (error) {
      setMonthError(getErrorMessage(error));
    } finally {
      setLoadingMonth(false);
    }
  }, [selectedYear, selectedMonth]);

  const loadOtherReports = useCallback(async () => {
    setLoadingOther(true);
    setOtherError("");

    const results = await Promise.allSettled([
      api.get("/api/reports/category-wise"),
      api.get("/api/reports/budget-comparison"),
    ]);

    const errors = [];

    if (results[0].status === "fulfilled") {
      setCategoryReports(
        Array.isArray(results[0].value.data)
          ? results[0].value.data
          : []
      );
    } else {
      errors.push(
        `Category report: ${getErrorMessage(results[0].reason)}`
      );
    }

    if (results[1].status === "fulfilled") {
      setBudgetReports(
        Array.isArray(results[1].value.data)
          ? results[1].value.data
          : []
      );
    } else {
      errors.push(
        `Budget comparison: ${getErrorMessage(results[1].reason)}`
      );
    }

    if (errors.length > 0) {
      setOtherError(errors.join(" "));
    }

    setLoadingOther(false);
  }, []);

  useEffect(() => {
    loadDateReport();
    loadMonthlyReport();
    loadOtherReports();
  }, [loadDateReport, loadMonthlyReport, loadOtherReports]);

  const categoryTotal = useMemo(
    () =>
      categoryReports.reduce(
        (sum, item) => sum + (Number(item.totalExpenses) || 0),
        0
      ),
    [categoryReports]
  );

  const budgetTotal = useMemo(
    () =>
      budgetReports.reduce(
        (sum, item) => sum + (Number(item.budgetAmount) || 0),
        0
      ),
    [budgetReports]
  );

  const actualBudgetExpenses = useMemo(
    () =>
      budgetReports.reduce(
        (sum, item) => sum + (Number(item.actualExpenses) || 0),
        0
      ),
    [budgetReports]
  );

  const totalRemaining = useMemo(
    () =>
      budgetReports.reduce(
        (sum, item) => sum + (Number(item.remainingAmount) || 0),
        0
      ),
    [budgetReports]
  );

  const highestCategoryExpense = useMemo(
    () =>
      Math.max(
        0,
        ...categoryReports.map(
          (item) => Number(item.totalExpenses) || 0
        )
      ),
    [categoryReports]
  );

  const getBudgetPercentage = (budget) => {
    const limit = Number(budget.budgetAmount) || 0;
    const spent = Number(budget.actualExpenses) || 0;

    if (limit <= 0) return 0;

    return Math.min((spent / limit) * 100, 100);
  };

  const refreshAll = () => {
    loadDateReport();
    loadMonthlyReport();
    loadOtherReports();
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
                  className="nav-link text-dark rounded"
                >
                  <i className="bi bi-piggy-bank me-2"></i>
                  Budgets
                </Link>

                <Link
                  to="/reports"
                  className="nav-link active bg-primary text-white rounded"
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
              <h2 className="fw-bold mb-1">Financial Reports</h2>
              <p className="text-muted mb-0">
                Review your income, expenses, and budget performance.
              </p>
            </div>

            <button
              type="button"
              className="btn btn-outline-primary"
              onClick={refreshAll}
              disabled={loadingDate || loadingMonth || loadingOther}
            >
              <i className="bi bi-arrow-clockwise me-2"></i>
              Refresh Reports
            </button>
          </div>

          {/* Date-range report */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-white py-3">
              <h5 className="fw-bold mb-0">Date-Range Summary</h5>
            </div>

            <div className="card-body">
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  loadDateReport();
                }}
              >
                <div className="row g-3 align-items-end">
                  <div className="col-md-4">
                    <label htmlFor="reportStartDate" className="form-label">
                      Start Date
                    </label>
                    <input
                      id="reportStartDate"
                      type="date"
                      className="form-control"
                      value={startDate}
                      max={endDate || undefined}
                      onChange={(event) => setStartDate(event.target.value)}
                      required
                    />
                  </div>

                  <div className="col-md-4">
                    <label htmlFor="reportEndDate" className="form-label">
                      End Date
                    </label>
                    <input
                      id="reportEndDate"
                      type="date"
                      className="form-control"
                      value={endDate}
                      min={startDate || undefined}
                      onChange={(event) => setEndDate(event.target.value)}
                      required
                    />
                  </div>

                  <div className="col-md-4">
                    <button
                      type="submit"
                      className="btn btn-primary w-100"
                      disabled={loadingDate}
                    >
                      {loadingDate ? "Loading..." : "Generate Report"}
                    </button>
                  </div>
                </div>
              </form>

              {dateError && (
                <div className="alert alert-danger mt-3 mb-0">
                  {dateError}
                </div>
              )}

              {loadingDate && !dateLoaded ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading report...</span>
                  </div>
                </div>
              ) : dateReport ? (
                <>
                  <p className="text-muted small mt-3 mb-0">
                    {formatDate(dateReport.startDate)} to{" "}
                    {formatDate(dateReport.endDate)}
                  </p>

                  <div className="row g-3 mt-1">
                    <div className="col-md-4">
                      <div className="card border-0 bg-success bg-opacity-10 h-100">
                        <div className="card-body">
                          <p className="text-muted mb-2">Total Income</p>
                          <h4 className="fw-bold text-success mb-0">
                            {formatCurrency(dateReport.totalIncome)}
                          </h4>
                        </div>
                      </div>
                    </div>

                    <div className="col-md-4">
                      <div className="card border-0 bg-danger bg-opacity-10 h-100">
                        <div className="card-body">
                          <p className="text-muted mb-2">Total Expenses</p>
                          <h4 className="fw-bold text-danger mb-0">
                            {formatCurrency(dateReport.totalExpenses)}
                          </h4>
                        </div>
                      </div>
                    </div>

                    <div className="col-md-4">
                      <div className="card border-0 bg-primary bg-opacity-10 h-100">
                        <div className="card-body">
                          <p className="text-muted mb-2">Net Balance</p>
                          <h4
                            className={`fw-bold mb-0 ${
                              Number(dateReport.netBalance) < 0
                                ? "text-danger"
                                : "text-primary"
                            }`}
                          >
                            {formatCurrency(dateReport.netBalance)}
                          </h4>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                !loadingDate && (
                  <p className="text-muted mt-3 mb-0">
                    Generate a report to view your financial summary.
                  </p>
                )
              )}
            </div>
          </div>

          {/* Monthly report */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-white py-3">
              <h5 className="fw-bold mb-0">Monthly Summary</h5>
            </div>

            <div className="card-body">
              <div className="row g-3 align-items-end">
                <div className="col-md-5">
                  <label htmlFor="reportMonth" className="form-label">
                    Month
                  </label>
                  <select
                    id="reportMonth"
                    className="form-select"
                    value={selectedMonth}
                    onChange={(event) =>
                      setSelectedMonth(Number(event.target.value))
                    }
                  >
                    {MONTHS.map((month, index) => (
                      <option key={month} value={index + 1}>
                        {month}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-md-4">
                  <label htmlFor="reportYear" className="form-label">
                    Year
                  </label>
                  <input
                    id="reportYear"
                    type="number"
                    className="form-control"
                    min="2000"
                    max="2100"
                    value={selectedYear}
                    onChange={(event) =>
                      setSelectedYear(event.target.value)
                    }
                  />
                </div>

                <div className="col-md-3">
                  <button
                    type="button"
                    className="btn btn-primary w-100"
                    onClick={loadMonthlyReport}
                    disabled={loadingMonth}
                  >
                    {loadingMonth ? "Loading..." : "View Month"}
                  </button>
                </div>
              </div>

              {monthError && (
                <div className="alert alert-danger mt-3 mb-0">
                  {monthError}
                </div>
              )}

              {loadingMonth && !monthLoaded ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">
                      Loading monthly report...
                    </span>
                  </div>
                </div>
              ) : monthlyReport ? (
                <>
                  <h6 className="fw-semibold mt-4 mb-3">
                    {MONTHS[(Number(monthlyReport.month) || 1) - 1]}{" "}
                    {monthlyReport.year}
                  </h6>

                  <div className="row g-3">
                    <div className="col-md-4">
                      <div className="border rounded p-3 h-100">
                        <p className="text-muted mb-2">Income</p>
                        <h5 className="fw-bold text-success mb-0">
                          {formatCurrency(monthlyReport.totalIncome)}
                        </h5>
                      </div>
                    </div>

                    <div className="col-md-4">
                      <div className="border rounded p-3 h-100">
                        <p className="text-muted mb-2">Expenses</p>
                        <h5 className="fw-bold text-danger mb-0">
                          {formatCurrency(monthlyReport.totalExpenses)}
                        </h5>
                      </div>
                    </div>

                    <div className="col-md-4">
                      <div className="border rounded p-3 h-100">
                        <p className="text-muted mb-2">Net Balance</p>
                        <h5
                          className={`fw-bold mb-0 ${
                            Number(monthlyReport.netBalance) < 0
                              ? "text-danger"
                              : "text-primary"
                          }`}
                        >
                          {formatCurrency(monthlyReport.netBalance)}
                        </h5>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                !loadingMonth && (
                  <p className="text-muted mt-3 mb-0">
                    Select a month to view the summary.
                  </p>
                )
              )}
            </div>
          </div>

          {/* Category-wise expenses */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
              <h5 className="fw-bold mb-0">Category-Wise Expenses</h5>
              <span className="badge bg-primary">
                {categoryReports.length} categories
              </span>
            </div>

            <div className="card-body">
              {otherError && (
                <div className="alert alert-warning">{otherError}</div>
              )}

              {loadingOther ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading reports...</span>
                  </div>
                </div>
              ) : categoryReports.length === 0 ? (
                <p className="text-muted text-center py-4 mb-0">
                  No category expense data is available.
                </p>
              ) : (
                <>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <span className="text-muted">Total across categories</span>
                    <strong>{formatCurrency(categoryTotal)}</strong>
                  </div>

                  {categoryReports.map((item) => {
                    const amount = Number(item.totalExpenses) || 0;
                    const percentage =
                      highestCategoryExpense > 0
                        ? (amount / highestCategoryExpense) * 100
                        : 0;

                    return (
                      <div key={item.categoryId ?? item.categoryName} className="mb-4">
                        <div className="d-flex justify-content-between gap-3 mb-2">
                          <span className="fw-semibold">
                            {item.categoryName || "Uncategorized"}
                          </span>
                          <span className="fw-semibold">
                            {formatCurrency(amount)}
                          </span>
                        </div>

                        <div
                          className="progress"
                          role="progressbar"
                          aria-label={`${item.categoryName || "Category"} expenses`}
                          aria-valuenow={percentage}
                          aria-valuemin="0"
                          aria-valuemax="100"
                          style={{ height: "10px" }}
                        >
                          <div
                            className="progress-bar"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </div>

          {/* Budget comparison */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-white py-3">
              <h5 className="fw-bold mb-0">Budget Comparison</h5>
            </div>

            <div className="card-body">
              {loadingOther ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">
                      Loading budget comparison...
                    </span>
                  </div>
                </div>
              ) : budgetReports.length === 0 ? (
                <p className="text-muted text-center py-4 mb-0">
                  No budget comparison data is available.
                </p>
              ) : (
                <>
                  <div className="row g-3 mb-4">
                    <div className="col-md-4">
                      <div className="border rounded p-3 h-100">
                        <p className="text-muted mb-2">Budget Total</p>
                        <h5 className="fw-bold mb-0">
                          {formatCurrency(budgetTotal)}
                        </h5>
                      </div>
                    </div>

                    <div className="col-md-4">
                      <div className="border rounded p-3 h-100">
                        <p className="text-muted mb-2">Actual Expenses</p>
                        <h5 className="fw-bold text-danger mb-0">
                          {formatCurrency(actualBudgetExpenses)}
                        </h5>
                      </div>
                    </div>

                    <div className="col-md-4">
                      <div className="border rounded p-3 h-100">
                        <p className="text-muted mb-2">Remaining Total</p>
                        <h5
                          className={`fw-bold mb-0 ${
                            totalRemaining < 0
                              ? "text-danger"
                              : "text-success"
                          }`}
                        >
                          {formatCurrency(totalRemaining)}
                        </h5>
                      </div>
                    </div>
                  </div>

                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Budget</th>
                          <th>Category</th>
                          <th>Budget Limit</th>
                          <th>Actual Expenses</th>
                          <th>Remaining</th>
                          <th>Usage</th>
                        </tr>
                      </thead>

                      <tbody>
                        {budgetReports.map((budget) => {
                          const limit = Number(budget.budgetAmount) || 0;
                          const spent = Number(budget.actualExpenses) || 0;
                          const remaining =
                            Number(budget.remainingAmount) || 0;
                          const percentage =
                            limit > 0 ? (spent / limit) * 100 : 0;
                          const barPercentage = Math.min(
                            Math.max(percentage, 0),
                            100
                          );
                          const exceeded = spent > limit;

                          return (
                            <tr key={budget.budgetId}>
                              <td>
                                <div className="fw-semibold">
                                  {budget.budgetName}
                                </div>
                                <small className="text-muted">
                                  {formatDate(budget.startDate)} –{" "}
                                  {formatDate(budget.endDate)}
                                </small>
                              </td>

                              <td>{budget.categoryName || "-"}</td>

                              <td>{formatCurrency(limit)}</td>

                              <td className="text-danger">
                                {formatCurrency(spent)}
                              </td>

                              <td
                                className={
                                  remaining < 0
                                    ? "text-danger fw-semibold"
                                    : "text-success fw-semibold"
                                }
                              >
                                {formatCurrency(remaining)}
                              </td>

                              <td style={{ minWidth: "140px" }}>
                                <div className="d-flex justify-content-between mb-1">
                                  <small>{percentage.toFixed(1)}%</small>
                                  {exceeded && (
                                    <small className="text-danger">
                                      Over budget
                                    </small>
                                  )}
                                </div>

                                <div
                                  className="progress"
                                  role="progressbar"
                                  aria-label={`${budget.budgetName} usage`}
                                  aria-valuenow={Math.min(percentage, 100)}
                                  aria-valuemin="0"
                                  aria-valuemax="100"
                                  style={{ height: "8px" }}
                                >
                                  <div
                                    className={`progress-bar ${
                                      exceeded ? "bg-danger" : "bg-success"
                                    }`}
                                    style={{ width: `${barPercentage}%` }}
                                  ></div>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Reports;