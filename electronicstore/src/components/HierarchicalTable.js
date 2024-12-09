import React, { useState } from "react";
import { Table, Input, Button } from "antd";
import { rows as initialData } from "../data/rows"; // Import your data

const HierarchicalTable = () => {
  const [expandedRowKeys, setExpandedRowKeys] = useState([]); // Track expanded rows
  const [tableData, setTableData] = useState(initialData); // State to store current table data
  const [value, setValue] = useState("");

  // Function to handle expand/collapse toggle
  const handleToggle = (id) => {
    setExpandedRowKeys(
      (prevExpandedRowKeys) =>
        prevExpandedRowKeys.includes(id)
          ? prevExpandedRowKeys.filter((key) => key !== id) // Collapse if expanded
          : [...prevExpandedRowKeys, id] // Expand if collapsed
    );
  };

  // Function to recursively calculate the total value for each parent
  const calculateParentTotal = (row) => {
    if (row.children) {
      const total = row.children.reduce(
        (sum, child) => sum + calculateParentTotal(child),
        0
      );
      row.totalValue = total;
      return total;
    }
    return row.value || 0;
  };

  // Fix: Ensure calculateVariance always returns a valid number
  const calculateVariance = (original, updated) => {
    if (original === 0 || updated === 0) return 0; // Avoid division by zero
    return ((updated - original) / original) * 100; // Return the variance as a percentage
  };

  // Update the value for a row based on allocation % or value
  const updateRowValue = (id, newValue, type) => {
    const updatedData = updateRowRecursively(tableData, id, newValue, type);
    setTableData(updatedData); // Update the table data with new values
  };

  // Recursively update row value and its children
  const updateRowRecursively = (data, id, newValue, type) => {
    return data.map((row) => {
      if (row.id === id) {
        const originalValue = row.value || 0; // Ensure originalValue is valid

        // Update value based on the allocation type
        if (type === "percent") {
          row.value = originalValue + (originalValue * newValue) / 100; // Increase by percentage
        } else if (type === "value") {
          row.value = newValue; // Set the value directly
        }

        // Calculate variance and update
        row.variance =
          calculateVariance(originalValue, row.value).toFixed(2) + "%";
      }

      if (row.children) {
        row.children = updateRowRecursively(row.children, id, newValue, type); // Recurse into children
      }

      return row;
    });
  };

  // Function to update parent value after a child value change
  const updateParentValue = (id) => {
    const updatedData = updateParentRecursively(tableData, id);
    setTableData(updatedData); // Update table with new parent data
  };

  // Recursively update parent value when a child value changes
  const updateParentRecursively = (data, id) => {
    return data.map((row) => {
      if (row.children) {
        const child = row.children.find((child) => child.id === id);
        if (child) {
          row.value = calculateParentTotal(row); // Update parent's value
        }

        row.children = updateParentRecursively(row.children, id); // Recurse into children
      }
      return row;
    });
  };

  // Handle input change for each input field
  const handleInputChange = (id, value) => {
    // const updatedData = updateRowInputValueRecursively(tableData, id, value);
    const updatedData = tableData.map((row) => {
      if (row.id === id) {
        row.inputValue = +value;
      }
      if (row.children.length > 0) {
        row.children = row.children.map((childID) => {
          if (childID.id === id) {
            childID.inputValue = +value;
          }
          return childID;
        });
      }
      return row;
    });
    setTableData(updatedData); // Update table state with new input values
  };

  // Recursively update input value for each row
  const updateRowInputValueRecursively = (data, id, value) => {
    return data.map((row) => {
      if (row.id === id) {
        row.value = +value;
      }

      if (row.children) {
        row.children = updateRowInputValueRecursively(row.children, id, value); // Recurse into children
      }

      return row;
    });
  };

  const findParent = (node, childId) => {
    if (!node.children) return null; // No children, not a parent

    for (const child of node.children) {
      if (child.id === childId) {
        return node; // Found the parent
      }
      const foundParent = findParent(child, childId); // Search deeper
      if (foundParent) {
        return foundParent;
      }
    }
    return null; // Not found in this branch
  };

  // Usage

  // Handle the "Allocate %" button click
  const handleAllocationPercentage = (id, inputValue) => {
    const updatedData = tableData.map((row) => {
      if (row.children.length > 0) {
        row.children = row.children.map((childID) => {
          if (childID.id === id) {
            // Get the original value of the row
            const originalValue = childID ? childID.value : 0;

            // Calculate the new value by applying the percentage allocation
            const newValue = originalValue * (1 + inputValue / 100);
            childID.value = Math.floor(+newValue);
            childID.variance = Math.floor((newValue / originalValue - 1) * 100);
          }
          return childID;
        });
      }
      const parent = findParent(row, id);

      if (parent && row.id === parent.id) {
        const originalValue = row.totalValue ? row.totalValue : 0;
        const t = calculateParentTotal(row);

        const newValue = t / originalValue - 1;

        /*     row.totalValue = +newValue; */
        row.variance = Math.floor(newValue * 100);
      }
      return row;
    });
    setTableData(updatedData);
  };

  // Handle the "Allocate Val" button click
  const handleAllocationValue = (id, value) => {
    const updatedData = tableData.map((row) => {
      if (row.children.length > 0) {
        row.children = row.children.map((childID) => {
          if (childID.id === id) {
            //childID.value = +value;
            const originalValue = childID ? childID.value : 0;

            // Calculate the new value by applying the percentage allocation
            const newValue = +value;
            childID.value = Math.floor(+newValue);
            childID.variance = Math.floor((newValue / originalValue - 1) * 100);
          }
          return childID;
        });
      }
      /* if (row.id === id) {
        row.value = +value;
      } */
      const parent = findParent(row, id);

      if (parent && row.id === parent.id) {
        const originalValue = row.totalValue ? row.totalValue : 0;
        const t = calculateParentTotal(row);

        const newValue = t / originalValue - 1;

        /*     row.totalValue = +newValue; */
        row.variance = Math.floor(newValue * 100);
      }
      return row;
    });
    setTableData(updatedData);
    // const row = tableData.find((row) => row.id === id);
    // const inputValue = parseFloat(row?.inputValue || 0); // Ensure it's a valid number

    // if (isNaN(inputValue)) return; // If input is invalid, do nothing

    // updateRowValue(id, inputValue, "value"); // Set the value directly

    // // Update the parent's total value
    // updateParentValue(id);
  };

  // Generate rows for table
  const renderRows = (data) => {
    return data.map((row) => {
      const totalValue = calculateParentTotal(row); // Calculate total for parent rows
      const isExpanded = expandedRowKeys.includes(row.id); // Check if row is expanded

      return {
        key: row.id,
        label: (
          <div>
            {row.children && (
              <span
                className="expand-toggle"
                onClick={() => handleToggle(row.id)} // Toggle expand/collapse
              >
                {isExpanded ? "−" : "+"}
              </span>
            )}
            <span className="label-text">{row.label}</span>
          </div>
        ),
        value: row.children ? <strong>{totalValue}</strong> : row.value,
        input: !row.children && (
          <Input
            value={row.inputValue || ""} // Ensure the input value is controlled
            onChange={(e) => handleInputChange(row.id, e.target.value)}
            style={{ width: "80px" }}
          />
        ),
        allocationPercentage: !row.children && (
          <Button
            onClick={() => handleAllocationPercentage(row.id, row.inputValue)}
          >
            Allocate %
          </Button>
        ),
        allocationValue: !row.children && (
          <Button onClick={() => handleAllocationValue(row.id, row.inputValue)}>
            Allocate Val
          </Button>
        ),
        variance: row.variance || "0%",
        children: row.children ? renderRows(row.children) : [],
      };
    });
  };

  // Grand total calculation
  const calculateGrandTotal = (data) => {
    return data.reduce((sum, row) => sum + calculateParentTotal(row), 0);
  };

  // Generate table data and grand total row
  const grandTotal = calculateGrandTotal(tableData);
  const dataWithGrandTotal = [
    ...renderRows(tableData),
    {
      key: "grand-total",
      label: <strong>Grand Total</strong>,
      value: <strong>{grandTotal}</strong>,
      children: [], // No children for the grand total row
    },
  ];

  // Columns definition for Ant Design Table
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
    {
      title: "Input",
      dataIndex: "input",
      key: "input",
    },
    {
      title: "Allocation %",
      dataIndex: "allocationPercentage",
      key: "allocationPercentage",
    },
    {
      title: "Allocation Val",
      dataIndex: "allocationValue",
      key: "allocationValue",
    },
    {
      title: "Variance %",
      dataIndex: "variance",
      key: "variance",
    },
  ];

  return (
    <div>
      <Table
        columns={columns}
        dataSource={dataWithGrandTotal}
        pagination={false}
        expandable={{
          expandedRowKeys,
          onExpand: (expanded, record) => handleToggle(record.key),
        }}
      />
    </div>
  );
};

export default HierarchicalTable;
