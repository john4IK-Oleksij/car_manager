// Той самий origin, коли фронт віддає FastAPI (Render або :8000); інакше локальний бекенд
const API_URL =
  ["127.0.0.1", "localhost"].includes(location.hostname) &&
  location.port !== "8000"
    ? "http://127.0.0.1:8000"
    : "";
// Має збігатися з медіа-запитами сітки в style.css
function cardsPerPage() {
  if (window.innerWidth >= 1000) return 3;
  if (window.innerWidth >= 640) return 2;
  return 1;
}

let PAGE_LIMIT = cardsPerPage();

const statusEl = document.getElementById("status");
const tableEl = document.getElementById("cars-table");
const bodyEl = document.getElementById("cars-body");

const brandInput = document.getElementById("filter-brand");
const fuelTypeSelect = document.getElementById("filter-fuel-type");
const minReleaseYearInput = document.getElementById("filter-min-release-year");
const applyBtn = document.getElementById("filter-apply");

const prevBtn = document.getElementById("page-prev");
const nextBtn = document.getElementById("page-next");

const errorBannerEl = document.getElementById("error-banner");
const paginationEl = document.getElementById("pagination");
const pageNumberEl = document.getElementById("page-number");
const successBannerEl = document.getElementById("success-banner");
const clearBtn = document.getElementById("filter-clear");
const yearErrorEl = document.getElementById("filter-year-error");

let hasSearched = false;
let successTimer = null;

function showSuccess(message) {
  successBannerEl.textContent = message;
  successBannerEl.hidden = false;
  clearTimeout(successTimer);
  successTimer = setTimeout(() => {
    successBannerEl.hidden = true;
  }, 3000);
}

const ERROR_MESSAGES = {
  409: "Автомобіль з таким VIN вже існує",
  404: "Автомобіль не знайдено",
  422: "Перевірте правильність заповнення форми",
  network: "Не вдалося з'єднатися з сервером. Перевірте, чи запущений бекенд",
};

function showError(message) {
  errorBannerEl.textContent = message;
  errorBannerEl.hidden = false;
}

function hideError() {
  errorBannerEl.hidden = true;
  errorBannerEl.textContent = "";
}

function showHttpError(status) {
  showError(ERROR_MESSAGES[status] ?? `Помилка сервера (HTTP ${status})`);
}

let appliedFilters = {
  brand: "",
  fuelType: "",
  minReleaseYear: "",
};

let currentOffset = 0;

function renderCars(cars) {
  bodyEl.innerHTML = "";

  if (cars.length === 0) {
    tableEl.hidden = true;
    statusEl.textContent = "Автомобілів не знайдено";
    statusEl.hidden = false;
    return;
  }

  for (const car of cars) {
    const row = document.createElement("tr");

    const values = [
      car.brand_model,
      car.manufacturer,
      car.vin,
      car.body_type,
      car.fuel_type,
      car.engine_volume != null ? `${car.engine_volume} л` : "—",
      car.price,
      car.rating ?? "—",
      car.release_year,
      car.is_available ? "Так" : "Ні",
      Array.isArray(car.options) ? car.options.join(", ") : "",
      new Date(car.created_at).toLocaleDateString("uk-UA"),
    ];

    for (const value of values) {
      const cell = document.createElement("td");
      cell.textContent = value;
      row.appendChild(cell);
    }

    row.addEventListener("click", () => viewCar(car.id));

    const actionsCell = document.createElement("td");
    actionsCell.className = "row-actions";

    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.textContent = "Редагувати";
    editBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      openModal(car, "edit");
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "danger";
    deleteBtn.textContent = "Видалити";
    deleteBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      deleteCar(car);
    });

    actionsCell.appendChild(editBtn);
    actionsCell.appendChild(deleteBtn);

    row.appendChild(actionsCell);
    bodyEl.appendChild(row);
  }

  statusEl.hidden = true;
  tableEl.hidden = false;
}

function buildQuery() {
  const params = new URLSearchParams();

  if (appliedFilters.brand) {
    params.set("brand", appliedFilters.brand);
  }

  if (appliedFilters.fuelType) {
    params.set("fuel_type", appliedFilters.fuelType);
  }

  if (appliedFilters.minReleaseYear) {
    params.set("min_release_year", appliedFilters.minReleaseYear);
  }

  params.set("limit", PAGE_LIMIT);
  params.set("offset", currentOffset);

  return params.toString();
}

async function loadCars() {
  hasSearched = true;
  paginationEl.hidden = false;
  statusEl.textContent = "Завантаження...";
  statusEl.hidden = false;
  tableEl.hidden = true;

  try {
    const response = await fetch(`${API_URL}/cars/?${buildQuery()}`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const cars = await response.json();
    renderCars(cars);
    updatePagination(cars.length);
    hideError();
  } catch (error) {
    console.error("Не вдалося завантажити автомобілі:", error);

    statusEl.hidden = true;

    if (error instanceof TypeError) {
      showError(ERROR_MESSAGES.network);
    } else {
      showHttpError(Number(error.message.replace("HTTP ", "")));
    }
  }
}

function updatePagination(count) {
  pageNumberEl.textContent = `Сторінка ${currentOffset / PAGE_LIMIT + 1}`;
  prevBtn.disabled = currentOffset === 0;
  nextBtn.disabled = count < PAGE_LIMIT;
}

applyBtn.addEventListener("click", () => {
  const year = minReleaseYearInput.value;
  const maxYear = new Date().getFullYear() + 1;

  if (
    year !== "" &&
    (!/^\d{4}$/.test(year) || Number(year) < 1900 || Number(year) > maxYear)
  ) {
    yearErrorEl.textContent = `Рік від 1900 до ${maxYear}`;
    return;
  }

  yearErrorEl.textContent = "";

  appliedFilters = {
    brand: brandInput.value.trim(),
    fuelType: fuelTypeSelect.value,
    minReleaseYear: minReleaseYearInput.value,
  };

  currentOffset = 0;
  loadCars();
});

clearBtn.addEventListener("click", () => {
  brandInput.value = "";
  fuelTypeSelect.value = "";
  minReleaseYearInput.value = "";
  yearErrorEl.textContent = "";
  appliedFilters = { brand: "", fuelType: "", minReleaseYear: "" };
  currentOffset = 0;
  hasSearched = false;
  tableEl.hidden = true;
  statusEl.hidden = true;
  paginationEl.hidden = true;
  hideError();
});

for (const input of [brandInput, fuelTypeSelect, minReleaseYearInput]) {
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      applyBtn.click();
    }
  });
}

prevBtn.addEventListener("click", () => {
  currentOffset = Math.max(0, currentOffset - PAGE_LIMIT);
  loadCars();
});

nextBtn.addEventListener("click", () => {
  currentOffset += PAGE_LIMIT;
  loadCars();
});

window.addEventListener("resize", () => {
  const limit = cardsPerPage();

  if (limit === PAGE_LIMIT) {
    return;
  }

  PAGE_LIMIT = limit;
  currentOffset = Math.floor(currentOffset / limit) * limit;

  if (hasSearched) {
    loadCars();
  }
});

const modalEl = document.getElementById("car-modal");
const formEl = document.getElementById("car-form");
const addCarBtn = document.getElementById("add-car-btn");
const cancelCarBtn = document.getElementById("cancel-car-btn");
const modalTitleEl = document.getElementById("car-modal-title");
const availabilityFieldEl = document.getElementById("availability-field");
const switchEditBtn = document.getElementById("switch-edit-btn");
const saveCarBtn = document.getElementById("save-car-btn");

let editingCarId = null;

function setFormMode(mode) {
  const readOnly = mode === "view";

  for (const el of formEl.elements) {
    if (el.matches("input, select, textarea")) {
      el.disabled = readOnly;
    }
  }

  saveCarBtn.hidden = readOnly;
  switchEditBtn.hidden = !readOnly;
  modalTitleEl.textContent = {
    create: "Додати автомобіль",
    edit: "Редагувати автомобіль",
    view: "Перегляд автомобіля",
  }[mode];
}

async function viewCar(carId) {
  try {
    const response = await fetch(`${API_URL}/cars/${carId}`);

    if (!response.ok) {
      showHttpError(response.status);
      return;
    }

    hideError();
    openModal(await response.json(), "view");
  } catch (error) {
    console.error("Не вдалося завантажити автомобіль:", error);
    showError(ERROR_MESSAGES.network);
  }
}

function clearFormErrors() {
  formEl.querySelectorAll(".field-error").forEach((el) => {
    el.textContent = "";
  });
}

function showFormErrors(errors) {
  for (const [field, message] of Object.entries(errors)) {
    const el = formEl.querySelector(`[data-error-for="${field}"]`);

    if (el) {
      el.textContent = message;
    }
  }
}

function openModal(car = null, mode = car ? "edit" : "create") {
  formEl.reset();
  clearFormErrors();

  editingCarId = car ? car.id : null;

  availabilityFieldEl.hidden = !car;

  if (car) {
    const set = (name, value) => {
      formEl.elements[name].value = value ?? "";
    };

    set("brand_model", car.brand_model);
    set("manufacturer", car.manufacturer);
    set("vin", car.vin);
    set("body_type", car.body_type);
    set("fuel_type", car.fuel_type);
    set("engine_volume", car.engine_volume);
    set("price", car.price);
    set("rating", car.rating);
    set("release_year", car.release_year);
    set("description", car.description);

    set("options", Array.isArray(car.options) ? car.options.join(", ") : "");

    set("is_available", String(car.is_available));
  }

  setFormMode(mode);

  if (mode === "view") {
    modalTitleEl.textContent = `Авто ${car.brand_model}`;
  }

  modalEl.hidden = false;
}

function closeModal() {
  modalEl.hidden = true;
  editingCarId = null;
}

function readFormData() {
  const raw = (name) => formEl.elements[name].value.trim();

  const requiredNumber = (name) => (raw(name) === "" ? NaN : Number(raw(name)));

  return {
    brand_model: raw("brand_model"),
    manufacturer: raw("manufacturer"),
    vin: raw("vin"),
    body_type: raw("body_type"),
    fuel_type: raw("fuel_type"),
    engine_volume:
      raw("engine_volume") === "" ? null : Number(raw("engine_volume")),
    price: requiredNumber("price"),
    rating: raw("rating") === "" ? null : Number(raw("rating")),
    release_year: requiredNumber("release_year"),
    description: raw("description"),
    options: raw("options")
      .split(",")
      .map((option) => option.trim())
      .filter((option) => option !== ""),
  };
}

function validateCar(data) {
  const errors = {};

  if (!data.brand_model) {
    errors.brand_model = "Марка і модель обов'язкові";
  } else if (data.brand_model.length > 150) {
    errors.brand_model = "Не більше 150 символів";
  }

  if (!data.manufacturer) {
    errors.manufacturer = "Виробник обов'язковий";
  }

  if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(data.vin)) {
    errors.vin = "VIN має містити 17 символів";
  }

  if (!["sedan", "crossover", "hatchback"].includes(data.body_type)) {
    errors.body_type = "Оберіть тип кузова";
  }

  if (!["petrol", "diesel", "electric", "hybrid"].includes(data.fuel_type)) {
    errors.fuel_type = "Оберіть тип пального";
  }

  if (
    data.engine_volume !== null &&
    (Number.isNaN(data.engine_volume) || data.engine_volume <= 0)
  ) {
    errors.engine_volume = "Об'єм має бути більше 0";
  }

  if (Number.isNaN(data.price) || data.price < 0) {
    errors.price = "Число, не менше 0";
  }

  if (
    data.rating !== null &&
    (Number.isNaN(data.rating) || data.rating < 0 || data.rating > 5)
  ) {
    errors.rating = "Число від 0 до 5";
  }

  if (
    Number.isNaN(data.release_year) ||
    data.release_year < 1900 ||
    data.release_year > new Date().getFullYear() + 1
  ) {
    errors.release_year = "Вкажіть коректний рік";
  }

  if (data.description.length > 1000) {
    errors.description = "Не більше 1000 символів";
  }

  if (data.options.length > 10) {
    errors.options = "Не більше 10 опцій";
  }
  return errors;
}
async function saveCar(data) {
  const isEditing = editingCarId !== null;
  const payload = {
    ...data,
    description: data.description || null,
  };
  if (isEditing) {
    payload.is_available = formEl.elements["is_available"].value === "true";
  }
  const url = isEditing
    ? `${API_URL}/cars/${editingCarId}`
    : `${API_URL}/cars/`;
  const expectedStatus = isEditing ? 200 : 201;
  try {
    const response = await fetch(url, {
      method: isEditing ? "PATCH" : "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    if (response.status === expectedStatus) {
      hideError();
      closeModal();
      showSuccess(isEditing ? "Зміни збережено" : "Автомобіль додано");
      if (hasSearched) {
        loadCars();
      }
      return;
    }
    console.error("Не вдалося зберегти автомобіль:", response.status);
    showHttpError(response.status);
  } catch (error) {
    console.error("Не вдалося зберегти автомобіль:", error);
    showError(ERROR_MESSAGES.network);
  }
}
async function deleteCar(car) {
  if (
    !confirm(`Ви впевнені, що хочете видалити «${car.brand_model}» з бази?`)
  ) {
    return;
  }
  try {
    const response = await fetch(`${API_URL}/cars/${car.id}`, {
      method: "DELETE",
    });
    if (response.status === 204) {
      hideError();
      showSuccess("Автомобіль видалено");
      if (bodyEl.children.length === 1 && currentOffset > 0) {
        currentOffset = Math.max(0, currentOffset - PAGE_LIMIT);
      }
      loadCars();
      return;
    }
    console.error("Не вдалося видалити автомобіль:", response.status);
    showHttpError(response.status);
  } catch (error) {
    console.error("Не вдалося видалити автомобіль:", error);
    showError(ERROR_MESSAGES.network);
  }
}
addCarBtn.addEventListener("click", () => openModal());
cancelCarBtn.addEventListener("click", closeModal);
switchEditBtn.addEventListener("click", () => setFormMode("edit"));

modalEl.addEventListener("click", (event) => {
  if (event.target === modalEl) {
    closeModal();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !modalEl.hidden) {
    closeModal();
  }
});
formEl.addEventListener("submit", (event) => {
  event.preventDefault();
  clearFormErrors();
  const data = readFormData();
  const errors = validateCar(data);
  if (Object.keys(errors).length > 0) {
    showFormErrors(errors);
    return;
  }
  saveCar(data);
});

loadCars();
