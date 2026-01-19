import { useState, useEffect, useMemo, useRef } from "react";
import "./App.css";

async function fetchAllUsers() {
  const res = await fetch("https://dummyjson.com/users?limit=0");
  if (!res.ok) throw new Error(`Ошибка сети: ${res.status}`);
  return await res.json();
}

function App() {
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [sortBy, setSortBy] = useState(null);
  const [sortOrder, setSortOrder] = useState("asc");
  const [selectedUser, setSelectedUser] = useState(null);
  const [filters, setFilters] = useState({
    firstName: "",
    lastName: "",
    country: "",
    city: "",
    email: "",
  });
  const [colWidths, setColWidths] = useState({});

  // Refs для ресайза
  const tableRef = useRef(null);
  const resizingColIndex = useRef(null);
  const startX = useRef(0);
  const startWidth = useRef(0);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchAllUsers();
        setAllUsers(data.users);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filteredAndSortedUsers = useMemo(() => {
    let result = [...allUsers];

    result = result.filter((user) => {
      const matchesFirstName = user.firstName
        .toLowerCase()
        .includes(filters.firstName.toLowerCase());
      const matchesLastName = user.lastName
        .toLowerCase()
        .includes(filters.lastName.toLowerCase());
      const matchesCountry = (user.address?.country || "")
        .toLowerCase()
        .includes(filters.country.toLowerCase());
      const matchesCity = (user.address?.city || "")
        .toLowerCase()
        .includes(filters.city.toLowerCase());
      const matchesEmail = user.email
        .toLowerCase()
        .includes(filters.email.toLowerCase());
      return (
        matchesFirstName &&
        matchesLastName &&
        matchesCountry &&
        matchesCity &&
        matchesEmail
      );
    });

    if (sortBy) {
      result.sort((a, b) => {
        let valA, valB;
        if (sortBy === "country") {
          valA = a.address?.country || "";
          valB = b.address?.country || "";
        } else if (sortBy === "city") {
          valA = a.address?.city || "";
          valB = b.address?.city || "";
        } else {
          valA = a[sortBy];
          valB = b[sortBy];
        }

        if (typeof valA === "number" && typeof valB === "number") {
          return sortOrder === "asc" ? valA - valB : valB - valA;
        } else {
          valA = String(valA).toLowerCase();
          valB = String(valB).toLowerCase();
          if (valA < valB) return sortOrder === "asc" ? -1 : 1;
          if (valA > valB) return sortOrder === "asc" ? 1 : -1;
          return 0;
        }
      });
    }

    return result;
  }, [allUsers, filters, sortBy, sortOrder]);

  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredAndSortedUsers.length / itemsPerPage);
  const paginatedUsers = filteredAndSortedUsers.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  const handleSort = (field) => {
    if (sortBy === field) {
      if (sortOrder === "asc") {
        setSortOrder("desc");
      } else {
        setSortBy(null);
        setSortOrder("asc");
      }
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
    setCurrentPage(0);
  };

  const openModal = (user) => setSelectedUser(user);
  const closeModal = () => setSelectedUser(null);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(0);
  };

  // === РЕСАЙЗ КОЛОНОК ===
  const handleMouseDown = (e, index) => {
    const rect = e.target.getBoundingClientRect();
    // Проверяем, что клик был у правого края (в зоне ресайзера)
    
    if (rect.right - e.clientX < 8) {
      resizingColIndex.current = index;
      startX.current = e.clientX;
      const computedStyle = window.getComputedStyle(e.target);
      startWidth.current = parseInt(computedStyle.width, 10);
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      e.target.classList.add("resizing");
    }
  };

  const handleMouseMove = (e) => {
    if (resizingColIndex.current === null) return;
    const diff = e.clientX - startX.current;
    const newWidth = Math.max(startWidth.current + diff, 50); // минимум 50px
    setColWidths((prev) => ({
      ...prev,
      [resizingColIndex.current]: `${newWidth}px`,
    }));
  };

  const handleMouseUp = () => {
    if (resizingColIndex.current !== null) {
      const ths = tableRef.current.querySelectorAll("th");
      if (ths[resizingColIndex.current]) {
        ths[resizingColIndex.current].classList.remove("resizing");
      }
      resizingColIndex.current = null;
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    }
  };

  const columns = [
    { key: "lastName", label: "Фамилия", sortable: true, filterable: true },
    { key: "firstName", label: "Имя", sortable: true, filterable: true },
    {
      key: "middleName",
      label: "Отчество",
      sortable: false,
      filterable: false,
    },
    { key: "age", label: "Возраст", sortable: true, filterable: false },
    { key: "gender", label: "Пол", sortable: true, filterable: false },
    { key: "phone", label: "Телефон", sortable: true, filterable: false },
    { key: "email", label: "Email", sortable: true, filterable: true },
    { key: "country", label: "Страна", sortable: true, filterable: true },
    { key: "city", label: "Город", sortable: true, filterable: true },
  ];

  return (
    <div className="app">
      <h1>Таблица пользователей</h1>

      {error && <div className="error">Ошибка: {error}</div>}
      {loading ? (
        <p>Загрузка всех данных...</p>
      ) : (
        <>
          {/* Строка фильтров */}
          <div className="table-container" style={{ marginBottom: "10px" }}>
            <table className="user-table filter-table">
              <thead>
                <tr>
                  {columns.map((col, index) => (
                    <th
                      key={col.key}
                      style={{ width: colWidths[index] || "auto" }}
                    >
                      {col.filterable ? (
                        <input
                          type="text"
                          placeholder={`Фильтр по ${col.label}`}
                          value={filters[col.key] || ""}
                          onChange={(e) =>
                            handleFilterChange(col.key, e.target.value)
                          }
                          style={{
                            width: "100%",
                            padding: "4px",
                            fontSize: "12px",
                          }}
                        />
                      ) : null}
                    </th>
                  ))}
                </tr>
              </thead>
            </table>
          </div>

          {/* Основная таблица */}
          <div className="table-container">
            <table className="user-table" ref={tableRef}>
              <thead>
                <tr>
                  {columns.map((col, index) => (
                    <th
                      key={col.key}
                      style={{ width: colWidths[index] || "auto" }}
                      onMouseDown={(e) => handleMouseDown(e, index)}
                      className={col.sortable ? "sortable" : ""}
                      onClick={
                        col.sortable ? () => handleSort(col.key) : undefined
                      }
                    >
                      {col.label}
                      {col.sortable && sortBy === col.key && (
                        <span>{sortOrder === "asc" ? " ↑" : " ↓"}</span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.map((user) => (
                  <tr
                    key={user.id}
                    onClick={() => openModal(user)}
                    className="user-row"
                  >
                    <td>{user.lastName}</td>
                    <td>{user.firstName}</td>
                    <td>-</td>
                    <td>{user.age}</td>
                    <td>{user.gender}</td>
                    <td>{user.phone}</td>
                    <td>{user.email}</td>
                    <td>{user.address?.country || "-"}</td>
                    <td>{user.address?.city || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pagination">
            <button
              onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
              disabled={currentPage === 0}
            >
              Назад
            </button>
            <span>
              Страница {currentPage + 1} из {totalPages || 1}
            </span>
            <button
              onClick={() =>
                setCurrentPage((p) => Math.min(totalPages - 1, p + 1))
              }
              disabled={currentPage >= totalPages - 1}
            >
              Вперёд
            </button>
          </div>
        </>
      )}

      {/* Модальное окно */}
      {selectedUser && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>
              ×
            </button>
            <img
              src={selectedUser.image}
              alt="Аватар"
              className="modal-avatar"
            />
            <h2>
              {selectedUser.firstName} {selectedUser.lastName}
            </h2>
            <p>
              <strong>Возраст:</strong> {selectedUser.age}
            </p>
            <p>
              <strong>Адрес:</strong> {selectedUser.address?.address},{" "}
              {selectedUser.address?.city}, {selectedUser.address?.country}
            </p>
            <p>
              <strong>Рост:</strong> {selectedUser.height} см
            </p>
            <p>
              <strong>Вес:</strong> {selectedUser.weight} кг
            </p>
            <p>
              <strong>Телефон:</strong> {selectedUser.phone}
            </p>
            <p>
              <strong>Email:</strong> {selectedUser.email}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
