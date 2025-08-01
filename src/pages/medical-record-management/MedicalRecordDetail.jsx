import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  GET_MEDICAL_RECORD,
  UPDATE_MEDICAL_RECORD,
  DELETE_ULTRASOUND,
} from "../../api/apiUrls";
import LabTestRequestModal from "../lab-test-management/LabTestRequestModal";
import InitUltrasoundModal from "../ultrasound-management/InitUltrasoundModal";
import UltrasoundImageFetcher from "../ultrasound-management/UltrasoundImageFetcher";
import TreatmentPlan from "../treatment-plan-management/TreatmentPlan";
import "../../styles/medical-record-management/MedicalRecordDetail.css";
import HeaderPage from "../../components/HeaderPage";

export default function MedicalRecordDetail() {
  const { getJsonAuthHeader, getAuthHeader } = useAuth();
  const { recordId } = useParams();
  const navigate = useNavigate();

  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [diagnosis, setDiagnosis] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [updateMessage, setUpdateMessage] = useState("");

  const [labResults, setLabResults] = useState([]);
  const [showLabModal, setShowLabModal] = useState(false);

  const [showUltrasoundModal, setShowUltrasoundModal] = useState(false);
  const [selectedUltrasound, setSelectedUltrasound] = useState(null);

  const TABS = {
    INIT: "init",
    TREATMENT: "treatment",
  };
  const [activeTab, setActiveTab] = useState(TABS.INIT);

  const tabs = [
    { key: TABS.INIT, label: "Thông tin ban đầu" },
    { key: TABS.TREATMENT, label: "Phác đồ điều trị" },
  ];

  const STATUS_TRANSLATIONS = {
    COMPLETED: "Đã hoàn thành",
    PROCESSING: "Đang xử lý",
  };

  const formatDate = useCallback((dateStr) => {
    if (!dateStr) return "Chưa có";
    try {
      return new Date(dateStr).toLocaleDateString("vi-VN");
    } catch {
      return dateStr;
    }
  }, []);

  const translateStatus = useCallback(
    (status) => STATUS_TRANSLATIONS[status] || status,
    []
  );

  const fetchRecord = useCallback(async () => {
    try {
      const response = await fetch(GET_MEDICAL_RECORD(recordId), {
        headers: getJsonAuthHeader(),
      });
      const result = await response.json();
      if (response.ok && result.data) {
        setRecord(result.data);
        setDiagnosis(result.data.diagnosis || "");
        setSymptoms(result.data.symptoms || "");
        setLabResults(result.data.initLabTestResults || []);
      } else {
        throw new Error(result.message || "Không thể tải hồ sơ");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [recordId, getJsonAuthHeader]);

  useEffect(() => {
    fetchRecord();
  }, [fetchRecord]);

  const handleUpdate = async () => {
    setUpdating(true);
    setUpdateMessage("");

    try {
      const response = await fetch(UPDATE_MEDICAL_RECORD(recordId), {
        method: "PUT",
        headers: getJsonAuthHeader(),
        body: JSON.stringify({ diagnosis, symptoms }),
      });

      const result = await response.json();

      if (response.ok) {
        // setUpdateMessage("Cập nhật thành công!");
        setRecord(result.data);
        setIsEditing(false);
      } else {
        throw new Error(result.message || "Lỗi khi cập nhật");
      }
    } catch (err) {
      setUpdateMessage(err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleUltrasoundSuccess = useCallback((newData) => {
    setRecord((prev) => ({
      ...prev,
      initUltrasounds: [...(prev.initUltrasounds || []), newData],
    }));
    setShowUltrasoundModal(false);
    setSelectedUltrasound(null);
  }, []);

  const handleUltrasoundDelete = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa kết quả siêu âm này?")) return;
    try {
      const res = await fetch(DELETE_ULTRASOUND(id), {
        method: "DELETE",
        headers: getAuthHeader(),
      });
      if (res.ok) {
        setRecord((prev) => ({
          ...prev,
          initUltrasounds: prev.initUltrasounds.filter((us) => us.id !== id),
        }));
      }
    } catch (err) {
      console.error("Lỗi khi xóa siêu âm:", err);
    }
  };

  const renderUltrasoundResults = () => {
    const ultrasounds = record?.initUltrasounds || [];

    return (
      <div className="mr-detail-card">
        <div className="mr-detail-card-header">
          <h2>Kết quả siêu âm</h2>
          <button
            className="mr-detail-create-btn"
            onClick={() => {
              setSelectedUltrasound(null);
              setShowUltrasoundModal(true);
            }}
          >
            Cập nhật kết quả siêu âm
          </button>
        </div>
        <div className="mr-detail-card-body">
          {ultrasounds.length > 0 ? (
            <div className="mr-detail-ultrasound-results">
              {ultrasounds.map((us) => (
                <div key={us.id} className="mr-detail-ultrasound-item">
                  <div className="mr-detail-ultrasound-header">
                    <div><strong>Ngày:</strong> {formatDate(us.date)}</div>
                    <div><strong>Kết quả:</strong> {us.result}</div>
                    <div className="mr-detail-ultrasound-actions">
                      <button onClick={() => {
                        setSelectedUltrasound(us);
                        setShowUltrasoundModal(true);
                      }}>
                        Cập nhật
                      </button>
                      <button onClick={() => handleUltrasoundDelete(us.id)}>
                        Xóa
                      </button>
                    </div>
                  </div>
                  <UltrasoundImageFetcher id={us.id} />
                </div>
              ))}
            </div>
          ) : (
            <div className="mr-detail-empty-msg">
              <span>Chưa có kết quả siêu âm</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderLabTestResults = () => (
    <div className="mr-detail-card">
      <div className="mr-detail-card-header">
        <h2>Kết quả xét nghiệm</h2>
        <button className="mr-detail-create-btn" onClick={() => setShowLabModal(true)}>
          Yêu cầu xét nghiệm
        </button>
      </div>
      <div className="mr-detail-card-body">
        {labResults.length > 0 ? (
          <div className="mr-detail-test-results">
            {labResults.map((test) => (
              <div key={test.id} className="mr-detail-test-item">
                <div className="mr-detail-test-header">
                  <span className="mr-detail-test-name">{test.labTestName}</span>
                  <span className={`mr-detail-test-status ${test.status.toLowerCase()}`}>
                    {translateStatus(test.status)}
                  </span>
                </div>

                <div className="mr-detail-test-details">
                  <div><strong>Ngày:</strong> {formatDate(test.testDate)}</div>
                  <div><strong>Nhân viên:</strong> {test.staffFullName || "Chưa rõ"}</div>
                </div>

                {test.status === "COMPLETED" && (
                  <div className="mr-detail-test-result">
                    <div><strong>Kết quả tóm tắt:</strong> {test.resultSummary || "Không có"}</div>
                    <div><strong>Chi tiết kết quả:</strong> {test.resultDetails || "Không có"}</div>
                    <div><strong>Ghi chú:</strong> {test.notes || "Không có"}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="mr-detail-empty-msg">
            <span>Chưa có kết quả xét nghiệm</span>
          </div>
        )}
      </div>
    </div>
  );


  if (loading) return <p>Đang tải hồ sơ...</p>;
  if (error) return <p className="mr-detail-error">{error}</p>;
  if (!record) return <p>Không tìm thấy hồ sơ</p>;

  return (
    <div className="medical-record-detail">
      <HeaderPage />
      <button
        onClick={() => navigate(-1)}
        className="treatment-session-page__back-btn"
      >
        ←
      </button>
      <h2>Chi tiết hồ sơ bệnh án</h2>

      <div className="mr-detail-patient-info">
        <div><strong>Họ tên:</strong> {record.fullName}</div>
        <div><strong>Ngày sinh:</strong> {record.dob}</div>
        <div>
          <strong>Giới tính:</strong>{" "}
          {record.gender === "MALE"
            ? "Nam"
            : record.gender === "FEMALE"
              ? "Nữ"
              : "Chưa cập nhật"}
        </div>

        <div><strong>Số điện thoại:</strong> {record.phoneNumber || "Chưa cập nhật"}</div>
        <div><strong>Địa chỉ:</strong> {record.address}</div>
        <div><strong>CMND/CCCD:</strong> {record.identityNumber}</div>
        <div><strong>Quốc tịch:</strong> {record.nationality}</div>
        <div><strong>Số BHYT:</strong> {record.insuranceNumber}</div>
        <div><strong>Ngày tạo:</strong> {formatDate(record.createdAt)}</div>
        {record.numberOfMissed > 0 && (
          <div
            style={{
              background: "linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)",
              color: "#dc2626",
              padding: "18px 16px",
              borderRadius: "12px",
              marginTop: "12px",
              fontWeight: "600",
              border: "1px solid #f87171",
              boxShadow: "0 2px 8px rgba(239, 68, 68, 0.15)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "15px",
              transition: "all 0.2s ease"
            }}
          >
            <span>Số lần bỏ lỡ điều trị: {record.numberOfMissed}</span>
          </div>
        )}
      </div>

      <hr />

      <div className="mr-detail-tab-navigation">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`mr-detail-tab-button ${activeTab === tab.key ? "active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mr-detail-tab-content">
        {activeTab === TABS.INIT && (
          <div className="mr-detail-init-tab">
            <div className="mr-detail-medical-section">
              <div className="mr-detail-section-header">
                <h3>Thông tin y tế</h3>
                <button onClick={() => setIsEditing(!isEditing)}>
                  {isEditing ? "Ẩn" : "Cập nhật thông tin"}
                </button>
              </div>

              {!isEditing ? (
                <>
                  <div><strong>Triệu chứng:</strong> {record.symptoms || "Chưa cập nhật"}</div>
                  <div><strong>Chẩn đoán ban đầu:</strong> {record.diagnosis || "Chưa cập nhật"}</div>
                </>
              ) : (
                <>
                  <div>
                    <label><strong>Triệu chứng:</strong></label><br />
                    <textarea
                      value={symptoms}
                      onChange={(e) => setSymptoms(e.target.value)}
                      rows={3}
                      style={{ width: "100%" }}
                    />
                  </div>

                  <div>
                    <label><strong>Chẩn đoán ban đầu:</strong></label><br />
                    <textarea
                      value={diagnosis}
                      onChange={(e) => setDiagnosis(e.target.value)}
                      rows={3}
                      style={{ width: "100%" }}
                    />
                  </div>

                  <button
                    onClick={handleUpdate}
                    disabled={updating}
                    style={{
                      backgroundColor: updating ? "#ccc" : "#077BF6",
                      color: "white",
                      padding: "10px 20px",
                      border: "none",
                      borderRadius: "6px",
                      fontSize: "16px",
                      cursor: updating ? "not-allowed" : "pointer",
                      boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
                      marginTop: "-5px",
                      marginBottom: "15px",
                      marginLeft: "25px",
                      transition: "background-color 0.3s",
                    }}
                  >
                    {updating ? "Đang cập nhật..." : "Lưu thông tin"}
                  </button>

                </>
              )}
              {updateMessage && <p style={{ marginTop: "10px" }}>{updateMessage}</p>}
            </div>

            {renderLabTestResults()}
            {renderUltrasoundResults()}
          </div>
        )}

        {activeTab === TABS.TREATMENT && (
          <TreatmentPlan medicalRecordId={recordId} />
        )}
      </div>

      {showLabModal && (
        <LabTestRequestModal
          recordId={recordId}
          onClose={() => setShowLabModal(false)}
          onSuccess={() => {
            setShowLabModal(false);
            fetchRecord();
          }}
        />
      )}

      {showUltrasoundModal && (
        <InitUltrasoundModal
          isOpen={true}
          onClose={() => {
            setShowUltrasoundModal(false);
            setSelectedUltrasound(null);
          }}
          medicalRecordId={recordId}
          onSuccess={handleUltrasoundSuccess}
          initialData={selectedUltrasound}
        />
      )}
    </div>
  );
}