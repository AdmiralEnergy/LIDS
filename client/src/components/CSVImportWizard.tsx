import { useState, useCallback } from "react";
import { Modal, Upload, Button, Steps, Table, Select, Progress, Alert, Typography, Space, Tag } from "antd";
import { UploadOutlined, CheckCircleOutlined, CloseCircleOutlined, CloudUploadOutlined } from "@ant-design/icons";
import Papa from "papaparse";

const { Title, Text } = Typography;
const { Dragger } = Upload;

interface CSVImportWizardProps {
  open: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

interface ParsedRow {
  [key: string]: string;
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

export function CSVImportWizard({ open, onClose, onImportComplete }: CSVImportWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [csvData, setCsvData] = useState<ParsedRow[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [mappings, setMappings] = useState<FieldMapping[]>([]);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState<ImportResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const resetState = useCallback(() => {
    setCurrentStep(0);
    setCsvData([]);
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

  const handleImport = useCallback(async () => {
    if (!validateMappings()) {
      setError("Please map at least a First Name or Last Name column");
      return;
    }

    setImporting(true);
    setImportProgress(0);
    setImportResults([]);
    setCurrentStep(2);

    const results: ImportResult[] = [];
    const batchSize = 10;

    for (let i = 0; i < csvData.length; i += batchSize) {
      const batch = csvData.slice(i, i + batchSize);
      
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

      setImportProgress(Math.min(100, Math.round(((i + batch.length) / csvData.length) * 100)));
      setImportResults([...results]);
    }

    setImporting(false);
    setImportProgress(100);
  }, [csvData, mappings, validateMappings]);

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
      width={800}
      footer={null}
      destroyOnClose
    >
      <Steps
        current={currentStep}
        items={[
          { title: "Upload CSV" },
          { title: "Map Columns" },
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
              onClick={handleImport}
              disabled={!validateMappings()}
              data-testid="button-start-import"
            >
              Import {csvData.length} Leads
            </Button>
          </div>
        </div>
      )}

      {currentStep === 2 && (
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
                onImportComplete();
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
