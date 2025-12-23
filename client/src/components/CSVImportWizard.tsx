import { useState, useCallback, useMemo } from "react";
import { Modal, Upload, Button, Steps, Table, Select, Progress, Alert, Typography, Space, Tag, Card, Statistic, Row, Col } from "antd";
import { UploadOutlined, CheckCircleOutlined, CloseCircleOutlined, CloudUploadOutlined, WarningOutlined, SafetyOutlined } from "@ant-design/icons";
import Papa from "papaparse";
import { classifyLead, getPropstreamPhoneDncPairs, mapPropstreamRow, getRiskLevelColor, calculateSafePercentage, type TCPAAnalysis, type TCPARiskLevel } from "../lib/tcpa";

const { Title, Text } = Typography;
const { Dragger } = Upload;

interface CSVImportWizardProps {
  open: boolean;
  onClose: () => void;
  onImportComplete: (successCount: number, failureCount: number) => void;
}

interface ParsedRow {
  [key: string]: string;
}

interface ClassifiedRow {
  raw: ParsedRow;
  mapped: Record<string, string>;
  tcpaAnalysis: TCPAAnalysis;
}

interface FieldMapping {
  csvColumn: string;
  twentyField: string;
}

interface ImportResult {
  success: boolean;
  row: number;
  error?: string;
  data?: ParsedRow;
}

const TWENTY_FIELDS = [
  { value: "firstName", label: "First Name", required: true },
  { value: "lastName", label: "Last Name", required: true },
  { value: "email", label: "Email", required: false },
  { value: "phone", label: "Phone", required: false },
  { value: "company", label: "Company", required: false },
  { value: "__skip__", label: "Skip this column", required: false },
];

function guessMapping(csvHeader: string): string {
  const header = csvHeader.toLowerCase().trim();
  
  if (header.includes("first") && header.includes("name")) return "firstName";
  if (header.includes("last") && header.includes("name")) return "lastName";
  if (header === "name" || header === "full name" || header === "fullname") return "firstName";
  if (header.includes("email") || header.includes("e-mail")) return "email";
  if (header.includes("phone") || header.includes("tel") || header.includes("mobile")) return "phone";
  if (header.includes("company") || header.includes("organization") || header.includes("org")) return "company";
  
  return "__skip__";
}

const RISK_LEVEL_LABELS: Record<TCPARiskLevel, string> = {
  SAFE: "Safe to Call",
  MODERATE: "Manual Review",
  DANGEROUS: "High Risk",
  DNC_DATABASE: "DNC Database",
  NO_CONTACT_DATA: "No Phone Data",
};

export function CSVImportWizard({ open, onClose, onImportComplete }: CSVImportWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [csvData, setCsvData] = useState<ParsedRow[]>([]);
  const [classifiedData, setClassifiedData] = useState<ClassifiedRow[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [mappings, setMappings] = useState<FieldMapping[]>([]);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState<ImportResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const resetState = useCallback(() => {
    setCurrentStep(0);
    setCsvData([]);
    setClassifiedData([]);
    setCsvHeaders([]);
    setMappings([]);
    setImporting(false);
    setImportProgress(0);
    setImportResults([]);
    setError(null);
  }, []);

  const handleClose = useCallback(() => {
    resetState();
    onClose();
  }, [resetState, onClose]);

  const handleFileUpload = useCallback((file: File) => {
    setError(null);
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          setError(`CSV parsing error: ${results.errors[0].message}`);
          return;
        }

        const data = results.data as ParsedRow[];
        if (data.length === 0) {
          setError("CSV file is empty");
          return;
        }

        const headers = Object.keys(data[0]);
        setCsvHeaders(headers);
        setCsvData(data);

        const phoneDncPairs = getPropstreamPhoneDncPairs();
        const classified = data.map((row) => {
          const mapped = mapPropstreamRow(row);
          const tcpaAnalysis = classifyLead(mapped, phoneDncPairs);
          return { raw: row, mapped, tcpaAnalysis };
        });
        setClassifiedData(classified);

        const autoMappings = headers.map((header) => ({
          csvColumn: header,
          twentyField: guessMapping(header),
        }));
        setMappings(autoMappings);
        setCurrentStep(1);
      },
      error: (err) => {
        setError(`Failed to parse CSV: ${err.message}`);
      },
    });

    return false;
  }, []);

  const updateMapping = useCallback((csvColumn: string, twentyField: string) => {
    setMappings((prev) =>
      prev.map((m) => (m.csvColumn === csvColumn ? { ...m, twentyField } : m))
    );
  }, []);

  const validateMappings = useCallback(() => {
    const mapped = mappings.filter((m) => m.twentyField !== "__skip__");
    const hasFirstName = mapped.some((m) => m.twentyField === "firstName");
    const hasLastName = mapped.some((m) => m.twentyField === "lastName");
    return hasFirstName || hasLastName;
  }, [mappings]);

  const tcpaStats = useMemo(() => {
    const stats: Record<TCPARiskLevel, number> = {
      SAFE: 0,
      MODERATE: 0,
      DANGEROUS: 0,
      DNC_DATABASE: 0,
      NO_CONTACT_DATA: 0,
    };
    classifiedData.forEach((row) => {
      stats[row.tcpaAnalysis.riskLevel]++;
    });
    const safePercentage = calculateSafePercentage(classifiedData.map(r => r.tcpaAnalysis));
    return { ...stats, safePercentage };
  }, [classifiedData]);

  const safeLeads = useMemo(() => {
    return classifiedData.filter((row) => row.tcpaAnalysis.riskLevel === "SAFE");
  }, [classifiedData]);

  const handleImport = useCallback(async () => {
    if (!validateMappings()) {
      setError("Please map at least a First Name or Last Name column");
      return;
    }

    setImporting(true);
    setImportProgress(0);
    setImportResults([]);
    setCurrentStep(3);

    const results: ImportResult[] = [];
    const batchSize = 10;
    const rowsToImport = safeLeads.map((r) => r.raw);

    for (let i = 0; i < rowsToImport.length; i += batchSize) {
      const batch = rowsToImport.slice(i, i + batchSize);
      
      try {
        const response = await fetch("/api/import/leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rows: batch,
            mappings: mappings.filter((m) => m.twentyField !== "__skip__"),
          }),
        });

        const result = await response.json();
        
        if (result.results) {
          results.push(
            ...result.results.map((r: any, idx: number) => ({
              ...r,
              row: i + idx + 1,
            }))
          );
        }
      } catch (err) {
        batch.forEach((_, idx) => {
          results.push({
            success: false,
            row: i + idx + 1,
            error: "Network error",
          });
        });
      }

      setImportProgress(Math.min(100, Math.round(((i + batch.length) / rowsToImport.length) * 100)));
      setImportResults([...results]);
    }

    setImporting(false);
    setImportProgress(100);
  }, [safeLeads, mappings, validateMappings]);

  const successCount = importResults.filter((r) => r.success).length;
  const failureCount = importResults.filter((r) => !r.success).length;

  const mappingColumns = [
    {
      title: "CSV Column",
      dataIndex: "csvColumn",
      key: "csvColumn",
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: "Sample Data",
      dataIndex: "csvColumn",
      key: "sample",
      render: (col: string) => (
        <Text type="secondary" style={{ maxWidth: 200 }} ellipsis>
          {csvData[0]?.[col] || "-"}
        </Text>
      ),
    },
    {
      title: "Map To Twenty Field",
      dataIndex: "twentyField",
      key: "twentyField",
      render: (_: string, record: FieldMapping) => (
        <Select
          value={record.twentyField}
          onChange={(value) => updateMapping(record.csvColumn, value)}
          style={{ width: 180 }}
          data-testid={`select-mapping-${record.csvColumn}`}
        >
          {TWENTY_FIELDS.map((field) => (
            <Select.Option key={field.value} value={field.value}>
              {field.label}
              {field.required && <Tag color="gold" style={{ marginLeft: 8 }}>Required</Tag>}
            </Select.Option>
          ))}
        </Select>
      ),
    },
  ];

  return (
    <Modal
      title="Import Leads from CSV"
      open={open}
      onCancel={handleClose}
      width={900}
      footer={null}
      destroyOnClose
    >
      <Steps
        current={currentStep}
        items={[
          { title: "Upload CSV" },
          { title: "Map Columns" },
          { title: "TCPA Review" },
          { title: "Import" },
        ]}
        style={{ marginBottom: 32 }}
      />

      {error && (
        <Alert
          message={error}
          type="error"
          showIcon
          closable
          onClose={() => setError(null)}
          style={{ marginBottom: 16 }}
        />
      )}

      {currentStep === 0 && (
        <div>
          <Dragger
            accept=".csv"
            showUploadList={false}
            beforeUpload={handleFileUpload}
            data-testid="upload-csv-dropzone"
          >
            <p className="ant-upload-drag-icon">
              <CloudUploadOutlined style={{ fontSize: 48, color: "#c9a648" }} />
            </p>
            <p className="ant-upload-text">Click or drag CSV file to upload</p>
            <p className="ant-upload-hint">
              Upload a CSV file with lead data. The file should include columns for name, email, phone, and company.
            </p>
          </Dragger>
        </div>
      )}

      {currentStep === 1 && (
        <div>
          <div style={{ marginBottom: 16 }}>
            <Text>Found {csvData.length} rows in your CSV. Map the columns to Twenty CRM fields:</Text>
          </div>

          <Table
            dataSource={mappings}
            columns={mappingColumns}
            rowKey="csvColumn"
            pagination={false}
            size="small"
            style={{ marginBottom: 24 }}
          />

          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <Button onClick={() => setCurrentStep(0)} data-testid="button-back">
              Back
            </Button>
            <Button
              type="primary"
              onClick={() => setCurrentStep(2)}
              disabled={!validateMappings()}
              data-testid="button-next-tcpa"
            >
              Next: TCPA Review
            </Button>
          </div>
        </div>
      )}

      {currentStep === 2 && (
        <div>
          <Card style={{ marginBottom: 24 }}>
            <Title level={4} style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <SafetyOutlined /> TCPA Compliance Analysis
            </Title>
            
            <Row gutter={16} style={{ marginBottom: 24 }}>
              <Col span={4}>
                <Card size="small" style={{ textAlign: "center", borderColor: getRiskLevelColor("SAFE") }}>
                  <Statistic
                    title={<Tag color={getRiskLevelColor("SAFE")}>{RISK_LEVEL_LABELS.SAFE}</Tag>}
                    value={tcpaStats.SAFE}
                    valueStyle={{ color: getRiskLevelColor("SAFE") }}
                  />
                </Card>
              </Col>
              <Col span={5}>
                <Card size="small" style={{ textAlign: "center", borderColor: getRiskLevelColor("MODERATE") }}>
                  <Statistic
                    title={<Tag color={getRiskLevelColor("MODERATE")}>{RISK_LEVEL_LABELS.MODERATE}</Tag>}
                    value={tcpaStats.MODERATE}
                    valueStyle={{ color: getRiskLevelColor("MODERATE") }}
                  />
                </Card>
              </Col>
              <Col span={5}>
                <Card size="small" style={{ textAlign: "center", borderColor: getRiskLevelColor("DANGEROUS") }}>
                  <Statistic
                    title={<Tag color={getRiskLevelColor("DANGEROUS")}>{RISK_LEVEL_LABELS.DANGEROUS}</Tag>}
                    value={tcpaStats.DANGEROUS}
                    valueStyle={{ color: getRiskLevelColor("DANGEROUS") }}
                  />
                </Card>
              </Col>
              <Col span={5}>
                <Card size="small" style={{ textAlign: "center", borderColor: getRiskLevelColor("DNC_DATABASE") }}>
                  <Statistic
                    title={<Tag color={getRiskLevelColor("DNC_DATABASE")}>{RISK_LEVEL_LABELS.DNC_DATABASE}</Tag>}
                    value={tcpaStats.DNC_DATABASE}
                    valueStyle={{ color: getRiskLevelColor("DNC_DATABASE") }}
                  />
                </Card>
              </Col>
              <Col span={5}>
                <Card size="small" style={{ textAlign: "center" }}>
                  <Statistic
                    title={<Tag color="default">{RISK_LEVEL_LABELS.NO_CONTACT_DATA}</Tag>}
                    value={tcpaStats.NO_CONTACT_DATA}
                  />
                </Card>
              </Col>
            </Row>

            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <Statistic
                title="Overall SAFE Percentage"
                value={tcpaStats.safePercentage}
                suffix="%"
                valueStyle={{ color: tcpaStats.safePercentage >= 70 ? getRiskLevelColor("SAFE") : tcpaStats.safePercentage >= 40 ? getRiskLevelColor("MODERATE") : getRiskLevelColor("DANGEROUS") }}
              />
            </div>
          </Card>

          <Alert
            message={<span style={{ fontWeight: 600 }}><WarningOutlined style={{ marginRight: 8 }} />Non-SAFE leads will be skipped</span>}
            description={
              <div>
                <Text>To maintain TCPA compliance, only leads classified as SAFE will be imported.</Text>
                <br />
                <Text type="secondary">
                  {tcpaStats.MODERATE + tcpaStats.DANGEROUS + tcpaStats.DNC_DATABASE + tcpaStats.NO_CONTACT_DATA} leads will be excluded from import.
                </Text>
              </div>
            }
            type="warning"
            showIcon={false}
            style={{ marginBottom: 24 }}
          />

          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <Text strong style={{ fontSize: 16 }}>
              Importing {safeLeads.length} of {csvData.length} leads (SAFE only)
            </Text>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <Button onClick={() => setCurrentStep(1)} data-testid="button-back-tcpa">
              Back
            </Button>
            <Button
              type="primary"
              onClick={handleImport}
              disabled={safeLeads.length === 0}
              data-testid="button-start-import"
            >
              Import {safeLeads.length} Safe Leads
            </Button>
          </div>
        </div>
      )}

      {currentStep === 3 && (
        <div>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <Title level={4} style={{ marginBottom: 16 }}>
              {importing ? "Importing..." : "Import Complete"}
            </Title>
            <Progress
              percent={importProgress}
              status={importing ? "active" : failureCount > 0 ? "exception" : "success"}
              style={{ maxWidth: 400, margin: "0 auto" }}
            />
          </div>

          {!importing && (
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <Space size="large">
                <div>
                  <CheckCircleOutlined style={{ fontSize: 24, color: "#52c41a" }} />
                  <div style={{ marginTop: 8 }}>
                    <Text strong style={{ fontSize: 18 }}>{successCount}</Text>
                    <Text type="secondary" style={{ display: "block" }}>Imported</Text>
                  </div>
                </div>
                {failureCount > 0 && (
                  <div>
                    <CloseCircleOutlined style={{ fontSize: 24, color: "#ff4d4f" }} />
                    <div style={{ marginTop: 8 }}>
                      <Text strong style={{ fontSize: 18, color: "#ff4d4f" }}>{failureCount}</Text>
                      <Text type="secondary" style={{ display: "block" }}>Failed</Text>
                    </div>
                  </div>
                )}
              </Space>
            </div>
          )}

          {failureCount > 0 && !importing && (
            <Alert
              message="Some imports failed"
              description={
                <div style={{ maxHeight: 150, overflow: "auto" }}>
                  {importResults
                    .filter((r) => !r.success)
                    .slice(0, 10)
                    .map((r) => (
                      <div key={r.row}>
                        Row {r.row}: {r.error}
                      </div>
                    ))}
                  {failureCount > 10 && <div>...and {failureCount - 10} more</div>}
                </div>
              }
              type="warning"
              style={{ marginBottom: 16 }}
            />
          )}

          <div style={{ textAlign: "center" }}>
            <Button
              type="primary"
              onClick={() => {
                onImportComplete(successCount, failureCount);
                handleClose();
              }}
              disabled={importing}
              data-testid="button-close-import"
            >
              Done
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
