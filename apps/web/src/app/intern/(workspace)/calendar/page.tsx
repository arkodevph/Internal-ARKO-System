"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ArrowUpRight } from "lucide-react";
import { api } from "../../../../lib/trpc/client";
import {
  dateLabel,
  Empty,
  PageHeading,
  QueryState,
  Status,
} from "../_components/common";
import s from "../_components/intern.module.css";

export default function InternCalendar() {
  const [month, setMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const [day, setDay] = useState<number | null>(null);
  const start = useMemo(
    () => new Date(month.getFullYear(), month.getMonth(), 1),
    [month],
  );
  const end = useMemo(
    () => new Date(month.getFullYear(), month.getMonth() + 1, 1),
    [month],
  );
  const query = api.intern.calendar.useQuery({ start, end });
  const items = [
    ...(query.data?.events.map((item) => ({
      id: `event-${item.id}`,
      title: item.title,
      date: new Date(item.date),
      description: item.description,
      time: `${item.startTime} – ${item.endTime}`,
      status: null,
      taskId: null,
      endDate: item.endDate ? new Date(item.endDate) : null,
    })) || []),
    ...(query.data?.deadlines.map((item) => ({
      id: `task-${item.id}`,
      title: item.title,
      date: new Date(item.dueDate),
      description: null,
      time: "Task deadline",
      status: item.status,
      taskId: item.id,
      endDate: null,
    })) || []),
  ].sort((a, b) => a.date.getTime() - b.date.getTime());
  const matchesDay = (item: (typeof items)[number], value: number) => {
    const selected = new Date(start.getFullYear(), start.getMonth(), value);
    const itemStart = new Date(
      item.date.getFullYear(),
      item.date.getMonth(),
      item.date.getDate(),
    );
    const itemEnd = item.endDate
      ? new Date(
          item.endDate.getFullYear(),
          item.endDate.getMonth(),
          item.endDate.getDate(),
        )
      : itemStart;
    return selected >= itemStart && selected <= itemEnd;
  };
  const visible = day ? items.filter((item) => matchesDay(item, day)) : items;
  const offset = (start.getDay() + 6) % 7;
  const days = new Date(end.getFullYear(), end.getMonth(), 0).getDate();
  function shift(amount: number) {
    setMonth(new Date(month.getFullYear(), month.getMonth() + amount, 1));
    setDay(null);
  }
  return (
    <>
      <PageHeading title="Calendar">
        Shared meetings and your task deadlines, together in one calendar.
      </PageHeading>
      <div className={s.calendarLayout}>
        <section
          className={`${s.panel} ${s.monthPicker}`}
          aria-label="Choose a date"
        >
          <div className={s.monthNav}>
            <button
              type="button"
              aria-label="Previous month"
              onClick={() => shift(-1)}
            >
              <ChevronLeft size={19} />
            </button>
            <h2>
              {month.toLocaleDateString("en-PH", {
                month: "long",
                year: "numeric",
              })}
            </h2>
            <button
              type="button"
              aria-label="Next month"
              onClick={() => shift(1)}
            >
              <ChevronRight size={19} />
            </button>
          </div>
          <div className={s.monthGrid}>
            {["M", "T", "W", "T", "F", "S", "S"].map((label, i) => (
              <span aria-hidden="true" key={i}>
                {label}
              </span>
            ))}
            {Array.from({ length: offset }, (_, i) => (
              <span key={`empty-${i}`} />
            ))}
            {Array.from({ length: days }, (_, i) => i + 1).map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={day === value}
                aria-label={`${dateLabel(new Date(month.getFullYear(), month.getMonth(), value))}${items.some((item) => matchesDay(item, value)) ? ", has scheduled items" : ""}`}
                onClick={() => setDay(day === value ? null : value)}
              >
                {value}
                {items.some((item) => matchesDay(item, value)) && (
                  <span className={s.dayDot} />
                )}
              </button>
            ))}
          </div>
          <div className={s.actions}>
            <button
              type="button"
              className={s.button}
              onClick={() => setDay(null)}
            >
              Whole month
            </button>
            <button
              type="button"
              className={s.button}
              onClick={() => {
                setMonth(
                  new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                );
                setDay(new Date().getDate());
              }}
            >
              Today
            </button>
          </div>
        </section>
        <section className={s.panel}>
          <div className={s.sectionHeading}>
            <h2>
              {day
                ? dateLabel(
                    new Date(month.getFullYear(), month.getMonth(), day),
                  )
                : "This month’s schedule"}
            </h2>
          </div>
          <QueryState
            loading={query.isLoading}
            error={query.error}
            retry={query.refetch}
          />
          {query.data &&
            (visible.length ? (
              <div className={s.agenda}>
                {visible.map((item) => (
                  <article className={s.agendaItem} key={item.id}>
                    <h3>{item.title}</h3>
                    <small>
                      {dateLabel(item.date)}
                      {item.endDate && ` – ${dateLabel(item.endDate)}`} ·{" "}
                      {item.time}
                    </small>
                    {item.description && <p>{item.description}</p>}
                    {item.status && (
                      <div className={s.actions}>
                        <Status status={item.status} />
                      </div>
                    )}
                    {item.taskId && (
                      <Link href={`/intern/tasks?task=${item.taskId}`}>
                        Open task <ArrowUpRight size={16} />
                      </Link>
                    )}
                  </article>
                ))}
              </div>
            ) : (
              <Empty title="A little breathing room">
                No shared meetings or task deadlines{" "}
                {day ? "on this date" : "this month"}. Choose another date to
                look ahead.
              </Empty>
            ))}
        </section>
      </div>
    </>
  );
}
