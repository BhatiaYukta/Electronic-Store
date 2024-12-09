import React, { useState } from "react";
import { Table } from "antd";
import "./HierarchicalTable.css"; // Optional for styling
import { rows } from "../data/rows"; // Import your data

const HierarchicalTable = () => {
  const [expandedRowKeys, setExpandedRowKeys] = useState([]); // Start collapsed

  // Toggle expand/collapse
  const handleToggle = (id) => {
    if (expandedRowKeys.includes(id)) {
      setExpandedRowKeys(expandedRowKeys.filter((key) => key !== id)); // Collapse
    } else {
      setExpandedRowKeys([...expandedRowKeys, id]); // Expand
    }
  };

  // Calculate total recursively for parent rows
  const calculateParentTotal = (row) => {
    if (row.children) {
      return row.children.reduce(
        (sum, child) => sum + calculateParentTotal(child),
        0
      );
    }
    return row.value;
  };

  // Render table rows
  const renderRows = (data) => {
    return data.map((row) => {
      const isExpanded = expandedRowKeys.includes(row.id);
      const totalValue = calculateParentTotal(row); // Calculate parent total

      return {
        key: row.id,
        label: (
          <div>
            {row.children && (
              <span
                className="expand-toggle"
                onClick={() => handleToggle(row.id)}
              >
                {isExpanded ? "−" : "+"}
              </span>
            )}
            <span className="label-text">{row.label}</span>
          </div>
        ),
        value: row.children ? <strong>{totalValue}</strong> : row.value,
        children: row.children ? renderRows(row.children) : undefined,
      };
    });
  };

  // Grand total calculation
  const calculateGrandTotal = (data) => {
    return data.reduce((sum, row) => sum + calculateParentTotal(row), 0);
  };

  const columns = [
    {
      title: "Label",
      dataIndex: "label",
      key: "label",
    },
    {
      title: "Value",
      dataIndex: "value",
      key: "value",
      render: (text) => <strong>{text}</strong>,
    },
  ];

  const tableData = renderRows(rows);
  const grandTotal = calculateGrandTotal(rows);

  // Add the Grand Total row
  tableData.push({
    key: "grand-total",
    label: <strong>Grand Total</strong>,
    value: <strong>{grandTotal}</strong>,
  });

  return (
    <div>
      <h2>Hierarchical Table</h2>
      <Table
        columns={columns}
        dataSource={tableData}
        pagination={false}
        expandable={{
          expandedRowKeys,
          onExpand: (expanded, record) =>
            handleToggle(record.key), // Sync with Antd's expand logic
        }}
      />
    </div>
  );
};

export default HierarchicalTable;
