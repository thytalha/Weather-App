/**
 * MosamCheck — Drag & Drop Controller
 * Manages dragging, reordering, and saving custom layout of weather metric cards.
 */

"use strict";

const METRIC_ORDER_KEY = "mosamcheck_metric_order";
let draggedMetric = null;

function initDragDrop() {
  if (!metricsGrid) return;
  const items = metricsGrid.querySelectorAll(".metric");

  items.forEach((item) => {
    item.addEventListener("dragstart", onDragStart);
    item.addEventListener("dragover", onDragOver);
    item.addEventListener("drop", onDrop);
    item.addEventListener("dragend", onDragEnd);
    item.addEventListener("dragenter", onDragEnter);
    item.addEventListener("dragleave", onDragLeave);
  });
}

function onDragStart(e) {
  draggedMetric = this;
  this.classList.add("dragging");
  e.dataTransfer.effectAllowed = "move";
  e.dataTransfer.setData("text/plain", this.dataset.metric);
}

function onDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = "move";
}

function onDragEnter() {
  if (this !== draggedMetric) this.classList.add("drag-over");
}

function onDragLeave() {
  this.classList.remove("drag-over");
}

function onDrop(e) {
  e.preventDefault();
  if (this !== draggedMetric) {
    const parent = this.parentElement;
    const fromIdx = [...parent.children].indexOf(draggedMetric);
    const toIdx = [...parent.children].indexOf(this);
    if (fromIdx < toIdx) parent.insertBefore(draggedMetric, this.nextSibling);
    else parent.insertBefore(draggedMetric, this);
    saveMetricOrder();
  }
  this.classList.remove("drag-over");
}

function onDragEnd() {
  this.classList.remove("dragging");
  document
    .querySelectorAll(".metric")
    .forEach((m) => m.classList.remove("drag-over", "dragging"));
  draggedMetric = null;
}

function saveMetricOrder() {
  if (!metricsGrid) return;
  const order = [...metricsGrid.querySelectorAll(".metric")].map(
    (m) => m.dataset.metric,
  );
  localStorage.setItem(METRIC_ORDER_KEY, JSON.stringify(order));
}

function restoreMetricOrder() {
  if (!metricsGrid) return;
  try {
    const saved = localStorage.getItem(METRIC_ORDER_KEY);
    if (!saved) {
      initDragDrop();
      return;
    }
    const order = JSON.parse(saved);
    order.forEach((id) => {
      const el = metricsGrid.querySelector(`[data-metric="${id}"]`);
      if (el) metricsGrid.appendChild(el);
    });
  } catch {
    localStorage.removeItem(METRIC_ORDER_KEY);
  }
  initDragDrop();
}
