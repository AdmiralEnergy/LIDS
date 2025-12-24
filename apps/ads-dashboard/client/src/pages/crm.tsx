import { useState, useMemo } from "react";
import {
  Tabs,
  Table,
  Button,
  Space,
  Typography,
  Input,
  Modal,
  Form,
  message,
  Popconfirm,
  Tag,
  Spin,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  UserOutlined,
  BankOutlined,
  DollarOutlined,
  FileTextOutlined,
  CheckSquareOutlined,
} from "@ant-design/icons";
import { useTable } from "@refinedev/antd";
import { useCreate, useUpdate, useDelete } from "@refinedev/core";

const { Title, Text } = Typography;

interface TwentyPerson {
  id: string;
  name?: { firstName?: string; lastName?: string };
  emails?: { primaryEmail?: string };
  phones?: { primaryPhoneNumber?: string };
  company?: { name?: string };
  jobTitle?: string;
  createdAt?: string;
}

interface TwentyCompany {
  id: string;
  name?: string;
  domainName?: string;
  employees?: number;
  linkedinLink?: { url?: string };
  createdAt?: string;
}

interface TwentyOpportunity {
  id: string;
  name?: string;
  amount?: { amountMicros?: number; currencyCode?: string };
  stage?: string;
  closeDate?: string;
  company?: { name?: string };
  createdAt?: string;
}

interface TwentyNote {
  id: string;
  title?: string;
  body?: string;
  createdAt?: string;
  person?: TwentyPerson;
  company?: TwentyCompany;
}

interface TwentyTask {
  id: string;
  title?: string;
  body?: string;
  status?: string;
  dueAt?: string;
  createdAt?: string;
}

function PeopleTab() {
  const [searchText, setSearchText] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<TwentyPerson | null>(null);
  const [form] = Form.useForm();

  const { tableProps, tableQuery } = useTable<TwentyPerson>({
    resource: "people",
    syncWithLocation: false,
  });

  const { mutate: createPerson } = useCreate();
  const { mutate: updatePerson } = useUpdate();
  const { mutate: deletePerson } = useDelete();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredData = useMemo(() => {
    const data = tableProps.dataSource || [];
    if (!searchText) return data;
    const search = searchText.toLowerCase();
    return data.filter((record: any) => {
      const name = `${record.name?.firstName || ""} ${record.name?.lastName || ""}`.toLowerCase();
      const email = (record.emails?.primaryEmail || record.email || "").toLowerCase();
      return name.includes(search) || email.includes(search);
    });
  }, [tableProps.dataSource, searchText]);

  const handleSubmit = async (values: any) => {
    const nameParts = values.name?.split(" ") || [];
    const data = {
      name: {
        firstName: nameParts[0] || "",
        lastName: nameParts.slice(1).join(" ") || "",
      },
      emails: { primaryEmail: values.email },
      phones: { primaryPhoneNumber: values.phone },
      jobTitle: values.company,
    };

    if (editingRecord) {
      updatePerson(
        { resource: "people", id: editingRecord.id, values: data },
        {
          onSuccess: () => {
            message.success("Person updated");
            setModalOpen(false);
            form.resetFields();
            setEditingRecord(null);
            tableQuery.refetch();
          },
          onError: () => message.error("Failed to update person"),
        }
      );
    } else {
      createPerson(
        { resource: "people", values: data },
        {
          onSuccess: () => {
            message.success("Person created");
            setModalOpen(false);
            form.resetFields();
            tableQuery.refetch();
          },
          onError: () => message.error("Failed to create person"),
        }
      );
    }
  };

  const handleEdit = (record: TwentyPerson) => {
    const name = `${record.name?.firstName || ""} ${record.name?.lastName || ""}`.trim();
    setEditingRecord(record);
    form.setFieldsValue({
      name,
      email: record.emails?.primaryEmail || (record as any).email,
      phone: record.phones?.primaryPhoneNumber || (record as any).phone,
      company: record.company?.name || record.jobTitle || (record as any).company,
    });
    setModalOpen(true);
  };

  const handleDelete = (id: string) => {
    deletePerson(
      { resource: "people", id },
      {
        onSuccess: () => {
          message.success("Person deleted");
          tableQuery.refetch();
        },
        onError: () => message.error("Failed to delete person"),
      }
    );
  };

  const columns = [
    {
      title: "Name",
      key: "name",
      render: (_: any, record: any) => {
        if (record.name?.firstName || record.name?.lastName) {
          return `${record.name?.firstName || ""} ${record.name?.lastName || ""}`.trim();
        }
        return record.name || "Unknown";
      },
    },
    {
      title: "Email",
      key: "email",
      render: (_: any, record: any) => record.emails?.primaryEmail || record.email || "-",
    },
    {
      title: "Phone",
      key: "phone",
      render: (_: any, record: any) => record.phones?.primaryPhoneNumber || record.phone || "-",
    },
    {
      title: "Company",
      key: "company",
      render: (_: any, record: any) => record.company?.name || record.jobTitle || record.company || "-",
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      render: (_: any, record: any) => (
        <Space>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            data-testid={`button-edit-person-${record.id}`}
          />
          <Popconfirm
            title="Delete this person?"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              data-testid={`button-delete-person-${record.id}`}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, gap: 16, flexWrap: "wrap" }}>
        <Input
          placeholder="Search people..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ maxWidth: 300 }}
          data-testid="input-search-people"
        />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingRecord(null);
            form.resetFields();
            setModalOpen(true);
          }}
          data-testid="button-add-person"
        >
          Add Person
        </Button>
      </div>

      <Spin spinning={tableQuery.isLoading}>
        <Table
          {...tableProps}
          dataSource={filteredData}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          data-testid="table-people"
        />
      </Spin>

      <Modal
        title={editingRecord ? "Edit Person" : "Add Person"}
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          form.resetFields();
          setEditingRecord(null);
        }}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input data-testid="input-person-name" />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ type: "email" }]}>
            <Input data-testid="input-person-email" />
          </Form.Item>
          <Form.Item name="phone" label="Phone">
            <Input data-testid="input-person-phone" />
          </Form.Item>
          <Form.Item name="company" label="Company">
            <Input data-testid="input-person-company" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={isSubmitting}
                data-testid="button-submit-person"
              >
                {editingRecord ? "Update" : "Create"}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredData = useMemo(() => {
    const data = tableProps.dataSource || [];
    if (!searchText) return data;
    const search = searchText.toLowerCase();
    return data.filter((record: any) => {
      const name = (record.name || "").toLowerCase();
      const domain = (record.domainName || "").toLowerCase();
      return name.includes(search) || domain.includes(search);
    });
  }, [tableProps.dataSource, searchText]);

  const handleSubmit = async (values: any) => {
    const data = {
      name: values.name,
      domainName: values.domain,
      employees: values.employees ? parseInt(values.employees) : undefined,
    };

    if (editingRecord) {
      updateCompany(
        { resource: "companies", id: editingRecord.id, values: data },
        {
          onSuccess: () => {
            message.success("Company updated");
            setModalOpen(false);
            form.resetFields();
            setEditingRecord(null);
            tableQuery.refetch();
          },
          onError: () => message.error("Failed to update company"),
        }
      );
    } else {
      createCompany(
        { resource: "companies", values: data },
        {
          onSuccess: () => {
            message.success("Company created");
            setModalOpen(false);
            form.resetFields();
            tableQuery.refetch();
          },
          onError: () => message.error("Failed to create company"),
        }
      );
    }
  };

  const handleEdit = (record: TwentyCompany) => {
    setEditingRecord(record);
    form.setFieldsValue({
      name: record.name,
      domain: record.domainName,
      employees: record.employees,
    });
    setModalOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteCompany(
      { resource: "companies", id },
      {
        onSuccess: () => {
          message.success("Company deleted");
          tableQuery.refetch();
        },
        onError: () => message.error("Failed to delete company"),
      }
    );
  };

  const columns = [
    { title: "Name", dataIndex: "name", key: "name" },
    { title: "Domain", dataIndex: "domainName", key: "domainName", render: (v: string) => v || "-" },
    { title: "Employees", dataIndex: "employees", key: "employees", render: (v: number) => v?.toLocaleString() || "-" },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      render: (_: any, record: TwentyCompany) => (
        <Space>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            data-testid={`button-edit-company-${record.id}`}
          />
          <Popconfirm
            title="Delete this company?"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              data-testid={`button-delete-company-${record.id}`}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, gap: 16, flexWrap: "wrap" }}>
        <Input
          placeholder="Search companies..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ maxWidth: 300 }}
          data-testid="input-search-companies"
        />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingRecord(null);
            form.resetFields();
            setModalOpen(true);
          }}
          data-testid="button-add-company"
        >
          Add Company
        </Button>
      </div>

      <Spin spinning={tableQuery.isLoading}>
        <Table
          {...tableProps}
          dataSource={filteredData}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          data-testid="table-companies"
        />
      </Spin>

      <Modal
        title={editingRecord ? "Edit Company" : "Add Company"}
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          form.resetFields();
          setEditingRecord(null);
        }}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="name" label="Company Name" rules={[{ required: true }]}>
            <Input data-testid="input-company-name" />
          </Form.Item>
          <Form.Item name="domain" label="Domain">
            <Input placeholder="example.com" data-testid="input-company-domain" />
          </Form.Item>
          <Form.Item name="employees" label="Employees">
            <Input type="number" data-testid="input-company-employees" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={isSubmitting}
                data-testid="button-submit-company"
              >
                {editingRecord ? "Update" : "Create"}
              </Button>
            </Space>
          </Form.Item>
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredData = useMemo(() => {
    const data = tableProps.dataSource || [];
    if (!searchText) return data;
    const search = searchText.toLowerCase();
    return data.filter((record: any) => {
      const name = (record.name || "").toLowerCase();
      return name.includes(search);
    });
  }, [tableProps.dataSource, searchText]);

  const handleSubmit = async (values: any) => {
    const data = {
      name: values.name,
      amount: values.amount ? { amountMicros: parseFloat(values.amount) * 1000000, currencyCode: "USD" } : undefined,
      stage: values.stage,
      closeDate: values.closeDate,
    };

    if (editingRecord) {
      updateOpp(
        { resource: "opportunities", id: editingRecord.id, values: data },
        {
          onSuccess: () => {
            message.success("Opportunity updated");
            setModalOpen(false);
            form.resetFields();
            setEditingRecord(null);
            tableQuery.refetch();
          },
          onError: () => message.error("Failed to update opportunity"),
        }
      );
    } else {
      createOpp(
        { resource: "opportunities", values: data },
        {
          onSuccess: () => {
            message.success("Opportunity created");
            setModalOpen(false);
            form.resetFields();
            tableQuery.refetch();
          },
          onError: () => message.error("Failed to create opportunity"),
        }
      );
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
    deleteOpp(
      { resource: "opportunities", id },
      {
        onSuccess: () => {
          message.success("Opportunity deleted");
          tableQuery.refetch();
        },
        onError: () => message.error("Failed to delete opportunity"),
      }
    );
  };

  const stageColors: Record<string, string> = {
    NEW: "blue",
    MEETING: "cyan",
    PROPOSAL: "orange",
    CUSTOMER: "green",
  };

  const columns = [
    { title: "Name", dataIndex: "name", key: "name" },
    {
      title: "Amount",
      key: "amount",
      render: (_: any, record: TwentyOpportunity) => {
        if (record.amount?.amountMicros) {
          const amount = record.amount.amountMicros / 1000000;
          return `$${amount.toLocaleString()}`;
        }
        return "-";
      },
    },
    {
      title: "Stage",
      dataIndex: "stage",
      key: "stage",
      render: (stage: string) => stage ? <Tag color={stageColors[stage] || "default"}>{stage}</Tag> : "-",
    },
    { title: "Close Date", dataIndex: "closeDate", key: "closeDate", render: (v: string) => v ? new Date(v).toLocaleDateString() : "-" },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      render: (_: any, record: TwentyOpportunity) => (
        <Space>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            data-testid={`button-edit-opportunity-${record.id}`}
          />
          <Popconfirm
            title="Delete this opportunity?"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              data-testid={`button-delete-opportunity-${record.id}`}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, gap: 16, flexWrap: "wrap" }}>
        <Input
          placeholder="Search opportunities..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ maxWidth: 300 }}
          data-testid="input-search-opportunities"
        />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingRecord(null);
            form.resetFields();
            setModalOpen(true);
          }}
          data-testid="button-add-opportunity"
        >
          Add Opportunity
        </Button>
      </div>

      <Spin spinning={tableQuery.isLoading}>
        <Table
          {...tableProps}
          dataSource={filteredData}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          data-testid="table-opportunities"
        />
      </Spin>

      <Modal
        title={editingRecord ? "Edit Opportunity" : "Add Opportunity"}
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          form.resetFields();
          setEditingRecord(null);
        }}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input data-testid="input-opportunity-name" />
          </Form.Item>
          <Form.Item name="amount" label="Amount ($)">
            <Input type="number" data-testid="input-opportunity-amount" />
          </Form.Item>
          <Form.Item name="stage" label="Stage">
            <Input placeholder="NEW, MEETING, PROPOSAL, CUSTOMER" data-testid="input-opportunity-stage" />
          </Form.Item>
          <Form.Item name="closeDate" label="Close Date">
            <Input type="date" data-testid="input-opportunity-closedate" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={isSubmitting}
                data-testid="button-submit-opportunity"
              >
                {editingRecord ? "Update" : "Create"}
              </Button>
            </Space>
          </Form.Item>
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredData = useMemo(() => {
    const data = tableProps.dataSource || [];
    if (!searchText) return data;
    const search = searchText.toLowerCase();
    return data.filter((record: any) => {
      const title = (record.title || "").toLowerCase();
      const body = (record.body || "").toLowerCase();
      return title.includes(search) || body.includes(search);
    });
  }, [tableProps.dataSource, searchText]);

  const handleSubmit = async (values: any) => {
    const data = {
      title: values.title,
      body: values.body,
    };

    if (editingRecord) {
      updateNote(
        { resource: "notes", id: editingRecord.id, values: data },
        {
          onSuccess: () => {
            message.success("Note updated");
            setModalOpen(false);
            form.resetFields();
            setEditingRecord(null);
            tableQuery.refetch();
          },
          onError: () => message.error("Failed to update note"),
        }
      );
    } else {
      createNote(
        { resource: "notes", values: data },
        {
          onSuccess: () => {
            message.success("Note created");
            setModalOpen(false);
            form.resetFields();
            tableQuery.refetch();
          },
          onError: () => message.error("Failed to create note"),
        }
      );
    }
  };

  const handleEdit = (record: TwentyNote) => {
    setEditingRecord(record);
    form.setFieldsValue({
      title: record.title,
      body: record.body,
    });
    setModalOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteNote(
      { resource: "notes", id },
      {
        onSuccess: () => {
          message.success("Note deleted");
          tableQuery.refetch();
        },
        onError: () => message.error("Failed to delete note"),
      }
    );
  };

  const columns = [
    { title: "Title", dataIndex: "title", key: "title", render: (v: string) => v || "-" },
    {
      title: "Body",
      dataIndex: "body",
      key: "body",
      ellipsis: true,
      render: (v: string) => v?.substring(0, 100) || "-",
    },
    {
      title: "Related To",
      key: "person",
      render: (_: any, record: TwentyNote) => {
        if (record.person) {
          return `${record.person.name?.firstName || ""} ${record.person.name?.lastName || ""}`.trim();
        }
        if (record.company) {
          return record.company.name;
        }
        return "-";
      },
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (v: string) => v ? new Date(v).toLocaleDateString() : "-",
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      render: (_: any, record: TwentyNote) => (
        <Space>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            data-testid={`button-edit-note-${record.id}`}
          />
          <Popconfirm
            title="Delete this note?"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              data-testid={`button-delete-note-${record.id}`}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, gap: 16, flexWrap: "wrap" }}>
        <Input
          placeholder="Search notes..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ maxWidth: 300 }}
          data-testid="input-search-notes"
        />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingRecord(null);
            form.resetFields();
            setModalOpen(true);
          }}
          data-testid="button-add-note"
        >
          Add Note
        </Button>
      </div>

      <Spin spinning={tableQuery.isLoading}>
        <Table
          {...tableProps}
          dataSource={filteredData}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          data-testid="table-notes"
        />
      </Spin>

      <Modal
        title={editingRecord ? "Edit Note" : "Add Note"}
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          form.resetFields();
          setEditingRecord(null);
        }}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="title" label="Title">
            <Input data-testid="input-note-title" />
          </Form.Item>
          <Form.Item name="body" label="Body" rules={[{ required: true }]}>
            <Input.TextArea rows={4} data-testid="input-note-body" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={isSubmitting}
                data-testid="button-submit-note"
              >
                {editingRecord ? "Update" : "Create"}
              </Button>
            </Space>
          </Form.Item>
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredData = useMemo(() => {
    const data = tableProps.dataSource || [];
    if (!searchText) return data;
    const search = searchText.toLowerCase();
    return data.filter((record: any) => {
      const title = (record.title || "").toLowerCase();
      return title.includes(search);
    });
  }, [tableProps.dataSource, searchText]);

  const handleSubmit = async (values: any) => {
    const data = {
      title: values.title,
      body: values.body,
      status: values.status || "TODO",
      dueAt: values.dueAt,
    };

    if (editingRecord) {
      updateTask(
        { resource: "tasks", id: editingRecord.id, values: data },
        {
          onSuccess: () => {
            message.success("Task updated");
            setModalOpen(false);
            form.resetFields();
            setEditingRecord(null);
            tableQuery.refetch();
          },
          onError: () => message.error("Failed to update task"),
        }
      );
    } else {
      createTask(
        { resource: "tasks", values: data },
        {
          onSuccess: () => {
            message.success("Task created");
            setModalOpen(false);
            form.resetFields();
            tableQuery.refetch();
          },
          onError: () => message.error("Failed to create task"),
        }
      );
    }
  };

  const handleEdit = (record: TwentyTask) => {
    setEditingRecord(record);
    form.setFieldsValue({
      title: record.title,
      body: record.body,
      status: record.status,
      dueAt: record.dueAt?.split("T")[0],
    });
    setModalOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteTask(
      { resource: "tasks", id },
      {
        onSuccess: () => {
          message.success("Task deleted");
          tableQuery.refetch();
        },
        onError: () => message.error("Failed to delete task"),
      }
    );
  };

  const statusColors: Record<string, string> = {
    TODO: "blue",
    IN_PROGRESS: "orange",
    DONE: "green",
  };

  const columns = [
    { title: "Title", dataIndex: "title", key: "title" },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => status ? <Tag color={statusColors[status] || "default"}>{status}</Tag> : "-",
    },
    {
      title: "Due Date",
      dataIndex: "dueAt",
      key: "dueAt",
      render: (v: string) => v ? new Date(v).toLocaleDateString() : "-",
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (v: string) => v ? new Date(v).toLocaleDateString() : "-",
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      render: (_: any, record: TwentyTask) => (
        <Space>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            data-testid={`button-edit-task-${record.id}`}
          />
          <Popconfirm
            title="Delete this task?"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              data-testid={`button-delete-task-${record.id}`}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, gap: 16, flexWrap: "wrap" }}>
        <Input
          placeholder="Search tasks..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ maxWidth: 300 }}
          data-testid="input-search-tasks"
        />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingRecord(null);
            form.resetFields();
            setModalOpen(true);
          }}
          data-testid="button-add-task"
        >
          Add Task
        </Button>
      </div>

      <Spin spinning={tableQuery.isLoading}>
        <Table
          {...tableProps}
          dataSource={filteredData}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          data-testid="table-tasks"
        />
      </Spin>

      <Modal
        title={editingRecord ? "Edit Task" : "Add Task"}
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          form.resetFields();
          setEditingRecord(null);
        }}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="title" label="Title" rules={[{ required: true }]}>
            <Input data-testid="input-task-title" />
          </Form.Item>
          <Form.Item name="body" label="Description">
            <Input.TextArea rows={3} data-testid="input-task-body" />
          </Form.Item>
          <Form.Item name="status" label="Status">
            <Input placeholder="TODO, IN_PROGRESS, DONE" data-testid="input-task-status" />
          </Form.Item>
          <Form.Item name="dueAt" label="Due Date">
            <Input type="date" data-testid="input-task-duedate" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={isSubmitting}
                data-testid="button-submit-task"
              >
                {editingRecord ? "Update" : "Create"}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export function CRMPage() {
  const tabItems = [
    {
      key: "people",
      label: (
        <span>
          <UserOutlined /> People
        </span>
      ),
      children: <PeopleTab />,
    },
    {
      key: "companies",
      label: (
        <span>
          <BankOutlined /> Companies
        </span>
      ),
      children: <CompaniesTab />,
    },
    {
      key: "opportunities",
      label: (
        <span>
          <DollarOutlined /> Opportunities
        </span>
      ),
      children: <OpportunitiesTab />,
    },
    {
      key: "notes",
      label: (
        <span>
          <FileTextOutlined /> Notes
        </span>
      ),
      children: <NotesTab />,
    },
    {
      key: "tasks",
      label: (
        <span>
          <CheckSquareOutlined /> Tasks
        </span>
      ),
      children: <TasksTab />,
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <Title level={2} style={{ color: "#fff", margin: 0 }}>
          Twenty CRM
        </Title>
        <Text style={{ color: "rgba(255,255,255,0.65)" }}>
          Manage your CRM data directly from Twenty
        </Text>
      </div>

      <div
        style={{
          background: "#0f3654",
          borderRadius: 8,
          padding: 24,
        }}
      >
        <Tabs items={tabItems} defaultActiveKey="people" data-testid="tabs-crm" />
      </div>
    </div>
  );
}
