import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";

const PAGE_SIZE = 5;

export default function SegmentMembers({ segmentId: passedId }) {
  const { id: routeId } = useParams();
  const navigate = useNavigate();
  const segmentId = passedId ?? routeId;

  const [members, setMembers] = useState([]);
  const [distribution, setDistribution] = useState([]);
  const [segmentName, setSegmentName] = useState("");
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(true);
  const [error, setError] = useState("");
  const [chartError, setChartError] = useState("");
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [genderFilter, setGenderFilter] = useState("");
  const [languageFilter, setLanguageFilter] = useState("");
  const [occupationFilter, setOccupationFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      if (!segmentId || segmentId === "undefined") {
        setError("Invalid segment ID. Please return to Segments.");
        setLoading(false);
        setChartLoading(false);
        return;
      }

      setLoading(true);
      setChartLoading(true);
      setError("");
      setChartError("");

      const membersRequest = api.get(
        `/api/segments/${encodeURIComponent(segmentId)}/members`,
        { params: { page: 1, page_size: 100 } }
      );

      const distributionRequest = api.get(
        `/api/segments/${encodeURIComponent(segmentId)}/language-distribution`
      );

      try {
        const response = await membersRequest;
        if (cancelled) return;

        const data = response.data;
        const result = Array.isArray(data)
          ? data
          : data?.members ?? data?.items ?? data?.results ?? [];

        if (!Array.isArray(result)) {
          throw new Error("Invalid members response from the server.");
        }

        setMembers(result);
        setSegmentName(data?.segment_name || "");
      } catch (err) {
        if (!cancelled) {
          const detail = err.response?.data?.detail;
          setError(
            typeof detail === "string"
              ? detail
              : err.message || "Unable to load segment members."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }

      try {
        const response = await distributionRequest;
        if (cancelled) return;

        const result = response.data?.distribution;
        if (!Array.isArray(result)) {
          throw new Error("Invalid language distribution response.");
        }

        setDistribution(result);
      } catch (err) {
        if (!cancelled) {
          setChartError(
            err.response?.data?.detail ||
              "Unable to load language distribution."
          );
        }
      } finally {
        if (!cancelled) setChartLoading(false);
      }
    }

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [segmentId]);

  const getValue = (member, key) =>
    String(member[key] ?? "").trim();

  const uniqueValues = (key) =>
    [...new Set(members.map((member) => getValue(member, key)).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b));

  const cities = useMemo(() => uniqueValues("city"), [members]);
  const genders = useMemo(() => uniqueValues("gender"), [members]);
  const languages = useMemo(
    () => uniqueValues("preferred_language"),
    [members]
  );
  const occupations = useMemo(
    () => uniqueValues("occupation"),
    [members]
  );

  const filteredMembers = useMemo(() => {
    const term = search.trim().toLowerCase();

    return members.filter((member) => {
      const searchableText = [
        member.id,
        member.name,
        member.email,
        member.phone,
        member.age,
        member.gender,
        member.city,
        member.state,
        member.preferred_language,
        member.occupation,
      ]
        .map((value) => String(value ?? ""))
        .join(" ")
        .toLowerCase();

      return (
        (!term || searchableText.includes(term)) &&
        (!cityFilter || getValue(member, "city") === cityFilter) &&
        (!genderFilter || getValue(member, "gender") === genderFilter) &&
        (!languageFilter ||
          getValue(member, "preferred_language") === languageFilter) &&
        (!occupationFilter ||
          getValue(member, "occupation") === occupationFilter)
      );
    });
  }, [
    members,
    search,
    cityFilter,
    genderFilter,
    languageFilter,
    occupationFilter,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredMembers.length / PAGE_SIZE)
  );

  const safePage = Math.min(currentPage, totalPages);

  const paginatedMembers = filteredMembers.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, cityFilter, genderFilter, languageFilter, occupationFilter]);

  const resetFilters = () => {
    setSearch("");
    setCityFilter("");
    setGenderFilter("");
    setLanguageFilter("");
    setOccupationFilter("");
    setCurrentPage(1);
  };

  const hasFilters =
    search || cityFilter || genderFilter || languageFilter || occupationFilter;

  const distributionTotal = distribution.reduce(
    (sum, item) => sum + Number(item.count || 0),
    0
  );

  const columns = [
    { key: "id", label: "ID" },
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    { key: "age", label: "Age" },
    { key: "gender", label: "Gender" },
    { key: "city", label: "City" },
    { key: "state", label: "State" },
    { key: "preferred_language", label: "Preferred Language" },
    { key: "occupation", label: "Occupation" },
  ];

  return (
    <div className="sm-page">
      <style>{`
        .sm-page {
          min-height: 100vh;
          padding: 30px;
          background: #f5f7fc;
          color: #172554;
          font-family: Inter, Arial, sans-serif;
          box-sizing: border-box;
        }
        .sm-page * { box-sizing: border-box; }
        .sm-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 18px;
          flex-wrap: wrap;
          margin-bottom: 24px;
        }
        .sm-title {
          margin: 0;
          font-size: 28px;
          font-weight: 750;
          color: #14264b;
        }
        .sm-subtitle {
          margin: 9px 0 0;
          color: #718096;
          font-size: 14px;
        }
        .sm-back {
          padding: 11px 17px;
          border: 1px solid #d8e1f0;
          border-radius: 9px;
          background: white;
          color: #243b70;
          font-weight: 650;
          cursor: pointer;
        }
        .sm-back:hover { background: #edf3ff; }
        .sm-stats {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 22px;
        }
        .sm-stat, .sm-card {
          border: 1px solid #e4eaf4;
          border-radius: 14px;
          background: white;
          box-shadow: 0 4px 18px rgba(30,55,100,.04);
        }
        .sm-stat { padding: 20px; }
        .sm-stat-label { color: #718096; font-size: 13px; }
        .sm-stat-value {
          display: block;
          margin-top: 10px;
          color: #244bd7;
          font-size: 27px;
          font-weight: 750;
        }
        .sm-card { overflow: hidden; margin-bottom: 22px; }
        .sm-card-heading {
          margin: 0;
          padding: 20px 22px;
          border-bottom: 1px solid #edf0f6;
          color: #243453;
          font-size: 17px;
          font-weight: 700;
        }
        .sm-chart-body { padding: 22px; }
        .sm-language-row { margin-bottom: 20px; }
        .sm-language-row:last-child { margin-bottom: 0; }
        .sm-language-info {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 9px;
          font-size: 13px;
          color: #34435e;
        }
        .sm-track {
          height: 10px;
          overflow: hidden;
          border-radius: 99px;
          background: #edf1f8;
        }
        .sm-bar {
          height: 100%;
          border-radius: 99px;
          background: #4567ed;
          transition: width .3s ease;
        }
        .sm-chart-total {
          margin-top: 20px;
          color: #718096;
          font-size: 12px;
        }
        .sm-toolbar { padding: 22px; border-bottom: 1px solid #edf0f6; }
        .sm-toolbar-title {
          margin: 0 0 17px;
          font-size: 17px;
          font-weight: 700;
          color: #243453;
        }
        .sm-search-row {
          display: grid;
          grid-template-columns: minmax(220px, 2fr) repeat(4, minmax(125px, 1fr));
          gap: 12px;
        }
        .sm-search, .sm-select {
          width: 100%;
          min-width: 0;
          height: 43px;
          padding: 0 12px;
          border: 1px solid #dce3ef;
          border-radius: 8px;
          background: white;
          color: #263653;
          font-size: 13px;
          outline: none;
        }
        .sm-search:focus, .sm-select:focus {
          border-color: #4a6cf7;
          box-shadow: 0 0 0 3px rgba(74,108,247,.1);
        }
        .sm-filter-footer, .sm-pagination {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 15px;
          color: #7b879c;
          font-size: 13px;
        }
        .sm-reset, .sm-page-btn {
          padding: 8px 12px;
          border: 1px solid #dce3ef;
          border-radius: 7px;
          background: white;
          color: #3c5bdc;
          cursor: pointer;
        }
        .sm-table-wrap { width: 100%; overflow-x: auto; }
        .sm-table {
          width: 100%;
          min-width: 1050px;
          border-collapse: collapse;
          text-align: left;
        }
        .sm-table th {
          padding: 15px 16px;
          background: #f7f9fd;
          color: #61708b;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: .45px;
          white-space: nowrap;
          border-bottom: 1px solid #e8edf5;
        }
        .sm-table td {
          padding: 16px;
          border-bottom: 1px solid #edf0f5;
          color: #34435e;
          font-size: 13px;
          vertical-align: middle;
        }
        .sm-table tbody tr:hover { background: #f8faff; }
        .sm-id { color: #66758e; font-weight: 700; }
        .sm-name { color: #1d2d4b; font-weight: 700; }
        .sm-email { color: #3658c9; overflow-wrap: anywhere; }
        .sm-pill {
          display: inline-block;
          padding: 5px 9px;
          border-radius: 20px;
          background: #edf2ff;
          color: #3d5dd0;
          font-size: 11px;
          font-weight: 650;
          white-space: nowrap;
        }
        .sm-empty, .sm-loading {
          padding: 40px 20px;
          text-align: center;
          color: #718096;
        }
        .sm-empty h3 { color: #253654; }
        .sm-error {
          padding: 16px;
          margin-bottom: 18px;
          border: 1px solid #fecaca;
          border-radius: 10px;
          background: #fff1f2;
          color: #b42332;
        }
        .sm-pagination {
          margin: 0;
          padding: 17px 22px;
          border-top: 1px solid #edf0f6;
        }
        .sm-page-controls { display: flex; gap: 6px; flex-wrap: wrap; }
        .sm-page-btn.active { background: #3f63eb; color: white; }
        .sm-page-btn:disabled { opacity: .4; cursor: not-allowed; }
        @media (max-width: 1200px) {
          .sm-search-row { grid-template-columns: repeat(3, minmax(0, 1fr)); }
          .sm-search-row .sm-search { grid-column: span 3; }
        }
        @media (max-width: 760px) {
          .sm-page { padding: 18px 12px; }
          .sm-title { font-size: 23px; }
          .sm-stats { grid-template-columns: 1fr; gap: 10px; }
          .sm-stat { padding: 15px; }
          .sm-toolbar, .sm-chart-body { padding: 16px 12px; }
          .sm-search-row { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 9px; }
          .sm-search-row .sm-search { grid-column: span 2; }
          .sm-pagination { padding: 15px 12px; }
        }
        @media (max-width: 380px) {
          .sm-search-row { grid-template-columns: 1fr; }
          .sm-search-row .sm-search { grid-column: span 1; }
        }
      `}</style>

      <div className="sm-header">
        <div>
          <h1 className="sm-title">
            {segmentName || "Segment Members"}
          </h1>
          <p className="sm-subtitle">
            Audience members and language distribution for Segment #{segmentId}
          </p>
        </div>

        <button
          className="sm-back"
          type="button"
          onClick={() => navigate("/segments")}
        >
          ← Back to Segments
        </button>
      </div>

      {error && <div className="sm-error" role="alert">{error}</div>}

      {!error && (
        <>
          <div className="sm-stats">
            <div className="sm-stat">
              <span className="sm-stat-label">Loaded Members</span>
              <span className="sm-stat-value">
                {loading ? "—" : members.length}
              </span>
            </div>
            <div className="sm-stat">
              <span className="sm-stat-label">Matching Search Results</span>
              <span className="sm-stat-value">
                {loading ? "—" : filteredMembers.length}
              </span>
            </div>
            <div className="sm-stat">
              <span className="sm-stat-label">Current Page</span>
              <span className="sm-stat-value">
                {loading ? "—" : `${safePage} / ${totalPages}`}
              </span>
            </div>
          </div>

          <section className="sm-card">
            <h2 className="sm-card-heading">Language Distribution</h2>
            {chartLoading ? (
              <div className="sm-loading">Loading language distribution...</div>
            ) : chartError ? (
              <div className="sm-error" role="alert">{chartError}</div>
            ) : distribution.length === 0 ? (
              <div className="sm-empty">No language data available.</div>
            ) : (
              <div className="sm-chart-body">
                {distribution.map((item) => {
                  const count = Number(item.count || 0);
                  const percentage = distributionTotal
                    ? (count / distributionTotal) * 100
                    : 0;

                  return (
                    <div className="sm-language-row" key={item.language}>
                      <div className="sm-language-info">
                        <strong>{item.language || "Unknown"}</strong>
                        <span>
                          {count} member{count === 1 ? "" : "s"} ·{" "}
                          {percentage.toFixed(1)}%
                        </span>
                      </div>
                      <div
                        className="sm-track"
                        role="progressbar"
                        aria-label={`${item.language} members`}
                        aria-valuenow={count}
                        aria-valuemin={0}
                        aria-valuemax={distributionTotal}
                      >
                        <div
                          className="sm-bar"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
                <p className="sm-chart-total">
                  Total members in language distribution: {distributionTotal}
                </p>
              </div>
            )}
          </section>

          <section className="sm-card">
            <div className="sm-toolbar">
              <h2 className="sm-toolbar-title">Audience Directory</h2>

              <div className="sm-search-row">
                <input
                  className="sm-search"
                  type="search"
                  placeholder="Search name, email, phone..."
                  aria-label="Search members"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />

                <select
                  className="sm-select"
                  aria-label="Filter by city"
                  value={cityFilter}
                  onChange={(event) => setCityFilter(event.target.value)}
                >
                  <option value="">All Cities</option>
                  {cities.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>

                <select
                  className="sm-select"
                  aria-label="Filter by gender"
                  value={genderFilter}
                  onChange={(event) => setGenderFilter(event.target.value)}
                >
                  <option value="">All Genders</option>
                  {genders.map((gender) => (
                    <option key={gender} value={gender}>{gender}</option>
                  ))}
                </select>

                <select
                  className="sm-select"
                  aria-label="Filter by language"
                  value={languageFilter}
                  onChange={(event) => setLanguageFilter(event.target.value)}
                >
                  <option value="">All Languages</option>
                  {languages.map((language) => (
                    <option key={language} value={language}>{language}</option>
                  ))}
                </select>

                <select
                  className="sm-select"
                  aria-label="Filter by occupation"
                  value={occupationFilter}
                  onChange={(event) => setOccupationFilter(event.target.value)}
                >
                  <option value="">All Occupations</option>
                  {occupations.map((occupation) => (
                    <option key={occupation} value={occupation}>
                      {occupation}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm-filter-footer">
                <span>
                  {filteredMembers.length} member(s) match your search
                </span>
                {hasFilters && (
                  <button
                    className="sm-reset"
                    type="button"
                    onClick={resetFilters}
                  >
                    Reset filters
                  </button>
                )}
              </div>
            </div>

            {loading ? (
              <div className="sm-loading">Loading segment members...</div>
            ) : filteredMembers.length === 0 ? (
              <div className="sm-empty">
                <h3>No members found</h3>
                <p>Try changing your search or resetting the filters.</p>
              </div>
            ) : (
              <>
                <div className="sm-table-wrap">
                  <table className="sm-table">
                    <thead>
                      <tr>
                        {columns.map((column) => (
                          <th key={column.key}>{column.label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedMembers.map((member, index) => (
                        <tr
                          key={
                            member.id ??
                            member.member_id ??
                            `${member.email ?? "member"}-${index}`
                          }
                        >
                          {columns.map((column) => {
                            const value = member[column.key];
                            const displayValue =
                              value == null || value === ""
                                ? "—"
                                : typeof value === "object"
                                  ? JSON.stringify(value)
                                  : String(value);

                            return (
                              <td
                                key={column.key}
                                className={
                                  column.key === "id"
                                    ? "sm-id"
                                    : column.key === "name"
                                      ? "sm-name"
                                      : column.key === "email"
                                        ? "sm-email"
                                        : ""
                                }
                              >
                                {column.key === "preferred_language" ||
                                column.key === "occupation" ? (
                                  value ? (
                                    <span className="sm-pill">
                                      {displayValue}
                                    </span>
                                  ) : "—"
                                ) : displayValue}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="sm-pagination">
                  <span>
                    Showing {(safePage - 1) * PAGE_SIZE + 1}–
                    {Math.min(safePage * PAGE_SIZE, filteredMembers.length)} of{" "}
                    {filteredMembers.length} loaded members
                  </span>

                  <div className="sm-page-controls">
                    <button
                      type="button"
                      className="sm-page-btn"
                      disabled={safePage === 1}
                      onClick={() => setCurrentPage(1)}
                    >
                      «
                    </button>
                    <button
                      type="button"
                      className="sm-page-btn"
                      disabled={safePage === 1}
                      onClick={() => setCurrentPage(safePage - 1)}
                    >
                      Previous
                    </button>

                    {Array.from(
                      { length: totalPages },
                      (_, index) => index + 1
                    ).map((page) => (
                      <button
                        key={page}
                        type="button"
                        className={`sm-page-btn ${
                          page === safePage ? "active" : ""
                        }`}
                        aria-current={page === safePage ? "page" : undefined}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </button>
                    ))}

                    <button
                      type="button"
                      className="sm-page-btn"
                      disabled={safePage === totalPages}
                      onClick={() => setCurrentPage(safePage + 1)}
                    >
                      Next
                    </button>
                    <button
                      type="button"
                      className="sm-page-btn"
                      disabled={safePage === totalPages}
                      onClick={() => setCurrentPage(totalPages)}
                    >
                      »
                    </button>
                  </div>
                </div>
              </>
            )}
          </section>
        </>
      )}
    </div>
  );
}
