import { useState, useEffect, useMemo } from 'react';
import './App.css';

// Загрузка ВСЕХ пользователей один раз
async function fetchAllUsers() {
  const res = await fetch('https://dummyjson.com/users?limit=0');
  if (!res.ok) throw new Error(`Ошибка сети: ${res.status}`);
  return await res.json();
}

function App() {
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [sortBy, setSortBy] = useState(null);
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedUser, setSelectedUser] = useState(null);
  const [colWidths, setColWidths] = useState({});
  const [filters, setFilters] = useState({
    firstName: '',
    lastName: '',
    country: '',
    city: '',
    email: ''
  });

  // Загружаем всех пользователей один раз
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

  // Применяем фильтрацию + сортировку + пагинацию
  const filteredAndSortedUsers = useMemo(() => {
    let result = [...allUsers];

    // Фильтрация
    result = result.filter(user => {
      const matchesFirstName = user.firstName.toLowerCase().includes(filters.firstName.toLowerCase());
      const matchesLastName = user.lastName.toLowerCase().includes(filters.lastName.toLowerCase());
      const matchesCountry = (user.address?.country || '').toLowerCase().includes(filters.country.toLowerCase());
      const matchesCity = (user.address?.city || '').toLowerCase().includes(filters.city.toLowerCase());
      const matchesEmail = user.email.toLowerCase().includes(filters.email.toLowerCase());
      return matchesFirstName && matchesLastName && matchesCountry && matchesCity && matchesEmail;
    });

    // Сортировка
    if (sortBy) {
      result.sort((a, b) => {
        let valA, valB;

        if (sortBy === 'country') {
          valA = a.address?.country || '';
          valB = b.address?.country || '';
        } else if (sortBy === 'city') {
          valA = a.address?.city || '';
          valB = b.address?.city || '';
        } else {
          valA = a[sortBy];
          valB = b[sortBy];
        }

        // Обработка чисел и строк
        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortOrder === 'asc' ? valA - valB : valB - valA;
        } else {
          valA = String(valA).toLowerCase();
          valB = String(valB).toLowerCase();
          if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
          if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
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
      if (sortOrder === 'asc') {
        setSortOrder('desc');
      } else {
        setSortBy(null);
        setSortOrder('asc');
      }
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setCurrentPage(0);
  };

  const openModal = (user) => setSelectedUser(user);
  const closeModal = () => setSelectedUser(null);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(0); // сброс на первую страницу при фильтрации
  };

  // Ресайз (без drag-логики для упрощения — можно добавить позже)
  // Сейчас оставим только стили, ресайз отключим, чтобы не мешать фильтрации
  // (или можно оставить — но для простоты временно уберём)

  const columns = [
    { key: 'lastName', label: 'Фамилия', sortable: true, filterable: true },
    { key: 'firstName', label: 'Имя', sortable: true, filterable: true },
    { key: 'middleName', label: 'Отчество', sortable: false, filterable: false },
    { key: 'age', label: 'Возраст', sortable: true, filterable: false },
    { key: 'gender', label: 'Пол', sortable: true, filterable: false },
    { key: 'phone', label: 'Телефон', sortable: true, filterable: false },
    { key: 'email', label: 'Email', sortable: true, filterable: true },
    { key: 'country', label: 'Страна', sortable: true, filterable: true },
    { key: 'city', label: 'Город', sortable: true, filterable: true },
  ];

  return (
    <div className="app">
      <h1>Таблица пользователей</h1>

      {error && <div className="error">Ошибка: {error}</div>}
      {loading ? (
        <p>Загрузка всех данных...</p>
      ) : (
        <>
          {/* Фильтры */}
          <div className="table-container" style={{ marginBottom: '10px' }}>
            <table className="user-table filter-table">
              <thead>
                <tr>
                  {columns.map(col => (
                    <th key={col.key}>
                      {col.filterable ? (
                        <input
                          type="text"
                          placeholder={`Фильтр по ${col.label}`}
                          value={filters[col.key] || ''}
                          onChange={(e) => handleFilterChange(col.key, e.target.value)}
                          style={{ width: '100%', padding: '4px', fontSize: '12px' }}
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
            <table className="user-table">
              <thead>
                <tr>
                  {columns.map(col => (
                    <th
                      key={col.key}
                      className={col.sortable ? 'sortable' : ''}
                      onClick={col.sortable ? () => handleSort(col.key) : undefined}
                    >
                      {col.label}
                      {col.sortable && sortBy === col.key && (
                        <span>{sortOrder === 'asc' ? ' ↑' : ' ↓'}</span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.map(user => (
                  <tr key={user.id} onClick={() => openModal(user)} className="user-row">
                    <td>{user.lastName}</td>
                    <td>{user.firstName}</td>
                    <td>-</td>
                    <td>{user.age}</td>
                    <td>{user.gender}</td>
                    <td>{user.phone}</td>
                    <td>{user.email}</td>
                    <td>{user.address?.country || '-'}</td>
                    <td>{user.address?.city || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Пагинация */}
          <div className="pagination">
            <button
              onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
              disabled={currentPage === 0}
            >
              Назад
            </button>
            <span>
              Страница {currentPage + 1} из {totalPages || 1}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
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
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>×</button>
            <img src={selectedUser.image} alt="Аватар" className="modal-avatar" />
            <h2>{selectedUser.firstName} {selectedUser.lastName}</h2>
            <p><strong>Возраст:</strong> {selectedUser.age}</p>
            <p><strong>Адрес:</strong> {selectedUser.address?.address}, {selectedUser.address?.city}, {selectedUser.address?.country}</p>
            <p><strong>Рост:</strong> {selectedUser.height} см</p>
            <p><strong>Вес:</strong> {selectedUser.weight} кг</p>
            <p><strong>Телефон:</strong> {selectedUser.phone}</p>
            <p><strong>Email:</strong> {selectedUser.email}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;