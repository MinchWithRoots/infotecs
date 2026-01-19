import { useState, useEffect, useRef } from "react";
import "./App.css";

async function fetchUsers({
  skip = 0,
  limit = 10,
  sortBy = null,
  order = null,
}) {
  let url = "https://dummyjson.com/users";
  const params = new URLSearchParams();

  params.append("limit", limit);
  params.append("skip", skip);

  if (sortBy) {
    params.append("sortBy", sortBy);
    params.append("order", order);
  }

  const res = await fetch(url + "?" + params.toString());
  if (!res.ok) {
    throw new Error(`Ошибка сети: ${res.status}`);
  }
  return await res.json();
}

function App() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [sortBy, setSortBy] = useState(null);
  const [sortOrder, setSortOrder] = useState("asc");
  const [selectedUser, setSelectedUser] = useState(null);
  const [colWidths, setColWidths] = useState({}); // {0: '120px', 1: '100px', ...}
  const tableRef = useRef(null);
  const resizingColIndex = useRef(null);
  const startX = useRef(0);
  const startWidth = useRef(0);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchUsers({
        skip: currentPage * 10,
        limit: 10,
        sortBy: sortBy,
        order: sortOrder,
      });
      setUsers(data.users);
      setTotal(data.total);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentPage, sortBy, sortOrder]);

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

  // === РЕСАЙЗ КОЛОНОК ===
  const handleMouseDown = (e, index) => {
    // Проверяем, что клик был именно на ресайзере (справа)
    const rect = e.target.getBoundingClientRect();
    if (rect.right - e.clientX < 10) {
      resizingColIndex.current = index;
      startX.current = e.clientX;
      const th = e.target;
      startWidth.current = parseInt(
        document.defaultView.getComputedStyle(th).width,
        10
      );
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      th.classList.add("resizing");
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

  const totalPages = Math.ceil(total / 10);

  // Колонки таблицы
  const columns = [
    { key: "lastName", label: "Фамилия", sortable: true },
    { key: "firstName", label: "Имя", sortable: false },
    { key: "middleName", label: "Отчество", sortable: false },
    { key: "age", label: "Возраст", sortable: true },
    { key: "gender", label: "Пол", sortable: true },
    { key: "phone", label: "Телефон", sortable: true },
    { key: "email", label: "Email", sortable: false },
    { key: "country", label: "Страна", sortable: false },
    { key: "city", label: "Город", sortable: false },
  ];

  return (
    <div className="app">
      <h1>Таблица пользователей</h1>

      {error && (
        <div className="error">
          Ошибка: {error}
          {error.includes("Network") && (
            <div className="warning">
              {" "}
              Включите VPN для доступа к dummyjson.com
            </div>
          )}
        </div>
      )}

      {loading ? (
        <p>Загрузка...</p>
      ) : (
        <>
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
                {users.map((user) => (
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
              Страница {currentPage + 1} из {totalPages}
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
