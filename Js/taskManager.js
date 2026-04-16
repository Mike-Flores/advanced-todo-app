const STORAGE_KEY = "myTasks";

const loadFromStorage = () => {
  const data = localStorage.getItem(STORAGE_KEY);

  if (!data) return [];

  return JSON.parse(data);
};

const saveToStorage = () => {
  const data = JSON.stringify(tasks);

  localStorage.setItem(STORAGE_KEY, data);
};

const getMaxId = () => {
  if (tasks.length === 0) return 0;

  const ids = tasks.map((t) => t.id);

  return Math.max(...ids);
};

let tasks = loadFromStorage(),
  idCounter = getMaxId();

const generateId = () => ++idCounter;

// ===== HELPER FUNCTIONS =====
const validateNotEmpty = (text, fieldName) => {
  if (text.trim() === "") {
    return { success: false, error: `Task ${fieldName} cannot be empty` };
  }
  return { success: true };
};

const findTask = (id) => {
  const task = tasks.find((t) => t.id === id);
  if (!task) {
    return { success: false, error: "Task not found in database" };
  }
  return { success: true, task };
};

const checkForDuplicate = (text) => {
  if (typeof text !== "string") {
    return {
      success: false,
      error: "String was expected, got: " + typeof text,
    };
  }

  // console.log(text);

  // Normalizamos el texto que viene del usuario
  const normalizedInput = text.trim().toLowerCase();

  // Buscamos en la lista de tareas
  const foundTask = tasks.find((task) => {
    const normalizedTask = task.description.trim().toLowerCase();
    return normalizedTask === normalizedInput;
  });

  // success → indica si la función pudo validar el input o si la función pudo ejecutarse completa.
  // isDuplicate → indica si ya existe una tarea con esa descripción.
  return { success: true, isDuplicate: !!foundTask, task: foundTask || null };
};

// =========================================

const addTask = (task) => {
  const validationResult = validateNotEmpty(task, "description");
  if (!validationResult.success) return validationResult;

  const duplicatesResult = checkForDuplicate(task);

  console.log(duplicatesResult);
  if (duplicatesResult.isDuplicate)
    return { success: false, error: "This task already exists" };

  tasks.push({ id: generateId(), description: task, completed: false });

  saveToStorage();

  return { success: true, message: "Task added successfully" };
};

const getAll = () => tasks;

const markAsCompleted = (id) => {
  const result = findTask(id);
  if (!result.success) return result;

  result.task.completed = true;

  saveToStorage();

  return { success: true, message: "Task completed" };
};

const deleteTask = (id) => {
  if (!id) return { success: false, error: "Enter the task ID to delete" };

  const result = findTask(id);
  if (!result.success) return result;

  tasks = tasks.filter((x) => x.id !== result.task.id);

  saveToStorage();

  return {
    success: true,
    message: "Task deleted successfully",
  };
};

const getCompletedTasks = function () {
  // Retorna solo tasks completed
  // Usa filter
  const completed = tasks.filter((x) => x.completed === true);
  return completed;

  // Versión más corta (opcional):
  // return tasks.filter(x => x.completed);
  // (porque x.completed ya es true/false)
};

const clearCompleted = () => {
  const completed = taskManager.getCompletedTasks().length;

  if (completed === 0) {
    return { success: false, error: "Nothing to clear" };
  }

  tasks = tasks.filter((task) => !task.completed);

  // completed.forEach((el) => {
  //   taskManager.deleteTask(el.id);
  // });

  saveToStorage();

  return {
    success: true,
    message: `Successfully cleared ${completed} completed task(s)`,
  };
};

const getPending = function () {
  // Retorna solo tasks NO completed
  // Usa filter
  const pending = tasks.filter((x) => x.completed === false);
  return pending;

  // Versión corta:
  // return tasks.filter(x => !x.completed);
};

// Retorna número total de tasks
const countTotal = () => tasks.length;

// Retorna tasks cuya descripción INCLUYA el text (case-insensitive)
// Pista: usa .toLowerCase() y .includes()
// Ejemplo: search("js") → encuentra "Estudiar JS"
const search = function (text) {
  const validationResult = validateNotEmpty(text, "Search input");
  if (!validationResult.success) return validationResult;

  // Esto lo reemplacé con lo de abajo porque sólo checaba si sí se incluían esos caracteres, y por ejemplo "4ta tar" coincidía con "4ta tarea" aunque estuviera incompleta:
  // ACTUALIZACIÓN: creo que SÍ es correcto usar includes() ya que en las barras de búsqueda yo no pongo el texto completo de lo que estoy buscando; lo había reemplazado con la comparación estricta (===) porque quería usar search() para buscar duplicados, pero mejor haré una función dedicada a eso.
  const result = tasks.filter((task) =>
    task.description.toLowerCase().includes(text.toLowerCase()),
  );
  // const result = tasks.filter(
  //   (task) => task.description.toLowerCase() === text.toLowerCase()
  // );

  if (result.length === 0) return { success: false, message: "Task not found" };

  return { success: true, message: "Task found", task: result };
};

const sortById = function (ascending = true) {
  // Retorna tasks ordenadas por id
  // ascending = true → ascending order
  // ascending = false → descending order

  // El [...tasks] crea una copia nueva.
  return [...tasks].sort((a, b) => (ascending ? a.id - b.id : b.id - a.id));
};

const getStats = function () {
  let total = tasks.length,
    completed = getCompletedTasks().length;

  return {
    total,
    completed,
    pending: getPending().length,
    percentage: total > 0 ? ((completed / total) * 100).toFixed(0) + "%" : "0%",
  };
};

const updateDescription = function (id, newDescription) {
  if (!id) return { success: false, error: "Enter the task ID to edit" };

  const validationResult = validateNotEmpty(
    newDescription,
    "The new description",
  );
  if (!validationResult.success) return validationResult;

  let result = findTask(id);
  if (!result.success) return result;

  result.task.description = newDescription;

  saveToStorage();

  return { success: true, message: "Task updated successfully" };
};

const clearAll = () => {
  let previousTasks, previousId;

  try {
    previousTasks = [...tasks];
    previousId = idCounter;

    tasks = [];
    idCounter = 0;
    saveToStorage();

    return { success: true, message: "All tasks cleared" };
  } catch (error) {
    tasks = previousTasks;
    idCounter = previousId;
    return {
      success: false,
      error: "System error: <br>Failed to clear storage",
    };
  }
};

const exportData = () => {
  if (tasks.length === 0) {
    return { success: false, error: "No tasks available <br>for export" };
  }
  return {
    success: true,
    data: JSON.parse(JSON.stringify(tasks)),
    message: "Tasks exported successfully",
  };
};

// const validateTaskFormat = (importedTasks) => {
//   // Validate the structure of each task
//   const taskFormat = importedTasks.every(
//     (t) =>
//       typeof t.id === "number" &&
//       typeof t.description === "string" &&
//       t.description.trim() !== "" &&
//       typeof t.completed === "boolean"
//   );

//   if (!taskFormat) {
//     return { success: false, error: "Invalid task format" };
//   }

//   return { success: true, message: "The format is correct" };
// };

const validateTaskFormat = (importedTasks) => {
  const errors = [];
  const validTasks = [];

  importedTasks.forEach((t, index) => {
    const taskErrors = [];

    // id: debe existir y ser número
    if (!("id" in t)) {
      taskErrors.push("Missing 'id' property");
    } else if (typeof t.id !== "number") {
      taskErrors.push("'id' must be a numeric value");
    }

    // description: debe existir y ser string no vacío
    if (!("description" in t)) {
      taskErrors.push("Missing 'description' property");
    } else if (
      typeof t.description !== "string" ||
      t.description.trim() === ""
    ) {
      taskErrors.push("'description' cannot be empty");
    }

    // completed: debe existir y ser boolean
    if (!("completed" in t)) {
      taskErrors.push("Missing 'completed' property");
    } else if (typeof t.completed !== "boolean") {
      taskErrors.push("Property 'completed' must be a boolean");
    }

    if (taskErrors.length > 0) {
      errors.push({ task: t, issues: taskErrors, index });
    } else {
      validTasks.push(t);
    }
  });

  if (errors.length > 0) {
    return {
      success: false,
      validTasks,
      errors,
      error: `No tasks imported, 
        <br>${errors.length} task(s) has/have an invalid format`,
    };
  }

  return { success: true, validTasks, message: "All tasks are valid" };
};

const overwriteTasks = (importedTasks) => {
  // Validate that it's an array
  if (!Array.isArray(importedTasks)) {
    return { success: false, error: "An array was expected" };
  }

  if (importedTasks.length === 0)
    return { success: false, error: "The array is empty" };

  const formatValidation = validateTaskFormat(importedTasks);

  if (formatValidation.validTasks.length === 0) return formatValidation;

  const filteredTasks = formatValidation.validTasks;

  idCounter = 0;

  filteredTasks.forEach((item) => {
    // console.log(item);
    item.id = generateId();
  });

  tasks = filteredTasks;

  idCounter = getMaxId();

  saveToStorage();

  // Retornar un resultado claro para la UI:
  return {
    success: true,
    importedCount: filteredTasks.length,
    invalidFormat: formatValidation.errors?.length || 0,
    errors: formatValidation.errors || [],
    message: "Task(s) replaced successfully",
  };
};

const mergeTasks = (importedTasks) => {
  // Validate that it's an array
  if (!Array.isArray(importedTasks)) {
    return { success: false, error: "An array was expected" };
  }

  if (importedTasks.length === 0) {
    return { success: false, error: "The array is empty" };
  }

  const noDuplicates = [],
    existingTasks = [];

  for (const task of importedTasks) {
    // console.log(task);

    const result = checkForDuplicate(task.description);

    // if (!result.success) {
    //   return result;
    // }

    if (!result.isDuplicate) {
      noDuplicates.push(task);
    }

    if (result.isDuplicate) {
      existingTasks.push(task);
    }
  }
  // console.log("NEW: ", noDuplicates);
  // console.log("OLD; ", existingTasks);

  if (noDuplicates.length === 0) {
    return {
      success: false,
      error: "No tasks imported, <br>all of them already exist",
    };
  }

  const formatValidation = validateTaskFormat(noDuplicates);

  // Si no hay tareas válidas y si hay duplicadas
  if (formatValidation.validTasks.length === 0) {
    if (existingTasks.length > 0) {
      return {
        success: false,
        error: `${formatValidation.error}, <br>and 
          ${existingTasks.length} task(s) already existed`,
      };
    }
    return formatValidation;
  }

  // console.log("Hasta AQUÍ llega");

  const filteredTasks = formatValidation.validTasks;

  filteredTasks.forEach((item) => {
    // console.log(item);
    item.id = generateId();
    tasks.push(item);
  });

  idCounter = getMaxId();

  saveToStorage();

  // Retornar un resultado claro para la UI:
  return {
    success: true,
    importedCount: filteredTasks.length,
    duplicates: existingTasks?.length || 0,
    invalidFormat: formatValidation.errors?.length || 0,

    errors: formatValidation.errors || [],
    message: "Task(s) merged successfully",
  };

  // return filteredTasks;
};

const reorderTasks = (newIdsOrder) => {
  const newOrderArray = [];

  newIdsOrder.forEach((id) => {
    let result = findTask(Number(id));
    if (!result.success) return result;
    newOrderArray.push(result.task);
  });

  tasks = newOrderArray;

  saveToStorage();

  return { success: true, message: "Order updated" };
};

const getStorageUsage = () => {
  // Useful for debugging
  const used = JSON.stringify(tasks).length;
  const limit = 5 * 1024 * 1024; // Approximately 5MB of localStorage

  return {
    savedTasks: tasks.length,
    bytesUsed: used,
    usagePercentage: ((used / limit) * 100).toFixed(2) + "%",
  };
};
// ==========================

const toggleCompleted = (id) => {
  const result = findTask(id);
  if (!result.success) return result;

  // !result.task.completed
  //   ? (result.task.completed = true)
  //   : (result.task.completed = false);

  result.task.completed = !result.task.completed;

  saveToStorage();

  const status = result.task.completed ? "completed" : "pending";

  return {
    success: true,
    markedAs: status,
    message: `Task "${result.task.description}" updated to ${status}`,
  };
};

const completeAll = () => {
  if (!tasks.length)
    return { success: false, error: "There are zero tasks in database" };

  const pending = getPending();

  if (pending.length === 0) {
    return { success: false, error: "No pending tasks to complete" };
  }

  pending.forEach((t) => (t.completed = true));

  saveToStorage();

  return {
    success: true,
    message: "All tasks marked as completed",
  };
};

export const taskManager = {
  addTask,
  getAll,
  deleteTask,
  getCompletedTasks,
  clearCompleted,
  getPending,
  countTotal,
  getStats,
  updateDescription,
  clearAll,
  exportData,
  overwriteTasks,
  mergeTasks,
  reorderTasks,
  toggleCompleted,
  completeAll,
};

// Todas válidas y nuevas:
const testValidNew = [
  { id: 101, description: "Comprar pan", completed: false },
  { id: 102, description: "Estudiar JavaScript", completed: true },
];
