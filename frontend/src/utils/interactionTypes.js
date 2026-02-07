// Utility functions for interaction type formatting and styling

export const formatInteractionType = (type) => {
  const typeMap = {
    purchase: "Purchase",
    interest: "Interest",
    test_drive: "Test Drive",
    general_inquiry: "General Inquiry",
  };
  return typeMap[type] || type;
};

export const getInteractionTypeColor = (type) => {
  const colorMap = {
    purchase: "success",
    interest: "info",
    test_drive: "warning",
    general_inquiry: "error",
  };
  return colorMap[type] || "default";
};
