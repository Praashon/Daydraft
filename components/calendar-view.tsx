"use client";

import React, { useState } from "react";
import { DailyPlanItem } from "@/types";
import { Calendar, ChevronLeft, ChevronRight, Clock } from "lucide-react";

interface CalendarViewProps {
  plan: DailyPlanItem[];
  onTogglePlanItem?: (id: string) => void;
  onAddPlanItem?: (item: DailyPlanItem) => void;
}

const HOURS = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
];

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function CalendarView({
  plan,
  onTogglePlanItem,
  onAddPlanItem,
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [pickerMonth, setPickerMonth] = useState(new Date());
  const yearOptions = Array.from(
    { length: 21 },
    (_, index) => new Date().getFullYear() - 10 + index,
  );

  const formatDateKey = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

  const isSameDate = (left: Date, right: Date) =>
    formatDateKey(left) === formatDateKey(right);

  const selectDate = (date: Date) => {
    setSelectedDate(date);
    setCurrentDate(date);
    setPickerMonth(date);
    setIsDatePickerOpen(false);
  };

  const getPickerDays = () => {
    const firstDay = new Date(
      pickerMonth.getFullYear(),
      pickerMonth.getMonth(),
      1,
    );
    const startOffset = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(
      pickerMonth.getFullYear(),
      pickerMonth.getMonth() + 1,
      0,
    ).getDate();
    const days = Array.from(
      { length: startOffset + daysInMonth },
      (_, index) => {
        if (index < startOffset) return null;
        return new Date(
          pickerMonth.getFullYear(),
          pickerMonth.getMonth(),
          index - startOffset + 1,
        );
      },
    );
    return days;
  };

  const setPickerMonthPart = (month: number, year: number) => {
    setPickerMonth(new Date(year, month, 1));
  };

  const handlePrevWeek = () => {
    const prev = new Date(currentDate);
    prev.setDate(prev.getDate() - 7);
    setCurrentDate(prev);
    setSelectedDate(prev);
  };

  const handleNextWeek = () => {
    const next = new Date(currentDate);
    next.setDate(next.getDate() + 7);
    setCurrentDate(next);
    setSelectedDate(next);
  };

  const getWeekDays = (baseDate: Date) => {
    const date = new Date(baseDate);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const startOfWeek = new Date(date.setDate(diff));

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const weekDays = getWeekDays(currentDate);
  const currentMonth = MONTHS[currentDate.getMonth()];
  const currentYear = currentDate.getFullYear();
  const today = new Date();

  const handleTimeSlotClick = (hour: string) => {
    if (onAddPlanItem) {
      const taskName = window.prompt(`Enter task for ${hour}:`);
      if (taskName) {
        const formattedSelectedDate = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`;
        onAddPlanItem({
          time: hour,
          date: formattedSelectedDate,
          task: taskName,
          completed: false,
        });
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="page-heading text-zinc-900 dark:text-zinc-100">
            Calendar & Schedule
          </h2>
          <p className="body-text text-zinc-500 dark:text-zinc-400">
            Time-blocked visual schedule mapped directly from your brain dumps.
          </p>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setPickerMonth(selectedDate);
              setIsDatePickerOpen((open) => !open);
            }}
            className="flex items-center gap-2 bg-white dark:bg-zinc-950 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs hover:border-emerald-500 transition-colors"
            aria-expanded={isDatePickerOpen}
            aria-label="Choose calendar date"
          >
            <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
            <span className="label-small font-medium text-zinc-900 dark:text-zinc-100">
              {selectedDate.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
            <ChevronRight
              className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${isDatePickerOpen ? "rotate-90" : ""}`}
            />
          </button>

          {isDatePickerOpen && (
            <div className="absolute right-0 top-full z-20 mt-2 w-[280px] rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 shadow-xl">
              <div className="mb-3 flex items-center gap-2">
                <select
                  value={pickerMonth.getMonth()}
                  onChange={(event) =>
                    setPickerMonthPart(
                      Number(event.target.value),
                      pickerMonth.getFullYear(),
                    )
                  }
                  className="min-w-0 flex-1 rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-2 text-xs font-semibold text-zinc-900 outline-none focus:border-emerald-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                  aria-label="Choose month"
                >
                  {MONTHS.map((month, index) => (
                    <option key={month} value={index}>
                      {month}
                    </option>
                  ))}
                </select>
                <select
                  value={pickerMonth.getFullYear()}
                  onChange={(event) =>
                    setPickerMonthPart(
                      pickerMonth.getMonth(),
                      Number(event.target.value),
                    )
                  }
                  className="w-[82px] rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-2 text-xs font-semibold text-zinc-900 outline-none focus:border-emerald-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                  aria-label="Choose year"
                >
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() =>
                      setPickerMonth(
                        (month) =>
                          new Date(
                            month.getFullYear(),
                            month.getMonth() - 1,
                            1,
                          ),
                      )
                    }
                    className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                    aria-label="Previous month"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setPickerMonth(
                        (month) =>
                          new Date(
                            month.getFullYear(),
                            month.getMonth() + 1,
                            1,
                          ),
                      )
                    }
                    className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                    aria-label="Next month"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                Choose a day
              </div>

              <div className="grid grid-cols-7 gap-1 text-center">
                {DAYS_OF_WEEK.slice(1)
                  .concat(DAYS_OF_WEEK[0])
                  .map((day) => (
                    <span
                      key={day}
                      className="py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400"
                    >
                      {day.slice(0, 1)}
                    </span>
                  ))}
                {getPickerDays().map((date, index) => (
                  <span key={date ? formatDateKey(date) : `empty-${index}`}>
                    {date && (
                      <button
                        type="button"
                        onClick={() => selectDate(date)}
                        className={`h-8 w-full rounded-lg text-xs font-medium transition-colors ${
                          isSameDate(date, selectedDate)
                            ? "bg-emerald-600 text-white"
                            : isSameDate(date, today)
                              ? "bg-emerald-600/10 text-emerald-600 dark:text-emerald-500"
                              : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
                        }`}
                      >
                        {date.getDate()}
                      </button>
                    )}
                  </span>
                ))}
              </div>

              <button
                type="button"
                onClick={() => selectDate(new Date())}
                className="mt-3 w-full rounded-lg border border-zinc-200 dark:border-zinc-800 py-2 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
              >
                Jump to today
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 subtle-card-shadow">
        <div className="flex items-center justify-between mb-3">
          <span className="card-heading text-zinc-900 dark:text-zinc-100">
            {currentMonth} {currentYear}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrevWeek}
              className="p-1 rounded-lg hover:bg-zinc-50 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextWeek}
              className="p-1 rounded-lg hover:bg-zinc-50 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2 text-center">
          {weekDays.map((dayObj, idx) => {
            const dateNum = dayObj.getDate();
            const dayName = DAYS_OF_WEEK[dayObj.getDay()];
            const isToday =
              dayObj.getDate() === today.getDate() &&
              dayObj.getMonth() === today.getMonth() &&
              dayObj.getFullYear() === today.getFullYear();
            const isSelected =
              selectedDate.getDate() === dayObj.getDate() &&
              selectedDate.getMonth() === dayObj.getMonth() &&
              selectedDate.getFullYear() === dayObj.getFullYear();

            return (
              <button
                key={idx}
                onClick={() => selectDate(dayObj)}
                className={`py-2 px-1 rounded-xl transition-all flex flex-col items-center gap-1 ${
                  isSelected
                    ? "bg-emerald-600 text-white shadow-xs"
                    : isToday
                      ? "bg-emerald-600/10 text-emerald-600 dark:text-emerald-500 font-semibold"
                      : "hover:bg-zinc-50 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400"
                }`}
              >
                <span className="text-[11px] font-medium uppercase tracking-wider">
                  {dayName}
                </span>
                <span className="text-[15px] font-semibold">{dateNum}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 subtle-card-shadow">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-zinc-200 dark:border-zinc-800">
          <span className="card-heading text-zinc-900 dark:text-zinc-100">
            Schedule Timeline
          </span>
          <span className="label-small text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            Active time blocks
          </span>
        </div>

        <div className="space-y-4">
          {HOURS.map((hour) => {
            const formattedSelectedDate = formatDateKey(selectedDate);
            const matchingItems = plan.filter(
              (p) =>
                p.time.startsWith(hour.slice(0, 2)) &&
                p.date === formattedSelectedDate,
            );

            return (
              <div key={hour} className="flex items-start gap-4 group">
                <span className="w-14 shrink-0 font-mono text-[12px] text-zinc-500 dark:text-zinc-400 pt-2">
                  {hour}
                </span>

                <div className="flex-1 min-h-[44px] pb-3 border-b border-zinc-200 dark:border-zinc-800/60">
                  {matchingItems.length > 0 ? (
                    <div className="space-y-2">
                      {matchingItems.map((item, idx) => (
                        <div
                          key={item.id || idx}
                          onClick={() =>
                            onTogglePlanItem &&
                            item.id &&
                            onTogglePlanItem(item.id)
                          }
                          className={`p-3 rounded-xl flex items-start justify-between gap-3 cursor-pointer transition-all ${
                            item.completed
                              ? "bg-gray-100 border border-gray-200 opacity-60"
                              : "bg-emerald-600/5 border border-emerald-600 dark:border-emerald-500/20"
                          }`}
                        >
                          <div
                            className={
                              item.completed ? "line-through text-gray-500" : ""
                            }
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className={`font-mono label-small font-semibold ${item.completed ? "text-gray-500" : "text-emerald-600 dark:text-emerald-500"}`}
                              >
                                {item.time}
                              </span>
                              <span
                                className={`body-text font-medium ${item.completed ? "text-gray-500" : "text-zinc-900 dark:text-zinc-100"}`}
                              >
                                {item.task}
                              </span>
                            </div>
                            {item.description && (
                              <p
                                className={`label-small mt-0.5 ${item.completed ? "text-gray-400" : "text-zinc-500 dark:text-zinc-400"}`}
                              >
                                {item.description}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div
                      onClick={() => handleTimeSlotClick(hour)}
                      className="h-6 rounded-lg group-hover:bg-zinc-50 dark:bg-zinc-900/60 transition-colors border border-transparent cursor-pointer"
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
