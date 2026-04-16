# 🧪 Quality Assurance & Test Cases - To-Do App

This document outlines the testing suite performed to ensure the application's reliability, data integrity, and user experience.

---

## 1. Core CRUD Operations

| ID        | Feature  | Scenario              | Expected Result                                                                 |
| :-------- | :------- | :-------------------- | :------------------------------------------------------------------------------ |
| **TC-01** | Add Task | Empty Input           | Blocks creation; shows: _"Task description cannot be empty"_.                   |
| **TC-02** | Add Task | Duplicate Entry       | Prevents identical tasks; shows: _"This task already exists"_.                  |
| **TC-03** | Add Task | Success               | Task added to list; shows: _"Task added successfully!"_                         |
| **TC-04** | Status   | ID not found          | If ID is missing or not found, shows: _"Task not found in database."_           |
| **TC-05** | Status   | Toggle Complete       | Updates task state and shows: _"Task [Description] updated to [Status]."_       |
| **TC-06** | Edit     | No Changes            | If text is identical, the editor closes without unnecessary writes.             |
| **TC-07** | Edit     | Success               | Validates ID and non-empty string; shows: _"Task updated successfully"_.        |
| **TC-08** | Delete   | ID not found          | If ID is missing or not found, shows: _"Task not found in database."_           |
| **TC-09** | Delete   | Success (single task) | Prompts for confirmation; removes task and shows _"Task deleted successfully."_ |

## 2. Mass Actions & Logic

| ID        | Feature         | Scenario                             | Expected Result                                                                                                                           |
| :-------- | :-------------- | :----------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------- |
| **TC-10** | Complete All    | Database Empty                       | Prevents action; shows: _"There are zero tasks in database"_.                                                                             |
| **TC-11** | Complete All    | No pending tasks                     | Prevents action; shows: _"No pending tasks to complete"_.                                                                                 |
| **TC-12** | Complete All    | Success                              | Marks all tasks as completed in one batch and shows _"All tasks marked as completed"_.                                                    |
| **TC-13** | Clear All       | Database Empty                       | Prevents action; shows: _"No tasks available to clear"_.                                                                                  |
| **TC-14** | Clear All       | Persistence Failure                  | Implements **Rollback**: if it fails to clear Storage, restores memory and ID counter and shows _"System error: Failed to clear storage"_ |
| **TC-15** | Clear All       | Success                              | Clears storage and shows: _"All tasks cleared"_                                                                                           |
| **TC-16** | Clear Completed | Database empty or No completed tasks | Prevents action; shows: _"No completed tasks to clear"_                                                                                   |
| **TC-17** | Clear Completed | Success                              | Prompts for confirmation; filters and removes only completed tasks; shows: _"Successfully cleared [quantity] completed task(s)"_          |

## 3. Advanced Import/Export Engine

| ID        | Feature | Scenario                       | Expected Result                                                                                                                                                                                                       |
| :-------- | :------ | :----------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **TC-18** | Import  | Smart Flow                     | If list is empty, bypasses "Merge/Replace" modal and opens file picker.                                                                                                                                               |
| **TC-19** | Import  | Invalid File Format            | Rejects non-JSON files; shows: _"Only .json files are allowed"_.                                                                                                                                                      |
| **TC-20** | Import  | Corrupt JSON                   | `try...catch` handles parsing errors; shows: _"Invalid JSON file"_.                                                                                                                                                   |
| **TC-21** | Import  | Partial Import                 | Validates `id` (number), `description` (string), and `completed` (boolean). Imports the valid ones and registers the failed ones without stopping the process. Detailed report available via the 'More options' menu. |
| **TC-22** | Import  | Error Badge                    | Displays a button as a blinking badge with the count of failed items, next to "Import" button, to open the detailed report of errors found on invalid tasks.                                                          |
| **TC-23** | Import  | Duplicate filter               | In Merge mode, it identifies and separates existing tasks by description.                                                                                                                                             |
| **TC-24** | Import  | No new tasks                   | In Merge mode, if there are no new tasks to import, prevents action; shows: _"No tasks imported, all of them already exist"_.                                                                                         |
| **TC-25** | Import  | No valid tasks only duplicates | In Merge mode, If there are no valid tasks but there are duplicates, displays a toast notification with the count of invalid and duplicate tasks..                                                                    |
| **TC-26** | Import  | Success                        | Depending on mode (merge or replace) shows on toast how many tasks were imported, how many were duplicates and how many had an invalid format.                                                                        |
| **TC-27** | Export  | Empty List                     | Blocks export if no tasks exist; shows: _"No tasks available for export"_.                                                                                                                                            |
| **TC-28** | Export  | Success                        | Shows: _"Tasks exported successfully"_.                                                                                                                                                                               |

## 4. UX & State Integrity

| ID        | Feature       | Scenario                      | Expected Result                                                                                                                                                 |
| :-------- | :------------ | :---------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **TC-29** | Drag-and-Drop | Not on "All" filter           | Drag and drop only available on All filter, to prevent tasks from being misplaced when filters are active.                                                      |
| **TC-30** | Drag-and-Drop | Less than 2 tasks in database | Disables drag functionality.                                                                                                                                    |
| **TC-31** | Drag-and-Drop | Success                       | Shows: _"Order updated"_.                                                                                                                                       |
| **TC-32** | Undo Timer    | Task State Change             | If a task is unmarked in "Completed" filter, it stays visible for 5s before disappearing, allowing the user to undo the action before the task is filtered out. |
| **TC-33** | UI Cleanup    | Last Task Deleted             | Automatically hides the Error Badge and resets error logs if `tasks.length === 0`.                                                                              |
| **TC-34** | Theme/Filters | Persistence                   | Theme and current filter are persisted in localStorage and restored upon session reload.                                                                        |
| **TC-35** | Initial State | First-time user (No data)     | App loads with light theme on, 'All' filter by default, empty list message, and items left counter at 0.                                                        |

## 5. Accessibility (a11y) - Known Issues

- **Keyboard Navigation:** Linear navigation works with `Tab`.
- **Focus Management:** Focus returns to the top of the page when opening the Statistics modal (Improvement pending).
- **Visibility:** Visibility of Edit/Delete buttons has been optimized for mouse hover and keyboard focus on desktop.
