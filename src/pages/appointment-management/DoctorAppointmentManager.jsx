import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import { GET_ALL_APPOINTMENT } from "../../api/apiUrls";
import ROUTES from "../../routes/RoutePath";
import "../../styles/appointment-management/DoctorAppointmentManager.css";

export default function DoctorAppointmentManager() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const navigate = useNavigate();

  const translateStatus = useCallback((status) => {
    switch (status) {
      case "UNPAID":
        return "Chưa thanh toán";
      case "NOT_PAID":
        return "Chưa trả tiền";
      case "UNCHECKED_IN":
        return "Chưa check-in";
      case "CHECKED_IN":
        return "Đã check-in";
      case "CANCELLED":
        return "Đã hủy";
      default:
        return "Không xác định";
    }
  }, []);

  const getStatusColor = useCallback((status) => {
    switch (status) {
      case "UNPAID":
      case "NOT_PAID":
        return "warning";
      case "UNCHECKED_IN":
        return "info";
      case "CHECKED_IN":
        return "success";
      case "CANCELLED":
        return "error";
      default:
        return "default";
    }
  }, []);

  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Token không tồn tại");

      const res = await fetch(GET_ALL_APPOINTMENT, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const json = await res.json();
      if (json.statusCode === 200 && json.data) {
        setAppointments(json.data);
      } else {
        throw new Error(json.message || "Lỗi khi fetch danh sách lịch hẹn");
      }
    } catch (err) {
      setError(err.message || "Có lỗi xảy ra khi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const handleViewRecord = useCallback(
    (userId) => {
      if (userId) {
        navigate(ROUTES.MEDICAL_RECORD(userId));
      } else {
        alert("Không có mã tài khoản để xem hồ sơ.");
      }
    },
    [navigate]
  );

  const filteredAppointments = appointments.filter((appt) => {
    return statusFilter === "all" || appt.status === statusFilter;
  });

  const sortedAppointments = [...filteredAppointments].sort(
    (a, b) => new Date(b.createAt) - new Date(a.createAt)
  );

  const statusOptions = [
    { value: "all", label: `Tất cả (${appointments.length})` },
    {
      value: "UNPAID",
      label: `Chưa thanh toán (${appointments.filter((a) => a.status === "UNPAID").length})`,
    },
    {
      value: "NOT_PAID",
      label: `Chưa trả tiền (${appointments.filter((a) => a.status === "NOT_PAID").length})`,
    },
    {
      value: "UNCHECKED_IN",
      label: `Chưa check-in (${appointments.filter((a) => a.status === "UNCHECKED_IN").length})`,
    },
    {
      value: "CHECKED_IN",
      label: `Đã check-in (${appointments.filter((a) => a.status === "CHECKED_IN").length})`,
    },
    {
      value: "CANCELLED",
      label: `Đã hủy (${appointments.filter((a) => a.status === "CANCELLED").length})`,
    },
  ];

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("vi-VN");
    } catch {
      return dateString;
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return "N/A";
    try {
      if (timeString.includes("T")) {
        const date = new Date(timeString);
        return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
      }
      return timeString;
    } catch {
      return timeString;
    }
  };

  if (loading) {
    return (
      <div className="doctor-apm-container">
        <div className="doctor-apm-loading">
          <div className="spinner"></div>
          <p>Đang tải danh sách lịch hẹn...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="doctor-apm-container">
        <div className="doctor-apm-error">
          <h3>Có lỗi xảy ra</h3>
          <p>{error}</p>
          <button className="doctor-apm-retry-btn" onClick={fetchAppointments}>
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="doctor-apm-container">
      <header className="doctor-apm-header">
        <h1 className="doctor-apm-title">Quản lý lịch hẹn</h1>
        <p className="doctor-apm-subtitle">
          Tổng cộng: <strong>{appointments.length}</strong> lịch hẹn
        </p>
      </header>

      <div className="doctor-apm-controls">
        <div className="filter-group">
          <label htmlFor="status-filter">Trạng thái:</label>
          <Select
            id="status-filter"
            options={statusOptions}
            value={statusOptions.find((opt) => opt.value === statusFilter)}
            onChange={(selected) => setStatusFilter(selected.value)}
            className="doctor-apm-react-select"
            classNamePrefix="react-select"
            isSearchable={false}
          />
        </div>

        <div className="results-info">
          Hiển thị: <strong>{sortedAppointments.length}</strong> kết quả
        </div>
      </div>

      {sortedAppointments.length === 0 ? (
        <div className="doctor-apm-empty">
          <h3>Không có lịch hẹn nào</h3>
          <p>Không tìm thấy lịch hẹn phù hợp với bộ lọc</p>
          <button className="clear-filters-btn" onClick={() => setStatusFilter("all")}>
            Xóa bộ lọc
          </button>
        </div>
      ) : (
        <div className="doctor-apm-table-container">
          <div className="doctor-apm-table-wrapper">
            <table className="doctor-apm-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Ngày hẹn</th>
                  <th>Tên bệnh nhân</th>
                  <th>Thời gian</th>
                  <th>Trạng thái</th>
                  <th>Ghi chú</th>
                  <th>Ngày tạo</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {sortedAppointments.map((appt) => (
                  <tr key={appt.id} className="appointment-row">
                    <td>{appt.id}</td>
                    <td>{formatDate(appt.time)}</td>
                    <td>{appt.patientName || "N/A"}</td>
                    <td>
                      <span>
                        {formatTime(appt.startTime)} - {formatTime(appt.endTime)}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge status-${getStatusColor(appt.status)}`}>
                        {translateStatus(appt.status)}
                      </span>
                    </td>
                    <td>
                      {appt.note ? (
                        <span title={appt.note}>
                          {appt.note.length > 30 ? `${appt.note.substring(0, 30)}...` : appt.note}
                        </span>
                      ) : (
                        <span className="no-note">Không có</span>
                      )}
                    </td>
                    <td>{formatDate(appt.createAt)}</td>
                    <td>
                      <button
                        className="doctor-apm-view-btn"
                        onClick={() => handleViewRecord(appt.user)}
                        disabled={!appt.user}
                        title="Xem hồ sơ bệnh án"
                      >
                        Xem
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
