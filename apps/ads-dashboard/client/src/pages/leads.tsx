import { useState } from "react";
import {
  Table,
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
} from "antd";
import {
  PhoneOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { useTable } from "@refinedev/antd";
import { useUpdate, useCreate } from "@refinedev/core";
import type { Lead } from "@shared/schema";
import { CSVImportWizard } from "../components/CSVImportWizard";

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

export function LeadsPage() {
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
      title: "Phone",
      dataIndex: "phone",
      key: "phone",
      render: (phone: string) => (
        <Text style={{ color: "rgba(255,255,255,0.85)" }}>{phone}</Text>
      ),
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      render: (email: string) => (
        <Text style={{ color: "rgba(255,255,255,0.85)" }}>{email}</Text>
      ),
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
              <div style={{ display: "flex", gap: 48 }}>
                <div>
                  <Text style={{ color: "rgba(255,255,255,0.5)", display: "block" }}>
                    Email
                  </Text>
                  <Text style={{ color: "#fff", fontSize: 16 }}>
                    {selectedLead.email}
                  </Text>
                </div>
                <div>
                  <Text style={{ color: "rgba(255,255,255,0.5)", display: "block" }}>
                    Phone
                  </Text>
                  <Text style={{ color: "#fff", fontSize: 16 }}>
                    {selectedLead.phone}
                  </Text>
                </div>
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
