import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography, IconButton, Badge, Paper } from "@mui/material";
import { ChevronLeft, ChevronRight } from "@mui/icons-material";

const FollowUpCalendar = ({ followups }) => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());

  const getFollowupCountForDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const dateStr = `${year}-${month}-${day}`;

    const count = followups.filter((f) => {
      // Extract just the date portion from the ISO timestamp
      const followupDate = f.scheduledDate.split("T")[0];
      return followupDate === dateStr;
    }).length;

    return count;
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const handlePrevMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1),
    );
  };

  const handleNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1),
    );
  };

  const handleDateClick = (day) => {
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, "0");
    const dayStr = String(day).padStart(2, "0");
    const dateStr = `${year}-${month}-${dayStr}`;
    navigate(`/followups?date=${dateStr}`);
  };

  const { daysInMonth, startingDayOfWeek, year, month } =
    getDaysInMonth(currentDate);
  const monthName = currentDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
  const today = new Date();
  const todayDate = today.getDate();
  const todayMonth = today.getMonth();
  const todayYear = today.getFullYear();

  const days = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day);
  }

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <Box>
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        mb={2}
      >
        <IconButton onClick={handlePrevMonth} size="small">
          <ChevronLeft />
        </IconButton>
        <Typography variant="h6">{monthName}</Typography>
        <IconButton onClick={handleNextMonth} size="small">
          <ChevronRight />
        </IconButton>
      </Box>

      <Box display="grid" gridTemplateColumns="repeat(7, 1fr)" gap={1}>
        {weekDays.map((day) => (
          <Box
            key={day}
            textAlign="center"
            py={1}
            fontWeight="bold"
            fontSize="0.875rem"
            color="text.secondary"
          >
            {day}
          </Box>
        ))}

        {days.map((day, index) => {
          if (!day) {
            return <Box key={`empty-${index}`} />;
          }

          const date = new Date(year, month, day);
          const count = getFollowupCountForDate(date);
          const isToday =
            day === todayDate && month === todayMonth && year === todayYear;

          return (
            <Paper
              key={day}
              elevation={isToday ? 3 : 1}
              sx={{
                p: 1.5,
                cursor: "pointer",
                minHeight: 100,
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                justifyContent: "space-between",
                backgroundColor: isToday ? "primary.light" : "background.paper",
                "&:hover": {
                  backgroundColor: "action.hover",
                  transform: "scale(1.05)",
                  transition: "all 0.2s",
                },
              }}
              onClick={() => handleDateClick(day)}
            >
              <Typography
                variant="body1"
                fontWeight={isToday ? "bold" : "normal"}
                color={isToday ? "primary.contrastText" : "inherit"}
              >
                {day}
              </Typography>
              {count > 0 ? (
                <Typography
                  variant="caption"
                  sx={{
                    alignSelf: "center",
                    color: isToday ? "white" : "primary.light",
                    fontWeight: "bold",
                    backgroundColor: "error.lighter",
                    px: 1,
                    py: 0.5,
                    borderRadius: 1,
                  }}
                >
                  {count} {count === 1 ? "follow-up" : "follow-ups"}
                </Typography>
              ) : (
                <Box /> /* Spacer for alignment */
              )}
            </Paper>
          );
        })}
      </Box>
    </Box>
  );
};

export default FollowUpCalendar;
