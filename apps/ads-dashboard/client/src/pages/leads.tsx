import { useState, useMemo } from "react";
import {
  Table,
  Tabs,
  Tag,
  Button,
  Space,
  Typography,
  Progress,
  Tooltip,
  Modal,
  Form,
  Input,
  Select,
  message,
  Row,
  Col,
  Spin,
  Popconfirm,
} from "antd";
import {
  PhoneOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
  UploadOutlined,
  UserOutlined,
  BankOutlined,
  DollarOutlined,
  FileTextOutlined,
  CheckSquareOutlined,
  DeleteOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { useTable } from "@refinedev/antd";
import { useUpdate, useCreate, useDelete } from "@refinedev/core";
import type { Lead } from "@shared/schema";
import { CSVImportWizard } from "../components/CSVImportWizard";
import { ContactMethodList } from "../components/ContactMethodList";
import { getAllPopulatedPhones, getAllPopulatedEmails } from "../lib/fieldUtils";

const { Title, Text } = Typography;

const statusColors: Record<string, string> = {
  new: "#1890ff",
  contacted: "#722ed1",
  qualified: "#c9a648",
  converted: "#52c41a",
};

const stageColors: Record<string, string> = {
  new: "#1890ff",
  contacted: "#722ed1",
  qualified: "#c9a648",
  proposal: "#13c2c2",
  won: "#52c41a",
  lost: "#ff4d4f",
};

const getIcpScoreColor = (score: number) => {
  if (score >= 71) return "#c9a648";
  if (score >= 41) return "#faad14";
  return "#ff4d4f";
};

function LeadsTab() {
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [form] = Form.useForm();
  const [addForm] = Form.useForm();

  const { tableProps, tableQuery } = useTable<Lead>({
    resource: "leads",
    syncWithLocation: false,
  });

  const { mutate: updateLead, mutation: updateMutationState } = useUpdate();
  const { mutate: createLead, mutation: createMutationState } = useCreate();
  const isUpdating = updateMutationState?.isPending ?? false;
  const isCreating = createMutationState?.isPending ?? false;

  const handleImportComplete = (successCount?: number, failureCount?: number) => {
    tableQuery.refetch();
    if (successCount && successCount > 0) {
      if (failureCount && failureCount > 0) {
        message.warning(`Imported ${successCount} leads, ${failureCount} failed`);
      } else {
        message.success(`Imported ${successCount} leads successfully`);
      }
    } else if (failureCount && failureCount > 0) {
      message.error(`Import failed: ${failureCount} leads could not be imported`);
    }
  };

  const handleCall = (lead: Lead) => {
    message.success(`Initiating call to ${lead.name} at ${lead.phone}`);
  };

  const handleView = (lead: Lead) => {
    setSelectedLead(lead);
    setViewModalOpen(true);
  };

  const handleEdit = (lead: Lead) => {
    setSelectedLead(lead);
    form.setFieldsValue(lead);
    setEditModalOpen(true);
  };

  const handleEditSave = async () => {
    try {
      const values = await form.validateFields();

      if (!selectedLead) {
        message.error("No lead selected");
        return;
      }

      updateLead(
        {
          resource: "leads",
          id: selectedLead.id,
          values,
        },
        {
          onSuccess: () => {
            message.success("Lead updated successfully");
            setEditModalOpen(false);
            tableQuery.refetch();
          },
          onError: (err) => {
            message.error(`Failed to update lead: ${err?.message || "Unknown error"}`);
          },
        }
      );
    } catch (err) {
      message.error("Please fill in all required fields");
    }
  };

  const handleAddLead = async () => {
    try {
      const values = await addForm.validateFields();

      createLead(
        {
          resource: "leads",
          values: {
            firstName: values.firstName,
            lastName: values.lastName,
            name: `${values.firstName} ${values.lastName}`,
            email: values.email,
            phone: values.phone,
            street: values.street,
            city: values.city,
            state: values.state,
            zipCode: values.zipCode,
            leadSource: values.leadSource,
            utilityProvider: values.utilityProvider,
            monthlyElectricBill: values.monthlyElectricBill ? parseFloat(values.monthlyElectricBill) : undefined,
            squareFeet: values.squareFeet ? parseFloat(values.squareFeet) : undefined,
            yearBuilt: values.yearBuilt ? parseFloat(values.yearBuilt) : undefined,
            stage: "new",
            status: "new",
            icpScore: 50,
            source: values.leadSource === "DOOR_KNOCK" ? "Door Knock" :
                   values.leadSource === "REFERRAL" ? "Referral" :
                   values.leadSource === "PROPSTREAM" ? "PropStream" :
                   values.leadSource === "EVENT" ? "Event" : "Website",
          },
        },
        {
          onSuccess: () => {
            message.success("Lead added successfully");
            setAddModalOpen(false);
            addForm.resetFields();
            tableQuery.refetch();
          },
          onError: (err) => {
            message.error(`Failed to add lead: ${err?.message || "Unknown error"}`);
          },
        }
      );
    } catch (err) {
      message.error("Please fill in all required fields");
    }
  };

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      sorter: true,
      render: (name: string, record: Lead) => (
        <div>
          <Text strong style={{ color: "#fff", display: "block" }}>
            {name}
          </Text>
          <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>
            {record.company}
          </Text>
        </div>
      ),
    },
    {
      title: "Contact Methods",
      key: "contactMethods",
      width: 220,
      render: (_: unknown, record: Lead) => {
        const phones = getAllPopulatedPhones(record as Record<string, unknown>);
        const emails = getAllPopulatedEmails(record as Record<string, unknown>);
        return (
          <ContactMethodList
            phones={phones}
            emails={emails}
            compact={true}
            maxDisplay={2}
            onCallPhone={(phone) => {
              message.success(`Initiating call to ${record.name} at ${phone}`);
            }}
          />
        );
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      filters: [
        { text: "New", value: "new" },
        { text: "Contacted", value: "contacted" },
        { text: "Qualified", value: "qualified" },
        { text: "Converted", value: "converted" },
      ],
      render: (status: string) => (
        <Tag
          color={statusColors[status]}
          style={{ textTransform: "capitalize", borderRadius: 4 }}
        >
          {status}
        </Tag>
      ),
    },
    {
      title: "ICP Score",
      dataIndex: "icpScore",
      key: "icpScore",
      sorter: true,
      render: (score: number) => (
        <div style={{ minWidth: 100 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 4,
            }}
          >
            <Text style={{ color: getIcpScoreColor(score), fontWeight: 600 }}>
              {score}
            </Text>
          </div>
          <Progress
            percent={score}
            showInfo={false}
            size="small"
            strokeColor={getIcpScoreColor(score)}
            trailColor="rgba(255,255,255,0.1)"
          />
        </div>
      ),
    },
    {
      title: "Source",
      dataIndex: "source",
      key: "source",
      render: (source: string) => (
        <Tag style={{ background: "rgba(255,255,255,0.08)", border: "none" }}>
          {source}
        </Tag>
      ),
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      sorter: true,
      render: (date: Date) => (
        <Text style={{ color: "rgba(255,255,255,0.65)" }}>
          {new Date(date).toLocaleDateString()}
        </Text>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: Lead) => (
        <Space size={8}>
          <Tooltip title="Call">
            <Button
              data-testid={`button-call-${record.id}`}
              type="text"
              icon={<PhoneOutlined />}
              onClick={() => handleCall(record)}
              style={{ color: "rgba(255,255,255,0.65)" }}
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              data-testid={`button-edit-${record.id}`}
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              style={{ color: "rgba(255,255,255,0.65)" }}
            />
          </Tooltip>
          <Tooltip title="View">
            <Button
              data-testid={`button-view-${record.id}`}
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleView(record)}
              style={{ color: "rgba(255,255,255,0.65)" }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 32 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <Title level={2} style={{ color: "#fff", margin: 0 }}>
          Leads
        </Title>
        <Space>
          <Button
            data-testid="button-import-csv"
            icon={<UploadOutlined />}
            size="large"
            onClick={() => setImportModalOpen(true)}
            style={{ fontWeight: 500 }}
          >
            Import CSV
          </Button>
          <Button
            data-testid="button-add-lead"
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            onClick={() => setAddModalOpen(true)}
            style={{
              background: "#c9a648",
              borderColor: "#c9a648",
              fontWeight: 500,
            }}
          >
            Add Lead
          </Button>
        </Space>
      </div>

      <CSVImportWizard
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImportComplete={handleImportComplete}
      />

      <div
        style={{
          background: "#0f3654",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        <Table
          {...tableProps}
          columns={columns}
          rowKey="id"
          loading={tableQuery.isLoading}
          pagination={{
            ...tableProps.pagination,
            showSizeChanger: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} leads`,
          }}
          style={{ background: "transparent" }}
        />
      </div>

      <Modal
        title={<span style={{ color: "#fff" }}>Lead Details</span>}
        open={viewModalOpen}
        onCancel={() => setViewModalOpen(false)}
        footer={null}
        width={600}
      >
        {selectedLead && (
          <div style={{ padding: "16px 0" }}>
            <Space direction="vertical" size={16} style={{ width: "100%" }}>
              <div style={{ display: "flex", gap: 48 }}>
                <div>
                  <Text style={{ color: "rgba(255,255,255,0.5)", display: "block" }}>
                    Name
                  </Text>
                  <Text style={{ color: "#fff", fontSize: 16 }}>
                    {selectedLead.name}
                  </Text>
                </div>
                <div>
                  <Text style={{ color: "rgba(255,255,255,0.5)", display: "block" }}>
                    Company
                  </Text>
                  <Text style={{ color: "#fff", fontSize: 16 }}>
                    {selectedLead.company}
                  </Text>
                </div>
              </div>
              <div>
                <Text style={{ color: "rgba(255,255,255,0.5)", display: "block", marginBottom: 8 }}>
                  Contact Methods
                </Text>
                <ContactMethodList
                  phones={getAllPopulatedPhones(selectedLead as Record<string, unknown>)}
                  emails={getAllPopulatedEmails(selectedLead as Record<string, unknown>)}
                  compact={false}
                  onCallPhone={(phone) => {
                    message.success(`Initiating call to ${selectedLead.name} at ${phone}`);
                  }}
                />
              </div>
              <div style={{ display: "flex", gap: 48 }}>
                <div>
                  <Text style={{ color: "rgba(255,255,255,0.5)", display: "block" }}>
                    Status
                  </Text>
                  <Tag color={statusColors[selectedLead.status]}>
                    {selectedLead.status}
                  </Tag>
                </div>
                <div>
                  <Text style={{ color: "rgba(255,255,255,0.5)", display: "block" }}>
                    Stage
                  </Text>
                  <Tag color={stageColors[selectedLead.stage]}>
                    {selectedLead.stage}
                  </Tag>
                </div>
                <div>
                  <Text style={{ color: "rgba(255,255,255,0.5)", display: "block" }}>
                    ICP Score
                  </Text>
                  <Text
                    style={{
                      color: getIcpScoreColor(selectedLead.icpScore),
                      fontSize: 16,
                      fontWeight: 600,
                    }}
                  >
                    {selectedLead.icpScore}
                  </Text>
                </div>
              </div>
              <div>
                <Text style={{ color: "rgba(255,255,255,0.5)", display: "block" }}>
                  Source
                </Text>
                <Text style={{ color: "#fff", fontSize: 16 }}>
                  {selectedLead.source}
                </Text>
              </div>
            </Space>
          </div>
        )}
      </Modal>

      <Modal
        title={<span style={{ color: "#fff" }}>Edit Lead</span>}
        open={editModalOpen}
        onCancel={() => setEditModalOpen(false)}
        onOk={handleEditSave}
        confirmLoading={isUpdating}
        okButtonProps={{ style: { background: "#c9a648", borderColor: "#c9a648" } }}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 24 }}>
          <Form.Item label="Name" name="name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Email" name="email" rules={[{ required: true, type: "email" }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Phone" name="phone">
            <Input />
          </Form.Item>
          <Form.Item label="Company" name="company">
            <Input />
          </Form.Item>
          <Form.Item label="Status" name="status">
            <Select>
              <Select.Option value="new">New</Select.Option>
              <Select.Option value="contacted">Contacted</Select.Option>
              <Select.Option value="qualified">Qualified</Select.Option>
              <Select.Option value="converted">Converted</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="ICP Score" name="icpScore">
            <Input type="number" min={0} max={100} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={<span style={{ color: "#fff" }}>Add New Lead</span>}
        open={addModalOpen}
        onCancel={() => {
          setAddModalOpen(false);
          addForm.resetFields();
        }}
        onOk={handleAddLead}
        confirmLoading={isCreating}
        okText="Add Lead"
        okButtonProps={{ style: { background: "#c9a648", borderColor: "#c9a648" } }}
        width={600}
      >
        <Form form={addForm} layout="vertical" style={{ marginTop: 24 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="First Name" name="firstName" rules={[{ required: true, message: "Required" }]}>
                <Input placeholder="John" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Last Name" name="lastName" rules={[{ required: true, message: "Required" }]}>
                <Input placeholder="Smith" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Phone" name="phone" rules={[{ required: true, message: "Phone required" }]}>
                <Input placeholder="+1 555-123-4567" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Email" name="email" rules={[{ type: "email", message: "Invalid email" }]}>
                <Input placeholder="john@example.com" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="Street Address" name="street">
            <Input placeholder="123 Main St" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={10}>
              <Form.Item label="City" name="city">
                <Input placeholder="Charlotte" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="State" name="state">
                <Input placeholder="NC" maxLength={2} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="ZIP Code" name="zipCode">
                <Input placeholder="28202" maxLength={10} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Lead Source" name="leadSource">
                <Select placeholder="Select source">
                  <Select.Option value="DOOR_KNOCK">Door Knock</Select.Option>
                  <Select.Option value="REFERRAL">Referral</Select.Option>
                  <Select.Option value="WEBSITE">Website</Select.Option>
                  <Select.Option value="EVENT">Event</Select.Option>
                  <Select.Option value="PROPSTREAM">PropStream</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Utility Provider" name="utilityProvider">
                <Input placeholder="Duke Energy" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="Monthly Electric Bill" name="monthlyElectricBill">
                <Input type="number" prefix="$" placeholder="150" min={0} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Square Feet" name="squareFeet">
                <Input type="number" placeholder="2000" min={0} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Year Built" name="yearBuilt">
                <Input type="number" placeholder="2005" min={1900} max={2030} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}

// =============================================================================
// CRM Tab Components (previously in crm.tsx)
// =============================================================================

interface TwentyCompany {
  id: string;
  name?: string;
  domainName?: string;
  employees?: number;
  createdAt?: string;
}

interface TwentyNote {
  id: string;
  title?: string;
  body?: string;
  createdAt?: string;
  person?: { name?: { firstName?: string; lastName?: string } };
  company?: { name?: string };
}

interface TwentyTask {
  id: string;
  title?: string;
  body?: string;
  status?: string;
  dueAt?: string;
  createdAt?: string;
}

interface TwentyOpportunity {
  id: string;
  name?: string;
  amount?: { amountMicros?: number; currencyCode?: string };
  stage?: string;
  closeDate?: string;
  createdAt?: string;
}

function CompaniesTab() {
  const [searchText, setSearchText] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<TwentyCompany | null>(null);
  const [form] = Form.useForm();

  const { tableProps, tableQuery } = useTable<TwentyCompany>({
    resource: "companies",
    syncWithLocation: false,
  });

  const { mutate: createCompany } = useCreate();
  const { mutate: updateCompany } = useUpdate();
  const { mutate: deleteCompany } = useDelete();

  const filteredData = useMemo(() => {
    const data = tableProps.dataSource || [];
    if (!searchText) return data;
    const search = searchText.toLowerCase();
    return data.filter((record: TwentyCompany) => {
      const name = (record.name || "").toLowerCase();
      return name.includes(search);
    });
  }, [tableProps.dataSource, searchText]);

  const handleSubmit = async (values: { name?: string; domain?: string; employees?: string }) => {
    const data = {
      name: values.name,
      domainName: values.domain,
      employees: values.employees ? parseInt(values.employees) : undefined,
    };

    if (editingRecord) {
      updateCompany(
        { resource: "companies", id: editingRecord.id, values: data },
        {
          onSuccess: () => { message.success("Company updated"); setModalOpen(false); form.resetFields(); setEditingRecord(null); tableQuery.refetch(); },
          onError: () => message.error("Failed to update company"),
        }
      );
    } else {
      createCompany(
        { resource: "companies", values: data },
        {
          onSuccess: () => { message.success("Company created"); setModalOpen(false); form.resetFields(); tableQuery.refetch(); },
          onError: () => message.error("Failed to create company"),
        }
      );
    }
  };

  const handleEdit = (record: TwentyCompany) => {
    setEditingRecord(record);
    form.setFieldsValue({ name: record.name, domain: record.domainName, employees: record.employees });
    setModalOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteCompany(
      { resource: "companies", id },
      {
        onSuccess: () => { message.success("Company deleted"); tableQuery.refetch(); },
        onError: () => message.error("Failed to delete company"),
      }
    );
  };

  const columns = [
    { title: "Name", dataIndex: "name", key: "name" },
    { title: "Domain", dataIndex: "domainName", key: "domainName", render: (v: string) => v || "-" },
    { title: "Employees", dataIndex: "employees", key: "employees", render: (v: number) => v?.toLocaleString() || "-" },
    {
      title: "Actions", key: "actions", width: 120,
      render: (_: unknown, record: TwentyCompany) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Popconfirm title="Delete?" onConfirm={() => handleDelete(record.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <Input placeholder="Search..." prefix={<SearchOutlined />} value={searchText} onChange={(e) => setSearchText(e.target.value)} style={{ maxWidth: 300 }} />
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingRecord(null); form.resetFields(); setModalOpen(true); }}>Add Company</Button>
      </div>
      <Spin spinning={tableQuery.isLoading}>
        <Table {...tableProps} dataSource={filteredData} columns={columns} rowKey="id" pagination={{ pageSize: 10 }} />
      </Spin>
      <Modal title={editingRecord ? "Edit Company" : "Add Company"} open={modalOpen} onCancel={() => { setModalOpen(false); form.resetFields(); setEditingRecord(null); }} footer={null}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="name" label="Name" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="domain" label="Domain"><Input placeholder="example.com" /></Form.Item>
          <Form.Item name="employees" label="Employees"><Input type="number" /></Form.Item>
          <Form.Item><Space><Button onClick={() => setModalOpen(false)}>Cancel</Button><Button type="primary" htmlType="submit">{editingRecord ? "Update" : "Create"}</Button></Space></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

function NotesTab() {
  const [searchText, setSearchText] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<TwentyNote | null>(null);
  const [form] = Form.useForm();

  const { tableProps, tableQuery } = useTable<TwentyNote>({
    resource: "notes",
    syncWithLocation: false,
  });

  const { mutate: createNote } = useCreate();
  const { mutate: updateNote } = useUpdate();
  const { mutate: deleteNote } = useDelete();

  const filteredData = useMemo(() => {
    const data = tableProps.dataSource || [];
    if (!searchText) return data;
    const search = searchText.toLowerCase();
    return data.filter((record: TwentyNote) => {
      const title = (record.title || "").toLowerCase();
      return title.includes(search);
    });
  }, [tableProps.dataSource, searchText]);

  const handleSubmit = async (values: { title?: string; body?: string }) => {
    const data = { title: values.title, body: values.body };
    if (editingRecord) {
      updateNote(
        { resource: "notes", id: editingRecord.id, values: data },
        {
          onSuccess: () => { message.success("Note updated"); setModalOpen(false); form.resetFields(); setEditingRecord(null); tableQuery.refetch(); },
          onError: () => message.error("Failed to update note"),
        }
      );
    } else {
      createNote(
        { resource: "notes", values: data },
        {
          onSuccess: () => { message.success("Note created"); setModalOpen(false); form.resetFields(); tableQuery.refetch(); },
          onError: () => message.error("Failed to create note"),
        }
      );
    }
  };

  const handleEdit = (record: TwentyNote) => {
    setEditingRecord(record);
    form.setFieldsValue({ title: record.title, body: record.body });
    setModalOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteNote(
      { resource: "notes", id },
      {
        onSuccess: () => { message.success("Note deleted"); tableQuery.refetch(); },
        onError: () => message.error("Failed to delete note"),
      }
    );
  };

  const columns = [
    { title: "Title", dataIndex: "title", key: "title", render: (v: string) => v || "-" },
    { title: "Body", dataIndex: "body", key: "body", ellipsis: true, render: (v: string) => v?.substring(0, 100) || "-" },
    { title: "Created", dataIndex: "createdAt", key: "createdAt", render: (v: string) => v ? new Date(v).toLocaleDateString() : "-" },
    {
      title: "Actions", key: "actions", width: 120,
      render: (_: unknown, record: TwentyNote) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Popconfirm title="Delete?" onConfirm={() => handleDelete(record.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <Input placeholder="Search..." prefix={<SearchOutlined />} value={searchText} onChange={(e) => setSearchText(e.target.value)} style={{ maxWidth: 300 }} />
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingRecord(null); form.resetFields(); setModalOpen(true); }}>Add Note</Button>
      </div>
      <Spin spinning={tableQuery.isLoading}>
        <Table {...tableProps} dataSource={filteredData} columns={columns} rowKey="id" pagination={{ pageSize: 10 }} />
      </Spin>
      <Modal title={editingRecord ? "Edit Note" : "Add Note"} open={modalOpen} onCancel={() => { setModalOpen(false); form.resetFields(); setEditingRecord(null); }} footer={null}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="title" label="Title"><Input /></Form.Item>
          <Form.Item name="body" label="Body" rules={[{ required: true }]}><Input.TextArea rows={4} /></Form.Item>
          <Form.Item><Space><Button onClick={() => setModalOpen(false)}>Cancel</Button><Button type="primary" htmlType="submit">{editingRecord ? "Update" : "Create"}</Button></Space></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

function TasksTab() {
  const [searchText, setSearchText] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<TwentyTask | null>(null);
  const [form] = Form.useForm();

  const { tableProps, tableQuery } = useTable<TwentyTask>({
    resource: "tasks",
    syncWithLocation: false,
  });

  const { mutate: createTask } = useCreate();
  const { mutate: updateTask } = useUpdate();
  const { mutate: deleteTask } = useDelete();

  const filteredData = useMemo(() => {
    const data = tableProps.dataSource || [];
    if (!searchText) return data;
    const search = searchText.toLowerCase();
    return data.filter((record: TwentyTask) => (record.title || "").toLowerCase().includes(search));
  }, [tableProps.dataSource, searchText]);

  const handleSubmit = async (values: { title?: string; body?: string; status?: string; dueAt?: string }) => {
    const data = { title: values.title, body: values.body, status: values.status || "TODO", dueAt: values.dueAt };
    if (editingRecord) {
      updateTask(
        { resource: "tasks", id: editingRecord.id, values: data },
        {
          onSuccess: () => { message.success("Task updated"); setModalOpen(false); form.resetFields(); setEditingRecord(null); tableQuery.refetch(); },
          onError: () => message.error("Failed to update task"),
        }
      );
    } else {
      createTask(
        { resource: "tasks", values: data },
        {
          onSuccess: () => { message.success("Task created"); setModalOpen(false); form.resetFields(); tableQuery.refetch(); },
          onError: () => message.error("Failed to create task"),
        }
      );
    }
  };

  const handleEdit = (record: TwentyTask) => {
    setEditingRecord(record);
    form.setFieldsValue({ title: record.title, body: record.body, status: record.status, dueAt: record.dueAt?.split("T")[0] });
    setModalOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteTask({ resource: "tasks", id }, { onSuccess: () => { message.success("Task deleted"); tableQuery.refetch(); }, onError: () => message.error("Failed to delete task") });
  };

  const statusColors: Record<string, string> = { TODO: "blue", IN_PROGRESS: "orange", DONE: "green" };

  const columns = [
    { title: "Title", dataIndex: "title", key: "title" },
    { title: "Status", dataIndex: "status", key: "status", render: (s: string) => s ? <Tag color={statusColors[s] || "default"}>{s}</Tag> : "-" },
    { title: "Due", dataIndex: "dueAt", key: "dueAt", render: (v: string) => v ? new Date(v).toLocaleDateString() : "-" },
    {
      title: "Actions", key: "actions", width: 120,
      render: (_: unknown, record: TwentyTask) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Popconfirm title="Delete?" onConfirm={() => handleDelete(record.id)}><Button size="small" danger icon={<DeleteOutlined />} /></Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <Input placeholder="Search..." prefix={<SearchOutlined />} value={searchText} onChange={(e) => setSearchText(e.target.value)} style={{ maxWidth: 300 }} />
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingRecord(null); form.resetFields(); setModalOpen(true); }}>Add Task</Button>
      </div>
      <Spin spinning={tableQuery.isLoading}>
        <Table {...tableProps} dataSource={filteredData} columns={columns} rowKey="id" pagination={{ pageSize: 10 }} />
      </Spin>
      <Modal title={editingRecord ? "Edit Task" : "Add Task"} open={modalOpen} onCancel={() => { setModalOpen(false); form.resetFields(); setEditingRecord(null); }} footer={null}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="title" label="Title" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="body" label="Description"><Input.TextArea rows={3} /></Form.Item>
          <Form.Item name="status" label="Status"><Select placeholder="Status"><Select.Option value="TODO">TODO</Select.Option><Select.Option value="IN_PROGRESS">IN_PROGRESS</Select.Option><Select.Option value="DONE">DONE</Select.Option></Select></Form.Item>
          <Form.Item name="dueAt" label="Due Date"><Input type="date" /></Form.Item>
          <Form.Item><Space><Button onClick={() => setModalOpen(false)}>Cancel</Button><Button type="primary" htmlType="submit">{editingRecord ? "Update" : "Create"}</Button></Space></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

function OpportunitiesTab() {
  const [searchText, setSearchText] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<TwentyOpportunity | null>(null);
  const [form] = Form.useForm();

  const { tableProps, tableQuery } = useTable<TwentyOpportunity>({
    resource: "opportunities",
    syncWithLocation: false,
  });

  const { mutate: createOpp } = useCreate();
  const { mutate: updateOpp } = useUpdate();
  const { mutate: deleteOpp } = useDelete();

  const filteredData = useMemo(() => {
    const data = tableProps.dataSource || [];
    if (!searchText) return data;
    const search = searchText.toLowerCase();
    return data.filter((record: TwentyOpportunity) => (record.name || "").toLowerCase().includes(search));
  }, [tableProps.dataSource, searchText]);

  const handleSubmit = async (values: { name?: string; amount?: string; stage?: string; closeDate?: string }) => {
    const data = {
      name: values.name,
      amount: values.amount ? { amountMicros: parseFloat(values.amount) * 1000000, currencyCode: "USD" } : undefined,
      stage: values.stage,
      closeDate: values.closeDate,
    };
    if (editingRecord) {
      updateOpp({ resource: "opportunities", id: editingRecord.id, values: data }, {
        onSuccess: () => { message.success("Opportunity updated"); setModalOpen(false); form.resetFields(); setEditingRecord(null); tableQuery.refetch(); },
        onError: () => message.error("Failed to update opportunity"),
      });
    } else {
      createOpp({ resource: "opportunities", values: data }, {
        onSuccess: () => { message.success("Opportunity created"); setModalOpen(false); form.resetFields(); tableQuery.refetch(); },
        onError: () => message.error("Failed to create opportunity"),
      });
    }
  };

  const handleEdit = (record: TwentyOpportunity) => {
    setEditingRecord(record);
    form.setFieldsValue({
      name: record.name,
      amount: record.amount?.amountMicros ? record.amount.amountMicros / 1000000 : undefined,
      stage: record.stage,
      closeDate: record.closeDate,
    });
    setModalOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteOpp({ resource: "opportunities", id }, { onSuccess: () => { message.success("Opportunity deleted"); tableQuery.refetch(); }, onError: () => message.error("Failed to delete opportunity") });
  };

  const stageColors: Record<string, string> = { NEW: "blue", MEETING: "cyan", PROPOSAL: "orange", CUSTOMER: "green" };

  const columns = [
    { title: "Name", dataIndex: "name", key: "name" },
    { title: "Amount", key: "amount", render: (_: unknown, r: TwentyOpportunity) => r.amount?.amountMicros ? `$${(r.amount.amountMicros / 1000000).toLocaleString()}` : "-" },
    { title: "Stage", dataIndex: "stage", key: "stage", render: (s: string) => s ? <Tag color={stageColors[s] || "default"}>{s}</Tag> : "-" },
    { title: "Close Date", dataIndex: "closeDate", key: "closeDate", render: (v: string) => v ? new Date(v).toLocaleDateString() : "-" },
    {
      title: "Actions", key: "actions", width: 120,
      render: (_: unknown, record: TwentyOpportunity) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Popconfirm title="Delete?" onConfirm={() => handleDelete(record.id)}><Button size="small" danger icon={<DeleteOutlined />} /></Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <Input placeholder="Search..." prefix={<SearchOutlined />} value={searchText} onChange={(e) => setSearchText(e.target.value)} style={{ maxWidth: 300 }} />
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingRecord(null); form.resetFields(); setModalOpen(true); }}>Add Opportunity</Button>
      </div>
      <Spin spinning={tableQuery.isLoading}>
        <Table {...tableProps} dataSource={filteredData} columns={columns} rowKey="id" pagination={{ pageSize: 10 }} />
      </Spin>
      <Modal title={editingRecord ? "Edit Opportunity" : "Add Opportunity"} open={modalOpen} onCancel={() => { setModalOpen(false); form.resetFields(); setEditingRecord(null); }} footer={null}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="name" label="Name" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="amount" label="Amount ($)"><Input type="number" /></Form.Item>
          <Form.Item name="stage" label="Stage"><Select placeholder="Stage"><Select.Option value="NEW">NEW</Select.Option><Select.Option value="MEETING">MEETING</Select.Option><Select.Option value="PROPOSAL">PROPOSAL</Select.Option><Select.Option value="CUSTOMER">CUSTOMER</Select.Option></Select></Form.Item>
          <Form.Item name="closeDate" label="Close Date"><Input type="date" /></Form.Item>
          <Form.Item><Space><Button onClick={() => setModalOpen(false)}>Cancel</Button><Button type="primary" htmlType="submit">{editingRecord ? "Update" : "Create"}</Button></Space></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

// =============================================================================
// Main Leads Page with CRM Tabs
// =============================================================================

export function LeadsPage() {
  const tabItems = [
    {
      key: "leads",
      label: <span><UserOutlined /> Leads</span>,
      children: <LeadsTab />,
    },
    {
      key: "companies",
      label: <span><BankOutlined /> Companies</span>,
      children: <CompaniesTab />,
    },
    {
      key: "opportunities",
      label: <span><DollarOutlined /> Opportunities</span>,
      children: <OpportunitiesTab />,
    },
    {
      key: "notes",
      label: <span><FileTextOutlined /> Notes</span>,
      children: <NotesTab />,
    },
    {
      key: "tasks",
      label: <span><CheckSquareOutlined /> Tasks</span>,
      children: <TasksTab />,
    },
  ];

  return (
    <div style={{ padding: 32 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <Title level={2} style={{ color: "#fff", margin: 0 }}>
          Leads & CRM
        </Title>
      </div>
      <div style={{ background: "#0f3654", borderRadius: 12, padding: 24 }}>
        <Tabs items={tabItems} defaultActiveKey="leads" />
      </div>
    </div>
  );
}
