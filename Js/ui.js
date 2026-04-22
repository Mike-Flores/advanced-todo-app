// === Imports ===
import { taskManager } from "./taskManager.js";

// === DOM references ===

// Document shorthand
const d = document;

// Theme
const $themeBtn = d.getElementById("theme-toggle");

// Task list
const $taskList = d.getElementById("task-list");
const $taskTemplate = document.getElementById("task-template");
const $newTaskInput = d.getElementById("new-task-input");
const $form = d.getElementById("task-form");
const $main = d.getElementById("task-list-section");
const $itemsLeft = d.getElementById("items-left");

// Filters
const $filters = d.getElementById("filters");
const $allFilterBtn = d.getElementById("all-filter");
const $activeFilterBtn = d.getElementById("active-filter");
const $completedFilterBtn = d.getElementById("completed-filter");

// State variables
let $draggingItem = null;
let currentFilter = null;

// Modals...
const $confirmModal = document.getElementById("confirm-modal");
const $confirmForm = d.getElementById("confirm-form");
const $modalText = document.getElementById("modal-text");

// Toast
const $toastContainer = d.getElementById("toast-container");

// Import/Export
const $fileInput = document.getElementById("file-input");
const $errorToggle = d.getElementById("error-toggle");
const $errorCount = d.getElementById("error-count");
const $errorOverlay = d.getElementById("error-overlay");
const $errorContainer = document.getElementById("error-container");
const $errorList = document.getElementById("errors-list");

// Footer
const $footer = d.getElementById("footer");

// More options Menu
const $moreOptionsBtn = d.getElementById("more-options-btn");
const $menuOfOptions = d.getElementById("menu-of-options");

// Stats:
const $statsDiv = d.getElementById("stats");
const $statsTemplate = d.getElementById("stats-template");

// === Functions ===
const renderTasks = (tasksToRender = null, drag = false) => {
  const tasks = tasksToRender || taskManager.getAll();

  $taskList.innerHTML = "";

  if (tasks.length === 0) {
    handleZeroTasks();
    updatePendingCounter();
    return;
  }

  const fragment = d.createDocumentFragment();

  tasks.forEach((task) => {
    const $clone = $taskTemplate.content.cloneNode(true);

    const $li = $clone.querySelector(".task-item");
    const $input = $clone.querySelector(".task-checkbox");
    const $label = $clone.querySelector(".label");
    const $editBtn = $clone.querySelector(".edit-btn");
    const $deleteBtn = $clone.querySelector(".delete-btn");

    $li.dataset.id = task.id;

    if (drag) {
      $li.draggable = true;
    }

    $input.id = task.id;
    $input.dataset.id = task.id;
    $input.checked = task.completed;
    if ($input.checked) $li.dataset.status = "completed";

    $label.htmlFor = task.id;
    $label.textContent = task.description;

    $editBtn.setAttribute("title", "Edit task");
    $editBtn.dataset.id = task.id;

    $deleteBtn.dataset.id = task.id;

    fragment.appendChild($clone);
  });

  $taskList.appendChild(fragment);

  updatePendingCounter();
};

const handleDragOver = (e) => {
  e.preventDefault();
  const $overItem = e.target.closest(".task-item");

  if ($overItem && $overItem !== $draggingItem) {
    const bounding = $overItem.getBoundingClientRect();
    const offset = e.clientY - bounding.top - bounding.height / 2;

    if (offset > 0) {
      $overItem.after($draggingItem);
    } else {
      $overItem.before($draggingItem);
    }
  }
};

const handleNewOrder = () => {
  $draggingItem.classList.remove("dragging");

  if (currentFilter !== "all") return;

  const $items = [...document.querySelectorAll(".task-item")];

  if ($items.length < 2) return;

  const newIdsOrder = $items.map((el) => el.dataset.id);

  const result = taskManager.reorderTasks(newIdsOrder);

  if (!result.success) {
    return showToast(result.error, "error");
  }

  showToast(result.message, "success");
};

const handleZeroTasks = () => {
  const p = d.createElement("p");

  p.className = "no-tasks";

  p.textContent = "No tasks to show";

  $taskList.appendChild(p);
};

const renderStats = () => {
  $statsDiv.innerHTML = "";

  const fragment = d.createDocumentFragment();
  const stats = taskManager.getStats();

  const clone = $statsTemplate.content.cloneNode(true);

  const $stats = {
    total: clone.querySelector(".stat-total"),
    completed: clone.querySelector(".stat-completed"),
    pending: clone.querySelector(".stat-pending"),
    percentage: clone.querySelector(".stat-percentage"),
  };

  $stats.total.textContent = `Total tasks: ${stats.total}`;
  $stats.completed.textContent = `Completed tasks: ${stats.completed}`;
  $stats.pending.textContent = `Pending tasks: ${stats.pending}`;
  $stats.percentage.textContent = `${stats.percentage} completed`;
  fragment.appendChild(clone);
  $statsDiv.appendChild(fragment);

  $statsDiv.classList.toggle("hidden");
};

const addTask = () => {
  const result = taskManager.addTask($newTaskInput.value);

  $newTaskInput.value = "";

  if (!result.success) {
    showToast(result.error, "error");
    return;
  }

  loadCurrentFilterTasks();
  showToast(result.message, "success");
};

const editTask = ($label, id) => {
  const originalText = $label.textContent;

  const $input = document.createElement("input");
  $input.type = "text";
  $input.value = originalText;
  $input.className = "edit-input";
  $label.classList.add("hidden");
  $label.after($input);

  $input.focus();
  $input.select();

  const removeInput = () => {
    $input.remove();
    $label.classList.remove("hidden");
  };

  $input.onkeydown = (e) => {
    if (e.key === "Enter") {
      if ($input.value === originalText) {
        removeInput();
        return;
      }

      const result = taskManager.updateDescription(id, $input.value);

      removeInput();

      if (!result.success) {
        showToast(result.error, "error");
        return;
      }

      $label.textContent = $input.value;
      showToast(result.message, "success");
    }

    if (e.key === "Escape") removeInput();
  };

  $input.onblur = () => removeInput();
};

const deleteTask = (id) => {
  const result = taskManager.deleteTask(id);

  if (!result.success) {
    showToast(result.error, "error");
    return;
  }

  loadCurrentFilterTasks();

  return showToast(result.message, "success");
};

const completeTask = (id) => {
  const result = taskManager.toggleCompleted(id);

  if (!result.success) {
    showToast(result.error, "error");
    return;
  }

  updatePendingCounter();

  if (currentFilter === "completed" && result.markedAs === "pending") {
    showToast(`${result.message}. It will disappear in 5 seconds`, "success");
    setTimeout(loadCurrentFilterTasks, 5000);
    return;
  }

  loadCurrentFilterTasks();
  showToast(result.message, "success");
};

const handleCompleteAll = () => {
  const result = taskManager.completeAll();

  if (!result.success) {
    showToast(result.error, "error");
    return;
  }

  updatePendingCounter();
  loadCurrentFilterTasks();

  showToast(result.message, "success");
};

const showToast = (text, type) => {
  if ($toastContainer.children.length >= 5) {
    $toastContainer.children[0].remove();
  }

  const toast = d.createElement("div");
  toast.className = `toast toast-${type} animate-in`;

  const icons = {
    success: "✓",
    error: "✗",
    info: "!",
  };
  const icon = d.createElement("span");
  icon.className = "toast-icon";
  icon.textContent = icons[type];

  const textEl = d.createElement("p");
  textEl.innerHTML = text;

  toast.appendChild(icon);
  toast.appendChild(textEl);

  $toastContainer.appendChild(toast);

  const timer = type === "success" ? 6000 : 6000;

  setTimeout(() => {
    toast.classList.add("animate-out");
    toast.addEventListener("animationend", () => toast.remove());
  }, timer);
};

const updatePendingCounter = () => {
  const pending = taskManager.getPending();

  $itemsLeft.textContent = `${pending.length} items left`;
};

const handleClearCompletedRequest = () => {
  const totalCompleted = taskManager.getCompletedTasks().length;

  if (totalCompleted === 0) {
    return showToast("No completed tasks to clear", "error");
  }

  showConfirmModal(
    "clearCompleted",
    `Are you sure you want to clear ${totalCompleted} completed task(s)?`,
  );
};

const clearCompleted = () => {
  const result = taskManager.clearCompleted();

  if (!result.success) {
    return showToast(result.error, "error");
  }

  loadCurrentFilterTasks();
  showToast(result.message, "success");
};

const handleClearAllRequest = () => {
  const hasTasks = taskManager.countTotal() > 0;
  if (!hasTasks) {
    showToast("No tasks available to clear", "error");
    return;
  }

  showConfirmModal("clearAll", "Are you sure you want to clear all tasks?");
};

const clearAll = () => {
  const result = taskManager.clearAll();

  if (!result.success) {
    return showToast(result.error, "error");
  }

  renderTasks();
  showToast(result.message, "success");
};

const showConfirmModal = (context, message, id = null) => {
  $confirmModal.context = context;
  $confirmModal.taskId = id;

  $modalText.textContent = message;

  $confirmModal
    .querySelectorAll("button")
    .forEach((btn) => btn.classList.add("hidden"));

  const buttonsToShow = {
    delete: ["confirm-btn", "cancel-btn"],
    import: ["fusion-btn", "replace-btn", "cancel-btn"],
    export: ["json-btn", "csv-btn", "txt-btn", "cancel-btn"],
  };

  //Maps contexts to the button groups
  let group = "delete"; // by default for 'clear' and 'delete1'
  if (context === "import") group = "import";
  if (context === "export") group = "export";

  buttonsToShow[group].forEach((id) =>
    document.getElementById(id).classList.remove("hidden"),
  );

  $confirmModal.showModal();
};

const handleImportClick = () => {
  const hasTasks = taskManager.countTotal() > 0;
  if (!hasTasks) {
    openFilePicker("overwrite");
    return;
  }

  showConfirmModal(
    "import",
    "You already have tasks. Do you want to Merge or Replace them?",
  );
};

const handleExport = () => {
  const result = taskManager.exportData();

  if (!result.success) {
    showToast(result.error, "error");
    return;
  }

  const jsonString = JSON.stringify(result.data, null, 2);

  const blob = new Blob([jsonString], { type: "application/json" });

  const url = URL.createObjectURL(blob);
  const link = d.createElement("a");
  link.href = url;
  link.download = `tasks-backup-${Date.now()}.json`;

  link.click();

  setTimeout(() => URL.revokeObjectURL(url), 500);

  showToast(result.message, "success");
};

const openFilePicker = (mode) => {
  $fileInput.dataset.action = mode;
  $fileInput.click();
};

const showErrorsIcon = (arr) => {
  $errorToggle.errors = arr;

  $errorToggle.classList.remove("hidden");
  $errorToggle.classList.add("is-blinking");
  $errorCount.textContent = `⚠️${arr.length}`;
};

const hideErrorsIcon = () => {
  $errorToggle.classList.add("hidden");
  $errorCount.textContent = `⚠️0`;
  $errorList.innerHTML = "";
};

const handleFileSelect = (e) => {
  const file = e.target.files[0];

  if (!file) return;

  if (!file.name.endsWith(".json")) {
    showToast("Only .json files are allowed", "error");
    return;
  }

  hideErrorsIcon();

  const action = e.target.dataset.action;

  const reader = new FileReader();

  reader.onload = (event) => {
    try {
      const data = JSON.parse(event.target.result);

      let result;

      if (action === "merge") {
        result = taskManager.mergeTasks(data);
      } else if (action === "overwrite") {
        result = taskManager.overwriteTasks(data);
      }

      const hasErrors = (result.errors?.length || 0) > 0;

      if (hasErrors) {
        showErrorsIcon(result.errors);

        setTimeout(() => {
          showToast(
            "Open the menu with <br>︽ / ︾ and click the <br>pulsing badge for the error log.",
            "info",
          );
        }, 3000);
      }

      if (result.success) {
        loadCurrentFilterTasks();
        if (action === "merge") {
          showToast(
            `Merge complete:
            <br>${result.importedCount} new task(s),

            <br><br>${result.duplicates} skipped (already exist),
            
            <br><br>${result.invalidFormat} invalid format.`,
            "success",
          );
        }
        if (action === "overwrite") {
          showToast(
            `${result.importedCount} Task(s) imported successfully
            <br><br>${result.invalidFormat} Task(s) had an invalid format`,
            "success",
          );
        }
      } else {
        showToast(result.error, "error");
      }
    } catch (error) {
      if (error instanceof SyntaxError) {
        showToast("Invalid JSON file format", "error");
      } else {
        console.error("Developer Error:", error);
        showToast("An unexpected error occurred during import", "error");
      }
    }
  };

  reader.readAsText(file);
};

const showErrorsList = (errors) => {
  $errorList.innerHTML = "";

  $errorOverlay.classList.add("visible");

  const fragment = d.createDocumentFragment();

  errors.forEach((el) => {
    const dt = document.createElement("dt");
    dt.className = "error-title";
    dt.textContent = `Error(s) on task #${el.index + 1}:`;

    fragment.appendChild(dt);

    el.issues.forEach((issue) => {
      const dd = document.createElement("dd");
      dd.className = "error-details";
      dd.textContent = issue;
      fragment.appendChild(dd);
    });
  });

  $errorList.appendChild(fragment);
};

const hideErrors = () => {
  const totalTasks = taskManager.countTotal();

  if (totalTasks === 0) hideErrorsIcon();
};

const getCurrentFilter = () => {
  const filter = localStorage.getItem("Current-filter");

  if (!filter) return null;

  return filter;
};

const saveCurrentFilter = (filter) => {
  localStorage.setItem("Current-filter", filter);
};

const loadCurrentFilterTasks = () => {
  currentFilter = getCurrentFilter();

  if (currentFilter === "active") {
    renderTasks(taskManager.getPending());
    highlightFilter($activeFilterBtn);
    return;
  }

  if (currentFilter === "completed") {
    renderTasks(taskManager.getCompletedTasks());
    highlightFilter($completedFilterBtn);
    return;
  }

  renderTasks(taskManager.getAll(), true);
  highlightFilter($allFilterBtn);
};

const highlightFilter = (filter) => {
  $filters
    .querySelectorAll("button")
    .forEach((btn) => btn.classList.remove("highlight"));

  filter.classList.add("highlight");
};

const hideMenu = () => {
  $moreOptionsBtn.classList.toggle("rotate");
  $menuOfOptions.classList.toggle("hidden");
};

// === Listeners ===
const initialize = () => {
  // ***** Event delegation is used per section for easier maintenance and scalability
  // Theme management:
  $themeBtn.addEventListener("click", () => {
    const isDark = d.documentElement.getAttribute("data-theme") === "dark";
    const newTheme = isDark ? "light" : "dark";

    d.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
  });

  // Listener to submit a new task
  $form.addEventListener("submit", (e) => {
    e.preventDefault();
    addTask();

    $newTaskInput.value = "";
  });

  $statsDiv.addEventListener("click", (e) => {
    if (e.target.matches("#close-stats")) {
      $statsDiv.classList.toggle("hidden");
    }
  });

  // Listener for task list section
  $main.addEventListener("click", (e) => {
    const id = Number(e.target.getAttribute("data-id"));

    // Edit
    if (e.target.matches(".edit-btn")) {
      const $taskItem = e.target.closest(".task-item");

      const $label = $taskItem.querySelector(".label");

      editTask($label, id);
    }

    // Delete
    if (e.target.matches(".delete-btn")) {
      showConfirmModal(
        "delete1Task",
        "Are you sure you want to delete this task?",
        id,
      );
    }

    // Complete
    if (e.target.matches(".task-checkbox")) {
      completeTask(id);
    }
  });

  $taskList.addEventListener("dragstart", (e) => {
    $draggingItem = e.target.closest(".task-item");
    $draggingItem.classList.add("dragging");
  });

  $taskList.addEventListener("dragover", (e) => {
    handleDragOver(e);
  });

  $taskList.addEventListener("dragend", handleNewOrder);

  // Listener for confirmation message modal
  $confirmModal.addEventListener("click", (e) => {
    if (
      $confirmModal.context === "delete1Task" &&
      e.target.matches(".confirm-btn")
    ) {
      deleteTask($confirmModal.taskId);
      hideErrors();
    }

    if (
      $confirmModal.context === "clearCompleted" &&
      e.target.matches(".confirm-btn")
    ) {
      clearCompleted();
      hideErrors();
    }

    if (
      $confirmModal.context === "clearAll" &&
      e.target.matches(".confirm-btn")
    ) {
      clearAll();
      hideErrorsIcon();
    }

    if (e.target.matches(".fusion-btn")) {
      openFilePicker("merge");
    }

    if (e.target.matches(".replace-btn")) {
      openFilePicker("overwrite");
    }

    if (!$confirmForm.contains(e.target)) {
      $confirmModal.close();
    }
  });

  // Listener to upload file when importing
  $fileInput.addEventListener("change", handleFileSelect);

  // Listener to display errors when importing
  $errorOverlay.addEventListener("click", (e) => {
    if (
      e.target.matches("#close-errors") ||
      !$errorContainer.contains(e.target)
    ) {
      $errorOverlay.classList.remove("visible");
    }
  });

  // Listener for footer section
  $footer.addEventListener("click", (e) => {
    // Clear Completed button
    if (e.target.matches("#clear-completed")) {
      handleClearCompletedRequest();
    }

    if (e.target.matches("#all-filter")) {
      saveCurrentFilter("all");
      loadCurrentFilterTasks();
    }

    if (e.target.matches("#active-filter")) {
      saveCurrentFilter("active");
      loadCurrentFilterTasks();
    }

    if (e.target.matches("#completed-filter")) {
      saveCurrentFilter("completed");
      loadCurrentFilterTasks();
    }

    if (e.target.matches(".more-options-btn")) {
      hideMenu();
    }

    // Export button
    if (e.target.matches("#export-btn")) {
      hideMenu();
      handleExport();
    }

    if (e.target.matches("#import-btn")) {
      hideMenu();
      handleImportClick();
    }

    if (e.target.matches("#error-toggle")) {
      hideMenu();
      $errorToggle.classList.remove("is-blinking");
      showErrorsList(e.target.errors);
    }

    if (e.target.matches("#complete-all-btn")) {
      hideMenu();
      handleCompleteAll();
    }

    if (e.target.matches("#clear-all-btn")) {
      hideMenu();
      handleClearAllRequest();
    }

    // Listeners for statistics section
    if (e.target.matches("#stats-btn")) {
      hideMenu();
      renderStats();
    }
  });

  loadCurrentFilterTasks();
  updatePendingCounter();
};

d.addEventListener("DOMContentLoaded", initialize);
